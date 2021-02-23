- 限流
    - 漏桶，请求先进入到漏桶里,漏桶以一定的速度出水，接口有响应速率
    - 令牌桶，每秒生产固定数量的令牌，处理请求需要先拿到令牌
    - 差异: 令牌桶能处理峰时流量
- 动态代理，JDK原生和cglib
    - 原生JDK是基于接口实现的, 实现`InvocationHandler`接口里的`invoke`方法，接着调用`Proxy.newProxyInstance`方法，传入类加载，接口，以及需要代理的对象
    - cglib是基于`继承`(字节码增强技术)实现的，实现`MethodInterceptor`接口里的`intercept`方法,接着`new Enhancer()`并且`setSuperclass()`和`setCallback`
- TCP/IP协议栈
- IPV4(4个字节), IPV6(16个字节)
- HTTPS简述
- TCP,UDP介绍,差别,UDP保证可靠性
- 红黑树,AVL对比,引申B,B+树(B+中间不存节点)
- closing 状态
- [dubbo 负载均衡算法](https://dubbo.apache.org/zh/docs/v2.7/dev/source/loadbalance/)
    - 加权随机算法
        * 比如权重`[1,2,3]`, 那么分为`[[0,1), [1,3), [3,6)]`, 随机6以内的数，落在哪个区间算哪个
        * warm up, 服务刚启动先降权，后满权
    - 加权最小连接数
        * 拿到最小连接数的节点组(可能会有多个最小连接数相同的节点), 然后节点组进行加权随机算法
    - 一致性hash算法
        * 将服务提供者映射到圆环上，并且引入虚拟节点(一个物理节点充当多个虚拟节点，目的是为了防止由于节点不够分散，导致大量请求落到了同一个节点上，而其他节点只会接收到了少量请求的情况)
        * ConsistentHashLoadBalance **不关心权重**
    - 加权轮询
        * 初版的代码: 求加权的和，每次调用产生一个序号(从0开始)，对加权的和取余，余数一直递减，捡到0对应的`invoker`即为将要调用的节点(问题在于如果加权的和很大，每次减一，效率过低)

- https流程
    * client先请求server
    * server返回数字证书
    * client使用CA机构的颁发的公钥对数字证书进行解密，然后通过摘要算法计算出的值和数字签名进行验证，相等则通过
    * client生成session_key, 并且用上一步解出来的公钥进行加密传送给server
    * server根据私钥去解 session_key, 然后就可以对要发送的内容使用session_key进行加解密了

- 数字签名，数字证书的区别
    * 首先要知道https是一个三方（client, server, CA机构）加解密的过程
    * server对公钥申请证书, 先对公钥进行`摘要`算法(hash算法)，生成`数字签名`(如果公钥被篡改，那么hash值会变)
    * CA机构使用私钥对server申请的公钥和数字签名进行加密即生成`数字证书`
- 分片大小
    * MTU 以太网最大支持的单帧 1500
    * MSS TCP支持的单分组 512
- TCP拆包和粘包
    * csv变量举例
