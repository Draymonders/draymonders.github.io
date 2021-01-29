
## 集合

###  List

- ArrayList
    * `DEFAULT_CAPACITY = 10`
    * `int newCapacity = oldCapacity + (oldCapacity >> 1);`
- LinkdedList
    * 双向循环链表
- Vector
    * `initialCapacity = 10`
    * `int newCapacity = 2 * oldCapacity;`
- CopyOnWriteArrayList
    * 需要clone整个数组(所以峰值内存会double，适合写少读多的场景)

### Map

- [HashMap](https://tech.meituan.com/2016/06/24/java-hashmap.html)
    * 只允许一条记录的键为null，允许多条记录的值为null。
    * 当链表长度>=8且桶大小>=64时转红黑树
    * 线程不安全的体现(TODO)
- ConcurrentHashMap(TODO)
    * key和null都不能为null
    * https://crossoverjie.top/2018/07/23/java-senior/ConcurrentHashMap/
- Set(TODO)



# 问题汇总

- 接口跟抽象类的区别
    - 接口定义行为
    - 抽象类为了复用, 相同的东西抽象类实现，不同的东西子类实现
- BIO，[NIO](https://tech.meituan.com/2016/11/04/nio.html)
- 双亲委派模型
- java中mysql数据库机器CPU使用过高怎么定位