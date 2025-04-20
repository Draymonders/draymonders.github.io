## ThreadLocal笔记
![kIEgyR.jpg](https://s2.ax1x.com/2019/02/25/kIEgyR.jpg)

如上图所示

每个Thread 都有一个map,里面存着Entry<Key,value>,而`key`是实现了`WeakReference`的`ThreadLocal`,如果不是`WeakReference`，那么可能Entry里面的key和value在线程结束才会进行GC，但是由于是`WeakReference`,因此当Key被设置为`null`时,key就会被 gc 回收.

但是由于`value`还在`currentThread`->`Map`->`Entry`->`value`中，因此导致了内存泄漏

## 解决方法

hreadLocalMap类的设计本身已经有了这一问题的解决方案，那就是在每次`get()`/`set()`/`remove()`ThreadLocalMap中的值的时候，会自动清理key为null的value。如此一来，value也能被回收了。

```java
private Entry getEntryAfterMiss(ThreadLocal<?> key, int i, Entry e) {
    Entry[] tab = table;
    int len = tab.length;

    while (e != null) {
        ThreadLocal<?> k = e.get();
        if (k == key)
            return e;
        if (k == null)
            expungeStaleEntry(i);
        else
            i = nextIndex(i, len);
        e = tab[i];
    }
    return null;
}
```
中的
```java
if (k == null)
    expungeStaleEntry(i);
```

expungeStaleEntry保证了key为null的情况下value也置为null

```java
private int expungeStaleEntry(int staleSlot) {
    Entry[] tab = table;
    int len = tab.length;

    // expunge entry at staleSlot
    tab[staleSlot].value = null;
    tab[staleSlot] = null;
    size--;

    // Rehash until we encounter null
    Entry e;
    int i;
    for (i = nextIndex(staleSlot, len);
         (e = tab[i]) != null;
         i = nextIndex(i, len)) {
        ThreadLocal<?> k = e.get();
        if (k == null) {
            e.value = null;
            tab[i] = null;
            size--;
        } else {
            int h = k.threadLocalHashCode & (len - 1);
            if (h != i) {
                tab[i] = null;

                // Unlike Knuth 6.4 Algorithm R, we must scan until
                // null because multiple entries could have been stale.
                while (tab[h] != null)
                    h = nextIndex(h, len);
                tab[h] = e;
            }
        }
    }
    return i;
}
```

## 需要注意的点

1. 每次使用完ThreadLocal，都调用它的remove()方法，清除数据。
2. 在使用线程池的情况下，没有及时清理ThreadLocal，不仅是内存泄漏的问题，更严重的是可能导致业务逻辑出现问题。所以，使用ThreadLocal就跟加锁完要解锁一样，用完就清理。

## reference

- [threadLocal源码解析](https://blog.csdn.net/ThinkWon/article/details/102508721)