# 读写锁
里面其实是一个锁`sync`继承自`aqs`

高位是`share count`,低位是 `exclusiveCount`

- 获取写锁 （当前有读锁退出），（当前有写锁，并且占用写锁的不为当前线程）则退出，cas更新`state`，执行重入操作
- 获取读锁，如果（已经有写锁，并且占有写锁的不为当前线程）则退出;
- **锁降级**需要遵循先获取写锁、获取读锁再释放写锁的次序

## 锁降级

共享数据，线程T1，线程T2

线程T1,想要修改完数据后立即使用数据，并且希望整个操作是原子的

```
T1拿写锁
  |
更新共享数据
  |
T1拿读锁
  |
T1释放写锁
  | 
读取共享数据
  |
T1释放读锁
```
如果是T1单纯拿写锁完成整个流程，效率低
如果是T1写锁释放再获取读锁，可能会被T2拿到写锁更新了共享数据数据


## reference
- [read write lock](https://juejin.cn/post/6844903952274685959)