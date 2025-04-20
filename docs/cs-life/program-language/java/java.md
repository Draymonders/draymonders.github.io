# 问题汇总

- 接口跟抽象类的区别
    - 接口定义行为
    - 抽象类为了复用, 相同的东西抽象类实现，不同的东西子类实现
- BIO，[NIO](https://tech.meituan.com/2016/11/04/nio.html)
- 线程池
    - corePoolSize, maxPoolSize, keepAliveTime, keepAliveUnit, runnableQueue, ThreadFactory, RejectHandler
    * 未达到corePoolSize先创建线程，然后塞到runnableQueue里，队列满了，继续创建线程到maxPoolSize，达到后执行rejectHandler