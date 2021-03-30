# Redis

## 基础

- aof和rdb优点，区别
- 慢日志查询
- 缓存一致性，如何避免脏数据
- 缓存雪崩、缓存穿透
- 数据淘汰机制
- 底层网络模型（Linux，Windows，MacOS）

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

## mget和pipeline的区别

- mget是官方支持的， pipeline是客户端自己实现的
- mget和pipeline在客户端和服务端交互是一样的，都是多个命令一次网络IO
- mget可以分布式并行去做， 而pipeline只能是一个命令一个命令去做

## big key

1. 大key会带来操作时间的上升 即使是`O(logn)`的操作，n越大，执行时间越长，Redis单线程处理，会block其他命令执行
2. 大key迁移会很麻烦
3. io的开销(将big key传输到client, io会很慢)

## 性能优化

- [Redis 性能优化思路，写的非常好！](https://www.easemob.com/news/6409)