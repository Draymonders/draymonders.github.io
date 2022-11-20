# 哨兵

## 轮询规则

(条件1 = true && 条件2 = false) || (条件3 = false || 条件4 = true)

条件是通过并发加载的。

理论上 条件4=true 加载完，整个规则表达式就为true，就可以直接返回上游了，不需要继续等待条件1，条件2，条件3的情况

这里是通过加了个 unkown 的运算符，

unkown && unkown = unkown
unkown && true = unkown
unkown || true = true
unkown || false = unkown