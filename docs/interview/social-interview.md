# 社招面经

## 抖音

### 电商一面

- 算法题
    * [剑指 Offer 52. 两个链表的第一个公共节点](https://leetcode-cn.com/problems/liang-ge-lian-biao-de-di-yi-ge-gong-gong-jie-dian-lcof/)
    * [Leetcode 31. 给定一组数字，任意组合，求比给定组合M大的最小值](https://leetcode-cn.com/problems/next-permutation/)
- Linux
    * 统计当前目录下（包含子目录） java 的文件的代码总行数。
        * wc -l \`find . -name "*.java"\` | awk '{ sum=sum+$1 } END { print sum }'
    * 管道的理解，管道除了存内容还存什么?
        * Linux管道是一个操作方式为文件的内存缓冲区
        * `|` 是匿名管道，父子进程间使用，父进程先打开一个管道，然后fork出子进程，子进程通过拷贝父进程的地址空间拿到管道的描述符，从而可以读写
    * 程序正在跑
        * ctrl + c，会发送`SIGINT`的信号，等同于`kill -2`(interrupt)，程序那边接收到这个信号后做处理
        * ctrl + z，会发送`SIGTSTP`的信号
- MySQL
    * Innodb 索引结构
    * 普通索引，唯一索引 之间的性能差异
        * 唯一索引需要保证插入前没有数据，普通索引可以在写入磁盘前加 `change buffer`
    * 事务级别，MVCC
    * 二阶段提交
    - 用户表t_user表，年龄age（int类型），求哪个年龄的用户最多
        * select age, count(1) from t_user group by age order by count(1) desc limit 1;
- 网络
    * 访问 https://toutiao.com 过程中发生了什么
        * dns（nslookup, dig） -> tcp -> http -> https（SSL）
        * 网关 -> service -> client
        * 浏览器渲染
- 成长
    * 最近阅读的相关书籍
        * Dubbo官方文档，美团技术博客，其他大厂技术博客，effictive go，Java并发编程实战

### 电商二面

- 项目
    * 毕业1年的成长与经历 
    * Redis相关经历
- 算法
    * 开根运算 （误差1e-5）
    * 判断二叉搜索树
    * 堆排序
- 数学
    * 两枚硬币，甲乙分别扔，然后谁扔正面谁赢，求甲赢的概率
        * 1/2 + 1/(2^3) + 1/(2^5) + ... = 2/3(1-(1/4)^n) => 2/3
- http
    * get和post区别（是否可以缓存）
    * http和https区别
    * [中间人攻击](https://segmentfault.com/a/1190000013075736)
    * https如何抓包（Fiddler or Charles）
- Redis
    * 单线程模型
    * 数据结构
    * 跳表实现，如何插入节点
    * [mget和pipeline区别](https://jzwdsb.github.io/2019/02/redis_pipeline_mget/)
        * mget和pipeline都是多命令一起执行，只有一次往返的网络IO
        * mget在集群下可以并行去获取，pipeline还是串行
    * 主从同步的细节
        * 全同步
        * 增量同步
    * 可以试试`Memcached`或者多线程的`Redis`

### 电商三面

- [类Leetcode 718. 最长重复子数组，求两个字符串的最大相同子串](https://leetcode-cn.com/problems/maximum-length-of-repeated-subarray/)
- Java
    * 讲一下`ConcurrentHashMap`
        * 为什么比`HashTable`的效率高
        * CAS操作，有什么问题，解决方案
    * 线程池
        * 处理流程
        * 为什么先corePoolSize，再入队列，最后maxPoolSize
    * 类加载机制
        * 为什么需要双亲委派
- MySQL
    * 给定表T （id name salary city）
        * salary > 10000 && avg city salary > 5000
    * 索引的数据结构实现
    * InnoDB默认事务隔离级别RR，实现方式（MVCC+间隙锁）
- Redis
    * 数据结构，使用场景
- 一致性hash
    * Dubbo负载均衡算法里面的一致性hash，虚拟节点，另外强调了不能加权

## 滴滴

### 交易引擎一面（挂）

面了1h20min，面试交流的还可，主要是因为个人技术栈和部门不符

以下`...`均表示我在瞎答

- 项目
    * 优化过的问题
        * zset和set配合去分片list结构
    * 解决过的问题
        * RedisTimeout的处理流程
    * 大并发下，如何解决问题
        * 线上的策略是clone，并发控制的都是从Redis里面（保证线程安全）
        * 每个线程执行是串行的，线程安全的
    * 项目兜底机制，降级策略
- golang
    * 协程死锁的情况...
    * 内存泄露的情况...
    * 了解Context包嘛...
- 设计
    * 设计rpc，rpc本质 `remote process call`
    * 长/短链接
        * 短连接需要建立连接池，长连接用完需要释放
    * 负载均衡
        * 生产者可能一直在变，怎么维护，我说注册中心，也顺带扯了一下`service mesh`，做类似网关的功能
    * 数据压缩
        * RPC很重要的一点儿是为了降低带宽使用，压缩会占CPU，所以需要做trade off
- MySQL
    * 数据结构
    * 一个age，具体怎么存索引的（CPU，内存，磁盘各自做了什么操作...）
- Redis
    * 线程模型（6.0以后多线程，多线程做了啥...）
    * 持久化机制
        * RDB会导致服务器的哪些负载变大，为啥
            * 开了进程，会占CPU和内存，写快照到磁盘，会使用到IO
        * AOF流程，什么时候从内存dump到磁盘，缓冲区什么时候读写，每个对应的过程是同步的还是异步的(`fsync`方法)
        * RDB写快照时候，还可以增量写AOF，最后合并
    * 集群用过么(codis or cluster)
        * 你了解的集群怎么做（分桶）
        * 讲一下一个key要存入集群中会经历哪些过程
            * 为什么按照`key`去hash，而不是按照`client-ip` or `client`的一些去hash，以及对应的机器down掉怎么办
- 并发编程
    * 用java，golang写多线程循环打印
        * golang要写channel和锁的两种方式
        * 看代码，分析存在的问题
- 算法题
    * 存在重复元素的全排列

### 国际化一面

这次也是面了1h20min，面试交流的还可

- 自我介绍以及项目介绍
    * 由项目引申出来Redis的使用
- Redis
    * 五种数据结构，以及对应的场景
    * 单线程（6.0 多线程）
    * 跳表
    * 渐进式rehash
    * 持久化
- MySQL
    * 事务的特性
    * 事务隔离级别及实现
    * SQL调优
- Linux
    * socket io模型（select, poll, epoll）
    * 日志里面第一列是ip, 查询出现次数前10的ip
        * `cat xxx.log | awk '{ print $1 }' | sort -n | uniq -c | sort -r -k1 | head 10`
    * 负载很高的时候，怎么查
- 算法题
    * 用加法实现减法，乘法，除法（加法已经内置好）
    * [复原 IP 地址](https://leetcode-cn.com/problems/restore-ip-addresses/)


### 国际化二面 

整体偏 MySQL 和 Kafka，最后面试官说限于时间，本来还想和我交流操作系统和Linux的

- `ChaosBlade`分析线上`RedisTimeout`流程
    * 对`ChaosBlade`理解，cpu100%，mem100%，磁盘写满，弱网，网络不可达
- 数据库
    * 有哪些log（binlog，slowlog，undolog，redolog）
        * 讲一下redo/undo log
        * redis事务实现原理
    * 索引的理解
    * 组合索引的索引存储是怎么样的
    * 为什么数据库最开始就选择用B+树，而不是数组，队列这样的结构
        * 我理解更多的是瓶颈在io
    * 理想情况下，内存足够，b+ tree和数组检索的区别（假设只读的情况下）
        * 数组索引明显更快，并且可以cache到寄存器层面
        * b+ tree是基于堆的，不会比数组快
- Kafka
    * 理解（看过kafka的paper，整体讲了一下）
    * Kafka官方介绍不是用来做消息队列的，是用来做流处理平台
    * 语义的保证
        * 至少一次
        * 最多一次
        * 刚好一次（这里就引申到了：如何用UDP实现可靠性传输，转向下面）
- TCP
    * 如何可靠
        * 滑动窗口，流量控制，拥塞控制
    * 为什么不能两次握手
        * 服务端socket资源浪费
    * 为什么不能三次挥手
        * 客户端socket资源浪费
- 算法题
    * [剑指 Offer 52. 两个链表的第一个公共节点](https://leetcode-cn.com/problems/liang-ge-lian-biao-de-di-yi-ge-gong-gong-jie-dian-lcof/)
    * LRU Cache
        * 实现
        * 用在哪里（内存置换，页面置换）

### 国际化三面

- 成长
    - 为什么做测开，以后的发展规划
    - 小团队和大团队的感受
    - 什么情况下会去滴滴（氛围好！）
    - 对全栈的理解，T字型人才
- Java
    - JUC源码理解
    - 主线程等从线程执行完，再执行
        * join实现机制
            * 通过`wait`和`notify`实现的（线程还存活，就一直wait）
        * 共享内存（本质上都是去改变状态去通信）
            * 要么自己手写
            * 也可以用`CountDownLatch`来实现
    - ArrayList删除里面所有的偶数
        * 用`iterator`，iterator
- MySQL
    - 写一个SQL，找出语文排名第二的学生姓名
        * 三张表 Student(id,name), Course(id,name), Score(sid、cid、score)
        * 这里用了max(score) < max(score), 应该用order by limit更好的
- TCP
    - TIME_CLOSE理解
- 算法
    - 队列实现栈
        * 两个队列实现
        * 一个队列实现（获取原来的size，插入值，然后将size个数从队列头插入到尾部）
    - 无序数组，三个数找和为target的情况 (hashMap去做)


## 快手

用户增长，通俗讲就是拉新用户

### 用户增长一面 

- 多线程
    * 线程创建的方式
    * 线程池机制，为什么corePoolSize，阻塞队列，maxPoolSize这样处理
    * 线程池的线程怎么做到不回收的
    * 线程同步的方式
    * 知道的锁优化（不说synchronized，我说了readwriteLock的锁降级过程）
    * AQS原理，（[CLH](https://coderbee.net/index.php/concurrent/20131115/577)）
    * 自旋锁的unsafe怎么实现的
- JVM
    * java内存分布
    * 堆的区分
    * 什么时候gc会影响应用的可用性
    * 强，软，弱，虚引用
        * `weakReference`提到了`ThreadLocal`
        * 讲了具体ThreadLocal的实现，以及防止内存泄露
            * ThreadLocal是采用开放寻址法
        * 在应用侧，线程池用`ThreadLocal`的时候，如何一个任务执行完清除
            * 是不是可以实现线程池的钩子函数`afterExecute` ?
            * 有框架可以实现嘛，还是必须业务去做
- Spring
    * IOC和AOP
    * 不加注解就能对所有的方法做一些事前log和事后的log（不能用AOP），怎么实现（我说要么代码重写，要么字节码增强）
        * 面试官说我不了解源码就没继续追问了
- 设计题（我设计不太行，而且这个题确实挺难）
    * 邀请好友给自己涨钱的实现（数据量30E），并且用户A给用户B涨完钱，用户B不能给用户A涨钱，每个人每天有5次助力（一天有限期）
        * 数据库怎么设计
        * 缓存怎么设计
        * 如何保证几次查库的一致性（说了唯一key，或者布隆过滤器）
- 算法题
    * [leetcode 92. 反转链表 II](https://leetcode-cn.com/problems/reverse-linked-list-ii/)

### 用户增长二面

面试官说，不论去哪儿，做的开心是最重要的～

- 项目
    * Redis分析
- Java
    * concurrentHashMap
        * 1.7 两级hash
        * 1.8 volatile + CAS + synchronized
    * 分布式锁
        * 可重入怎么实现
        * 如何保证原子性
        * 为什么删除的时候要重新get一下
            * 需要保证删的这个服务实例拥有锁
- 数据库
    * 事务
    * 索引
- Kafka
    * 如果保证有序
- 算法
    * [雪花算法](https://github.com/weiyinfu/wolf/blob/master/wiredwolf/snow_flake.py)
        * 时钟回拨
    * 限流算法
        * [令牌桶](https://github.com/Draymonders/Steed/blob/main/entity/qpsLimiter.go)，Java里面的RateLimiter
        * 计数器法
        * 漏桶算法
    * 最长递增子序列（dp）

### 用户增长三面

- 项目or成长
    - 分工
    - 遇到的问题
    - Redis和Memcached的区别（讲了一下多线程）
    - 线上压测（toB没有公有云业务）
    - 为什么到了现在这家公司
    - 为什么做测开
    - 竞赛经历
- 场景
    - 抢红包设计
        - 超发如何解决
- offer
    - 问了我现在的offer情况

## 复盘

- 重点：系统设计能力
    * 点餐系统
        * 如何解决订单超发
    * 停车场系统
    * 排队系统
    * 中国象棋
- 时钟回拨
- Redis和Memcached的区别
- Kafka如何保证至少一次，刚好一次
- https抓包
- SQL调优
- undo log，redo log
- Spring事务实现
- XSS和CSRF攻击
- 自动熔断工具
- 502可能的原因
    * 网关超时
- 信号量和锁有什么区别
    * Mutex管理的是资源的使用权，而Semaphore管理的是资源的数量，有那么一点微妙的小区别。