# 扩容

背景：

- db 存储快满了，因此需要扩容，执行时间为凌晨
- db扩容期间会有 5s 左右时间不可写
- db的架构为 proxy + 主从，查询必须带分片键


扩容前

![扩容前](./scale_up_before.png)

扩容后

![扩容前](./scale_up_after.png)