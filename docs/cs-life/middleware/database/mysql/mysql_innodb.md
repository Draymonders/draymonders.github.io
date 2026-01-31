# MySQL InnoDB 简介

本文档以资深开发视角深入剖析 InnoDB 存储引擎的核心特性，涵盖环境搭建、日志机制、索引原理、内存管理、锁机制、事务模型及扩容方案。

## 1. 环境安装 (Environment)

基于 Docker Compose 快速搭建 MySQL 5.7 实验环境，便于复现与调试。

### 1.1 部署配置

创建 `docker-compose.yml`，挂载配置与数据目录以保证数据持久化及配置可修改。

```yaml
version: "3"

services:
  mysql:
    image: mysql:5.7
    command: --default-authentication-plugin=mysql_native_password --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    restart: always
    ports:
      - 3306:3306
    environment:
      MYSQL_ROOT_PASSWORD: root
    volumes:
      # 配置文件挂载
      - ~/data/mysql/conf/my.cnf:/etc/mysql/my.cnf
      # 数据文件挂载
      - ~/data/mysql/data:/var/lib/mysql
```

### 1.2 启动与状态检查

```bash
# 启动容器
docker-compose up -d

# 检查容器状态
docker ps | grep mysql
```

连接 MySQL 并查看 InnoDB 引擎状态：
```sql
mysql -u root -p
-- 查看 InnoDB 核心状态（包含锁、I/O、Buffer Pool等信息）
SHOW ENGINE INNODB STATUS\G
```

## 2. 日志系统 (Logging)

MySQL 的日志系统是保证数据持久性（Durability）、原子性（Atomicity）及主从复制的关键。

### 2.1 日志体系概览

| 日志类型 | 归属层级 | 类型 | 关键作用 | 刷盘策略 |
| :--- | :--- | :--- | :--- | :--- |
| **Binlog** | Server 层 | 逻辑日志 | 主从复制、数据恢复、审计 | `sync_binlog` |
| **Redo Log** | InnoDB 层 | 物理日志 | 崩溃恢复 (Crash Safe)、持久性 | `innodb_flush_log_at_trx_commit` |
| **Undo Log** | InnoDB 层 | 逻辑日志 | 事务回滚、MVCC (多版本并发控制) | 独立/系统表空间 |
| **Slow Log** | Server 层 | 文本日志 | 慢查询分析 | `long_query_time` |

### 2.2 Binlog (归档日志)
记录所有对数据库执行更改的 SQL 语句，主要用于主从复制和 Point-in-Time Recovery (PITR)。

*   **格式 (`binlog_format`)**：
    *   `STATEMENT`: 记录 SQL 原句（可能导致主从不一致）。
    *   `ROW`: 记录行变更前后的值（推荐，数据更安全）。
    *   `MIXED`: 混合模式。
*   **常用操作**：
    ```sql
    -- 查看当前 Binlog 写入位置
    SHOW MASTER STATUS\G
    ```
    ```bash
    # 解析 Binlog (因是二进制文件，需用工具查看)
    mysqlbinlog --start-position=856 mysql-bin.000003 -v
    ```

### 2.3 Redo Log (重做日志)
**WAL (Write-Ahead Logging)** 技术的核心。修改数据页前，先记录 Redo Log，保证事务的 **Durability (持久性)**。

*   **机制**：循环写入固定大小的文件组（如 `ib_logfile0`, `ib_logfile1`）。
*   **CheckPoint**：当 Redo Log 写满或系统空闲时，触发 Checkpoint 将脏页刷新到磁盘，推进 LSN (Log Sequence Number)。
*   **关键参数**：
    *   `innodb_log_file_size`: 单个日志文件大小。
    *   `innodb_flush_log_at_trx_commit`:
        *   `0`: 每秒写入磁盘（性能最好，Crash 可能丢1秒数据）。
        *   `1`: 每次事务提交写入磁盘（默认，最安全）。
        *   `2`: 每次提交写入 OS Cache（MySQL Crash 不丢，OS Crash 丢）。

### 2.4 Undo Log (回滚日志)
*   **作用**：
    1.  **事务回滚**：记录数据的反向操作（Insert -> Delete, Update -> Reverse Update），保证 **Atomicity (原子性)**。
    2.  **MVCC**：构建数据的历史版本，实现一致性非锁定读。

## 3. 索引文件 (Indexing)

InnoDB 采用 **B+ 树** 作为索引的物理存储结构，高度通常在 2-4 层，通过减少磁盘 I/O 次数提升查询效率。

### 3.1 聚簇索引 vs 二级索引
*   **聚簇索引 (Clustered Index)**：
    *   **定义**：叶子节点存储完整的**行数据**。InnoDB 表必须有且仅有一个聚簇索引（通常是主键）。
    *   **优势**：根据主键查询无需回表，速度最快。
*   **二级索引 (Secondary Index)**：
    *   **定义**：叶子节点存储 `索引列值 + 主键值`。
    *   **回表 (Look Up)**：查询非覆盖索引列时，需先查二级索引拿到主键，再回查聚簇索引获取完整数据。

### 3.2 覆盖索引
当 SQL 查询的列完全包含在二级索引中时，无需回表操作，直接返回结果。这是 SQL 优化的重要手段。

## 4. 内存缓冲池 (Buffer Pool)

InnoDB 将磁盘数据页缓存到内存中，利用 Buffer Pool 弥补磁盘 I/O 瓶颈。

### 4.1 内存管理策略
*   **Page**: 内存页（默认 16KB）。
*   **LRU 算法优化**: 采用 **Midpoint Insertion Strategy**。新读取的页插入到 LRU 列表的 5/8 处（Old Sublist 头部），而非 List 头部。
    *   **目的**：防止全表扫描等一次性大查询将热点数据（New Sublist）挤出内存。
*   **Change Buffer**: 针对非唯一二级索引的写操作（Insert/Update/Delete），如果数据页不在内存，先在 Buffer 中记录变更，稍后 Merge，减少随机磁盘 I/O。

### 4.2 监控
```sql
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
-- 建议设置为机器物理内存的 60%-80% (专用 DB 服务器)
```

## 5. 锁机制 (Locking)

### 5.1 锁类型

*   **共享锁 (S Lock)**: 读锁。允许事务读，阻止其他事务写。
    *   `SELECT ... LOCK IN SHARE MODE`
*   **排他锁 (X Lock)**: 写锁。允许事务读写，阻止其他事务读写。
    *   `SELECT ... FOR UPDATE`, `UPDATE`, `DELETE`

### 5.2 锁算法 (Row-Level Locking)
InnoDB 的行锁是加在**索引**上的，而非记录本身。

1.  **Record Lock**: 锁单行记录。
2.  **Gap Lock**: 间隙锁。锁两个记录之间的空隙，防止其他事务插入数据，解决**幻读**问题。
3.  **Next-Key Lock**: Record Lock + Gap Lock。锁住行记录及其之前的间隙。

### 5.3 意向锁 (Intention Lock)

表级锁，用于快速判断表中是否有行被上锁，提高加表锁的效率（如 `LOCK TABLES`）。

## 6. 事务 (Transactions)

### 6.1 ACID 特性与实现

*   **A (Atomicity)**: 原子性。由 **Undo Log** 保证，支持回滚。
*   **C (Consistency)**: 一致性。事务前后的数据完整性约束，由代码逻辑、约束及 AID 共同保证。
*   **I (Isolation)**: 隔离性。由 **MVCC** (快照读) + **锁** (当前读) 保证。
*   **D (Durability)**: 持久性。由 **Redo Log** 保证。

### 6.2 隔离级别 (Isolation Levels)

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 实现方式 |
| :--- | :---: | :---: | :---: | :--- |
| **Read Uncommitted** | √ | √ | √ | 读不加锁 |
| **Read Committed (RC)** | × | √ | √ | MVCC (每次 Select 生成新 ReadView) |
| **Repeatable Read (RR)** | × | × | × | **默认**。MVCC (首次 Select 生成 ReadView) + Next-Key Lock |
| **Serializable** | × | × | × | 强制事务串行执行 |

### 6.3 MVCC (多版本并发控制)

*   **快照读 (Snapshot Read)**: 普通的 `SELECT`。读取 Undo Log 中的历史版本，不加锁，高并发。
*   **当前读 (Current Read)**: `INSERT`, `UPDATE`, `DELETE`, `SELECT ... FOR UPDATE`。读取最新版本，并加锁。

## 7. 扩容方案 (Scaling)

当单机数据库达到瓶颈（磁盘容量、I/O、CPU）时，需要进行扩容。

### 7.1 垂直扩容 (Scale Up)

简单粗暴，提升单机硬件配置（CPU、内存、SSD）。成本高，有物理上限。

### 7.2 水平扩容 (Scale Out)

通常指**分库分表 (Sharding)**。

*   **架构模式**: Proxy (如 ShardingSphere-Proxy, MyCat) 或 Client (Sharding-JDBC) + 数据库集群。
*   **扩容流程示例**:
    1.  **规划**: 确定新的分片策略（如 `hash(uid) % n`）。
    2.  **双写/同步**: 
        *   方案A: 停机迁移（简单但影响业务）。
        *   方案B: 存量同步 + 增量追平（基于 Binlog）。
    3.  **校验**: 数据一致性校验。
    4.  **切流**: 切换读写流量到新集群。
*   **注意事项**:
    *   扩容期间可能存在短暂的不可写（ReadOnly）。
    *   查询必须尽可能带上分片键（Sharding Key），否则会触发全路由扫描。

### 7.3 业务扩容

背景：

- db 存储快满了，不扩容会导致系统不可用，执行时间为凌晨
- db扩容期间会有 5s 左右时间不可写
- db的架构为 proxy + 主从，查询必须带分片键

扩容前

![扩容前](./scale_up_before.png)

扩容后

![扩容前](./scale_up_after.png)

## 附录：参考资料

- [MySQL 索引原理及慢查询优化](https://tech.meituan.com/2014/06/30/mysql-index.html)
- [InnoDB Undo Log 漫游](http://mysql.taobao.org/monthly/2015/04/)
- [InnoDB Redo Log 漫游](http://mysql.taobao.org/monthly/2015/05/)
