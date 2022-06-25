# 负载高的分析思路

- cpu利用率怎么查看，找到占用cpu最多的进程，分析堆栈
    1. 死循环
    2. 自旋锁竞争较大，一直在自旋
    3. 加解密
    4. hashMap7 链表循环
- memory怎么查看，OOM解决思路，分析对象占用，修改gc参数
- 磁盘利用率和性能如何查看 `iostat`
- socket状态？ `time_wait`和`close_wait`

[![6rWJPK.png](https://s3.ax1x.com/2021/03/16/6rWJPK.png)](https://imgtu.com/i/6rWJPK)