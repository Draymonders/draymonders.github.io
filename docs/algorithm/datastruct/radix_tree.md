# Radix

radix tree, 基数树，trie树（前缀树）的一种空间上的优化

## 举例

1. 先插入 key="foo", value=1

[![5WDXrQ.png](https://z3.ax1x.com/2021/10/24/5WDXrQ.png)](https://imgtu.com/i/5WDXrQ)


2. 再插入 key="fotbar", value=2

[![5WDjbj.png](https://z3.ax1x.com/2021/10/24/5WDjbj.png)](https://imgtu.com/i/5WDjbj)

## 深入理解

- 叶子节点，leaf不为nil，edges就为nil
- 从 root 到 leaf 节点的 prefiex 拼接 等于leaf节点的key值
- edges数组是按照 label 排序的，label 为单个字符

## Reference

- [radix 源码](https://github.com/Draymonders/radix) // 目前对中文支持不到位，后续有需求可以继续迭代
