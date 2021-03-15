# 内存

使用`free -m`, `available`包含了`free`, `available`里面除了`free`的还有磁盘的页缓存。

`The "available" memory accounts for that. It sums up all memory that is unused or can be freed immediately.`

```shell
              total        used        free      shared  buff/cache   available
Mem:          15903        3288        7868         878        4747       11442
Swap:             0           0           0
```
