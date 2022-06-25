# Mysql存储引擎-InnoDB


## 踩坑 & 处理

### 上游无限重试，重复执行update语句，锁等待严重，最终链接过多导致数据库OOM

场景是 
```
faas -> 请求算法服务返回相似商品 -> 相似商品召回送审
```
触发背景
1.  faas执行失败会无限重试，直到成功
2. 算法服务返回相似商品过多，1000个，<b>请求算法服务的时间+相似召回送审的时间</b>超过faas的设置时间，<b>稳定超时</b>，因此触发了无限重试
3. 在送审阶段，有一个更新语句如下，有<b>热点行</b>的<b>异步更新</b>，该表有不到1000条数据，因为一直异步更新，一直在申请连接池的连接，开事务进行更新，最终导致DB OOM

```sql
> 异步执行的语句
update t_dimension_daily_count set count = count + 1 
where daily_time = ? and stype = ? and sub_type = ?

> 数据库条数
select count(1) from t_dimension_daily_count;
count(1) = 942
```

报错从 1205 变成了 1105
```
Error 1205: Lock wait timeout exceeded; try restarting transcation

Error 1105: get master conn error，Error 1040: Too many connections
```

### 插入数据过大

str: field varchar(5)

```
insert into checkVarcharLimit(`id`,`str`) values(10, '244444');

ERROR 1406 (22001): Data too long for column 'str' at row 1
```

### 查询超时

背景
- 该店铺是top店铺，送审了很多次
- detail表有好几个大字段（`LongText`类型），使用`select *`会拿所有的数据，查询超时

解决方案最终选择的是 `select id, shop_id, task_id`，速度很快

```
索引是这个 KEY `idx_shop_id` (`shop_id`)

select * from t_access_shop_audit_detail where shop_id = 22713444 and commit_type = -70 limit 0, 1;   // 执行超时

SQL分析

explain select * from t_access_shop_audit_detail where shop_id = 22713444 and commit_type = -70 limit 0, 1;

key 是使用了 idx_shop_id，走了索引，但是执行还是会超时
```

### 数据库事务使用不当

背景

- 数据库事务里面执行了数据更新，然后发了个消息到mq，最后事务commit。
- 消费者消费消息，读master节点，还是老数据

解决方法：先commit事务，再发消息



