# 微服务

## 概览

kit：一个微服务的基础库（框架）

service：业务代码 + kit 依赖 + 第三方依赖组成的业务微服务

RPC + message queue：轻量级通讯

本质上等同于，多个微服务组合（compose）完成了一个完整的用户场景（usecase）。

每个服务独享自身的数据存储设施（缓存，数据库等），不像传统应用共享一个缓存和数据库，这样有利于服务的独立性，隔离相关干扰。

## 可用性 & 兼容性设计

- 隔离
- 超时控制
- 负载保护 
- 限流
- 降级
- 重试
- 负载均衡


## 微服务设计

### 链路交互

移动端 / 前端 -> Load Balancer -> API Gateway -> HTTP Server -> Microservices

- Load Balancer 负责负载均衡
- API Gateway 负责横切面的逻辑，比如安全认证，日志监控，限流熔断等
- HTTP Server 负责对外接口数据返回
- Microservices 业务逻辑编排

### Microservices 安全

对于服务内部，一般要区分身份认证和授权。

认证：服务A 是否可访问服务B
授权：服务A 是否可访问服务B的某些具体方法（比如修改抖音账户的信息，是个高危操作，需要加强授权管理）


- Full Trust
- Half Trust
- Zero Trust （上游服务与下游服务采用类似HTTPS加密方式进行通信）

## grpc & 服务发现

### grpc

- 服务上线时，旧实例先注销注册中心，暂停新的链接，正常链接执行完，再停掉容器

### 注册中心

<b>注册中心尽可能保证脏实例，也不要没有实例信息，没有实例信息的话，会发生大的故障。</b>

- consumer会缓存部分provider实例地址，在注册中心大面积故障的时候，暂停所有的服务发布，线上也不会有太大的影响。
- 注册中心，保证高可用。
- 不好的是，节点同步信息是全量同步的，写压力较大。可以进行读写分离/只更新部分中心/数据shard。
- pull模型 心跳比较多，push模型？

## 多集群 & 多租户

### 染色发布

染色发布，也即我们的多环境发布。

部署方式：

1. k8s部署容器，带上标签“boe_bing”
2. 服务实例启动时，加载环境变量“env: boe_bing”
3. 服务注册到注册中心，meta信息填上env，如下所示

10.xx.yy.zz  8888  {u'cluster': u'default', u'env': u'boe_bing'}

访问方式：

1. 访问者带上http header， "x-env: boe_bing"
2. http框架捕获到 header的“x-env”值，设置到ctx上
3. 访问下游服务时，由于ctx带有“x-env”特殊变量，因此负载均衡优先选择 下游服务meta信息匹配的，如果没找到，则fallback到 prod 环境
4. ctx 透传，网络传输时，将 "x-env" 序列化到 protocal 协议的header or body里（带上该信息）
5. rpc框架收到请求后，解析 protocal 协议，拿到“x-env”值，设置到ctx （这一步logId，traceId也是类似的做法）

### 多集群

多集群，意味着存储/缓存也是隔离的，互不影响。

（这里是指单机房内部的策略）

- 为了防止线上某个集群出问题，流量需要调度到其他集群，切换的时候会导致其他集群的缓存命中率变低
    - 所以实例默认选择链接所有集群
- 但链接了所有集群，会导致连接数变多，业务实例低峰期也占用了大量的链接，cpu使用率比较高（service consumer在往service provider 发送心跳），又使用了子集算法，选部分实例去链接。

## 引用 （待看）

- https://microservices.io/index.html
- https://blog.csdn.net/mindfloating/article/details/51221780


- https://www.cnblogs.com/dadadechengzi/p/9373069.html
- https://www.cnblogs.com/viaiu/archive/2018/11/24/10011376.html
- https://www.cnblogs.com/lfs2640666960/p/9543096.html
- https://mp.weixin.qq.com/s/L6OKJK1ev1FyVDu03CQ0OA
- https://www.bookstack.cn/read/API-design-guide/API-design-guide-02-面向资源的设计.md
- https://www.programmableweb.com/news/how-to-design-great-apis-api-first-design-and-raml/how-to/2015/07/10
- http://www.dockone.io/article/394
- https://www.jianshu.com/p/3c7a0e81451a
- https://www.jianshu.com/p/6e539caf662d
- https://my.oschina.net/CraneHe/blog/703173
- https://my.oschina.net/CraneHe/blog/703169
- https://my.oschina.net/CraneHe/blog/703160

