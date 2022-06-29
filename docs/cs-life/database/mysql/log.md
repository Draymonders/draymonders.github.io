# Mysql存储引擎-InnoDB

## 日志相关

### Binlog

- <b>逻辑日志</b>，用于主从同步

开启binlog需要在 `my.cnf` 配置

```
[mysqld]
log_bin=mysql-bin
server-id=1
```

#### Binlog 存储

```
> show master status\G

***************************[ 1. row ]***************************
File              | mysql-bin.000003
Position          | 856
Binlog_Do_DB      |
Binlog_Ignore_DB  |
Executed_Gtid_Set |
```

查看binlog格式，binlog有三种格式`STATEMENT`，`ROW`，`MIX`

```
> select @@session.binlog_format;
+-------------------------+
| @@session.binlog_format |
+-------------------------+
| ROW                     |
+-------------------------+
```


建表并初始化数据

```sql
CREATE TABLE `t_sample` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci

insert into t_sample(name) values("bing"),("draymonder");
```

#### 更新数据的binlog

```sql
update t_sample set name ='amor' where id=2;
```

查看binlog文件，需要使用mysql自带的 `mysqlbinlog` ，用cat不行，因为binlog是二进制文件

```sql
> mysqlbinlog --start-position=856 mysql-bin.000003 -v

# at 993
#220605  6:16:18 server id 1  end_log_pos 1047 CRC32 0x62752495 	Table_map: `amor`.`t_sample` mapped to number 110
# at 1047
#220605  6:16:18 server id 1  end_log_pos 1117 CRC32 0xdcaf7236 	Update_rows: table id 110 flags: STMT_END_F

BINLOG '
MkqcYhMBAAAANgAAABcEAAAAAG4AAAAAAAEABGFtb3IACHRfc2FtcGxlAAIIDwJAAACVJHVi
MkqcYh8BAAAARgAAAF0EAAAAAG4AAAAAAAEAAgAC///8AgAAAAAAAAAKZHJheW1vbmRlcvwCAAAA
AAAAAARhbW9yNnKv3A==
'/*!*/;
### UPDATE `amor`.`t_sample`
### WHERE
###   @1=2
###   @2='draymonder'
### SET
###   @1=2
###   @2='amor'
# at 1117
#220605  6:16:18 server id 1  end_log_pos 1148 CRC32 0x24efb3f3 	Xid = 42
COMMIT/*!*/;
SET @@SESSION.GTID_NEXT= 'AUTOMATIC' /* added by mysqlbinlog */ /*!*/;
DELIMITER ;
# End of log file
/*!50003 SET COMPLETION_TYPE=@OLD_COMPLETION_TYPE*/;
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=0*/;
```

#### 删除数据的binlog

```sql
delete from t_sample where name='amor';

> mysqlbinlog --start-position=856 mysql-bin.000003 -v

# at 1285
#220605  6:27:50 server id 1  end_log_pos 1339 CRC32 0x5567ded4 	Table_map: `amor`.`t_sample` mapped to number 110
# at 1339
#220605  6:27:50 server id 1  end_log_pos 1388 CRC32 0x07ba59c7 	Delete_rows: table id 110 flags: STMT_END_F

BINLOG '
5kycYhMBAAAANgAAADsFAAAAAG4AAAAAAAEABGFtb3IACHRfc2FtcGxlAAIIDwJAAADU3mdV
5kycYiABAAAAMQAAAGwFAAAAAG4AAAAAAAEAAgAC//wCAAAAAAAAAARhbW9yx1m6Bw==
'/*!*/;
### DELETE FROM `amor`.`t_sample`
### WHERE
###   @1=2
###   @2='amor'
# at 1388
#220605  6:27:50 server id 1  end_log_pos 1419 CRC32 0x79c74b7b 	Xid = 59
COMMIT/*!*/;
SET @@SESSION.GTID_NEXT= 'AUTOMATIC' /* added by mysqlbinlog */ /*!*/;
DELIMITER ;
# End of log file
/*!50003 SET COMPLETION_TYPE=@OLD_COMPLETION_TYPE*/;
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=0*/;
```


### RedoLog

为了取得更好的读写性能，InnoDB会将数据缓存在内存中（InnoDB Buffer Pool），对磁盘数据的修改也会落后于内存，这时如果进程或机器崩溃，会导致内存数据丢失，为了保证数据库本身的一致性和持久性，InnoDB维护了REDO LOG。

修改Page之前需要先将修改的内容记录到REDO中，并保证REDO LOG早于对应的Page落盘，也就是常说的WAL，Write Ahead Log。当故障发生导致内存数据丢失后，InnoDB会在重启时，通过重放REDO，将Page恢复到崩溃前的状态。


#### Redolog 存储

```
root@8a83121d6e85:/var/lib/mysql# ls -lsh | grep "ib"
4.0K -rw-r----- 1 mysql mysql 1.4K Jun  5 06:05 ib_buffer_pool
 48M -rw-r----- 1 mysql mysql  48M Jun  5 06:29 ib_logfile0
 48M -rw-r----- 1 mysql mysql  48M Jun  5 06:05 ib_logfile1
 76M -rw-r----- 1 mysql mysql  76M Jun  5 06:29 ibdata1
 12M -rw-r----- 1 mysql mysql  12M Jun  5 06:26 ibtmp1
```

innodb 存储引擎至少有1个重做日志文件组（group），每个group至少有2个文件，如默认的`ib_logfile0`和`ib_logfile1`，InnoDB先写`ib_logfile0`，写满了后，切换到`ib_logfile1`，再写满后，再继续写`ib_logfile0`

```
show variables like 'innodb%log%'\G

***************************[ 8. row ]***************************
Variable_name | innodb_log_file_size
Value         | 50331648    => 48MB
***************************[ 9. row ]***************************
Variable_name | innodb_log_files_in_group
Value         | 2                    => 2个

> show variables like '%flush%'\G

***************************[ 7. row ]***************************
Variable_name | innodb_flush_log_at_trx_commit
Value         | 1           =>  每提交一个事务，就刷盘 redo log buffer 到 log文件里
```

```
> show engine innodb status\G;  （插入大量的数据）
---
LOG
---
Log sequence number 127664222
Log flushed up to   120711324
Pages flushed up to 70622487
Last checkpoint at  62890079
```

- log sequence number: 代表当前的重做日志redo log(in buffer)在内存中的LSN
- log flushed up to: 代表刷到redo log file on disk中的LSN
- pages flushed up to: 代表已经刷到磁盘数据页上的LSN
- last checkpoint at: 代表上一次检查点所在位置的LSN

log sequence number >= log flushed up to >= pages flushed up to >= last checkpoint at



大概格式

```
（Page ID，Record Offset，(Filed 1, Value 1) … (Filed i, Value i) … )
```

其中，PageID指定要操作的Page页，Record Offset记录了Record在Page内的偏移位置，后面的Field数组，记录了需要修改的Field以及修改后的Value。


InnoDB中通过min-transaction实现，简称mtr，需要原子操作时，调用mtr_start生成一个mtr，mtr中会维护一个动态增长的m_log，这是一个动态分配的内存空间，将这个原子操作需要写的所有REDO先写到这个m_log中，当原子操作结束后，调用mtr_commit将m_log中的数据拷贝到InnoDB的Log Buffer。

#### redo log 大小设置

1. 设置过大，恢复需要花很长时间。
2. 设置过小，一个事务可能被记录在了不同的 redo log子log上。设置的太小会导致频繁的 `async checkpoint`，频繁刷盘

#### redo log、bin log 区别

1. binlog是mysql有的，和存储引擎无关，redo log是 InnoDB特有的。
2. binlog记录的逻辑日志，redo log记录的物理日志（关于每个页的更改的物理情况）
3. redo log是InnoDB实现的wal日志。二进制日志只在每次事务提交的时候一次性写入缓存中的日志文件，redo log一直会记录。
4. 为了保证存储引擎层和上层二进制日志的一致性，二者之间使用了 <b>两阶段事务</b>

#### Redo log 相关文章

- [庖丁解InnoDB之REDO LOG](http://catkang.github.io/2020/02/27/mysql-redo.html)
- [binlog、redo log](https://cloud.tencent.com/developer/article/1679325)


### Undo Log  TODO

1. 逻辑日志，记录事务执行过程中的相反操作（insert 变为 delete），（update 变为反向update）
2. 实现MVCC的非锁定读。读快照的能力
