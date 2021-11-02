# SQL

## distinct相关

原始数据

```sql
select task_status, update_time from t_audit_task_temp where id > 0;

task_status,update_time
3,2021-09-02 20:19:56
3,2021-09-02 21:26:46
5,2021-09-02 20:23:27
4,2021-09-02 21:29:04
```

只查单独一个字段

```sql
select distinct(task_status) from t_audit_task_temp where id > 0;

task_status
3
5
4
```

查询两个字段

```sql
select distinct(task_status),update_time from t_audit_task_temp where id > 0;

task_status,update_time
3,2021-09-02 20:19:56
3,2021-09-02 21:26:46
5,2021-09-02 20:23:27
4,2021-09-02 21:29:04
```