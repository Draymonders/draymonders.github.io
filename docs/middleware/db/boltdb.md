# Boltdb 源码阅读

## 背景

- 之前对db的了解更多的是黑盒，包括索引那些如何建立，更多的是八股文的记忆
- 虽说是go的代码，但读 boltDB 整体更像读c的代码，底层涉及到的更多是磁盘/内存 寻址

## 介绍

- boltdb和mysql一样采用了b+ tree的数据结构，适合读多写少的场景。
- b+ tree的平衡相关的代码在 spill（页分裂）和 rebanlance（页合并）方法内，并不难理解。
- 分支节点只存key，叶子节点存key和value

<del>- 当叶子节点内容较少时，可以把key和value直接塞入父节点的item中，是一种io优化，方便读取</del>

### 事务相关

- 读事务，读的是page在内存中的映射node。
- 写事务，重新把page拉取到内存（COW机制），只有在commit的时候才会落盘，并且更新meta。

### 磁盘页存储

- Page，就是header，用于标识当前page是什么类型
- pageElement，对item的meta信息记录
- item，具体的二进制落盘数据

![47LBNt.png](https://z3.ax1x.com/2021/10/01/47LBNt.png)

#### 磁盘内存映射

![47LaBd.png](https://z3.ax1x.com/2021/10/01/47LaBd.png)


### 数据读取

```go
// search recursively performs a binary search against a given page/node until it finds a given key.
// 检索key，有node就走node检索，有page就走page检索
func (c *Cursor) search(key []byte, pgid pgid) {
   p, n := c.bucket.pageNode(pgid)
   if p != nil && (p.flags&(branchPageFlag|leafPageFlag)) == 0 {
      panic(fmt.Sprintf("invalid page type: %d: %x", p.id, p.flags))
   }
   e := elemRef{page: p, node: n}
   // 记录走过的节点（page,node,index）栈，方便方法之间调用（减少参数）
   c.stack = append(c.stack, e)

   // If we're on a leaf page/node then find the specific node.
   if e.isLeaf() {
      c.nsearch(key)
      return
   }
   // 有内存node，走node检索，找到对应的节点后，递归进行search
   if n != nil {
      c.searchNode(key, n)
      return
   }
   // 只有磁盘page，走磁盘page检索，找到对应的节点后，递归进行search
   c.searchPage(key, p)
}
```

### 数据写入

```go
// put inserts a key/value.
func (n *node) put(oldKey, newKey, value []byte, pgid pgid, flags uint32) {
   if pgid >= n.bucket.tx.meta.pgid {
      panic(fmt.Sprintf("pgid (%d) above high water mark (%d)", pgid, n.bucket.tx.meta.pgid))
   } else if len(oldKey) <= 0 {
      panic("put: zero-length old key")
   } else if len(newKey) <= 0 {
      panic("put: zero-length new key")
   }

   // Find insertion index.
   index := sort.Search(len(n.inodes), func(i int) bool { return bytes.Compare(n.inodes[i].key, oldKey) != -1 })

   // 二分插入排序，保证整个nodes是有序的
   // Add capacity and shift nodes if we don't have an exact match and need to insert.
   exact := (len(n.inodes) > 0 && index < len(n.inodes) && bytes.Equal(n.inodes[index].key, oldKey))
   if !exact {
      n.inodes = append(n.inodes, inode{})
      copy(n.inodes[index+1:], n.inodes[index:])
   }

   inode := &n.inodes[index]
   inode.flags = flags
   inode.key = newKey
   inode.value = value
   inode.pgid = pgid
   _assert(len(inode.key) > 0, "put: zero-length inode key")
}
```

### B+ Tree索引示例

#### 主键索引

![47LdHA.png](https://z3.ax1x.com/2021/10/01/47LdHA.png)

#### 普通索引

![47L0AI.png](https://z3.ax1x.com/2021/10/01/47L0AI.png)

### 参考

- [boltdb gitbook](https://jaydenwen123.github.io/boltdb/)
- [Boltdb 源码导读（一）：Boltdb 数据组织](https://www.qtmuniao.com/2020/11/29/bolt-data-organised)
- [Boltdb 源码导读（二）：Boltdb 索引设计](https://www.qtmuniao.com/2020/12/14/bolt-index-design/)
- [Boltdb 源码导读（三）：Boltdb 事务实现](https://www.qtmuniao.com/2021/04/02/bolt-transaction/)