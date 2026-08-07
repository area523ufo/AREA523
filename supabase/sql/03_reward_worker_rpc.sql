-- ============================================================
-- AREA523
-- 03_reward_worker_rpc.sql
--
-- Worker-safe reward processing functions
--
-- Flow:
-- pending
--   → processing
--   → completed
--
-- Failure:
-- processing
--   → pending     (retryable)
--   → failed      (retry limit reached)
-- ============================================================


-- ============================================================
-- 1. REQUIRED WORKER COLUMNS
-- ============================================================

alter table public.reward_ledger
add column if not exists processing_started_at timestamptz;

alter table public.reward_ledger
add column if not exists completed_at timestamptz;

alter table public.reward_ledger
add column if not exists failed_at timestamptz;

alter table public.reward_ledger
add column if not exists transaction_signature text;

alter table public.reward_ledger
add column if not exists error_message text;

alter table public.reward_ledger
add column if not exists retry_count integer not null default 0;

alter table public.reward_ledger
add column if not exists updated_at timestamptz not null default now();


-- Transaction signature must not be reused by two rewards.

create unique index if not exists
reward_ledger_transaction_signature_unique
on public.reward_ledger(transaction_signature)
where transaction_signature is not null;


-- Worker queue lookup index.

create index if not exists
reward_ledger_worker_queue_idx
on public.reward_ledger(status, created_at)
where status in ('pending', 'processing');


-- ============================================================
-- 2. CLAIM ONE PENDING REWARD
--
-- FOR UPDATE SKIP LOCKED prevents two workers from claiming
-- the same reward.
-- ============================================================

create or replace function public.claim_next_reward()
returns table (
    id uuid,
    user_id uuid,
    wallet_address text,
    reward_type text,
    source_id text,
    amount bigint,
    burn_amount bigint,
    retry_count integer
)
language plpgsql
security definer
set search_path = public
as
$$
declare
    v_reward_id uuid;
begin
    select rl.id
    into v_reward_id
    from public.reward_ledger rl
    where rl.status = 'pending'
    order by rl.created_at asc
    for update skip locked
    limit 1;

    if v_reward_id is null then
        return;
    end if;

    update public.reward_ledger rl
    set
        status = 'processing',
        processing_started_at = now(),
        error_message = null,
        updated_at = now()
    where rl.id = v_reward_id;

    return query
    select
        rl.id,
        rl.user_id,
        rl.wallet_address,
        rl.reward_type,
        rl.source_id,
        rl.amount,
        rl.burn_amount,
        rl.retry_count
    from public.reward_ledger rl
    where rl.id = v_reward_id;
end;
$$;


-- ============================================================
-- 3. MARK REWARD COMPLETED
--
-- Records the Solana transaction signature and updates
-- daily/monthly completed and burned counters.
-- ============================================================

create or replace function public.complete_reward(
    p_reward_id uuid,
    p_transaction_signature text
)
returns text
language plpgsql
security definer
set search_path = public
as
$$
declare
    v_reward public.reward_ledger%rowtype;
    v_budget_date date;
    v_budget_month date;
begin
    if p_transaction_signature is null
       or btrim(p_transaction_signature) = '' then
        raise exception 'Transaction signature is required';
    end if;

    select *
    into v_reward
    from public.reward_ledger
    where id = p_reward_id
    for update;

    if not found then
        return 'reward_not_found';
    end if;

    if v_reward.status = 'completed' then
        if v_reward.transaction_signature = p_transaction_signature then
            return 'already_completed';
        end if;

        raise exception
            'Reward % is already completed with another signature',
            p_reward_id;
    end if;

    if v_reward.status <> 'processing' then
        return 'invalid_status:' || v_reward.status;
    end if;

    v_budget_date :=
        (v_reward.created_at at time zone 'UTC')::date;

    v_budget_month :=
        date_trunc(
            'month',
            v_reward.created_at at time zone 'UTC'
        )::date;

    update public.reward_ledger
    set
        status = 'completed',
        transaction_signature = btrim(p_transaction_signature),
        completed_at = now(),
        failed_at = null,
        error_message = null,
        updated_at = now()
    where id = p_reward_id;

    update public.reward_daily_budget
    set
        completed_amount =
            completed_amount + v_reward.amount,

        burned_amount =
            burned_amount + v_reward.burn_amount
    where budget_date = v_budget_date;

    update public.reward_monthly_budget
    set
        completed_amount =
            completed_amount + v_reward.amount,

        burned_amount =
            burned_amount + v_reward.burn_amount
    where budget_month = v_budget_month;

    insert into public.burn_ledger (
        reward_id,
        amount,
        transaction_signature,
        status
    )
    values (
        v_reward.id,
        v_reward.burn_amount,
        btrim(p_transaction_signature),
        'completed'
    )
    on conflict do nothing;

    return 'completed';
end;
$$;


-- ============================================================
-- 4. MARK REWARD FAILURE
--
-- Retryable failure:
-- processing → pending
--
-- Permanent failure:
-- processing → failed
-- ============================================================

create or replace function public.fail_reward(
    p_reward_id uuid,
    p_error_message text,
    p_retryable boolean default true,
    p_max_retries integer default 5
)
returns text
language plpgsql
security definer
set search_path = public
as
$$
declare
    v_current_retry_count integer;
    v_next_retry_count integer;
begin
    select retry_count
    into v_current_retry_count
    from public.reward_ledger
    where
        id = p_reward_id
        and status = 'processing'
    for update;

    if not found then
        return 'reward_not_processing';
    end if;

    v_next_retry_count :=
        coalesce(v_current_retry_count, 0) + 1;

    if p_retryable
       and v_next_retry_count < greatest(p_max_retries, 1) then

        update public.reward_ledger
        set
            status = 'pending',
            retry_count = v_next_retry_count,
            processing_started_at = null,
            error_message =
                left(
                    coalesce(p_error_message, 'Unknown worker error'),
                    2000
                ),
            updated_at = now()
        where id = p_reward_id;

        return 'retry_queued';
    end if;

    update public.reward_ledger
    set
        status = 'failed',
        retry_count = v_next_retry_count,
        failed_at = now(),
        error_message =
            left(
                coalesce(p_error_message, 'Unknown worker error'),
                2000
            ),
        updated_at = now()
    where id = p_reward_id;

    return 'failed';
end;
$$;


-- ============================================================
-- 5. RECOVER STALE PROCESSING JOBS
--
-- A worker may terminate after claiming a reward.
-- This returns old processing jobs to pending.
-- ============================================================

create or replace function public.recover_stale_rewards(
    p_stale_minutes integer default 10
)
returns integer
language plpgsql
security definer
set search_path = public
as
$$
declare
    v_recovered integer;
begin
    update public.reward_ledger
    set
        status = 'pending',
        processing_started_at = null,
        error_message = 'Recovered after stale worker lock',
        updated_at = now()
    where
        status = 'processing'
        and processing_started_at
            < now() - make_interval(
                mins => greatest(p_stale_minutes, 1)
            );

    get diagnostics v_recovered = row_count;

    return v_recovered;
end;
$$;


-- ============================================================
-- 6. PERMISSIONS
-- ============================================================

revoke all
on function public.claim_next_reward()
from public, anon, authenticated;

revoke all
on function public.complete_reward(uuid, text)
from public, anon, authenticated;

revoke all
on function public.fail_reward(uuid, text, boolean, integer)
from public, anon, authenticated;

revoke all
on function public.recover_stale_rewards(integer)
from public, anon, authenticated;


grant execute
on function public.claim_next_reward()
to service_role;

grant execute
on function public.complete_reward(uuid, text)
to service_role;

grant execute
on function public.fail_reward(uuid, text, boolean, integer)
to service_role;

grant execute
on function public.recover_stale_rewards(integer)
to service_role;


-- ============================================================
-- 7. TESTS
-- ============================================================

-- There may currently be no pending rewards.
select *
from public.claim_next_reward();

-- Return the test-claimed row to pending so no real reward
-- remains stuck in processing.
update public.reward_ledger
set
    status = 'pending',
    processing_started_at = null,
    updated_at = now()
where
    status = 'processing'
    and transaction_signature is null;


-- Confirm required columns.
select
    column_name,
    data_type,
    column_default
from information_schema.columns
where
    table_schema = 'public'
    and table_name = 'reward_ledger'
order by ordinal_position;


-- Current queue state.
select
    status,
    count(*) as reward_count
from public.reward_ledger
group by status
order by status;


-- ============================================================
-- END
-- ============================================================