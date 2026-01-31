# RocketMQ

## 1. 使用场景

RocketMQ 作为一款高性能、高吞吐量的分布式消息中间件，广泛应用于互联网业务中，主要场景包括：

*   **异步解耦**：将核心业务流程与非核心业务流程分离，降低系统耦合度。例如：用户注册后，异步发送邮件、短信通知，异步初始化积分等。
*   **削峰填谷**：在流量高峰期（如秒杀活动），消息队列充当缓冲层，将瞬时高并发请求暂存，后端服务按照自己的处理能力慢慢消费，防止系统崩溃。
*   **顺序消息**：保证消息的先进先出（FIFO）。RocketMQ 支持局部顺序（Partition/Queue 级别），适用于对顺序有严格要求的场景，如订单状态流转（创建->支付->发货->完成）。
*   **事务消息**：提供类似 X/Open XA 的分布式事务功能，通过半消息（Half Message）机制保证本地事务与消息发送的最终一致性。
*   **数据同步**：作为数据管道，用于异构系统间的数据同步。

## 2. 存储结构

RocketMQ 采用混合型的存储结构，主要由 **CommitLog**、**ConsumeQueue** 和 **IndexFile** 三部分组成。

### 2.1 CommitLog (消息主体)

**作用**：存储消息主体的物理文件。Broker 上收到的所有 Topic 的消息都顺序写入同一个 CommitLog 文件中。

**特点**：

*   **顺序写**：极大提高了写入性能（利用 OS 的 PageCache 和顺序 IO）。
*   **文件命名**：使用偏移量作为文件名，**文件名长度20位数字**，偏移量长度不够20位就左边补0。例如第一个文件为 `00000000000000000000`，第二个文件（假设文件大小1G）为 `00000000001073741824`。
*   **文件大小**：默认 1GB。
*   **结构**：每条消息长度不定，包含消息体、Topic、QueueId 等信息。文件写满后，自动创建下一个文件。

![bH7ZLV.jpg](https://s1.ax1x.com/2022/03/12/bH7ZLV.jpg)

### 2.2 ConsumeQueue (逻辑消费队列)

**作用**：消息消费的逻辑队列，类似于数据库的索引文件。引入 ConsumeQueue 是为了提高消息消费的性能。

**特点**：

*   **存储路径**：`consumequeue/{topic}/{queueId}/{fileName}`。
*   **索引结构**：每个条目固定大小 **20 Bytes**，包含：
    *   **CommitLog Offset (8 Bytes)**: 消息在 CommitLog 中的物理偏移量。
    *   **Msg Size (4 Bytes)**: 消息总长度。
    *   **Tags Hashcode (8 Bytes)**: 消息 Tag 的 Hash 值（用于过滤）。
*   **文件大小**：每个文件包含 30w 个条目，大小约 5.72MB。
*   **读写机制**：Consumer 消费时，先从 ConsumeQueue 读取消息的 Offset，再去 CommitLog 读取真实消息。由于条目大小固定，支持快速定位和随机访问。

![bH7mZT.jpg](https://s1.ax1x.com/2022/03/12/bH7mZT.jpg)

### 2.3 IndexFile (索引文件)

**作用**：提供根据 Message Key (业务 Key) 或 Message ID 快速查询消息的能力。

**结构**：IndexFile 底层实现为 **Hash 索引**（哈希槽 + 链表）。

*   **Header**: 存储索引头信息（如时间范围、槽位数量等）。
*   **Slot Table**: 默认 500w 个 Hash 槽。
*   **Index Linked List**: 默认 2000w 个 Index 条目。每个条目包含 Key Hash、CommitLog Offset、Timestamp、Next Index Offset（解决 Hash 冲突）。

**查询流程**：

1.  计算 Key 的 Hash 值。
2.  定位到 Slot Table 中的槽位。
3.  遍历链表找到对应的消息 Offset。

## 3. 可靠性手段

RocketMQ 从生产、存储到消费各个环节都提供了保证消息可靠性的手段。

### 3.1 消息不丢 (Message Reliability)

#### 1. 生产者端 (Producer)
*   **重试机制**：发送失败时自动重试。
*   **同步发送**：使用 `send()` 同步方法，等待 Broker 返回 SendResult，确认发送成功（Status 为 SEND_OK）。
*   **事务消息**：对于涉及本地事务的场景，使用事务消息机制保证消息发送与本地事务的一致性。

#### 2. Broker 端 (Storage)
*   **同步刷盘 (Sync Flush)**：消息写入内存后，强制刷入磁盘才返回成功。相比异步刷盘（Async Flush），性能较低但数据安全性最高。
    *   配置：`flushDiskType = SYNC_FLUSH`
*   **同步复制 (Sync Replication)**：Master 节点写入成功后，同步到 Slave 节点，两者都写入成功才返回给 Producer。防止 Master 宕机导致数据丢失。
    *   配置：`brokerRole = SYNC_MASTER`
*   **Dledger (Raft)**：使用 Dledger 模式，基于 Raft 协议实现多副本强一致性。

#### 3. 消费者端 (Consumer)
*   **ACK 机制**：Consumer 只有在通过业务逻辑处理完消息后，才返回 `ConsumeConcurrentlyStatus.CONSUME_SUCCESS`。
*   **重试队列**：如果消费失败（返回 RECONSUME_LATER 或抛出异常），Broker 会将消息通过 ScheduleTopic 重新投递，支持指数退避重试（默认 16 次）。
*   **死信队列 (DLQ)**：重试多次仍失败的消息进入死信队列，需人工干预。

### 3.2 消息不重复消费 (Idempotency)

RocketMQ **保证消息至少被消费一次 (At Least Once)**，但不保证消息不重复。网络波动、Consumer 重启、Rebalance 等情况都可能导致消息重复投递。

**解决方案**：**业务端实现幂等性**。

*   **数据库唯一键**：利用数据库的主键或唯一索引约束，重复插入会报错。
*   **Redis 原子操作**：使用 `setnx` 或类似指令，Key 为 Message ID 或 业务唯一 ID，处理前先判断是否存在。
*   **状态机**：业务流转需满足前置状态条件（如：订单状态只能从“未支付”变更为“已支付”）。
*   **Token 机制**：处理前检查 Token 是否已使用。
