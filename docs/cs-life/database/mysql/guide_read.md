# Mysql存储引擎-InnoDB

## 简述 

读了《高性能MySQL(第3版) 》第一章。但不是讲解实现的。

=>《MySQL技术内幕 InnoDB存储引擎 第2版》

1. Log
    * slow log，<b>二进制文件</b>，记录查询较慢的sql，借助 `mysqldumpslow` 分析，MySQL本身的文件
    * binlog，<b>逻辑日志</b>，记录数据库执行 更新的sql，供salve复制数据，MySQL本身的文件
    * redolog，<b>物理日志</b>，WAL日志，保证持久性，InnoDB特有
    * undo log，<b>逻辑日志</b>，记录事务执行过程中的相反操作（insert 变为 delete），（update 变为反向update）
2. buffer pool
    * insert buffer & change buffer
    * 索引是辅助索引（二级索引），索引不是 unique 的
3. 锁
4. 索引
5. 事务
6. MVCC 多版本并发控制
    - 提升了并发性能，可以认为是 行级锁的一种变种，但在很多情况下避免了加锁，因此开销更低。
7. 数据库踩坑
8. 查询优化，提升下sql能力

## 小试牛刀

`docker-compose --file docker-compose.yml up -d` 启动mysql容器

docker-compose.yml文件如下

volumes里面挂载了两个目录
- 配置文件`~/data/mysql/conf/my.cnf`，
- 数据目录，方便在宿主机看到数据 `~/data/mysql/data`

```
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
      - ~/data/mysql/conf/my.cnf:/etc/mysql/my.cnf
      - ~/data/mysql/data:/var/lib/mysql
```
`mysql -u root -p root` 连接到mysql，查看innodb引擎 情况

```
> show engine INNODB STATUS\G

***************************[ 1. row ]***************************
Type   | InnoDB
Name   |
Status |
=====================================
2022-06-04 14:51:57 0x7faf007f8700 INNODB MONITOR OUTPUT
=====================================
Per second averages calculated from the last 53 seconds
-----------------
BACKGROUND THREAD
-----------------
srv_master_thread loops: 2 srv_active, 0 srv_shutdown, 267 srv_idle
srv_master_thread log flush and writes: 269
----------
SEMAPHORES
----------
OS WAIT ARRAY INFO: reservation count 2
OS WAIT ARRAY INFO: signal count 2
RW-shared spins 0, rounds 4, OS waits 2
RW-excl spins 0, rounds 0, OS waits 0
RW-sx spins 0, rounds 0, OS waits 0
Spin rounds per wait: 4.00 RW-shared, 0.00 RW-excl, 0.00 RW-sx
------------
TRANSACTIONS
------------
Trx id counter 1795
Purge done for trx's n:o < 0 undo n:o < 0 state: running but idle
History list length 0
LIST OF TRANSACTIONS FOR EACH SESSION:
---TRANSACTION 421865085982560, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
--------
FILE I/O
--------
I/O thread 0 state: waiting for completed aio requests (insert buffer thread)
I/O thread 1 state: waiting for completed aio requests (log thread)
I/O thread 2 state: waiting for completed aio requests (read thread)
I/O thread 3 state: waiting for completed aio requests (read thread)
I/O thread 4 state: waiting for completed aio requests (read thread)
I/O thread 5 state: waiting for completed aio requests (read thread)
I/O thread 6 state: waiting for completed aio requests (write thread)
I/O thread 7 state: waiting for completed aio requests (write thread)
I/O thread 8 state: waiting for completed aio requests (write thread)
I/O thread 9 state: waiting for completed aio requests (write thread)
Pending normal aio reads: [0, 0, 0, 0] , aio writes: [0, 0, 0, 0] ,
 ibuf aio reads:, log i/o's:, sync i/o's:
```

bufferPoolSize
```
> show variables like 'innodb_buffer_pool_size'\G
(END)
***************************[ 1. row ]***************************
Variable_name | innodb_buffer_pool_size
Value         | 134217728     => 128MB
```

查看mysql相关配置

```shell
cd / 
find . -name "*mysql*" | grep "log"

或者用 mysqlCli 查询
mysqlCli> show variables like '%datadir%'\G
```
查询得知，mysql容器相关的文件存放在 `/var/lib/mysql`