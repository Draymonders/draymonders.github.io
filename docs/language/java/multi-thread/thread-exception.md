# 线程运行异常

可以使用如下代码，对线程存在的异常进行try catch

```java
Thread thread = new Thread(new Task());
thread.setUncaughtExceptionHandler(new ExceptionHandler());
```