# Redis 集群

## 集群方案

1. 客户端记录所有节点信息，利用一致性hash，将对应的key存到对应的节点上（节点间构建主从来保证高可用）
    * 数据迁移依赖客户端
2. Redis Cluster
    * 节点间通过 Gossip 同步状态，并且分slot到对应的主从节点
3. Codis
    * 利用zk来维护对应的slot和节点的关系

## Redis Cluster

- Cluster nodes are also able to **auto-discover** other nodes, detect non-working nodes, and promote slave nodes to master when needed in order to continue to operate when a failure occurs.
- The client is **not required** to hold the state of the cluster.
- Masters can not reply to clients (with the acknowledge of the write) and slaves (propagating the write) at about the same time.
* Merge operations are avoided
* hash use `crc16(key) % 16384`
* 

## Reference

- [Redis Cluter搭建](https://www.cnblogs.com/Yunya-Cnblogs/p/14608937.html)
- [Redis Cluster官方文档](https://redis.io/topics/cluster-spec)
- [Codis](https://github.com/CodisLabs/codis)
- [美团KV存储架构](https://mp.weixin.qq.com/s/1woExb3V_PjnrhHYH5Jksg)
- [字节火山 Redis 集群](https://mp.weixin.qq.com/s/VCpuZ0lvgSgfvG7voBl9fw)