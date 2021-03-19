# 社招面经

## 抖音

### 电商一面

- [剑指 Offer 52. 两个链表的第一个公共节点](https://leetcode-cn.com/problems/liang-ge-lian-biao-de-di-yi-ge-gong-gong-jie-dian-lcof/)
- [Leetcode 31. 给定一组数字，任意组合，求比给定组合M大的最小值](https://leetcode-cn.com/problems/next-permutation/)
- 统计当前目录下（包含子目录） java 的文件的代码总行数。(shell)
    * wc -l \`find . -name "*.java"\` | awk '{ print $1 }' | sum
- 管道的理解，管道除了存内容还存什么?
    * Linux上的管道就是一个操作方式为文件的内存缓冲区
    * `|` 是匿名管道，父子进程间使用，父进程先打开一个管道，然后fork出子进程，子进程通过拷贝父进程的地址空间拿到管道的描述符，从而可以读写
- 前台跑程序，ctrl-c在做什么
    * ctrl + c，会发送`SIGINT`的信号，等同于`kill -2 (interrupt)`，程序那边接收到这个信号后做处理
    * ctrl + z，会发送`SIGTSTP`的信号
- 用户表t_user表，年龄age（int类型），求哪个年龄的用户最多。(sql) **写错了，多练习SQL**
    * select age, count(1) from t_user group by age order by count(1) desc limit 1;
- MySQL相关
    * innodb 索引结构
    * 普通索引，唯一索引 之间的性能差异
        * 唯一索引需要保证插入前没有数据，普通索引可以在写入磁盘前加 `change buffer`
    * 事务级别，MVCC
    * 二阶段提交
- 访问 https://toutiao.com 过程中发生了什么
    * dns(nslookup, dig)
    * tcp
    * http
    * https
    * 网关 -> service -> client
    * 浏览器渲染
- 最近阅读的相关书籍
    * 说自己爱看历史书，也看了Dubbo官方文档，美团的技术公众号，大厂的技术公众号，不爱看个人的
    * 忘记说最近看过 effictive go，Java并发编程实战

### 电商二面

- 毕业1年的成长与经历 (Redis相关经历)
- 开根运算 (误差1e-5)
- 判断二叉搜索树
- 讲讲堆排序
- 两枚硬币，甲乙分别扔，然后谁扔正面谁赢，求甲赢的概率
    * 1/2 + 1/(2^3) + 1/(2^5) + ... = 2/3(1-(1/4)^n) => 2/3
- http
    * get和post区别(是否可以缓存)
    * http和https区别
    * 中间人攻击 **不会**
    * https如何抓包(Fiddler or Charles) **没抓过**
- Redis
    * 线程模型
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

问的基本上都答出来了

- [类Leetcode 718. 最长重复子数组，求两个字符串的最大相同子串](https://leetcode-cn.com/problems/maximum-length-of-repeated-subarray/)
- 讲一下`ConcurrentHashMap`
    * 为什么比`HashTable`的效率高
    * CAS操作，有什么问题，解决方案
- 线程池
    * 处理流程
    * 为什么先corePoolSize，再入队列，最后maxPoolSize
- 类加载机制
    * 为什么需要双亲委派
- MySQL
    * 给定表T (id name salary city)
        * salary > 10000 && avg city salary > 5000
    * 索引的数据结构实现
    * InnoDB默认事务隔离级别(RR)，实现方式(MVCC+间隙锁)
- Redis
    * 数据结构，使用场景
- 一致性hash
    * Dubbo负载均衡算法里面的一致性hash，虚拟节点，另外强调了不能加权

## 滴滴

### 交易引擎一面（挂）

面了1h20min，面试交流的还可，主要是因为个人技术栈和部门不符

以下`...`均表示我在瞎答

- 先自我介绍+项目介绍15分钟
- 项目层面（整体面试官不是很满意）
    * 优化过的问题
        * zset+set分片list结构
    * 说自己解决过的问题
        * RedisTimeout的处理流程
    * 大并发下，如何解决问题
        * 线上的策略是clone，并发控制的都是从Redis里面（保证线程安全）
        * 每个线程执行是串行的，线程安全的
    * 项目兜底机制 (降级)
- RPC设计
    * rpc本质 `remote process call`
    * 长/短链接
        * 短连接需要建立连接池，长连接用完需要释放
    * 负载均衡
        * 面试官还问，生产者可能一直在变，怎么维护，我说了注册中心，也顺带扯了一下`service mesh`，做类似网关的功能
    * 数据压缩
        * RPC很重要的一点儿是为了降低带宽使用，压缩会占CPU，所以需要做trade off
- golang
    * 协程死锁的情况...
    * 内存泄露的情况...
    * 了解Context包嘛...
- MySQL
    * 数据结构
    * 一个age，具体怎么存索引的（CPU，内存，磁盘各自做了什么操作...）
- Redis
    * 线程模型（6.0以后多线程，多线程做了啥...）
    * 持久化机制
        - RDB会导致服务器的哪些负载变大，为啥
            * 开了进程，会占CPU和内存，写快照到磁盘，会使用到IO
        - AOF流程，什么时候从内存dump到磁盘，缓冲区什么时候读写，每个对应的过程是同步的还是异步的(`fsync`方法)
        - RDB写快照时候，还可以增量写AOF，最后合并
    * 集群用过么(codis or cluster)
        - 你了解的集群怎么做（分桶）
        - 讲一下一个key要存入集群中会经历哪些过程
            * 为什么按照`key`去hash，而不是按照`client-ip` or `client`的一些去hash，以及对应的机器down掉怎么办
- 并发编程
    * 用java，golang写多线程循环打印
        * golang要写channel和锁的两种方式
        * 看代码，分析存在的问题
- 算法题
    * cpp 存在重复元素的全排列

### 国际化一面

这次也是面了1h20min，面试交流的还可

- 自我介绍以及项目介绍
    * 由项目引申出来Redis的使用
- Redis(这次准备了源码，不怕问)
    * 五种数据结构，以及对应的场景(这里又引到项目里面了，该说一些通用的场景的)
    * 单线程(6.0 多线程)
    * 跳表
    * 渐进式rehash
    * 持久化
- MySQL
    * 事务的特性
    * 事务隔离级别及实现
    * SQL调优（**好久没看了，需要复习**）
- Linux
    * io模型（select, poll, epoll**需要复习**）
    * 日志里面第一列是ip, 查询出现次数前10的ip
        * `cat xxx.log | awk '{ print $1 }' | sort -n | uniq -c | sort -r -k1 | head 10`
    * 负载很高的时候，怎么查（我是从cpu, memory, disk, socket方面去分析的）
        
- 算法题（秒了）
    * 用加法实现减法，乘法，除法（加法已经内置好）
    * [复原 IP 地址](https://leetcode-cn.com/problems/restore-ip-addresses/)


### 国际化二面 

一面问了很多`Redis`源码，所以二面就基本没问了

整体偏`MySQL`和`Kafka`, 然后面试官说限于时间，本来还想和我交流操作系统和Linux的

面试官说他弟弟也是矿大的hhh

- `ChaosBlade`分析线上`RedisTimeout`流程
    * 对`ChaosBlade`理解，cpu100%, mem100%, `full disk`, 弱网，网络不可达
- 数据库
    * 有哪些log, binlog, slowlog, undolog, redolog
        * 既然提到了redo/undo, 那么redis事务如何实现的（原理）
    * 索引的理解
    * 组合索引的索引存储是怎么样的
    * 为什么数据库最开始就选择用B+树，而不是数组，队列这样的结构
        * 我理解更多的是瓶颈在io
    * 理想情况下，内存足够，b+ tree和数组检索的区别（假设只读的情况下）
        * 这明显数组索引更快，并且可以cache到寄存器层面；b+ tree是基于堆的，不会比数组快
- Kafka
    * 理解（看过kafka的paper，整体讲了一下）
    * Kafka官方介绍不是用来做消息队列的，是用来做流处理平台
    * 语义的保证
        * 至少一次
        * 最多一次
        * 刚好一次（这里就引申到了：如何用UDP实现可靠性传输，转向下面）
- TCP
    * 如何可靠（流量控制，拥塞控制...）
    * 为什么不能两次握手，三次挥手（前者是服务端socket资源浪费，后者是客户端socket资源浪费）
- 算法题
    * 面试官让我看到了题库，我说这里面题我都会做
    * [剑指 Offer 52. 两个链表的第一个公共节点](https://leetcode-cn.com/problems/liang-ge-lian-biao-de-di-yi-ge-gong-gong-jie-dian-lcof/)
        * 本题写的太快，面试官有点儿吃惊
    * LRU Cache
        * 实现
        * 用在哪里（内存置换，页面置换）

## 快手

### 用户增长一面 

中间面试官网络不好，各种换网络（15min一次吧）

- 多线程
    * 线程创建的方式
    * 线程池机制，为什么corePoolSize, 队列，maxPoolSize这样子?
    * 线程池的线程怎么做到不回收的
    * 线程同步的方式
    * 知道的锁优化（不说synchronized，我说了readwriteLock的锁降级过程）
    * AQS原理，（CLH了解么，不了解啊）
    * 自旋锁的unsafe怎么实现的
- JVM
    * java内存分布
    * 堆的区分
    * 什么时候gc会影响应用的可用性
    * 强，软，弱，虚引用
        * `weakReference`提到了`ThreadLocal`
        * 讲了具体ThreadLocal的实现，以及防止内存泄露
        * 在应用侧，线程池用`ThreadLocal`的时候，如何一个任务执行完清除，（有框架可以实现嘛，还是必须业务去做）
- Spring
    * IOC和AOP
    * 不加注解就能对所有的方法做一些事前log和事后的log（不能用AOP），怎么实现（我说要么代码重写，要么字节码增强）
        * 面试官说我不了解源码就没继续追问了
- 设计题（这个题典型的差评了）
    * 邀请好友给自己涨钱的实现（数据量30E），并且用户A给用户B涨完钱，用户B不能给用户A涨钱
        * 怎么设计
        * 数据库怎么设计
        * 缓存怎么设计
        * 如何保证几次查库的一致性（说了唯一key，或者布隆过滤器）
- 算法题
    * [leetcode 92. 反转链表 II](https://leetcode-cn.com/problems/reverse-linked-list-ii/)

### 用户增长二面

TODO

## 复盘

- Redis源码阅读
    - [缓存无底洞](https://blog.csdn.net/erica_1230/article/details/50569301)
- https抓包
- [50道sql题](https://www.jianshu.com/p/476b52ee4f1b)
- kafka
- 去看B+ tree的实现