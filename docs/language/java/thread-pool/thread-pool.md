# 线程池

线程池的本质是对任务和线程的管理，而做到这一点最关键的思想就是将**任务和线程**两者解耦，不让两者直接关联，才可以做后续的分配工作。

线程池中是以生产者消费者模式，通过一个阻塞队列来实现的。阻塞队列缓存任务，工作线程从阻塞队列中获取任务。

## 为什么先corePoolSize, 然后队列，最后maxPoolSize

线程池创建线程需要获取mainlock这个全局锁，影响并发效率，阻塞队列可以很好的缓冲。

另外一方面，如果新任务的到达速率超过了线程池的处理速率，那么新到来的请求将累加起来，这样的话将耗尽资源。