# Redis

## 分布式锁

`ex`表示`expire`，`nx`表示`if not exist`
```shell
set redis-key clientId ex 5 nx
```

## 限流

使用zset+滑动窗口

比如每1分钟限制访问1000次,那么`period=60`, `max_count=1000`

1. `zadd rate_limit_key now_ts now_ts`(now_ts为当前的时间戳)
2. `zremrangebyscore rate_limit_key, 0, now_ts - period * 1000` (移除时间窗口之前的行为记录,剩下的都是时间窗口内的)
3. `zcard rate_limit_key` 获取窗口内的行为数量
4. `expire rate_limit_key period + 1`

判断步骤3中的获取的数量是否小于`max_count`

## 事务

执行结果如下，发现redis事务没有原子性(同时执行 or 同时不执行)

```shell
# redis-cli
127.0.0.1:6379> multi
OK
127.0.0.1:6379> set a aa
QUEUED
127.0.0.1:6379> incr a
QUEUED
127.0.0.1:6379> set b bb
QUEUED
127.0.0.1:6379> exec
1) OK
2) (error) ERR value is not an integer or out of range
3) OK
127.0.0.1:6379> get a
"aa"
127.0.0.1:6379> get b
"bb"
```

## mget和pipeline的区别

- mget是官方支持的， pipeline是客户端自己实现的
- mget和pipeline在客户端和服务端交互是一样的，都是多个命令一次网络IO
- mget可以分布式并行去做， 而pipeline只能是一个命令一个命令去做