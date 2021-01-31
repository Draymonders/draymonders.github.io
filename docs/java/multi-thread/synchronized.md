# Synchronized

`synchronized` 关键字是解决并发问题常用解决方案，有以下三种使用方式:

- 同步普通方法，锁的是当前对象。
- 同步静态方法，锁的是当前 `Class` 对象。
- 同步块，锁的是 `()` 中的对象。


## 实现原理

先上代码

```java
public class SynchronizedMain {

  private final Object object = new Object();
  private volatile int x = 0;
  private volatile static int y = 0;

  public static void main(String[] args) {
  }

  /**
   * 同步普通方法
   */
  synchronized int getMethod() {
    return ++x;
  }

  /**
   * 同步静态方法
   */
  static synchronized int staticGetMethod() {
    return ++y;
  }

  /**
   * 同步块
   */
  int getObjectMethod() {
    synchronized (this.object) {
      x ++;
    }
    return x;
  }
}
```

### 代码块

`JVM` 是通过进入、退出对象监视器( `Monitor` )来实现对方法、同步块的同步的。

具体实现是在编译之后在同步方法调用前加入一个 `monitor.enter` 指令，在退出方法和异常处插入 `monitor.exit` 的指令。

其本质就是对一个对象监视器( `Monitor` )进行获取，而这个获取过程具有排他性从而达到了同一时刻只能一个线程访问的目的。

而对于没有获取到锁的线程将会阻塞到方法入口处，直到获取锁的线程 `monitor.exit` 之后才能尝试继续获取锁。

使用 `javap -c Synchronize` 可以查看编译之后的具体信息。

```java
Compiled from "SynchronizedMain.java"
public class multi_thread.SynchronizedMain {
  public multi_thread.SynchronizedMain();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: aload_0
       5: new           #2                  // class java/lang/Object
       8: dup
       9: invokespecial #1                  // Method java/lang/Object."<init>":()V
      12: putfield      #3                  // Field object:Ljava/lang/Object;
      15: aload_0
      16: iconst_0
      17: putfield      #4                  // Field x:I
      20: return

  int getObjectMethod();
    Code:
       0: aload_0
       1: getfield      #3                  // Field object:Ljava/lang/Object;
       4: dup
       5: astore_1
       6: monitorenter
       7: aload_0
       8: dup
       9: getfield      #4                  // Field x:I
      12: iconst_1
      13: iadd
      14: putfield      #4                  // Field x:I
      17: aload_1
      18: monitorexit
      19: goto          27
      22: astore_2
      23: aload_1
      24: monitorexit
      25: aload_2
      26: athrow
      27: aload_0
      28: getfield      #4                  // Field x:I
      31: ireturn
    Exception table:
       from    to  target type
           7    19    22   any
          22    25    22   any

  static {};
    Code:
       0: iconst_0
       1: putstatic     #5                  // Field y:I
       4: return
}
```

可以看到在方法`getObjectMethod`同步块的入口和出口分别有 `monitorenter,monitorexit` 指令。

### 方法

具体实现是，方法调用指令来读取运行时常量池中的`ACC_SYNCHRONIZED`标志，如果方法表结构（method_info Structure）中的`ACC_SYNCHRONIZED`标志被设置，

那么线程在执行方法前会先去获取对象的`monitor`对象，如果获取成功则执行方法代码，执行完毕后释放`monitor`对象。

如果monitor对象已经被其它线程获取，那么当前线程被阻塞。

```java
static synchronized int staticGetMethod();
    descriptor: ()I
    flags: (0x0028) ACC_STATIC, ACC_SYNCHRONIZED
    Code:
        stack=2, locals=0, args_size=0
            0: getstatic     #5                  // Field y:I
            3: iconst_1
            4: iadd
            5: dup
            6: putstatic     #5                  // Field y:I
            9: ireturn
        LineNumberTable:
        line 29: 0

synchronized int getMethod();
    descriptor: ()I
    flags: (0x0020) ACC_SYNCHRONIZED
    Code:
      stack=3, locals=1, args_size=1
         0: aload_0
         1: dup
         2: getfield      #4                  // Field x:I
         5: iconst_1
         6: iadd
         7: dup_x1
         8: putfield      #4                  // Field x:I
        11: ireturn
      LineNumberTable:
        line 22: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      12     0  this   Lmulti_thread/SynchronizedMain;
```

可以看出无论是普通方法还是静态方法
开始和结束的地方都没有出现`monitorenter`和`monitorexit`指令，但是出现`ACC_SYNCHRONIZED`标志位。

## 锁优化

`synchronized`  很多都称之为重量锁，`JDK1.6` 中对 `synchronized` 进行了各种优化，为了能减少获取和释放锁带来的消耗引入了`偏向锁`和`轻量锁`。

### 偏向锁

为了降低获取锁的代价，`JDK1.6` 之后引入了偏向锁。

偏向锁的特征是: **锁不存在多线程竞争，并且应由一个线程多次获得锁。**

当线程1访问代码块并获取锁对象时，会在java对象头和栈帧中记录偏向的锁的threadID，`偏向锁不会主动释放锁`。

因此以后线程1再次获取锁的时候，需要`比较当前线程的threadID和Java对象头中的threadID是否一致`，如果一致（还是线程1获取锁对象），则无需使用CAS来加锁、解锁；

如果不一致（其他线程，如线程2要竞争锁对象，而偏向锁不会主动释放因此还是存储的线程1的threadID），那么需要`查看Java对象头中记录的线程1是否存活`，如果没有存活，那么锁对象被重置为无锁状态，其它线程（线程2）可以竞争将其设置为偏向锁；

如果存活，那么`立刻查找该线程（线程1）的栈帧信息`，如果还是需要继续持有这个锁对象，那么`暂停当前线程1，撤销偏向锁，升级为轻量级锁`，如果线程1不再使用该锁对象，那么将`锁对象状态设为无锁状态，重新偏向新的线程。`

偏向锁可以提高带有同步却没有竞争的程序性能，但如果程序中大多数锁都存在竞争时，那偏向锁就起不到太大作用。可以使用 `-XX:-UseBiasedLocking` 来关闭偏向锁，并默认进入轻量锁。


### 轻量锁

轻量级锁考虑的是竞争锁对象的线程不多，而且线程持有锁的时间也不长的情景。因为阻塞线程需要CPU从用户态转到内核态，代价较大，如果刚刚阻塞不久这个锁就被释放了，那这个代价就有点得不偿失了，因此这个时候就干脆不阻塞这个线程，让它自旋这等待锁释放。

线程1获取轻量级锁时会先把锁对象的对象头`MarkWord`复制一份到线程1的栈帧中创建的用于存储锁记录的空间（称为`DisplacedMarkWord`），然后使用CAS把对象头中的内容替换为线程1存储的锁记录（`DisplacedMarkWord`）的地址；

如果在线程1复制对象头的同时（在线程1CAS之前），线程2也准备获取锁，复制了对象头到线程2的锁记录空间中，但是在线程2CAS的时候，发现线程1已经把对象头换了，线程2的CAS失败，那么线程2就尝试使用自旋锁来等待线程1释放锁。

但是如果自旋的时间太长也不行，因为自旋是要消耗CPU的，因此自旋的次数是有限制的，比如10次或者100次，如果自旋次数到了线程1还没有释放锁，或者线程1还在执行，线程2还在自旋等待，这时又有一个线程3过来竞争这个锁对象，那么这个时候轻量级锁就会膨胀为重量级锁。重量级锁把除了拥有锁的线程都阻塞，防止CPU空转。


> 注意：为了避免无用的自旋，轻量级锁一旦膨胀为重量级锁就不会再降级为轻量级锁了；偏向锁升级为轻量级锁也不能再降级为偏向锁。一句话就是锁可以升级不可以降级，但是偏向锁状态可以被重置为无锁状态

### 锁粗化

按理来说，同步块的作用范围应该尽可能小，仅在共享数据的实际作用域中才进行同步，这样做的目的是为了使需要同步的操作数量尽可能缩小，缩短阻塞时间，如果存在锁竞争，那么等待锁的线程也能尽快拿到锁。 

但是加锁解锁也需要消耗资源，如果存在一系列的连续加锁解锁操作，可能会导致不必要的性能损耗。

锁粗化就是`将多个连续的加锁、解锁操作连接在一起，扩展成一个范围更大的锁，避免频繁的加锁解锁操作`。

### 锁消除

Java虚拟机在JIT编译时(可以简单理解为当某段代码即将第一次被执行时进行编译，又称即时编译)，通过对运行上下文的扫描，经过逃逸分析，去除不可能存在共享资源竞争的锁，通过这种方式消除没有必要的锁，可以节省毫无意义的请求锁时间


### 其他优化

#### 适应性自旋

在使用 `CAS` 时，如果操作失败，`CAS` 会自旋再次尝试。由于自旋是需要消耗 `CPU` 资源的，所以如果长期自旋就白白浪费了 `CPU`。`JDK1.6`加入了适应性自旋:

> 如果某个锁自旋很少成功获得，那么下一次就会减少自旋。


## Synchronized 和 ReentrantLock 比较

**TODO**

- `ReentrantLock` 支持 公平/非公平, Synchronized 非公平
- `ReentrantLock` 可以设置超时


# Reference
- [Java并发——Synchronized关键字和锁升级，详细分析偏向锁和轻量级锁的升级](https://blog.csdn.net/tongdanping/article/details/79647337)
- [不可不说的Java“锁”事](https://tech.meituan.com/2018/11/15/java-lock.html)