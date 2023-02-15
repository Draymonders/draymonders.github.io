# Mysql存储引擎-InnoDB

## Buffer Pool

- 按照 file -> shard -> buffer page的结构，shard内部对page进行缓存管理，采用LRU策略。
- 每个shard最多有 pgsize 个page，如果page满了，会触发lru，如果清理的page是dirty的，则落盘
- [github 简单的实现](https://github.com/Draymonders/bfile)