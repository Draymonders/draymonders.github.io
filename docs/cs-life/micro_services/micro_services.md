# 微服务

## 概览



kit：一个微服务的基础库（框架）
service：业务代码 + kit 依赖 + 第三方依赖组成的业务微服务
RPC + message queue：轻量级通讯

本质上等同于，多个微服务组合（compose）完成了一个完整的用户场景（usecase）。

每个服务独享自身的数据存储设施（缓存，数据库等），不像传统应用共享一个缓存和数据库，这样有利于服务的独立性，隔离相关干扰。

### 可用性 & 兼容性设计

- 隔离
- 超时控制
- 负载保护 
- 限流
- 降级
- 重试
- 负载均衡



## 微服务设计

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

## 多集群 & 多租户


## 引用

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

