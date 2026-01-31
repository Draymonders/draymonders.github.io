# Redis

## 基础

### 使用场景

Redis 作为一个高性能的内存数据库，常见的使用场景非常丰富：

1.  **缓存系统**：最常用的场景，用于缓存热点数据（用户信息、商品详情、配置信息等），降低数据库压力，提升响应速度。
    *   *特点*：读多写少，对一致性要求可容忍（最终一致性）。
2.  **计数器/限流**：利用 `INCR` 的原子性实现高并发计数（点赞数、库存扣减）或 API 限流。
3.  **排行榜**：利用 `ZSET` (Sorted Set) 实现实时排行榜（游戏积分、热搜话题）。
4.  **分布式锁**：利用 `SETNX` (Set if Not Exists) + Lua 脚本实现分布式环境下的互斥锁。
5.  **消息队列**：利用 `LIST` (LPUSH/BRPOP) 或 `STREAM` (Redis 5.0+) 实现轻量级消息队列。
6.  **位图 (Bitmap)**：用于存储用户签到、在线状态等海量布尔值，极其节省空间。
7.  **地理位置 (Geo)**：利用 `GEO` 指令存储坐标，计算距离和附近的人。
8.  **HyperLogLog**：用于海量数据的基数统计（如 UV 统计），占用空间极小。

### 数据结构

Redis 的高性能离不开其精心设计的底层数据结构。Redis 对象系统 (`redisObject`) 将上层数据类型与底层编码解耦。

| 数据类型 | 常用底层编码 (Encoding) | 应用场景 |
| :--- | :--- | :--- |
| **String** | `int`, `embstr`, `raw` (SDS) | 缓存、计数器、分布式锁 |
| **List** | `quicklist` (3.2+), `ziplist` (旧), `linkedlist` (旧) | 消息队列、文章列表 |
| **Hash** | `listpack` (7.0+), `ziplist` (旧), `hashtable` | 用户对象、购物车 |
| **Set** | `intset`, `hashtable` | 抽奖、标签、共同好友 |
| **ZSet** | `listpack` (7.0+), `ziplist` (旧), `skiplist` (跳表) | 排行榜、延时队列 |

*   **SDS (Simple Dynamic String)**：相比 C 字符串，SDS 二进制安全（可存储 `\0`），O(1) 获取长度，杜绝缓冲区溢出，减少内存分配次数（预分配+惰性释放）。
*   **SkipList (跳表)**：在 ZSet 中用于存储有序元素，支持平均 O(logN) 的查找、插入和删除，实现比平衡树简单，内存占用更低。

### 持久化：RDB 与 AOF

Redis 提供两种持久化机制来保证数据不丢失。

#### RDB (Redis Database)
内存快照，将某一时刻的数据全量写入磁盘。

*   **优点**：
    *   文件紧凑（二进制），适合备份和全量复制。
    *   恢复速度快，适合灾难恢复。
    *   对主进程性能影响小（fork 子进程处理）。
*   **缺点**：
    *   无法做到秒级持久化，两次快照间会丢失数据。
    *   Fork 子进程在内存较大时会阻塞主线程。

#### AOF (Append Only File)
以日志形式记录每次写操作。

*   **优点**：
    *   数据安全性高，支持秒级（`appendfsync everysec`）甚至同步刷盘。
    *   文件是文本格式，可读性好，便于修复（如误删 FLUSHALL）。
*   **缺点**：
    *   文件体积通常比 RDB 大。
    *   恢复速度慢于 RDB（需回放命令）。

> **最佳实践**：生产环境通常开启 **混合持久化** (Redis 4.0+)，AOF 重写时将内存数据做 RDB 快照写入 AOF 开头，后续追加增量命令。既保证了恢复速度，又保证了数据安全。

### 慢日志查询 (Slow Log)

用于定位阻塞 Redis 的慢命令。Redis 是单线程处理命令，慢命令会阻塞所有后续请求。

*   **配置**：
    *   `slowlog-log-slower-than 10000`：阈值，单位微秒（这里是 10ms）。
    *   `slowlog-max-len 128`：保留的慢日志条数（FIFO 队列，存储在内存中）。
*   **命令**：
    *   `SLOWLOG GET [n]`：获取最近 n 条慢日志。
    *   `SLOWLOG LEN`：获取慢日志长度。
    *   `SLOWLOG RESET`：清空慢日志。
*   **注意**：慢日志只记录命令执行时间，不包含网络 IO 和排队时间。

### 缓存一致性

保证缓存与数据库数据一致是缓存系统的核心挑战。

*   **Cache Aside Pattern (旁路缓存模式)** - *最常用*
    *   **读**：先读缓存，命中则返回；未命中读 DB，写入缓存并设置过期时间。
    *   **写**：先更新 DB，**再删除缓存**。
    *   *为什么是删除不是更新？* 并发写时，更新缓存可能导致脏数据（覆盖顺序错误）；且有些缓存计算复杂，懒加载更优。
    *   *问题*：删除缓存失败怎么办？ -> **重试机制**（MQ 异步重试）。
    *   *问题*：主从延迟导致读到旧数据回写缓存？ -> **延时双删**（更新 DB -> 删缓存 -> 休眠 N ms -> 再删缓存）。

*   **其他模式**：
    *   Read/Write Through：应用只与缓存交互，缓存组件负责同步 DB。
    *   Write Behind (Async Write)：先写缓存，异步批量刷入 DB（性能高，但有丢数据风险）。

### 缓存异常

1.  **缓存雪崩 (Cache Avalanche)**
    *   *现象*：大量 Key 同时过期或 Redis 宕机，请求全部打到 DB。
    *   *对策*：
        *   过期时间加随机值（Jitter）。
        *   Redis 高可用（Sentinel/Cluster）。
        *   服务降级、熔断、限流。
2.  **缓存穿透 (Cache Penetration)**
    *   *现象*：查询**不存在**的数据，缓存不命中，请求透传到 DB，导致 DB 压力大。
    *   *对策*：
        *   **布隆过滤器 (Bloom Filter)**：前置拦截不存在的 Key。
        *   缓存空对象（设置较短 TTL）。
        *   接口参数校验。
3.  **缓存击穿 (Hot Key Invalid)**
    *   *现象*：热点 Key 过期瞬间，大量并发请求打到 DB。
    *   *对策*：
        *   **互斥锁**：缓存失效时，先获取锁，拿到锁的去查 DB 建缓存，其他的等待。
        *   **逻辑过期**：Key 不设置 TTL，Value 中包含过期时间，后台异步更新。

### 数据淘汰机制

当内存达到 `maxmemory` 限制时，Redis 会触发淘汰策略：

*   **LRU (Least Recently Used)**：
    *   `allkeys-lru`：所有 Key 中淘汰最少使用的（*最常用*）。
    *   `volatile-lru`：设置了过期的 Key 中淘汰最少使用的。
*   **LFU (Least Frequently Used)** (4.0+)：
    *   `allkeys-lfu` / `volatile-lfu`：基于访问频率淘汰，防止偶发大流量干扰。
*   **Random**：
    *   `allkeys-random` / `volatile-random`：随机淘汰。
*   **TTL**：
    *   `volatile-ttl`：淘汰即将过期的 Key。
*   **Noeviction**：
    *   不淘汰，写入报错（读操作正常），默认策略。

### 底层网络模型

Redis 是基于 **Reactor 模式** 开发的网络事件处理器。

*   **IO 多路复用**：单线程同时监听多个 Socket，哪个有事件就处理哪个。避免了阻塞等待。
    *   **Linux**: 优先使用 `epoll` (O(1))。
    *   **MacOS / FreeBSD**: 使用 `kqueue` (O(1))。
    *   **Windows**: 早期 Microsoft 维护版本使用 `IOCP`。但 Redis 官方长期只支持 POSIX 系统（Linux/Unix），Windows 通常用于开发测试。
*   **Redis 6.0 多线程 IO**：
    *   Redis 核心命令执行依然是 **单线程**（避免锁竞争、上下文切换）。
    *   引入多线程专门处理 **网络数据的读写 (Read/Write)** 和 **协议解析**，解决网络 IO 瓶颈。

### 分布式锁

在分布式系统中，为了保证同一时间只有一个客户端能操作共享资源，通常使用 Redis 实现分布式锁。

#### 核心实现
使用 `SET` 命令的扩展参数实现加锁原子性：
```bash
SET key value [EX seconds] [PX milliseconds] [NX|XX]
```
*   `EX 5`：设置键的过期时间为 5 秒（防止死锁）。
*   `NX`：只在键不存在时设置（互斥性）。
*   `value`：必须是唯一标识（如 UUID），用于解锁时校验身份。

示例：
```shell
set lock_key unique_client_id ex 5 nx
```

#### 安全解锁
解锁时**必须**校验 `value` 是否与当前客户端一致，防止误删其他客户端的锁。这需要使用 **Lua 脚本** 保证原子性：

```lua
if redis.call("get",KEYS[1]) == ARGV[1] then
    return redis.call("del",KEYS[1])
else
    return 0
end
```

> **注意**：单机 Redis 存在单点故障风险。在集群环境中，建议参考 **Redlock** 算法。

### 限流

限流用于控制服务请求频率，防止系统过载。

#### 方案一：滑动窗口 
利用 `ZSet` 存储请求的时间戳，实现精准的滑动窗口限流。

**场景**：限制某用户在 1 分钟内最多访问 1000 次。

*   `key`: `rate_limit:{user_id}`
*   `period`: 60 (秒)
*   `max_count`: 1000

**步骤**：

1.  **记录请求**：将当前时间戳 (`now_ts`) 作为 score 和 member 写入 ZSet。
    ```redis
    ZADD rate_limit_key now_ts now_ts
    ```
2.  **移除过期数据**：移除窗口之外（`now_ts - period * 1000ms` 之前）的记录。
    ```redis
    ZREMRANGEBYSCORE rate_limit_key 0 (now_ts - period * 1000)
    ```
3.  **计数与判断**：统计当前窗口内的请求数。
    ```redis
    ZCARD rate_limit_key
    ```
    *   如果数量 <= `max_count`，则通过。
    *   如果数量 > `max_count`，则拒绝。
4.  **设置过期**：为 Key 设置过期时间，避免冷数据长期占用内存。
    ```redis
    EXPIRE rate_limit_key period + 1
    ```

> 缺点：ZSet 存储所有请求的时间戳，内存占用较高，不适合高并发大流量场景。

#### 方案二：令牌桶 / 漏桶

对于高并发场景，推荐使用 **Redis Cell** 模块或 Lua 脚本实现令牌桶算法，减少内存占用。

### Big Key 问题

Big Key 指的是 Value 占用内存过大或包含元素过多的 Key。

**什么是 Big Key**

*   **String 类型**：Value > 10KB。
*   **集合类型 (Hash/List/Set/ZSet)**：元素数量 > 5000 个。

**危害**

1.  **阻塞主线程**：Redis 是单线程模型，处理 Big Key 的操作（如 `GET`、`DEL`、序列化/反序列化）耗时久，会阻塞后续命令执行，导致整体 QPS 下降。
2.  **网络阻塞**：获取 Big Key 产生的网络流量大，容易打满带宽，导致其他正常请求超时。
3.  **集群迁移困难**：在 Redis Cluster 中，迁移 Big Key 会导致迁移卡顿甚至失败。
4.  **过期删除阻塞**：Big Key 过期自动删除时，如果没有开启 Lazy Free，同样会阻塞主线程。

**发现与解决**

*   **发现**：
    *   `redis-cli --bigkeys`：扫描大 Key。
    *   `MEMORY USAGE key`：查看 Key 内存占用。
*   **解决**：
    *   **拆分**：将大 Hash 拆分为 `hash_1`, `hash_2` ... `hash_n`。
    *   **定期清理**：避免 List/Set 无限增长。
    *   **异步删除**：使用 `UNLINK` 命令代替 `DEL`，在后台线程释放内存（Redis 4.0+）。

## 生产踩坑案例

### 场景：Binlog 乱序导致缓存数据丢失

**背景**: 业务需要将 MySQL 中的品牌资质表 `t_brand` 同步到 Redis 缓存。

*   **数据流**：`MySQL -> Binlog -> Canal/Databus -> Redis`
*   **Redis Key**：`relate_id` (店铺关联 ID)
*   **Redis Value**：`qualification_id` (资质 ID)

**问题描述**: 用户进行店铺资质更新操作：

1.  **新增** 一条新资质记录 (`id=2`, `relate_id=666`)。
2.  **删除** 旧资质记录 (`id=1`, `relate_id=666`)。
*注：两者指向同一个 Redis Key。*

**预期结果**：Redis 中 `relate_id:666` 的值应更新为新资质 ID。

**实际故障**：Redis 中 `relate_id:666` **不存在（被误删）**，导致业务查询穿透回 DB 或报错。

**根因分析**：这是典型的 **并发竞争 (Race Condition)** 问题。由于 Binlog 中不同行的事件可能被多线程并发消费，或者消费顺序与业务逻辑不一致：

| 时间 | DB 操作 / Binlog 事件 | 缓存处理线程 A | 缓存处理线程 B | 最终结果 |
| :--- | :--- | :--- | :--- | :--- |
| T1 | Insert `id=2` (`relate_id=666`) | 收到事件，执行 `SET 666 2444` | - | 缓存有值 (2444) |
| T2 | Delete `id=1` (`relate_id=666`) | - | 收到事件，执行 `DEL 666` | **缓存被删 (NULL)** |

即使 DB 操作是先删后增，如果 Binlog 投递顺序错乱（先收到 Insert 后收到 Delete），或者处理 Delete 的线程晚于处理 Insert 的线程执行，都会导致**新写入的缓存被旧数据的删除事件误删**。

**解决方案**

1.  **消费串行**：同一 `relate_id` 加分布式锁串行消费。
2.  **全量回查**：在处理删除 (`Insert`、`Delete`、`Update`) 事件时，查询 DB主库获取 `relate_id` 对应的最新的数据

## 推荐文章

- [Redis 性能优化思路，写的非常好！](https://www.easemob.com/news/6409)
- [火山引擎 Redis 云原生实践](https://mp.weixin.qq.com/s/VCpuZ0lvgSgfvG7voBl9fw)