# 社招面经

## 字节电商

### 一面

- [剑指 Offer 52. 两个链表的第一个公共节点](https://leetcode-cn.com/problems/liang-ge-lian-biao-de-di-yi-ge-gong-gong-jie-dian-lcof/)
- [Leetcode 31. 给定一组数字，任意组合，求比给定组合M大的最小值](https://leetcode-cn.com/problems/next-permutation/)
- 统计当前目录下（包含子目录）*.java 的文件的代码总行数。(shell)
    * wc -l \`find . -name "*.java"\` | awk '{ print $1 }' | sum
- 管道的理解，管道除了存内容还存什么?
    * Linux上的管道就是一个操作方式为文件的内存缓冲区
    * `|` 是匿名管道，父子进程间使用，父进程先打开一个管道，然后fork出子进程，子进程通过拷贝父进程的地址空间拿到管道的描述符，从而可以读写
- 前台跑程序，ctrl-c在做什么
    * ctrl + c，会发送`SIGINT`的信号，等同于`kill -2 (interrupt)`，程序那边接收到这个信号后做处理
    * ctrl + z，会发送`SIGTSTP`的信号
- 用户表t_user表，年龄age（int类型），求哪个年龄的用户最多。(sql) **没写出来，多练习**
    * select age, count(\*) from t_user group by age order by count(*) desc limit 1;
- mysql相关
    * innodb 索引结构
    * 普通索引，唯一索引 之间的性能差异
        * 唯一索引需要保证插入前没有数据，普通索引可以在写入磁盘前加 `change buffer`
    * 事务级别，mvcc
    * 二阶段提交
- https://toutiao.com 访问过程中发生了什么
- 最近阅读的相关书籍
    * 说自己爱看历史书，也看了Dubbo官方文档，美团的技术公众号，大厂的技术公众号，不爱看个人的
    * 忘记说最近看过 effictive go，Java并发编程实战

### 二面

- 项目介绍(自己说了Redis, 简直自己坑自己啊)
- 开根运算(误差1e-5)
- 判断二叉搜索树
- 讲讲堆排序
- 两枚硬币，甲乙分别扔，然后谁扔正面谁赢，求甲赢的概率
- http
    * get和post区别(是否可以缓存)
    * http和https，https抓包**没抓过**
- Redis
    * 数据结构
    * mget和pipeline区别 **不会**
    * 主从同步的细节
    * 可以试试`memCache`或者多线程的`Redis`

# TODO

- [50道sql题](https://www.jianshu.com/p/476b52ee4f1b)
- kafka事务
- 自增id用完了怎么办