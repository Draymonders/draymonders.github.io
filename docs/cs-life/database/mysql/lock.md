# Mysql存储引擎-InnoDB

## InnoDB中的锁

- 全局锁
- 表锁 (lock read/write)
- 行级锁（需要时才加上，**事务结束后**释放）
    * 共享锁（S Lock）：允许事务读一行数据
    * 排它锁（X Lock）：允许事务删除 or 更新数据
- 意向锁：对一行进行加锁，需要对数据库、表、页加<b>粗粒度</b>的锁

### InnoDB实现锁的算法

Record lock、Gap lock、Next-key lock

- [参考阅读](https://blog.51cto.com/u_15177525/3314017)

### 一致性读

#### 一致性非锁定读

- 在 `READ COMMITED` 事务隔离级别下，对于快照数据，非一致性读总是读取<b>最新的行数据版本</b>
- 在 `REPEATABLE READ` 事务隔离级别下，对于快照数据，非一致性读总是读取<b>事务开始时的行数据版本</b>

查看隔离级别
```sql
select @@tx_isolation
+-----------------+
| @@tx_isolation  |
+-----------------+
| REPEATABLE-READ |
+-----------------+
```

- 只读，不加锁

```sql
-- 
事务1
begin;
select id, name from amor.t_sample where id = 100;

=>
+-----+------+
| id  | name |
+-----+------+
| 100 | amor |
+-----+------+
---
事务2
begin;
update amor.t_sample set name = 'tr 2' where id = 100;
commit;
--- 
事务1
select id, name from amor.t_sample where id = 100;

=> 
+-----+------+
| id  | name |
+-----+------+
| 100 | amor |
+-----+------+
commit;
---
```

#### 一致性锁定读

- S锁 `lock in share mode`

```sql
-- 
事务1
begin;
select id, name from amor.t_sample where id = 100 lock in share mode;

=>
+-----+------+
| id  | name |
+-----+------+
| 100 | amor |
+-----+------+
---
事务2
begin;
update amor.t_sample set name = 'tr 3' where id = 100;
commit;    => 因为事务1加了读锁，所以这里是阻塞的，等事务1 commit/rollback 才能完成事务2的commit
--- 
事务1
select id, name from amor.t_sample where id = 100;

=> 
+-----+------+
| id  | name |
+-----+------+
| 100 | amor |
+-----+------+
commit;
---
```

- X锁 `for update`

```sql
-- 
事务1
begin;
select id, name from amor.t_sample where id = 100 for update;

=>
+-----+------+
| id  | name |
+-----+------+
| 100 | tr 3 |
+-----+------+
---
事务2
begin;
select id, name from amor.t_sample where id = 100;  => 这里是用的非锁定读，可以正常读数据

=> 
+-----+------+
| id  | name |
+-----+------+
| 100 | tr 3 |
+-----+------+

select id, name from amor.t_sample where id = 100 lock in share mode;  因为事务1加了X锁，所以这里是阻塞的，等事务1 commit/rollback 才能完成这里的查询



update amor.t_sample set name = 'tr 4' where id = 100;
commit;
--- 
事务1
select id, name from amor.t_sample where id = 100;

=> 
+-----+------+
| id  | name |
+-----+------+
| 100 | tr 3 |
+-----+------+
commit;
---
```

