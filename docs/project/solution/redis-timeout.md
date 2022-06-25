# Redis Timeout

排查过程如下

- 每隔15min会抖动一次
    * 怀疑是 RDB 造成的，关闭 RDB (仍然存在问题)
- Redis client (lettuce)
    * 建立链接，然后发送命令，顺带有个超时，用的类似`scheduleThreadPool`
- Redis server 
    * `config get timeout` 返回值0，永不超时
    - 慢日志分析
        * `config get slowlog-log-slower-than` 获取阈值
        * 由于slowlog是一个队列(FIFO)，导致出现`RedisTimeout`的时候，那部分的命令已经从队列里面出去了
        * 做的不好的一点儿，没有尝试把慢日志进行dump
- blade模拟故障
    * 实验验证在**网络延时较长** or **丢包率较高**的情况会出现timeout的情况，`cpu` 100%场景下不会