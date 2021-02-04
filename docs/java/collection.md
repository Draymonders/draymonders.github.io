## 集合

###  List

- ArrayList
    * `DEFAULT_CAPACITY = 10`
    * `int newCapacity = oldCapacity + (oldCapacity >> 1);`
    * 会遇到`ConcurrentModificationException`，比如固定返回5张实时抓拍图的场景
- LinkdedList
    * 双向循环链表
- Vector
    * `initialCapacity = 10`
    * `int newCapacity = 2 * oldCapacity;`
- CopyOnWriteArrayList
    * 需要clone整个数组(所以峰值内存会double，适合写少读多的场景)

### Map

- [HashMap](https://tech.meituan.com/2016/06/24/java-hashmap.html)
    * 懒加载，等第一次执行`putVal`才会去`initTab`
    * 只允许一条记录的键为null，允许多条记录的值为null。
    * 当链表长度>=8且桶大小>=64时转红黑树
    * 线程不安全(遍历的时候增加新key或者删除已有的key，报错`ConcurrentModificationException`,本质上还是modCount变化)
- [ConcurrentHashMap](https://crossoverjie.top/2018/07/23/java-senior/ConcurrentHashMap/)
    * key和null都不能为null
    * JDK7
        * 理论上 ConcurrentHashMap 支持 CurrencyLevel (Segment 数组数量) 的线程并发
        * 可以理解为JDK7是两层hash，一层segment(`ReentrantLock`)，一层table
        * 缺点是遍历比较复杂
    * JDK8
        * put先`initTable`, 如果链表首节点为null则`CAS`写入，否则直接获取首节点，然后synchronized插值
    * 1.8 在 1.7 的数据结构上做了大的改动，采用红黑树之后可以保证查询效率（O(logn)），甚至取消了 ReentrantLock 改为了 synchronized，这样可以看出在新版的 JDK 中对 synchronized 优化是很到位的。
- TreeMap
    * 红黑树，必须实现 `Comparable<K>` 接口 或者传入 `Comparator<K>` 的实现类
- LinkedHashMap
    * 继承自`HashMap`，线程不安全
    * 队首是最老的元素，队尾是最新的元素
    * 如何保证有序
        * 新建Node，会调用`linkNodeLast`方法将当前的节点放置到双向链表的末尾
        * 更新完，会执行`afterNodeAccess(newNode)`方法，会将当前操作的节点从链表中移动到**末尾**

### Set

- HashSet
    * 内部套的 HashMap，key为待添加的元素，value为一个`static final Object`
    * put方法 `this.map.put(e, PRESENT) == null;` 第一次插入返回值是null
    * get方法 `this.map.remove(o) == PRESENT;` 删除时候判断是否存在
- TreeSet
    * 内部套的 TreeMap，其他同HashSet一致

### Queue

- AbstractQueue
    - `offer`是放元素到队列里面，`pull`是从队列里面拉数据
    - `add`方法调用`offer`方法，如果没法增加元素到队列，会抛异常
    - `remove`方法调用`poll`方法，如果队列为空，会抛异常

- Deque（双端队列）
    * 有`addFirst`, `addLast`, `removeFirst`, `removeLast`
    * ArrayDeque
        * 线程不安全，性能比较拉跨(自我感觉)
    * LinkedList
        * 实现了Deque接口，最好还是用这个

- PriorityQueue
    * 线程不安全
    * 底层实现是Object数组
    * `offer`把节点加入到数组最后，然后向上更新`siftUp`最小根
    * `poll`会返回`queue[0]`，然后将`queue[0]`和`queue[sz-1]`做交换，再向下更新`siftDown`最小根

- ArrayBlockingQueue
    * 线程安全，使用`ReentrantLock`和`Condition`
    * **有一个锁**
    * `put`方法会阻塞等`NotFull`
    * `take`方法会阻塞等`NotEmpty`
    * `peek`方法会拿锁去读数据，当然可能读出来`null`
    * `drainTo(Collection c)`会将队列里面的数据推给集合`c`

- LinkedBlockingQueue
    * 线程安全，使用 `ReentrantLock` 和 `Condition`
    * 实现方式为单链表, `head`节点是一个虚节点，value为null
    * **有两个锁**，`takeLock` 和 `putLock`，并且存一个`AtomicInteger count`，这样就可以分离`offer`和`poll`操作。