-- ============================================================
-- AREA523
-- 01_reward_tables.sql
--
-- Purpose:
-- 1. On-chain reward queue
-- 2. 1:1 immediate burn tracking
-- 3. Daily / monthly payout caps
-- 4. Duplicate reward prevention
--
-- Important:
-- - Database balances are NOT real token balances.
-- - Real AREA balances exist only on Solana.
-- - One reward payout must be paired with an equal burn amount.
-- ============================================================


-- ============================================================
-- 1. REWARD CONFIG
-- ============================================================

create table if not exists public.reward_config (
    id smallint primary key default 1,

    is_enabled boolean not null default true,

    -- User payout limits
    daily_payout_cap bigint not null default 26666,
    monthly_payout_cap bigint not null default 800000,

    -- Category-specific monthly payout limits
    monthly_post_cap bigint not null default 200000,
    monthly_vote_cap bigint not null default 400000,
    monthly_ranking_cap bigint not null default 100000,

    -- Individual reward amounts
    verified_post_reward bigint not null default 100,
    correct_vote_reward bigint not null default 5,

    -- Per-user correct-vote reward limit
    user_daily_vote_reward_cap bigint not null default 50,

    -- Every rewarded token requires the same burn amount
    burn_ratio numeric(10, 4) not null default 1.0000,

    updated_at timestamptz not null default now(),

    constraint reward_config_single_row
        check (id = 1),

    constraint reward_config_positive_caps
        check (
            daily_payout_cap >= 0
            and monthly_payout_cap >= 0
            and monthly_post_cap >= 0
            and monthly_vote_cap >= 0
            and monthly_ranking_cap >= 0
            and verified_post_reward >= 0
            and correct_vote_reward >= 0
            and user_daily_vote_reward_cap >= 0
            and burn_ratio >= 0
        )
);


insert into public.reward_config (
    id,
    is_enabled,
    daily_payout_cap,
    monthly_payout_cap,
    monthly_post_cap,
    monthly_vote_cap,
    monthly_ranking_cap,
    verified_post_reward,
    correct_vote_reward,
    user_daily_vote_reward_cap,
    burn_ratio
)
values (
    1,
    true,
    26666,
    800000,
    200000,
    400000,
    100000,
    100,
    5,
    50,
    1.0000
)
on conflict (id) do nothing;


-- ============================================================
-- 2. REWARD LEDGER
-- ============================================================

create table if not exists public.reward_ledger (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references public.profiles(id)
        on delete restrict,

    -- Destination Solana wallet
    wallet_address text,

    reward_type text not null,

    -- Reference to the event that generated the reward.
    -- Examples:
    -- post UUID
    -- vote UUID
    -- ranking period such as 2026-07
    source_id text not null,

    amount bigint not null,

    -- Immediate 1:1 burn amount
    burn_amount bigint not null,

    status text not null default 'pending',

    -- A worker can claim a pending reward by locking it.
    locked_at timestamptz,
    locked_by text,

    processing_started_at timestamptz,
    completed_at timestamptz,
    failed_at timestamptz,

    attempt_count integer not null default 0,
    last_error text,

    -- One atomic Solana transaction should normally contain:
    -- 1. transferChecked
    -- 2. burnChecked
    transaction_signature text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint reward_ledger_reward_type_check
        check (
            reward_type in (
                'verified_post',
                'correct_vote',
                'monthly_ranking'
            )
        ),

    constraint reward_ledger_status_check
        check (
            status in (
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled'
            )
        ),

    constraint reward_ledger_amount_positive
        check (amount > 0),

    constraint reward_ledger_burn_amount_positive
        check (burn_amount > 0),

    constraint reward_ledger_equal_burn
        check (burn_amount = amount),

    constraint reward_ledger_wallet_format
        check (
            wallet_address is null
            or length(wallet_address) between 32 and 44
        ),

    -- Prevents rewarding the same event twice.
    constraint reward_ledger_unique_source
        unique (reward_type, source_id, user_id)
);


create index if not exists reward_ledger_status_created_idx
    on public.reward_ledger(status, created_at);


create index if not exists reward_ledger_user_created_idx
    on public.reward_ledger(user_id, created_at desc);


create index if not exists reward_ledger_type_created_idx
    on public.reward_ledger(reward_type, created_at desc);


create unique index if not exists reward_ledger_tx_signature_unique_idx
    on public.reward_ledger(transaction_signature)
    where transaction_signature is not null;


-- ============================================================
-- 3. BURN LEDGER
-- ============================================================

create table if not exists public.burn_ledger (
    id uuid primary key default gen_random_uuid(),

    reward_id uuid not null unique
        references public.reward_ledger(id)
        on delete restrict,

    amount bigint not null,

    transaction_signature text not null,

    created_at timestamptz not null default now(),

    constraint burn_ledger_amount_positive
        check (amount > 0)
);


create unique index if not exists burn_ledger_signature_reward_unique_idx
    on public.burn_ledger(transaction_signature, reward_id);


create index if not exists burn_ledger_created_idx
    on public.burn_ledger(created_at desc);


-- ============================================================
-- 4. DAILY BUDGET USAGE
-- ============================================================

create table if not exists public.reward_daily_budget (
    budget_date date primary key,

    reserved_amount bigint not null default 0,
    completed_amount bigint not null default 0,
    burned_amount bigint not null default 0,

    updated_at timestamptz not null default now(),

    constraint reward_daily_budget_non_negative
        check (
            reserved_amount >= 0
            and completed_amount >= 0
            and burned_amount >= 0
        )
);


-- ============================================================
-- 5. MONTHLY BUDGET USAGE
-- ============================================================

create table if not exists public.reward_monthly_budget (
    -- Always stored as the first day of the month.
    budget_month date primary key,

    reserved_amount bigint not null default 0,
    completed_amount bigint not null default 0,
    burned_amount bigint not null default 0,

    post_reserved_amount bigint not null default 0,
    vote_reserved_amount bigint not null default 0,
    ranking_reserved_amount bigint not null default 0,

    post_completed_amount bigint not null default 0,
    vote_completed_amount bigint not null default 0,
    ranking_completed_amount bigint not null default 0,

    updated_at timestamptz not null default now(),

    constraint reward_monthly_budget_first_day
        check (
            budget_month =
            date_trunc('month', budget_month)::date
        ),

    constraint reward_monthly_budget_non_negative
        check (
            reserved_amount >= 0
            and completed_amount >= 0
            and burned_amount >= 0

            and post_reserved_amount >= 0
            and vote_reserved_amount >= 0
            and ranking_reserved_amount >= 0

            and post_completed_amount >= 0
            and vote_completed_amount >= 0
            and ranking_completed_amount >= 0
        )
);


-- ============================================================
-- 6. UPDATED_AT TRIGGER FUNCTION
-- ============================================================

create or replace function public.set_reward_updated_at()
returns trigger
language plpgsql
as
$$
begin
    new.updated_at := now();
    return new;
end;
$$;


drop trigger if exists set_reward_config_updated_at
on public.reward_config;

create trigger set_reward_config_updated_at
before update on public.reward_config
for each row
execute function public.set_reward_updated_at();


drop trigger if exists set_reward_ledger_updated_at
on public.reward_ledger;

create trigger set_reward_ledger_updated_at
before update on public.reward_ledger
for each row
execute function public.set_reward_updated_at();


drop trigger if exists set_reward_daily_budget_updated_at
on public.reward_daily_budget;

create trigger set_reward_daily_budget_updated_at
before update on public.reward_daily_budget
for each row
execute function public.set_reward_updated_at();


drop trigger if exists set_reward_monthly_budget_updated_at
on public.reward_monthly_budget;

create trigger set_reward_monthly_budget_updated_at
before update on public.reward_monthly_budget
for each row
execute function public.set_reward_updated_at();


-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

alter table public.reward_config
enable row level security;

alter table public.reward_ledger
enable row level security;

alter table public.burn_ledger
enable row level security;

alter table public.reward_daily_budget
enable row level security;

alter table public.reward_monthly_budget
enable row level security;


-- Public users may view finalized reward history.
drop policy if exists "Public can view completed rewards"
on public.reward_ledger;

create policy "Public can view completed rewards"
on public.reward_ledger
for select
to anon, authenticated
using (status = 'completed');


-- Public users may view burn history.
drop policy if exists "Public can view burns"
on public.burn_ledger;

create policy "Public can view burns"
on public.burn_ledger
for select
to anon, authenticated
using (true);


-- Public users may view budget totals.
drop policy if exists "Public can view daily reward budgets"
on public.reward_daily_budget;

create policy "Public can view daily reward budgets"
on public.reward_daily_budget
for select
to anon, authenticated
using (true);


drop policy if exists "Public can view monthly reward budgets"
on public.reward_monthly_budget;

create policy "Public can view monthly reward budgets"
on public.reward_monthly_budget
for select
to anon, authenticated
using (true);


-- Public may read active reward parameters.
drop policy if exists "Public can view reward config"
on public.reward_config;

create policy "Public can view reward config"
on public.reward_config
for select
to anon, authenticated
using (true);


-- No client-side INSERT / UPDATE / DELETE policies are created.
-- Therefore only service_role and privileged database functions
-- may create or process rewards.


-- ============================================================
-- 8. FUNCTION PERMISSIONS
-- ============================================================

revoke all
on function public.set_reward_updated_at()
from public;

grant execute
on function public.set_reward_updated_at()
to service_role;


-- ============================================================
-- 9. TABLE PERMISSIONS
-- ============================================================

revoke insert, update, delete
on public.reward_config
from anon, authenticated;

revoke insert, update, delete
on public.reward_ledger
from anon, authenticated;

revoke insert, update, delete
on public.burn_ledger
from anon, authenticated;

revoke insert, update, delete
on public.reward_daily_budget
from anon, authenticated;

revoke insert, update, delete
on public.reward_monthly_budget
from anon, authenticated;


grant select
on public.reward_config
to anon, authenticated;

grant select
on public.reward_ledger
to anon, authenticated;

grant select
on public.burn_ledger
to anon, authenticated;

grant select
on public.reward_daily_budget
to anon, authenticated;

grant select
on public.reward_monthly_budget
to anon, authenticated;


grant all
on public.reward_config
to service_role;

grant all
on public.reward_ledger
to service_role;

grant all
on public.burn_ledger
to service_role;

grant all
on public.reward_daily_budget
to service_role;

grant all
on public.reward_monthly_budget
to service_role;


-- ============================================================
-- 10. INITIAL BUDGET ROWS
-- Uses UTC-based dates.
-- ============================================================

insert into public.reward_daily_budget (
    budget_date
)
values (
    (now() at time zone 'UTC')::date
)
on conflict (budget_date) do nothing;


insert into public.reward_monthly_budget (
    budget_month
)
values (
    date_trunc(
        'month',
        now() at time zone 'UTC'
    )::date
)
on conflict (budget_month) do nothing;


-- ============================================================
-- 11. VERIFICATION
-- ============================================================

select
    id,
    is_enabled,
    daily_payout_cap,
    monthly_payout_cap,
    monthly_post_cap,
    monthly_vote_cap,
    monthly_ranking_cap,
    verified_post_reward,
    correct_vote_reward,
    user_daily_vote_reward_cap,
    burn_ratio
from public.reward_config;


select
    table_name
from information_schema.tables
where table_schema = 'public'
and table_name in (
    'reward_config',
    'reward_ledger',
    'burn_ledger',
    'reward_daily_budget',
    'reward_monthly_budget'
)
order by table_name;


-- ============================================================
-- END
-- ============================================================