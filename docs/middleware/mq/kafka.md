# Kafka 调研

## kafka概念

- 分布式流处理平台
    - 发布订阅及Topic支持
    - 吞吐量高但不保证消费有序 (partition中才有序)
- 常见应用场景
    - 日志收集或流式处理
    - 消息系统(不太care有序性)
    - 用户活动跟踪或运营指标监控

### use case

- 日志分类
    1. 用户活动事件收集
    2. 系统监控数据收集
- 日志作用
    1. 搜索
    2. 推荐
    3. 广告


## 名词解释

- client
    - `Producer` 生产者
    - `Consumer` 消费者
- kafka server
    - `Record`消息 Kafka 处理的主要对象。
    - `Topic` 主题 主题是承载消息的逻辑容器，在实际使用中多用来区分具体的业务。生产者生产`Topic`, 消费者消费`Topic`
    - `Offset` 表示分区中每条消息的位置信息，是一个单调递增且不变的值。
    - `Broker` Kafka 的服务器端由被称为 `Broker` 的服务进程构成，即一个 `Kafka` 集群由多个 `Broker` 组成，`Broker` 负责接收和处理客户端发送过来的请求，以及对消息进行持久化。
    
    - `Partition` 分区, `Kafka` 中的分区机制指的是将每个主题划分成多个分区（`Partition`），每个分区是一组有序的消息日志。生产者生产的每条消息只会被发送到一个分区中，也就是说如果向一个双分区的主题发送一条消息，这条消息要么在分区 0 中，要么在分区 1 中。如你所见，Kafka的分区编号是从 0 开始的，如果 Topic 有 100 个分区，那么它们的分区号就是从 0 到99。
    - 副本, 副本是在分区概念下的，每个分区下可以配置若干个副本。
        - `Leader`， 提供 `client` 读写
        - `Follower`, 只用于高可用, `client`不可读写。
    - 点对点模型 `p2p`
        - `Consumer Group` 在 Kafka 中实现这种 P2P 模型的方法就是引入了消费者组（Consumer Group）。所谓的消费者组，指的是多个消费者实例共同组成一个组来消费一组主题。这组主题中的每个分区都只会被组内的一个消费者实例消费，其他消费者实例不能消费它。
    - `Consumer Offset` 每个消费者在消费消息的过程中必然需要有个字段记录它当前消费到了分区的哪个位置上，这个字段就是消费者位移（`Consumer Offset`）

## Paper 阅读

- 人生读完的第一篇paper
link: https://github.com/Draymonders/Code-Life/blob/master/middleware/kafka/Kafka.pdf


### traditional message system

1. IBM Websphere MQ has transactional supports that allow an application to insert messages into multiple queues atomically. (保证消息插入的事务性, 原子性?)
2. The JMS specification allows each individual message to be acknowledged after consumption.(消费每条消息都要ack)
3. Those systems are weak in distributed support.(很少支持分布式)
4. Finally, many messaging systems assume near immediate consumption of messages, so the queue of unconsumed messages is always fairly small. Their performance degrades significantly if messages are allowed to accumulate.(不允许堆积)
5. Additionally, most of them use a “push” model in which the broker forwards data to consumers.At LinkedIn, we
find the “pull” model more suitable for our applications since each consumer can retrieve the messages at the maximum rate it can sustain and avoid being flooded by messages pushed faster than it can handle. (大多数用的推模式, 但kafka是拉模式, 拉可以根据consumer控制速率，防止推送太快导致consumer扛不住).

### the architecture of Kafka and its key design principles

1. Unlike traditional iterators, the message stream iterator never terminates. If there are currently no more messages to consume, the iterator blocks until new messages are published to the topic.(消息迭代器不会终止, 不用重新建立tcp/ip链接)
2. We support both the point-to-point delivery model in which multiple consumers jointly consume a single copy of all messages in a topic, as well as the publish/subscribe model in which multiple consumers each retrieve its own copy of a topic. (支持发布订阅 & 点对点)
3. To balance load, a topic is divided into multiple partitions and each broker stores one or more of those partitions. (为了负载均衡，分成多个partition)

### Efficiency on a Single Partition

#### Simple storage

1. Kafka has a very simple storage layout. Each partition of a topic corresponds to a logical log.(消息就是存的日志)
2. Physically, a log is implemented as a set of segment files of approximately the same size (e.g., 1GB). Every time a producer publishes a message to a partition, the broker simply appends the message to the last segment file. (日志会分段, 每段存到一个文件上)
3. For better performance, we flush the segment files to disk only after a configurable number of messages have been published or a certain amount of time has elapsed. A message is only exposed to the consumers after it is flushed.(有一个缓冲队列，等队列数量满足 配置的数量 才会写入到log文件中)
4. This avoids the overhead of maintaining auxiliary, seek-intensive random-access index structures that map the message ids to the actual message locations. (消息没有id, 不需要建索引，减少了随机访问的overhead)
5. If the consumer acknowledges a particular message offset, it implies that the consumer has received all messages prior to that offset in the partition.(consumer提交offset,代表已经接收了offset之前的所有数据)
6. Each pull request contains the offset of the message from which the consumption begins and an acceptable number of bytes to fetch. Each broker keeps in memory a sorted list of offsets, including the offset of the first message in every segment file. The broker locates the segment file where the requested message resides by searching the offset list, and sends the data back to the consumer. (consumer拉取消息，包含了offset, broker保存了一个有序的offset, 表示每个段文件的首offset, 然后根据consumer的offset去定位段文件并且找到消息集合)
![wbkMfU.png](https://s1.ax1x.com/2020/09/21/wbkMfU.png)

#### Efficient transfer

1. the producer can submit a set of messages in a single send request. Although the end consumer API iterates one message at a time, under the covers, each pull request from a consumer also retrieves multiple messages up to a certain size, typically hundreds of kilobytes.(producer批量写入，consumer批量读取)
2. rely on the underlying file system page cache, avoiding double buffering messages are only cached in the page cache.. (依赖文件系统页缓存, 不存内存，避免了两层缓冲).Kafka doesn’t cache messages in process at all, it has very little overhead in garbage collecting its memory, making efficient implementation in a VM-based language feasible. (没有用很多内存，导致不需要gc).
3. Zero copy
    - A typical approach to sending bytes from a local file to a remote socket involves the following steps.
        1. read data from the storage media to the page cache in an OS
        2. copy data in the page cache to an application buffer
        3. copy application buffer to another kernel buffer
        4. send the kernel buffer to the socket.
     - (零拷贝原理 **todo**) 
#### stateless broker
1. the information about how much each consumer has consumed is not maintained by the broker, but by the consumer itself. (consumer掌管offset信息)
    - (由于不知道message被消费的信息, 所以删除消息是个麻烦事)
    - A message is automatically deleted if it has been retained in the broker longer than a certain period, typically 7 days.
2. A consumer can deliberately rewind back to an old offset and reconsume data. We note that rewinding a consumer is much easier to support in the pull model than the push model.(offset可以回退，因为是pull模型，push模型的话实现会比较麻烦)


### Distributed Coordination

1. each message is delivered to only one of the consumers within the group (在一个consumer group中，一条message只能被一个consumer消费)
2. Make a partition within a topic the smallest unit of parallelism. (partition 是最小的并行单位)
3. not have a central “master” node, but instead let consumers coordinate among themselves in a decentralized fashion
    - use zookeeper (zk介绍)
        1. file system like api, crud, and list the children of a path
        2. one can register a watcher on a path and get notified when the children of a path or the value of a path has changed
        3. a path can be created as ephemeral (as oppose to persistent), which means that if the creating client is gone, the path is automatically removed by the Zookeeper server; 
        4.  zookeeper replicates its data to multiple servers, which makes the data highly reliable and available
4. kafka use zookeeper for the following tasks
     - detect the addition and the removal of brokers and consumers (检测consumer * broker 增加/删除)
     - trigger a rebalance process when the above events happen (当上面事件发生，发生rebalance)
     - maintain the consumption relationship <del>and keep track of the consumed offset of each partition</del>
     - Each consumer registers a Zookeeper watcher on both the broker registry and the consumer registry, and will be notified whenever a change in the broker set or the consumer group occurs. (broker set / consumer group 状态发生改变，会通知)


### Delivery Guarantees

1. Kafka only guarantees at-least-once delivery. Exactly once delivery typically requires two-phase commits and is not necessary for our applications. (kafka保证至少一次消费, 正好一次需要两段提交, 但大多数系统不需要).
2. in the case when a consumer process crashes without a clean shutdown, the consumer process that takes over those partitions owned by the failed consumer may get some duplicate messages that are after the last offset successfully committed to zookeeper. (consumer突然宕机，会导致可能最后的offset更新没有推送到zk or kafka里)
    - If an application cares about duplicates, it must add its own de-
duplication logic, either using the offsets that we return to the consumer or some unique key within the message.(不想要重复，需要自行实现去重逻辑，如用offset or unique key).
3. To avoid log corruption, Kafka stores a CRC for each message in
the log.(防止log损坏，CRC校验)



## 常见问题

###  Kafka为什么客户端不可读写Follower副本

- https://www.zhihu.com/question/327925275/answer/705690755
1. 一方面，由于副本是基于分区的，已经做了数据的负载均衡。
2. `Leader-Follower` 同步 `Consumer Offset`存在一致性问题, 实现复杂。


### kafka吞吐量大

- 日志顺序读写和快速检索
- partition机制 (并行但不保证全topic有序)
- 批量发送接收和数据压缩机制
- 通过sendfile实现零拷贝原则

### 日志检索底层

- 每个partion作为一个文件夹
```
message length: 4 bytes (value: 1+4+n) // 消息长度, 不算自身, 可以理解为header
"magic" value: 1 byte         //版本号
crc: 4 bytes                        //CRC校验码
payload:  n bytes               // 具体的消息 
```
- 每个partition的日志会分为N个大小相等的segment, 虽然大小相等，但是消息数量不一定相等
- 每个partition只支持顺序读写
- partition会添加到最后一个segment上
- 所以通过建立 `segement_index -> real_offset -> real_record` 的映射，并利用顺序append，提高了效率

### 零拷贝

- 原始  `文件->用户缓冲区->内核->socket->消费者进程`
- 调用linux系统函数,  `文件->内核->socket->消费者进程`  

### 消费者组

- 在消息不被回收的情况下，不同group会消费同一topic的同一条消息
- 单个partition只能由消费者组中某个消费者消费
- 消费者组中的单个消费者可以消费多个partition

### topic 删除

- kafka的topic删除存在的问题会比较多
- 建议设置`auto.create.topics.enable = false`
- 建议设置`delete.topic.enable=true`
- 停掉kafka的流量，再删topic


## 参考

- [Kafka存储模型](https://cloud.tencent.com/developer/article/1057763)