# Tcc

是公司内的一个配置中心（业务代码里面各种tcc.Get()，因为有的需求会做灰度设计）

- 适合**读多写少**

## 设计

tcc那边儿每个配置都维护了两个key，一个是meta的key，一个是data的key

meta里面存了version字段

tccClient 会在业务实例本地缓存 配置的数据+版本

每次访问调用tcc的时候，判断tcc的server version和本地缓存version是否一致，如果一致直接走缓存

不一致的话，拉取server的data，然后再反序列化之类

流程图如下：

![bbsKfO.md.png](https://s1.ax1x.com/2022/03/13/bbsKfO.md.png)
