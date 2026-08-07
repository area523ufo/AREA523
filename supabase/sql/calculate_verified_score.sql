create or replace function public.calculate_verified_score()
returns void
language plpgsql
security definer
as
$$
begin

    update public.profiles p
    set verified_score = score_table.verified_score
    from (

        select

            v.user_id,

            round(

                (
                    count(*) filter (

                        where

                            (
                                po.verification_status = 'verified_real'
                                and v.vote = 'real'
                            )

                            or

                            (
                                po.verification_status = 'verified_ai'
                                and v.vote = 'ai'
                            )

                    )::numeric

                    /

                    nullif(

                        count(*) filter (

                            where
                                po.verification_finalized_at is not null

                        ),

                        0

                    )::numeric

                )

                * 100,

                2

            ) as verified_score

        from public.votes v

        join public.posts po

            on po.id = v.post_id

        where

            po.verification_finalized_at is not null

        group by

            v.user_id

    ) score_table

    where

        p.id = score_table.user_id;

end;

$$;


select public.calculate_verified_score();


select

    username,
    verified_score,
    verified_reports,
    area_balance

from public.profiles

order by

    verified_score desc nulls last,
    verified_reports desc,
    area_balance desc;