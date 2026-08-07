-- ============================================================
-- AREA523
-- verify_posts.sql
--
-- Purpose:
-- 1. Finalize posts after 7 days
-- 2. Require at least 50 votes
-- 3. Determine verified / AI-generated / no-consensus status
-- 4. Increase verified report count
-- 5. Queue 100 AREA verified-post reward
--
-- Important:
-- - profiles.area_balance is no longer modified.
-- - Actual AREA payment and 1:1 burn are handled later
--   by the Solana reward worker.
-- ============================================================


create or replace function public.verify_posts()
returns void
language plpgsql
security definer
set search_path = public
as
$$
declare
    post_record record;

    total_votes integer;
    real_votes integer;
    ai_votes integer;

    real_percent numeric(5, 2);
    ai_percent numeric(5, 2);

    queue_result text;
begin

    for post_record in

        select
            p.id,
            p.author_id,
            p.created_at,
            p.real_vote_count,
            p.ai_vote_count
        from public.posts p
        where
            p.verification_finalized_at is null
            and p.created_at <= now() - interval '7 days'
        order by p.created_at asc

    loop

        real_votes :=
            coalesce(post_record.real_vote_count, 0);

        ai_votes :=
            coalesce(post_record.ai_vote_count, 0);

        total_votes :=
            real_votes + ai_votes;


        --------------------------------------------------------
        -- Minimum vote requirement
        --------------------------------------------------------

        if total_votes < 50 then
            continue;
        end if;


        --------------------------------------------------------
        -- Vote percentages
        --------------------------------------------------------

        real_percent :=
            round(
                (
                    real_votes::numeric
                    / nullif(total_votes, 0)::numeric
                ) * 100,
                2
            );

        ai_percent :=
            round(
                (
                    ai_votes::numeric
                    / nullif(total_votes, 0)::numeric
                ) * 100,
                2
            );


        --------------------------------------------------------
        -- VERIFIED REAL / NOT AI VERIFIED
        --------------------------------------------------------

        if real_percent >= 70 then

            update public.posts
            set
                verification_status = 'verified_real',

                verification_finalized_at = now(),

                verified_at = now(),

                verification_snapshot_real_votes =
                    real_votes,

                verification_snapshot_ai_votes =
                    ai_votes,

                verification_snapshot_total_votes =
                    total_votes,

                verification_real_percentage =
                    real_percent,

                verification_ai_percentage =
                    ai_percent
            where
                id = post_record.id
                and verification_finalized_at is null;


            ----------------------------------------------------
            -- Verified author statistics
            --
            -- area_balance is intentionally not modified.
            ----------------------------------------------------

            update public.profiles
            set
                verified_reports =
                    coalesce(verified_reports, 0) + 1
            where id = post_record.author_id;


            ----------------------------------------------------
            -- Queue the on-chain reward
            --
            -- Official reward:
            -- 100 AREA payout + 100 AREA burn
            --
            -- Possible results:
            -- queued:<reward_uuid>
            -- wallet_missing
            -- already_queued
            -- daily_cap_reached
            -- monthly_cap_reached
            -- monthly_post_cap_reached
            ----------------------------------------------------

            queue_result :=
                public.enqueue_verified_post_reward(
                    post_record.id
                );


        --------------------------------------------------------
        -- AI GENERATED
        --------------------------------------------------------

        elsif ai_percent >= 70 then

            update public.posts
            set
                verification_status = 'verified_ai',

                verification_finalized_at = now(),

                verification_snapshot_real_votes =
                    real_votes,

                verification_snapshot_ai_votes =
                    ai_votes,

                verification_snapshot_total_votes =
                    total_votes,

                verification_real_percentage =
                    real_percent,

                verification_ai_percentage =
                    ai_percent
            where
                id = post_record.id
                and verification_finalized_at is null;


        --------------------------------------------------------
        -- NO CONSENSUS
        --------------------------------------------------------

        else

            update public.posts
            set
                verification_status = 'inconclusive',

                verification_finalized_at = now(),

                verification_snapshot_real_votes =
                    real_votes,

                verification_snapshot_ai_votes =
                    ai_votes,

                verification_snapshot_total_votes =
                    total_votes,

                verification_real_percentage =
                    real_percent,

                verification_ai_percentage =
                    ai_percent
            where
                id = post_record.id
                and verification_finalized_at is null;

        end if;

    end loop;

end;
$$;


-- ============================================================
-- Permissions
-- ============================================================

revoke all
on function public.verify_posts()
from public, anon, authenticated;

grant execute
on function public.verify_posts()
to service_role;


-- ============================================================
-- Manual execution
-- ============================================================

select public.verify_posts();


-- ============================================================
-- Verification: finalized posts
-- ============================================================

select
    id,
    author_id,
    verification_status,
    verification_finalized_at,
    verified_at,
    verification_snapshot_real_votes,
    verification_snapshot_ai_votes,
    verification_snapshot_total_votes,
    verification_real_percentage,
    verification_ai_percentage
from public.posts
order by created_at desc
limit 100;


-- ============================================================
-- Verification: queued post rewards
-- ============================================================

select
    id,
    user_id,
    wallet_address,
    reward_type,
    source_id,
    amount,
    burn_amount,
    status,
    created_at
from public.reward_ledger
where reward_type = 'verified_post'
order by created_at desc
limit 100;


-- ============================================================
-- Pending posts older than 7 days
-- ============================================================

select
    id,
    created_at,
    real_vote_count,
    ai_vote_count,
    (
        coalesce(real_vote_count, 0)
        + coalesce(ai_vote_count, 0)
    ) as total_votes
from public.posts
where
    verification_finalized_at is null
    and created_at <= now() - interval '7 days'
order by created_at asc;


-- ============================================================
-- END
-- ============================================================