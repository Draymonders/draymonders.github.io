# 社招面经

## 字节电商

### 一面

- [剑指 Offer 52. 两个链表的第一个公共节点](https://leetcode-cn.com/problems/liang-ge-lian-biao-de-di-yi-ge-gong-gong-jie-dian-lcof/)
- 给定一组数字，任意组合，求比给定组合M大的最小值，例如给定 (1,3,4) 比 314 大的最小值是 341
    * leetcode 31
- 统计当前目录下（包含子目录）*.java 的文件的代码总行数。(shell)
```shell
wc -l `find . -name "*.java"` | awk '{ print $1 }' | sum
```
- 管道的理解，管道除了存内容还存什么?
    * Linux上的管道就是一个操作方式为文件的内存缓冲区
    * `|` 是匿名管道，父子进程间使用，父进程先打开一个管道，然后fork出子进程，子进程通过拷贝父进程的地址空间拿到管道的描述符，从而可以读写
- 前台跑程序，ctrl-c在做什么
    * ctrl + c，会发送`SIGINT`的信号(kill -2 (interrupt))，然后程序那边可以接收到这个信号后做处理
    * ctrl + z, 会发送`SIGTSTP`的信号
- 用户表t_user表，年龄age（int类型），求哪个年龄的用户最多。写sql**没写出来，多练习**
    * select age, count(*) from t_user group by age order by count(*) desc limit 1;
- mysql相关
    * innodb 索引结构
    * 普通索引，唯一索引 之间的性能差异
        * 唯一索引需要保证插入前没有数据，普通索引可以在写入磁盘前加 `change buffer`
    * 事务级别，mvcc
    * 二阶段提交
- https://toutiao.com 访问过程中发生了什么
- 最近阅读的相关书籍
    * 说自己爱看历史书，也看了dubbo的官方文档，平时爱看美团的技术公众号，比较喜欢看大厂的技术公众号，不爱看个人的
    * 忘记说最近看过 effictive go，Java并发编程实战

# TODO
- [50道sql题](https://www.jianshu.com/p/476b52ee4f1b)