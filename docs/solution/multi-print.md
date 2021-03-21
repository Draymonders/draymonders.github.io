# 多线程循环打印1234

滴滴国际化交易引擎一面问到了，复盘一下

## java实现

深入的问题，如果`count.i`每次不是自增，而是加`10000`，怎么办?

- 解决方案: 每个线程都要有一个状态变量来控制是否打印，然后第i个线程去改变第i+1个线程的状态变量

### 面试时实现

```java
class SharedCount {
    public volatile int i;
    public SharedCount(int i) {
        this.i = i;
    }
}

class PrintThread implements Runnable {
    volatile SharedCount count;
    volatile Object LOCK;
    int cur;
    int n;
    PrintThread(SharedCount cnt, Object obj, int cur, int n) {
        this.cur = cur;
        this.Lock = obj;
        this.count = cnt;
        this.n = n;
    }
    
    public void run() {
        while (true) {
            synchronized(LOCK) {
                while (count.i % n != cur) {
                    LOCK.wait();
                } 
                System.out.println(cur);
                count.i++; //+= new Random().nextInt(2);
                LOCK.notifyAll();
            }
        }
    }
    
}

class Main {
    public static void main(Stirng[] args) {
        SharedCount count = new SharedCount(0);
        Object obj = new Object();
        int n = 3;
        List<Thread> threadList = new ArrayList<>();
        for (int i=0; i<n; i++) {
            threadList.add(new PrintThread(count, obj, i, n);
        }
        for (Thread t : threadList) {
            t.start();
        }
        for (Thread t : threadList) {
            t.join();
        }
    }
}
```

### 复盘实现

```java
package concurrency.print;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.SneakyThrows;

/**
 * 多线程循环打印 123...n
 *
 * @author Draymonder
 * @date 2021/03/10
 */
public class NumberLoopPrintMain {

  static volatile SharedObject[] states;

  public static void main(String[] args) {
    int n = 3;
    int maxLoopCount = 10;
    printLoopNumber(n, maxLoopCount);
  }

  @SneakyThrows
  public static void printLoopNumber(int n, int maxLoopCount) {
    AtomicInteger counter = new AtomicInteger();

    states = new SharedObject[n];
    for (int i = 0; i < n; i++) {
      states[i] = new SharedObject(0, new Object());
    }

    states[0].i = 1;

    List<Thread> threadList = new ArrayList<>();
    for (int i = 0; i < n; i++) {
      int next = (i + 1) % n;
      threadList.add(
          new Thread(new PrintNumberThread(states[i], states[next], n, i, maxLoopCount, counter)));
    }

    for (Thread t : threadList) {
      t.start();
    }
    for (Thread t : threadList) {
      t.join();
    }
  }
}

class SharedObject {

  public final Object LOCK;
  public volatile int i;

  SharedObject(int i, Object obj) {
    this.i = i;
    this.LOCK = obj;
  }
}

class PrintNumberThread implements Runnable {

  volatile SharedObject curState;
  volatile SharedObject nextState;
  final int n;
  final int cur;
  final int maxLoopCount;
  volatile AtomicInteger counter;

  PrintNumberThread(SharedObject curState, SharedObject nextState, int n, int cur, int maxLoopCount,
      AtomicInteger counter) {
    this.curState = curState;
    this.nextState = nextState;
    this.n = n;
    this.cur = cur;
    this.maxLoopCount = maxLoopCount;
    this.counter = counter;
  }

  @SneakyThrows
  @Override
  public void run() {
    while (true) {
      synchronized (curState.LOCK) {
        if (counter.get() > maxLoopCount) {
          break;
        }
        while (curState.i == 0) {
          curState.LOCK.wait();
        }
        curState.i = 0;

        int runningCount = counter.incrementAndGet();
        if (runningCount > maxLoopCount) {
          break;
        }

        System.out.println(cur);

        synchronized (nextState.LOCK) {
          nextState.i = 1;
          nextState.LOCK.notifyAll();
        }
        Thread.sleep(100);
      }
    }
  }
}
```

## golang实现

golang各自实现channel和锁的打印

```go
func main() {
    workerNum := 3
    maxCount := 100
    chTicket := make(chan int);
    go func() {
        chTicket <- 0
    }()
    
    n := 3
    for i:=0; i<n; i++ {
        j := i
        go func() {
          for {
            k := <- chTicket
            if (k > maxCount) {
                return ;
            }
            if (k % n == j) {
                fmt.Println(j);
                chTicket <- k+1
            } else {
                chTicket <- k
            }
          }  
        }()
    }
}
```

以及下面的代码会出现哪些问题？

- 每个协程不是打印他对应的那个数
- 会死锁，因为是for循环去defer，defer只有当函数退出才调用，所以会死锁(面试官说的)
- 最后边界的情况会出现些问题(面试官说的)

```go
func Print(worker int, max int) { 
   mx := sync.Mutex{} 
   v := 0 

   for i := 0; i < worker; i++ { 
      go func() { 
         for { 
            if v > max { 
               break 
            } 

            mx.Lock() 
            defer mx.Unlock() 

            fmt.Printf("%v ", v) 
            v++ 
         } 
      }() 
   } 
} 
```

## 复盘

- 无论流程多简单的事儿，都需要认真的去做，去分析`corner case`，而不是马大哈
- 一定要开动脑经去想，去做，而不是口嗨