# 复杂 hive 用法

## partition by，获取分组内序号

```sql
select  author_id,
        rule_key,
        from_unixtime(create_time, 'yyyyMMdd') as clean_date
from    (
            select  author_id,
                    rule_key,
                    create_time,
                    ROW_NUMBER() over(
                        partition by
                                author_id
                        order by
                                create_time desc
                    ) as rn
            from    ecom.app_author_credit_score_change_df
            where   date = '${date}'
            and     banned_day = -1
            and     is_revoke = 0
            and     from_unixtime(create_time, 'yyyyMMdd') >= '${date-7}'
        )
where   rn = 1
```