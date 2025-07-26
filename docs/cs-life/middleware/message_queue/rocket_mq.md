# RocketMQ

主要是在线数据异步处理使用。

## 存储

### CommitLog

作用：用于存储所有Topic的MQ消息实际数据

特点：

- 使用偏移量作为文件名，**文件名长度20位数字**，偏移量长度不够20位就左边补0
- 文件大小默认1GB
- 消息顺序写入该文件，每条消息长度不定，文件写满后，写入下一个文件

![bH7ZLV.jpg](https://s1.ax1x.com/2022/03/12/bH7ZLV.jpg)


### Topic

作用：区分业务域的一组消息

### ConsumeQueue

作用：提升topic的并发读写能力（但是没办法保证消息的全局有序，只能保证单queue的有序能力）

实现：CommitLog的一种索引

Consumer消费消息的时候，要读2次：先读ConsumeQueue得到offset，再通过offset找到CommitLog对应的消息内容。

特点：

- 存储路径：consumequeue/{topic}/{queueId}/{fileName}
- 文件固定大小约5.72MB
- 文件内存储30w个条目，每个条目20B：8B的CommitLog物理偏移量+4B消息长度+8B消息TagHash
- 文件很小，可整个文件加载到内存中
- 条目固定大小，可以像访问数组一样随机访问

![bH7mZT.jpg](https://s1.ax1x.com/2022/03/12/bH7mZT.jpg)

#### 为什么8B就能够存储CommitLog的偏移量了

8B => 64bit => 2**64 => 18446744073709551616
> len(str("18446744073709551616")) => 20

### offsetTable.offset

作用：要记录当前consumerQueue的每个consumerGroup的offset

这个offset是ConsumeQueue文件的（已经消费的）下标/行数，可以直接定位到ConsumeQueue并找到commitlogOffset从而找到消息体原文。

这个offset是消息消费进度的核心，不同的消费模式，保存地址不同 

**广播模式**：DefaultMQPushConsumer的BROADCASTING模式，各个Consumer没有互相干扰，使用LoclaFileOffsetStore，把Offset存储在Consumer本地 

**集群模式**：DefaultMQPushConsumer的CLUSTERING模式，由Broker端存储和控制Offset的值，使用RemoteBrokerOffsetStore

### IndexFile  TODO

作用：根据时间和msgId去定位到具体的消息内容

这个多是线上定位问题使用，根据MsgId去查具体的消息内容

## Reference

- https://jishuin.proginn.com/p/763bfbd6a0f2