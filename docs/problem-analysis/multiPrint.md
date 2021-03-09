(以下是滴滴的一面中所写的

# 多线程循环打印1234

## java实现

深入的问题，如果`count.i`每次不是自增，而是加`1w`，怎么办?

- 解决方案: 每个线程都要有一个状态变量来控制是否打印，然后第i个线程去改变第i+1个线程的状态变量

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

## golang实现

golang各自实现channel和锁的打印

```go
func main() {
    workerNum := 3
    maxCount := 100
    chTicket := make(chan);
    go func() {
        chTicket <- 0
    }()
    
    n := 3
    for i:=0; i<n; i++ {
        j := i
        go func() {
            k <- chTicket
            if (k > maxCount) {
                return ;
            }
            if (k % n == j) {
                fmt.Println(j);
                chTicket <- k+1
            } else {
                chTicket <- k
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
