# 极客时间-MYSQL45讲-笔记


## 01 | 基础架构：一条 SQL 查询语句是如何执行的？

![800B45CC-7F33-47BE-ABC6-DFDA23871E3E](https://i.loli.net/2020/11/29/s1eAQVUMnLorXzh.jpg)

### 连接器

尽量使用长连接。

但有些时候长连接累积下来，可能导致内存占用太大，被系统强行杀掉（OOM），从现象看就是 MySQL 异常重启了。

### 查询缓存

大多数情况下我会建议你不要使用查询缓存，为什么呢？因为查询缓存往往弊大于利。

除非业务就是有一张静态表，很长时间才会更新一次。 比如，一个系统配置表，那这张表上的查询才适合使用查询缓存。

MySQL 8.0 版本直接将查询缓存的整块功能删掉了，也就是说 8.0 开始彻底没 有这个功能了。

### 分析器

分析器会做“**词法分析**” 和 “**语法分析**”。

### 优化器

优化器是在表里面有多个索引的时候，决定使用哪个索引。

或者在一个语句有多表关联（join） 的时候，决定各个表的连接顺序。

### 执行器

先判断一下你对这个表 T 有没有执行查询的权限

如果有权限，就打开表继续执行。打开表的时候，优化器就会根据表的引擎定义，去使用这个引擎提供的接口。

## 02 | 日志系统：一条 SQL 更新语句是如何执行的？

redo log（重做日志）和 binlog（归档日志）

### 重要的日志模块：redo log

如果有人要赊账或者还账的话，掌柜一般有两种做法： 一种做法是直接把账本翻出来，把这次赊的账加上去或者扣除掉； 另一种做法是先在粉板上记下这次的账，等打烊以后再把账本翻出来核算。 在生意红火柜台很忙时，掌柜一定会选择后者，因为前者操作实在是太麻烦了。

 同样，在 MySQL 里也有这个问题，如果每一次的更新操作都需要写进磁盘，然后磁盘也要找到 对应的那条记录，然后再更新，整个过程 IO 成本、查找成本都很高

**WAL** 全称 Write-Ahead Logging

粉板和账本配合的整个过程，其实就是 MySQL 里经常说到的 WAL

它的关键点就是**先写日志，再写磁盘**，也就是先写粉板，等不忙的时候再写账本。

InnoDB 的 redo log 是固定大小的，比如可以配置为一组 4 个文件，每个文件的大 小是 1GB，那么这块“粉板”总共就可以记录 4GB 的操作。从头开始写，写到末尾就又回到开 头循环写

wirte pos 是当前记录的位置，一边写一边后移，写到第 3 号文件末尾后就回到 0 号文件开头。

checkpoint 是当前要擦除的位置，也是往后推移并且循环的，擦除记录前要把记录更新到数据文件。

如果 write pos 追上 checkpoint，表示“粉板”满了，这时候不能再执行新的更新，得停下来先擦掉一些记录，把 checkpoint 推进一下。

有了 redo log，InnoDB 就可以保证即使数据库发生异常重启，之前提交的记录都不会丢失， 这个能力称为crash-safe。

### 重要的日志模块：binlog

redo log 是 InnoDB 引擎特有的日志，而 Server 层也有自己的日志，称为 binlog（归档日志）。

**为什么会有两份日志呢**

因为最开始 MySQL 里并没有 InnoDB 引擎。MySQL 自带的引擎是 MyISAM，但是 MyISAM 没有 crash-safe 的能力，binlog 日志只能用于归档。而 InnoDB 是另一个公司以插件形式引入 MySQL 的，既然只依靠 binlog 是没有 crash-safe 能力的，所以 InnoDB 使用另外一套日志系 统——也就是 redo log 来实现 crash-safe 能力。

这两种日志有以下三点不同。

1.  redo log 是 InnoDB 引擎特有的；binlog 是 MySQL 的 Server 层实现的，所有引擎都可以使用。

2.  redo log 是物理日志，记录的是“在某个数据页上做了什么修改”；binlog 是逻辑日志， 记录的是这个语句的原始逻辑，比如“给 ID=2 这一行的 c 字段加 1 ”。

3.  redo log 是循环写的，空间固定会用完；binlog 是可以追加写入的。“追加写”是指 binlog 文件写到一定大小后会切换到下一个，并不会覆盖以前的日志。

**update 语句的执行流程图**，图中浅色框表示是在 InnoDB 内部执行的，深色 框表示是在执行器中执行的

![FD3928E3-1993-4F7A-99F1-631ADDE44D06](https://i.loli.net/2020/11/29/bwM5zlRdmDyhNxF.jpg)

将 redo log 的写入拆成了两个步骤：prepare 和 commit，这就是”**两阶段提交**“。

如果不使用“两阶段提交”，那么数据库的状态就有可能和用它的日志恢复出来的库 的状态不一致。

简单说，redo log 和 binlog 都可以用于表示事务的提交状态，而两阶段提交就是让这两个状态保持逻辑上的一致。

### 小结

redo log 用于保证 crash-safe 能力。

**innodb_flush_log_at_trx_commit** 这个参数设置成 1 的 时候，表示每次事务的 redo log 都直接持久化到磁盘。这个参数建议设置成 1。

**sync_binlog** 这个参数设置成 1 的时候，表示每次事务的 binlog 都持久化到磁盘。也建议设置成1。

两阶段提交是跨系统维持数据逻辑一致性时常用的一个方案，即使你不做数据库内核开发，日常开发中也有可能会用到。

## 03 | 事务隔离：为什么你改了我还看不见？

### 隔离性与隔离级别

ACID（Atomicity、Consistency、Isolation、Durability，即原子性、一致性、隔离性、持久性）

当数据库上有多个事务同时执行的时候，就可能出现脏读（dirty read）、不可重复读（non reapeatable read）、幻读（phantom read）的问题，为了解决这些问题，就有了“隔离级别”的概念。

隔离得越严实，效率就会越低。因此很多时候，我们都要 在二者之间寻找一个平衡点

SQL 标准的事务隔离级别包括：读未提交（read uncommitted）、读提交（read committed）、可重复读（repeatable read）和串行化 （serializable ）。

*   读未提交是指，一个事务还没提交时，它做的变更就能被别的事务看到。
*   读提交是指，一个事务提交之后，它做的变更才会被其他事务看到。
*   可重复读是指，一个事务执行过程中看到的数据，总是跟这个事务在启动时看到的数据是一致的。当然在可重复读隔离级别下，未提交变更对其他事务也是不可见的。
*   串行化，顾名思义是对于同一行记录，“写”会加“写锁”，“读”会加“读锁”。当出现 读写锁冲突的时候，后访问的事务必须等前一个事务执行完成，才能继续执行。

我们来看看在不同的隔离级别下，事务 A 会有哪些不同的返回结果，也就是图里面 V1、V2、 V3 的返回值分别是什么。

![919DEDDD-C592-4188-80C3-419FBD380AE9](https://i.loli.net/2020/11/29/rDAXUHhFvsJfSaZ.jpg)

*   若隔离级别是“读未提交”， 则 V1 的值就是 2。这时候事务 B 虽然还没有提交，但是结果 已经被 A 看到了。因此，V2、V3 也都是 2。
*   若隔离级别是“读提交”，则 V1 是 1，V2 的值是 2。事务 B 的更新在提交后才能被 A 看 到。所以， V3 的值也是 2。
*   若隔离级别是“可重复读”，则 V1、V2 是 1，V3 是 2。之所以 V2 还是 1，遵循的就是这 个要求：事务在执行期间看到的数据前后必须是一致的。
*   若隔离级别是“串行化”，则在事务 B 执行“将 1 改成 2”的时候，会被锁住。直到事务 A 提交后，事务 B 才可以继续执行。所以从 A 的角度看， V1、V2 值是 1，V3 的值是 2。

**在实现上，数据库里面会创建一个视图，访问的时候以视图的逻辑结果为准**。

* 在“可重复读”隔离级别下，这个视图是在事务启动时创建的，整个事务存在期间都用这个视图。
* 在“读提交”隔 离级别下，这个视图是在每个 SQL 语句开始执行的时候创建的。
* 在“读未提交”隔离级别下，直接返回记录上的最新值，没有视图概念。
* 在“串行化”隔离级别下，直接用加锁 的方式来避免并行访问。

那什么时候需要“可重复读”的场景呢

假设你在管理一个个人银行账户表。一个表存了每个月月底的余额，一个表存了账单明细。这时候你要做数据校对，也就是判断上个月的余额和当前余额的差额，是否与本月的账单明细一致。 你一定希望在校对过程中，即使有用户发生了一笔新的交易，也不影响你的校对结果。

这时候使用“可重复读”隔离级别就很方便。事务启动时的视图可以认为是静态的，不受其他事务更新的影响。

### 事务隔离的实现

这里我们展开说明“可重复 读”。

**undo log:  回滚日志**

记录上的最新值，通过回滚操作，都可以得到前一个状态的值。

MySQL 中，实际上每条记录在更新的时候都会同时记录一条回滚操作

![148DE056-1DE8-4E14-BEAE-3B3CC76A86EE](https://i.loli.net/2020/11/29/lEON4y6cFvDeW3a.jpg)

当前值是 4，但是在查询这条记录的时候，不同时刻启动的事务会有不同的 read-view。如图中 看到的，在视图 A、B、C 里面，这一个记录的值分别是 1、2、4，同一条记录在系统中可以存 在多个版本，就是数据库的多版本并发控制（MVCC）。对于 read-view A，要得到 1，就必须 将当前值依次执行图中所有的回滚操作得到。

当没有事务再需要用到这些回滚日志时，回滚日志会被删除。

讨论一下为什么**建议你尽量不要使用长事务**

长事务意味着系统里面会存在很老的事务视图

显式启动事务语句， begin 或 start transaction。配套的提交语句是 commit，回滚语句是 rollback。

set autocommit=0 会将这个线程的自动提交关掉 这个事务持续存在直到你主动执行 commit 或 rollback 语句，或者断开连接。 有些客户端连接框架会默认连接成功后先执行一个 set autocommit=0 的命令。这就导致接下 来的查询都在事务中，如果是长连接，就导致了意外的长事务。

**建议你总是使用 set autocommit=1 通过显式语句的方式来启动事务。**

如果执行 commit work and chain，则是提交事务并自动启动下一个事务，这样也省去了再次 执行 begin 语句的开销。

可以在 information_schema 库的 innodb_trx 这个表中查询长事务

```sql
select * from information_schema.innodb_trx where TIME_TO_SEC(timediff(now(),trx_started))<60
```

### 小结

MySQL 的事务隔离级别的现象和实现，根据实现原理分析了长事务存在的风险，以及如何用正确的方式避免长事务。

## 04 | 深入浅出索引（上）

索引为了提高数据查询的效率。

### 索引的常见模型

介绍三种常见、也比较简单的数据结构，它们分别是哈希表、有序数组和搜索树。

* 哈希表这种结构适用于等值查询的场景
* 有序数组索引适用于静态存储引擎
* 二叉搜索树 更新的时间复杂度也是 O(log(N)) ，实际上大多数的数据库存储却并不使用二叉树。其原因是，索引不止存在内存中，还要写到磁盘上。 为了让一个查询尽量少地读磁盘，就必须让查询过程访问尽量少的数据块。那么，我们就不应该使用二叉树，而是要使用“N 叉”树。N叉树由于在读写上的性能优点，以及适配磁盘的访问模式，已经被广泛应用在数据库引擎中 了。


### InnoDB 的索引模型

![E9AA314C-ECAB-4588-BCD6-46046C116878](https://i.loli.net/2020/11/29/6YWjsZ4hfFV9OGz.jpg)

从图中不难看出，根据叶子节点的内容，索引类型分为主键索引和非主键索引。

主键索引的叶子节点存的是整行数据。在 InnoDB 里，主键索引也被称为聚簇索引（clustered index）。

在 InnoDB 里，非主键索引也被称为二级索引 （secondary index）。

非主键索引的叶子节点内容是主键的值

**基于主键索引和普通索引的查询有什么区别？**

主键查询方式，则只需要搜索 ID 这棵 B+ 树；

普通索引查询方式，则需要先搜索 k 索引树， 得到 ID 的值为 500，再到 ID 索引树搜索一次

这个过程称为回表。

也就是说，基于非主键索引的查询需要多扫描一棵索引树。因此，我们在应用中应该尽量使用主键查询。

### 索引维护

如果新插入的 ID 值为 400，就相对麻烦了，需要逻辑上挪动后面的数据，空出位置。而更糟的情况是，如果 R5 所在的数据页已经满了，根据 B+ 树的算法，这时候需要申请一个新 的数据页，然后挪动部分数据过去.这个过程称为页分裂

当相邻两个页由于删除了数据，利用率很低之后，会将数据页做合并

自增主键的插入数据模式，正符合了我们前面提到的递增插入的场景。每次插入一条 新记录，都是追加操作，都不涉及到挪动其他记录，也不会触发叶子节点的分裂

有业务逻辑的字段做主键，则往往不容易保证有序插入

主键长度越小，普通索引的叶子节点就越小，普通索引占用的空间也就越小

**从性能和存储空间方面考量，自增主键往往是更合理的选择**

有没有什么场景适合用业务字段直接做主键的呢？还是有的。比如，有些业务的场景需求是这样 的： 

1. 只有一个索引； 
2. 该索引必须是唯一索引。

这就是典型的 KV 场景。

这时候我们就要优先考虑上一段提到的“尽量使用主键查询”原则，直接将这个索引设置为主键，可以避免每次查询需要搜索两棵树。

### 小结

介绍了 InnoDB 采用的 B+ 树结构，以及为什么 InnoDB 要这么选择。B+ 树能够很好地配合磁盘的读写特性，减少单次查询的磁盘访问次数。 

由于 InnoDB 是索引组织表，一般情况下建议创建一个自增主键，这样非主键索引占用的空间最小。但事无绝对，也分析了使用业务逻辑字段做主键的应用场景。

## 05 | 深入浅出索引（下）

### 覆盖索引

如果执行的语句是 select ID from T where k between 3 and 5，这时只需要查 ID 的值，而 ID 的值已经在 k 索引树上了，因此可以直接提供查询结果，不需要回表。也就是说，**在这个查询里面，索引 k 已经“覆盖了”我们的查询需求，我们称为覆盖索引**。

由于覆盖索引可以减少树的搜索次数，显著提升查询性能，所以使用覆盖索引是一个常用的性能 优化手段。

### 最左前缀原则

B+ 树这种索引结构，可以利用索引的“最左前缀”，来定位记录。

用（name，age）这个联合索引来分析

如果你要查的是所有名字第一个字是“张”的人，你也能够用上这个索引

不只是索引的全部定义，只要满足最左前缀，就可以利用索引来加速检索

**最左前缀可以是联合索引的最左 N 个字段，也可以是字符串索引的最左 M 个字符。**

在建立联合索引的时候，如何安排索引内的字段顺序。

这里我们的评估标准是，索引的复用能力。第一原则是，如果通过调整顺序， 可以少维护一个索引，那么这个顺序往往就是需要优先考虑采用的。

### 索引下推

```sql
select * from tuser where name like "张 %" and age=10 and ismale=1;
```

MySQL 5.6 引入的索引下推优化（index condition pushdown)， 可以**在索引遍历过程 中，对索引中包含的字段先做判断，直接过滤掉不满足条件的记录，减少回表次数**。

![图 3 无索引下推执行流程](https://i.loli.net/2020/11/29/XpBhyjQVvG73MWE.jpg)

![图 4 索引下推执行流程](https://i.loli.net/2020/11/29/7Q9HdVTcmq8eWzP.jpg)

在图 3 和 4 这两个图里面，每一个虚线箭头表示回表一次。

图 3 中，在 (name,age) 索引里面我特意去掉了 age 的值，这个过程 InnoDB 并不会去看 age 的值，只是按顺序把“name 第一个字是’张’”的记录一条条取出来回表。因此，需要回表 4 次。

图 4 跟图 3 的区别是，InnoDB 在 (name,age) 索引内部就判断了 age 是否等于 10，对于不等 于 10 的记录，直接判断并跳过。在我们的这个例子中，只需要对 ID4、ID5 这两条记录回表取 数据判断，就只需要回表 2 次。

### 小结

讲解了数据库索引的概念，包括了**覆盖索引、前缀索引、索引下推**。 

在满足语句需求的情况下， 尽量少地访问资源是数据库设计的重要原则之一。

在使用数据库的时候，尤其是在设计表结构时，也要以减少资源消耗作为目标。

## 06 | 全局锁和表锁 ：给表加个字段怎么有这么多阻碍？

根据加锁的范围，MySQL 里面的锁大致可以分成**全局锁、表级锁和行锁**三类。

### 全局锁

全局锁就是对整个数据库实例加锁

MySQL 提供了一个加全局读锁的方法，命令是 **Flush tables with read lock (FTWRL)**

之后其他线程的以下语句会被阻塞：数据更新语句（数据的增删改）、数据定义语句（包 括建表、修改表结构等）和更新类事务的提交语句。

**全局锁的典型使用场景是，做全库逻辑备份**。

让整库都只读，听上去就很危险： 如果你在主库上备份，那么在备份期间都不能执行更新，业务基本上就得停摆； 如果你在从库上备份，那么备份期间从库不能执行主库同步过来的 binlog，会导致主从延迟。

不加锁的话，备份系统备份的得到的库不是一个逻辑时间点，这个视图是逻辑不一致 的。

官方自带的逻辑备份工具是 mysqldump。**当 mysqldump 使用参数–single-transaction 的时 候，导数据之前就会启动一个事务，来确保拿到一致性视图**。而由于 MVCC 的支持，这个过程 中数据是可以正常更新的。

**对于 MyISAM 这种不支持事务的引擎 就需要使用 FTWRL 命令**

single-transaction 方法只适用于所有的表使用事务引擎的库。如果有的表使用了不支 持事务的引擎，那么备份就只能通过 FTWRL 方法。这往往是 DBA 要求业务开发人员使用 InnoDB 替代 MyISAM 的原因之一。

**为什么不使用 set global readonly=true 的方式呢**

一是，在有些系统中，readonly 的值会被用来做其他逻辑，比如用来判断一个库是主库还是备库。

二是，在异常处理机制上有差异。如果执行 FTWRL 命令之后由于客户端发生异常断开，那 那么 MySQL 会自动释放这个全局锁，整个库回到可以正常更新的状态。而将整个库设置为 readonly 之后，如果客户端发生异常，则数据库就会一直保持 readonly 状态，风险较高。

### 表级锁

**MySQL 里面表级别的锁有两种：一种是表锁，一种是元数据锁（meta data lock，MDL)。**

**表锁的语法是 lock tables … read/write**

与 FTWRL 类似，可以用 unlock tables 主动释放 锁，也可以在客户端断开的时候自动释放。

需要注意，lock tables 语法除了会限制别的线程的 读写外，也限定了本线程接下来的操作对象。

举个例子, 如果在某个线程 A 中执行 lock tables t1 read, t2 write; 这个语句，则其他线程写 t1、读写 t2 的语句都会被阻塞。同时，线程 A 在执行 unlock tables 之前，也只能执行读 t1、 写 t2 的操作。连读 t2 都不允许，自然也不能访问其他表。

对于 InnoDB 这种支持行锁的引擎，一般不使用 lock tables 命令来控制并发，毕竟锁住整个表的影响面还是太大。

**另一类表级的锁是 MDL（metadata lock)**

**MDL 不需要显式使用，在访问一个表的时候会被自动加上**。MDL 的作用是，保证读写的正确性。你可以想象一下，如果一个查询正在遍历一个 表中的数据，而执行期间另一个线程对这个表结构做变更，删了一列，那么查询线程拿到的结果 跟表结构对不上，肯定是不行的。

**当对一个表做增删改查操作的时候，加 MDL 读锁；当要对表做结构变更操作的时候，加 MDL 写锁。**

读锁之间不互斥，因此你可以有多个线程同时对一张表增删改查。

读写锁之间，写锁之间是互斥的，用来保证变更表结构操作的安全性。因此，如果有两个线程要同时给一个表加字段，其中一个要等另一个执行完才能开始执行。

事务中的 MDL 锁，在语句执行开始时申请，但是语句结束后并不会马上释放，而会等到整个事务提交后再释放。

**如何安全地给小表加字段**

**首先我们要解决长事务，事务不提交，就会一直占着 MDL 锁**

如果你要做 DDL 变更的表刚好有长事务在执行，要考虑先暂停 DDL，或者 kill 掉这个长事务。

**比较理想的机制是，在 alter table 语句 里面设定等待时间**

### 小结

介绍了 MySQL 的全局锁和表级锁。 **全局锁主要用在逻辑备份过程中**。

对于全部是 InnoDB 引擎的库，建议选择使用–singletransaction 参数，对应用会更友好。 

**表锁一般是在数据库引擎不支持行锁的时候才会被用到**的。如果你发现你的**应用程序里有 lock tables 这样的语句**，你需要追查一下，比较可能的情况是：

要么是你的系统现在还在用 **MyISAM 这类不支持事务的引擎**，那要安排升级换引擎；

要么是你的引擎升级了，但是**代码还没升级**。我见过这样的情况，最后业务开发就是把 lock tables 和 unlock tables 改成 begin 和 commit，问题就解决了。 

MDL 会直到事务提交才释放，在做表结构变更的时候，你一定要小心不要导致锁住线上查询和 更新。

## 07 | 行锁功过：怎么减少行锁对性能的影响？

### 两阶段锁

在 InnoDB 事务中，行锁是在需要的时候才加上的，但并不是不需要了就立刻释 放，而是要等到事务结束时才释放。这个就是两阶段锁协议。

![image-20201130133057077](https://i.loli.net/2020/11/30/gB32PHGSvKTZQr4.png)

如果你的事务中需要锁多个行，要把 最可能造成锁冲突、最可能影响并发度的锁尽量往后放。

### 死锁和死锁检测
![image-20201130133128986](https://i.loli.net/2020/11/30/QV7j4kgs1SYiyWz.png)

这时候，事务 A 在等待事务 B 释放 id=2 的行锁，而事务 B 在等待事务 A 释放 id=1 的行锁。 事务 A 和事务 B 在互相等待对方的资源释放，就是进入了死锁状态

当出现死锁以后，有**两种策略**：

*   一种策略是，直接进入等待，直到超时。这个超时时间可以通过参数 innodb_lock_wait_timeout 来设置。
*   另一种策略是，发起死锁检测，发现死锁后，主动回滚死锁链条中的某一个事务，让其他事 务得以继续执行。将参数 innodb_deadlock_detect 设置为 on，表示开启这个逻辑。

在 InnoDB 中，innodb_lock_wait_timeout 的默认值是 50s。 对于在线服务来说，这个等待时间往往是无法接受的。但是，我们又不可能直接把这个时间设置成一个很小的值，比如 1s。这样当出现死锁的时候， 确实很快就可以解开，但如果不是死锁，而是简单的锁等待呢？所以，超时时间设置太短的话， 会出现很多误伤。

所以，正常情况下我们还是要采用第二种策略，即：主动死锁检测

主动死锁检测在发生死锁的时候，是能够快 速发现并进行处理的，但是它也是有额外负担的。

innodb_deadlock_detect 的默认值本身就是 on

**每个新来的被堵住的线程**，都要判断会不会由于自己的加入导致了死锁，这是一个**时间复杂度是 O(n) 的操作**。假设有 1000 个并发线程要同时更新同一行，那么死锁检测操作就是 100 万这个 量级的。

虽然最终检测的结果是没有死锁，但是这期间要消耗大量的 CPU 资源。因此，你就会看到 CPU 利用率很高，但是每秒却执行不了几个事务

**怎么解决由这种热点行更新导致的性能问题呢**

*   一种头痛医头的方法，就是如果你能确保这个业务一定不会出现死锁，可以临时把死锁检测关 掉。
*   另一个思路是控制并发度

一个直接的想法就是，在客户端做并发控制。但是，你会很快发现这个方法不太可行，因为客户端很多

因此，**这个并发控制要做在数据库服务端**。如果你有中间件，可以考虑在中间件实现；如果你的团队有能修改 MySQL 源码的人，也可以做在 MySQL 里面。基本思路就是，对于相同行的更新，在进入引擎之前排队。这样在 InnoDB 内部就不会有大量的死锁检测工作了。

### 小结

介绍了 MySQL 的行锁，涉及了两阶段锁协议、死锁和死锁检测这两大部分内容。

其中，以两阶段协议为起点，讨论了在开发的时候如何安排正确的事务语句。

这里的 原则 / 建议是：如果你的事务中需要锁多个行，要把最可能造成锁冲突、最可能影响并发度的锁的申请时机尽量往后放。

但是，调整语句顺序并不能完全避免死锁。所以我们引入了死锁和死锁检测的概念，以及提供了三个方案，来减少死锁对数据库的影响。

减少死锁的主要方向，就是控制访问相同资源的并发事务量。

## 08 | 事务到底是隔离的还是不隔离的？

考虑这道题：

insert into t(id, k) values(1,1),(2,2);

![image-20201130144011712](https://i.loli.net/2020/11/30/QRDNIPyAvE2BrZ4.png)

语句 Q1 返回的 k 的值是 3，而语句 Q2 返回的 k 的值是 1

在 MySQL 里，有两个“视图”的概念：

*   一个是 view。它是一个用查询语句定义的虚拟表
*   另一个是 InnoDB 在实现 MVCC 时用到的一致性读视图，即 consistent read view，用于 支持 RC（Read Committed，读提交）和 RR（Repeatable Read，可重复读）隔离级别的 实现。

InnoDB 里面每个事务有一个唯一的事务 ID，叫作 transaction id。

把 transaction id 赋值给这个数据版本的事务 ID ：row trx_id

语句更新会生成 undo log（回滚日志）

![image-20201130144506859](https://i.loli.net/2020/11/30/Ol21Hq74h9ZDmct.png)

V1、V2、V3 并不是物理上真实存在 的，而是每次需要的时候根据当前版本和 undo log 计算出来的

三个虚线箭头，就是 undo log

InnoDB 代码实现上，一个事务只需要在启动的时候，找到所有已经提交的事务 ID 的最 大值，记为 up_limit_id。然后声明说，“如果一个数据版本的 row trx_id 大于 up_limit_id，我就不认，我必须要找到它的上一个版本”

这里，我们不妨做如下假设： 1. 事务 A 开始前，系统里面已经提交的事务最大 ID 是 99； 2. 事务 A、B、C 的版本号分别是 100、101、102，且当前系统里没有别的事务； 3. 三个事务开始前，(1,1）这一行数据的 row trx_id 是 90。 这样，事务 A、B、C 的 up_limit_id 的值就都是 99。

(1,1) 这个历史版本，什么时候可以被删除掉呢？在事务 A 提交后,（1,1) 这个版本就可以被删掉了

### 更新逻辑

事务 B 前面的查询语句，拿到的 k 也是 1。但是，当它要去更新数据的时候，不能再在历史版 本上更新了，否则事务 C 的更新就丢失了。

更新数据都是先读后写的，而这个读，只能读当前的值，称为“当前读（current read）”。

**当前读之后，事务的 up_limit_id 就发生了变化**

除了 update 语句外，select 语句如果加锁，也是**当前读**。

加上 lock in share mode 或 for update

下面这两个 select 语句，分别加了读锁（S 锁，共享锁）和 写锁（X 锁，排他锁）。

select k from t where id=1 lock in share mode;

select k from t where id=1 for update;

可重复读的核心就是一致性读（consistent read）

而事务更新数据的时候，只能用当前读。 如果当前的记录的行锁被其他事务占用的话，就需要进入锁等待。

读提交和可重复读最主要的区别是

*   在可重复读隔离级别下，只需要在事务开始的时候找到那个 up_limit_id，之后事务里的其他查询都共用这个 up_limit_id。（除非用了 当前读）
*   在读提交隔离级别下，每一个语句执行前都会重新算一次 up_limit_id 的值。
*   对于可重复读，查询只承认在事务启动前就已经提交完成的数据； 对于读提交，查询只承认在语句启动前就已经提交完成的数据。

### 小结

InnoDB 的行数据有多个版本，每个数据版本有自己的 row trx_id，每个事务或者语句有自己的 up_limit_id。普通查询语句是一致性读，一致性读会根据 row trx_id 和 up_limit_id 的大小决 定数据版本的可见性。

对于可重复读，查询只承认在事务启动前就已经提交完成的数据； 对于读提交，查询只承认在语句启动前就已经提交完成的数据；

而当前读，总是读取已经提交完成的最新版本。

## 09 | 普通索引和唯一索引，应该怎么选择？

从这两种索引对查询语句和更新语句的性能影响来进行分析

### 查询过程

*   对于普通索引来说，查找到满足条件的第一个记录 (5,500) 后，需要查找下一个记录，直到 碰到第一个不满足 k=5 条件的记录。

*   对于唯一索引来说，由于索引定义了唯一性，查找到第一个满足条件的记录后，就会停止继续检索。

    那么，这个不同带来的性能差距会有多少呢？答案是，微乎其微。

InnoDB 的数据是按数据页为单位来读写的。也就是说，当需要读一条记录的时候， 并不是将这个记录本身从磁盘读出来，而是以页为单位，将其整体读入内存。在 InnoDB 中， 每个数据页的大小默认是 16KB。

当找到 k=5 的记录的时候，它所在的数据页就都在内存里 了。那么，对于普通索引来说，要多做的那一次“查找和判断下一条记录”的操作，就只需要一 次指针寻找和一次计算。

### change buffer

当需要更新一个数据页时，如果数据页在内存中就直接更新；而如果这个数据页还没有在内存中 的话，在不影响数据一致性的前提下，InooDB 会将这些更新操作缓存在 change buffer 中。这样就不需要从磁盘中读入这个数据页了

在下次查询需要访问这个数据页的时候，将数据页读入内存，然后执行 change buffer 中与这个页有关的操作

通过这种方式就能保证这个数据逻 辑的正确性。

​    

将 change buffer 中的操作应用到原数据页，得到最新结果的过程称为 **purge**

除了访问这个 数据页会触发 purge 外，系统有后台线程会定期 purge。在数据库正常关闭（shutdown）的 过程中，也会执行 purge 操作。

purge 的执行流程： 

1.  从磁盘读入数据页到内存（老版本的数据页）。
2.  从 change buffer 里找出这个数据页的 change buffer 记录 (可能有多个），依次应用，得到新版数据页。
3.  写 redo log，这个 redo log 包含了数据的变更和 change buffer 的变更。

如果能够将更新操作先记录在 change buffer，减少读磁盘，语句的执行速度会得到明显的提升

什么条件下可以使用 change buffer 呢

**对于唯一索引来说，所有的更新操作都要先判断这个操作是否违反唯一性约束**。比如，要插入 (4,400) 这个记录，就要先判断现在表中是否已经存在 k=4 的记录，而**这必须要将数据页读入内存才能判断**。如果都已经读入到内存了，那直接更新内存会更快，就**没必要使用 change buffer** 了。

**因此，唯一索引的更新就不能使用 change buffer，实际上也只有普通索引可以使用**

### 更新过程

第一种情况是，这个记录要更新的目标页在内存中。这不是我们关注的重点

第二种情况是，这个记录要更新的目标页不在内存中。这时，InnoDB 的处理流程如下： 对于唯一索引来说，需要将数据页读入内存，判断到没有冲突，插入这个值，语句执行结束； 对于普通索引来说，则是将更新记录在 change buffer，语句执行就结束了。

将数据从磁盘读入内存涉及随机 IO 的访问，是数据库里面成本最高的操作之一。change buffer 因为减少了随机磁盘访问，所以对更新性能的提升是会很明显的。

change buffer 的使用场景通过上面的分析，你已经清楚了使用 change buffer 对更新过程的加速作用，也清楚了 change buffer 只限于用在普通索引的场景下，而不适用于唯一索引。

普通索引的所有场景，使用 change buffer 都可以起到加速作用吗？

对于写多读少的业务来说，页面在写完以后马上被访问到的概率比较小，此时 change buffer 的使用效果最好。这种业务模型常见的就是账单类、日志类的系统。

反过来，假设一个业务的更新模式是写入之后马上会做查询， 那么即使满足了条件，将更新先记录在 change buffer，但之后由于马上要访问这个数据页，会立即触发 purge 过程。这样随机 访问 IO 的次数不会减少，反而增加了 change buffer 的维护代价

### 总结

两类索引在查询能力上 是没差别的，主要考虑的是对更新性能的影响

**建议尽量选择普通索引**

特别地，在使用机械硬盘时，change buffer 这个机制的收效是非常显著

**个人理解 change buffer 和 redo log 的区别**

change buffer: 在 MySQL 用到的内存中，有这么一块区域，叫 change buffer，暂存对内存中还没有包含的数据的修改，以后读取的时候从磁盘中读取到内存，再应用change buffer
而 redo log 将对数据库的操作暂存，到一定程度才对数据库进行真正的更新，所以避免频繁的随机写磁盘

如原文所说：如果要简单地对比这两个机制在提升更新性能上的收益的话，redo log 主要节省的是随机写磁盘的 IO 消耗（转成顺序写），而 change buffer 主要节省的则是随机读磁盘的 IO 消耗。

### 小结

从普通索引和唯一索引的选择开始，分享了数据的查询和更新过程，然后说明了 change buffer 的机制以及应用场景，最后讲到了索引选择的实践。 

由于唯一索引用不上 change buffer 的优化机制，因此如果业务可以接受，从性能角度出发我，建议你优先考虑非唯一索引。

## 10 | MySQL 为什么有时候会选错索引？

### 优化器的逻辑

**选择索引是优化器的工作**

优化器会结合扫描行数、是否使用临时表、是否排序等因素进行综合判断。

### 扫描行数是怎么判断的？

MySQL 在真正开始执行语句之前，并不能精确地知道满足这个条件的记录有多少条，而只能根据统计信息来估算记录数。

一个索引上不同的值的个数，我们称之为“**基数**”（cardinality）。也就是说，这个基数越大，索引的区分度越好

可以使用 show index 方法，看到一个索引的基数

### MySQL 是怎样得到索引的基数的呢？

为什么要采样统计呢？因为把整张表取出来一行行统计，虽然可以得到精确的结果，但是代价太 高了，所以只能选择“采样统计”。

 InnoDB 默认会选择 N 个数据页，统计这些页面上的不同值，得到一个平均值，然后乘以这个索引的页面数，就得到了这个索引的基数。

当变更的数据行数超过 1/M 的时候，会自动触发重新做一次索引统计。

rows 这个字段表示的是预计扫描行数

使用普通索引需要把回表的代价算进去

analyze table t 命令，可以用来重新统计索引信息。

### 索引选择异常和处理

1. 像第一个例子一样，采用 force index 强行选择一个索引。如果 force index 指定的索引在候选索引列表中，就直接选择这个索引，不再评估其他索引的执行代价。
2. 可以考虑修改语句，引导 MySQL 使用我们期望的索引，在这个例子里，显然把“order by b limit 1” 改成 “order by b,a limit 1”，语义的逻辑是相同的。

### 小结

今天我们一起聊了聊索引统计的更新机制，并提到了优化器存在选错索引的可能性。 

对于由于索引统计信息不准确导致的问题，你可以用 analyze table 来解决。 

而对于其他优化器误判的情况，你可以在应用端用 force index 来强行指定索引，也可以通过修 改语句来引导优化器，还可以通过增加或者删除索引来绕过这个问题。

## 11 | 怎么给字符串字段加索引？

### 前缀索引

使用**前缀索引**，定义好长度，就可以做到既节省空间，又不用额外增加太多的查询成本。

当要给字符串创建前缀索引时，有什么方法能够确定我应该使用多长的前缀呢？

我们在建立索引时关注的是区分度，区分度越高越好。因为区分度越高，意味着重复的键值越少。

因此，我们可以通过统计索引上有多少个不同的值来判断要使用多长的前缀。

首先，你可以使用下面这个语句，算出这个列上有多少个不同的值：

```sql
select count(distinct email) as L from SUser;
```

然后，依次选取不同长度的前缀来看这个值，比如我们要看一下 4~7 个字节的前缀索引，可以 用这个语句：


```sql
select 
    count(distinct left(email,4)）as L4, 
    count(distinct left(email,5)）as L5,
    count(distinct left(email,6)）as L6,
    count(distinct left(email,7)）as L7,
from SUser;
```

当然，使用前缀索引很可能会损失区分度，所以你需要预先设定一个可以接受的损失比例，比如 5%。然后，在返回的 L4~L7 中，找出不小于 L * 95% 的值，假设这里 L6、L7 都满足，你就可 以选择前缀长度为 6。

**前缀索引对覆盖索引的影响**

使用前缀索引就用不上覆盖索引对查询性能的优化了，这也是你在选择是否使用前缀索引时需要考虑的一个因素。

### 其他方式

比如，我们国家的身份证号

**第一种方式是使用倒序存储**

如果你存储身份证号的时候把它倒过来存，每次查询的时候，你可以这么写：

```sql
select field_list from t where id_card = reverse(‘input_id_card_string’);
```

**第二种方式是使用 hash 字段**

你可以在表上再创建一个整数字段，来保存身份证的校验码，同时在这个字段上创建索引。

```sql
alter table t add id_card_crc int unsigned, add index(id_card_crc);
```

然后每次插入新记录的时候，都同时用 crc32() 这个函数得到校验码填到这个新字段

由于校验码可能存在冲突，也就是说两个不同的身份证号通过 crc32() 函数得到的结果可能是相同的，所 以你的查询语句 where 部分要判断 id_card 的值是否精确相同。

### 小结

在今天这篇文章中，我跟你聊了聊字符串字段创建索引的场景。我们来回顾一下，你可以使用的方式有：

1.  直接创建完整索引，这样可能比较占用空间。
2.  创建前缀索引，节省空间，但会增加查询扫描次数，并且不能使用覆盖索引。
3.  倒序存储，再创建前缀索引，用于绕过字符串本身前缀的区分度不够的问题。
4.  创建 hash 字段索引，查询性能稳定，有额外的存储和计算消耗，跟第三种方式一样，都不支持范围扫描。

在实际应用中，你要根据业务字段的特点选择使用哪种方式。

## 12 | 为什么我的 MySQL 会 “抖” 一下

InnoDB 在处理更新语句的时候，只做了写日志这一个磁盘操作。这个日志叫作 redo log（重做日志）。InnoDB 在处理更新语句的时候，只做了写日志这一个磁盘操作，在更新内存写完 redo log 后，就返回给客户端，本次更新成功。

掌柜总要找时间把账本更新一下，这对应的就是**把内存里的数据写入磁盘的过程，术语就是 flush**。

在这个 flush 操作执行之前，孔乙己的赊账总额，其实跟掌柜手中账本里面的记录是不一致的。因为孔乙己今天的赊账金额还只在粉板上，而账本里的记录是老的，还没把今天的赊账 算进去。

当内存数据页跟磁盘数据页内容不一致的时候，我们称这个内存页为“脏页”。内存数据写入到 磁盘后，内存和磁盘上的数据页的内容就一致了，称为“干净页”。

**不论是脏页还是干净页，都在内存中。**在这个例子里，内存对应的就是掌柜的记忆。

MySQL 偶尔“抖”一下的那个瞬间，可能就是在刷脏页（flush）。

### **什么情况会引发数据库的 flush 过程**

*   第一种场景是，InnoDB 的 redo log 写满了

把 checkpoint 位置从 CP 推进到 CP’，就需要将两个点之间的日志（浅绿色部分），对应的所有脏页都 flush 到磁盘

*   第二种场景，掌柜发现自己快记不住了，系统内存不足

*   第三种场景是，MySQL 认为系统“空闲”的时候

*   第四种场景，MySQL 正常关闭的

第一种是“redo log 写满了，要 flush 脏页”，这种情况是 InnoDB 要尽量避免的。因为出现 这种情况的时候，整个系统就不能再接受更新了，所有的更新都必须堵住。如果你从监控上看， 这时候更新数会跌为 0

第二种是“内存不够用了，要先将脏页写到磁盘”，这种情况其实是常态。InnoDB 用缓冲池 （buffer pool）管理内存，缓冲池中的内存页有三种状态：

第一种是，还没有使用的

第二种是，使用了并且是干净页

第三种是，使用了并且是脏页

### flush 的相关参数

**innodb_io_capacity**

首先，你要正确地告诉 InnoDB 所在主机的 IO 能力，这样 InnoDB 才能知道需要全力刷脏页的 时候，可以刷多快。一般设置成磁盘的 IOPS，磁盘的 IOPS 可以通过 fio 这个工具来测试

 **innodb_max_dirty_pages_pct** 

是脏页比例上限，默认值是 75%

根据上述算得的 F1(M) 和 F2(N) 两个值，取其中较大的值记为 R，之后引擎就可以按照 innodb_io_capacity 定义的能力乘以 R% 来控制刷脏页的速度。

平时要多关注脏页比 例，不要让它经常接近 75%。

脏页比例是通过 Innodb_buffer_pool_pages_dirty/Innodb_buffer_pool_pages_total 得到的

**innodb_flush_neighbors**

而 MySQL 中的一个机制，可能让你的查询会更慢

**在准备刷一个脏页的时候，如果这个数据页旁边的数据页刚好是脏页，就会把这个“邻居”也带着一起刷掉**。而且这个把“邻居”拖下水的逻 辑还可以继续蔓延，也就是对于每个邻居数据页，如果跟它相邻的数据页也还是脏页的话，也会 被放到一起刷。

值为 1 的时候会有上 述的“连坐”机制，值为 0 时表示不找邻居，自己刷自己的。

找“邻居”这个优化在机械硬盘时代是很有意义的，可以减少很多随机 IO

而如果使用的是 SSD 这类 IOPS 比较高的设备的话，我就建议你把 innodb_flush_neighbors 的值设置成 0。因为这时候 IOPS 往往不是瓶颈，而“只刷自己”，就能更快地执行完必要的刷 脏页操作，减少 SQL 语句响应时间。

在 MySQL 8.0 中，innodb_flush_neighbors 参数的默认值已经是 0 了。

### 小结

今天这篇文章，我延续第 2 篇中介绍的 WAL 的概念，和你解释了这个机制后续需要的刷脏页操作和执行时机。利用 WAL 技术，数据库将随机写转换成了顺序写，大大提升了数据库的性能。

但是，由此也带来了内存脏页的问题。脏页会被后台线程自动 flush，也会由于数据页淘汰而触发 flush，而刷脏页的过程由于会占用资源，可能会让你的更新和查询语句的响应时间长一些。 在文章里，我也给你介绍了控制刷脏页的方法和对应的监控方式。

## 13 | 为什么表数据删掉一半，表文件大小不变？

 正确回收空间的方法

为什么简单地删除表数据达不到表空间回收的效果

### innodb_file_per_table

表数据既可以存在共享表空间里，也可以是单独的文件。这个行为是由参数 innodb_file_per_table 控制的：

1.  这个参数设置为 OFF 表示的是，表的数据放在系统共享表空间，也就是跟数据字典放在一 起；

2.  这个参数设置为 ON 表示的是，每个 InnoDB 表数据存储在一个以 .ibd 为后缀的文件中。

从 MySQL 5.6.6 版本开始，它的默认值就是 ON 了。

因为，一个表单独存储为一个 文件更容易管理，而且在你不需要这个表的时候，通过 drop table 命令，系统就会直接删除这 个文件。而如果是放在共享表空间中，即使表删掉了，空间也是不会回收

建议你不论使用 MySQL 的哪个版本，都将这个值设置为 ON

在删除整个表的时候，可以使用 drop table 命令回收表空间。但是，我们遇到的更多的删 除数据的场景是删除某些行，这时就遇到了我们文章开头的问题：表中的数据被删除了，但是表空间却没有被回收。

### 数据删除流程

数据页的复用跟记录的复用是不同的

如果我们用 delete 命令把整个表的数据删除呢？结果就是，所有的数据页都会被标 记为可复用。但是磁盘上，文件不会变小。

delete 命令其实只是把记录的位置，或者数据页标记为了“可复用”，但磁盘 文件的大小是不会变的。也就是说，通过 delete 命令是不能回收表空间的。这些可以复用，而 没有被使用的空间，看起来就像是“空洞”。

不止是删除数据会造成空洞，插入数据也会。所以，如果能够把这些空洞去掉，就 能达到收缩表空间的目的。经过大量增删改的表，都是可能是存在空洞的. 而重建表，就可以达到这样的目的。

### 重建表

新建一个与表 A 结构相同的表 B，然后按照主键 ID 递增的顺序，把数据一行一行地从表 A 里读出来再插入到表 B 中。数据从表 A 导入表 B 的操作完成后，用表 B 替换 A，从效果上看，就起到了收缩表 A 空间的作用。

**alter table A engine=InnoDB** 命令来重建表。

这个临时表 B 不需要你自己创建， MySQL 会自动完成转存数据、交换表名、删除旧表的操作。

在整个 DDL 过程中，表 A 中不能有更新。也就是说， 这个 DDL 不是 Online 的。

MySQL 5.6 版本开始引入的 Online DDL, 对这个操作流程做了优化

1.  生成临时文件的过程中，将所有对 A 的操作记录在一个日志文件（row log）中

2.  临时文件生成后，将日志文件中的操作应用到临时文件，得到一个逻辑数据上与表 A 相同 的数据文件

方案在重建表的过程中，允许对表 A 做增删改操作。这也就是 Online DDL 名字的来源

*   alter table t engine = InnoDB（也就是 recreate）
*   analyze table t 只是对表的索引信息做重新统计
*   optimize table t 等于 recreate+analyze。

### 小结

今天这篇文章，我和你讨论了数据库中收缩表空间的方法。 现在你已经知道了，如果要收缩一个表，只是 delete 掉表里面不用的数据的话，表文件的大小 是不会变的，你还要通过 alter table 命令重建表，才能达到表文件变小的目的。我跟你介绍了 重建表的两种实现方式，Online DDL 的方式是可以考虑在业务低峰期使用的，而 MySQL 5.5 及之前的版本，这个命令是会阻塞 DML 的，这个你需要特别小心。

## 14 | count (*) 这么慢，我该怎么办？

### count(*) 的实现方式

MyISAM 引擎把一个表的总行数存在了磁盘上，因此执行 count(*) 的时候会直接返回这个 数，效率很高；

而 InnoDB 引擎就麻烦了，它执行 count(*) 的时候，需要把数据一行一行地从引擎里面读出 来，然后累积计数。

我们在这篇文章里讨论的是没有过滤条件的 count(*)，如果加了 where 条件的话，MyISAM 表也是不能返回得这么快的。

即使是在同一个时刻的多个查询，由于多版本并发控制（MVCC）的原因，InnoDB 表“应该返回多少行”也是不确定的

当然，现在这个看上去笨笨的 MySQL，在执行 count(*) 操作的时候还是做了优化的。

 InnoDB 是索引组织表，主键索引树的叶子节点是数据，而普通索引树的叶子节点是 主键值。所以，普通索引树比主键索引树小很多。对于 count(_) 这样的操作，遍历哪个索引树得到的结果逻辑上都是一样的。因此，*_MySQL 优化器会找到最小的那棵树来遍历**。在保证逻辑 正确的前提下，尽量减少扫描的数据量，是数据库系统设计的通用法则之一。

*   MyISAM 表虽然 count(*) 很快，但是不支持事务
*   show table status 命令虽然返回很快，但是不准确
*   InnoDB 表直接 count(*) 会遍历全表，虽然结果准确，但会导致性能问题。

### count (*) 这么慢，我们只能自己计数

在数据库保存计数

要解决的问题，都是由于 InnoDB 要支持事务，从而导致 InnoDB 表不能把 count(*) 直接存起来，然后查询的时候直接返回形成的。

所谓以子之矛攻子之盾，现在我们就利用“事务”这个特性，把问题解决掉。

将 插入删除数据和更新计数值 作为一个事务提交，确保任何时刻获得的都是逻辑正确的计数值

![图 4 会话 A、B 的执行时序图](https://i.loli.net/2020/12/01/rIWCebVmp7K1lto.png)

### 不同的 count 用法

如果 count 函数的参数不是 NULL，累计值就加 1，否则不加

**count(*)、count(主键 id) 和 count(1) 都表示返回满足条件的结果集的总行数（因为它们都不肯为 null）；而 count(字段），则表示返回满足条件的数据行里面，参数“字段”不为 NULL 的总个数。**

现在的优化器只优化了 count(*) 的语义为“取行数”

对于 count(主键 id) 来说，InnoDB 引擎会遍历整张表，把每一行的 id 值都取出来，返回给 server 层。server 层拿到 id 后，判断是不可能为空的，就按行累加。

对于 count(1) 来说，InnoDB 引擎遍历整张表，但不取值。server 层对于返回的每一行，放一 个数字“1”进去，判断是不可能为空的，按行累加。

count(_) 是例外，并不会把全部字段取出来，而是专门做了优化，不取值。count(_) 肯定 不是 null，按行累加。

**按照效率排序的话，count(字段)&lt;count(主键 id)&lt;count(1)≈count(\*)，所以我 建议你，尽量使用 count(\*)**

### 小结

今天，我和你聊了聊 MySQL 中获得表行数的两种方法。我们提到了在不同引擎中 count(*) 的 实现方式是不一样的，也分析了用缓存系统来存储计数值存在的问题。

其实，把计数放在 Redis 里面，不能够保证计数和 MySQL 表里的数据精确一致的原因，是这 两个不同的存储构成的系统，不支持分布式事务，无法拿到精确一致的视图。而把计数值也放在 MySQL 中，就解决了一致性视图的问题。 InnoDB 引擎支持事务，我们利用好事务的原子性和隔离性，就可以简化在业务开发时的逻辑。 这也是 InnoDB 引擎备受青睐的原因之一。

## 15 | 答疑文章（一）：日志和索引相关问题

## 16 | “order by” 是怎么工作的？

## 17 | 如何正确地显示随机消息？

## 18 | 为什么这些 SQL 语句逻辑相同，性能却差异巨大？

## 19 | 为什么我只查一行的语句，也执行这么慢？

## 20 | 幻读是什么，幻读有什么问题？

## 21 | 为什么我只改一行的语句，锁这么多？

## 22 | MySQL 有哪些 “饮鸩止渴” 提高性能的方法？

## 23 | MySQL 是怎么保证数据不丢的？

## 24 | MySQL 是怎么保证主备一致的？

## 25 | MySQL 是怎么保证高可用的？

## 26 | 备库为什么会延迟好几个小时？

## 27 | 主库出问题了，从库怎么办？

## 28 | 读写分离有哪些坑？

## 29 | 如何判断一个数据库是不是出问题了？

## 30 | 答疑文章（二）：用动态的观点看加锁

## 31 | 误删数据后除了跑路，还能怎么办？

## 32 | 为什么还有 kill 不掉的语句？

## 33 | 我查这么多数据，会不会把数据库内存打爆？

## 34 | 到底可不可以使用 join？

## 35 | join 语句怎么优化？

## 36 | 为什么临时表可以重名？

## 37 | 什么时候会使用内部临时表？

## 38 | 都说 InnoDB 好，那还要不要使用 Memory 引擎？

## 39 | 自增主键为什么不是连续的？

## 40 | insert 语句的锁为什么这么多？

## 41 | 怎么最快地复制一张表？

## 42 | grant 之后要跟着 flush privileges 吗？

## 43 | 要不要使用分区表？

## 44 | 答疑文章（三）：说一说这些好问题

## 45 | 自增 id 用完怎么办？

## 其他资料

### MySQL 6 种日志文件

[MySQL 中的重做日志（redo log），回滚日志（undo log），以及二进制日志（binlog）的简单总结 - MSSQL123 - 博客园](https://www.cnblogs.com/wy123/p/8365234.html)