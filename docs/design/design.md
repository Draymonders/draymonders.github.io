# 系统设计

## 设计流程

### 1. 约束和用例

计算如下需求

- 每秒的QPS 
    * 读写QPS，流量的计算
- 未来几年的存储容量 
    * 数据会占用的磁盘空间
- Hash所需的位数

### 2. 抽象设计

- application service
    * 提供哪些接口和服务
- data storage
    * 数据底层存储

### 3. 瓶颈分析

- 优化
    * LoadBalancer
    * Scale storage
    * Cache
    * Message queue
- 没有最好的设计
    * 表明系统中存在的trade off

### 4. 抽象设计的拓展

