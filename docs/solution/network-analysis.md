# 网络故障分析

## IP ping不通

1. ping 127.0.0.1，如果ping不通说明本机设置的TCP/IP协议有问题。ping该地址不经过网卡，仅仅是软件层面。
2. ping 本机IP地址，ping本机IP其实是从驱动到网卡。如果此时ping不通，则表示网卡驱动有问题，或者硬件有问题。
3. ping 网关（所谓网关，就是连接到另一个网络的“关卡”，一般为离我们最近的路由器）；可以使用`ipconfig/ifconfig`查看；若ping不通，则为主机到路由器之间的网络故障。
4. ping 目的IP，若ping不通，应该就是路由器到目的主机的网络存在问题。

## 长/短链接

- http client中有一个参数是`maxPerRoute`，作用是：限制每个`Route`(即server的ip+port)的最大连接数。

- 当client到server建立`Route`的连接数超过默认设置(默认是2)，会发生如下报错:

```java
java.net.NoRouteToHostException: Cannot assign requested address (Address not available)
```

- 调大了 perRoute 参数(10000)后，发现只能发送成功10000个请求
- 用`netstat -autpn | grep tcp | grep ${host}` 发现有大量的`TIME_WAIT`状态，推断是客户端都是短连接，发送请求后就关闭了(尽管使用了连接池)。
- 将 KeepAlive参数改为-1， 重新发请求，仍然有大量的`TIME_WAIT`状态。
- 咨询拓哥，说长连接基本是占用固定的那几个端口，并且都是`ESTABLISHED`状态，使用`watch`观察，发现开启了`KeepAlive`后，`ESTABLISHED`的端口号仍然不固定。
- 后拓哥做了实验，跑KV场景，链接就是会复用的，跑nginx场景，链接没有复用，因此推断 KeepAlive 服务端也要处理，如果不做处理，客户端单开 KeepAlive 是没有效果的。

### 总结

1. 长连接保持处理是通过四元组来判断的 (client_ip，client_port，server_ip，server_port)。
2. 若不用链接池和长连接，在高并发短连接的TCP服务器上，当服务器处理完请求后立刻主动正常关闭连接。
    - 这个场景下会出现大量socket处于TIME_WAIT状态。如果客户端的并发量持续很高，此时部分客户端就会显示连接不上。

## TimeWait / CloseWait

### TimeWait

一般是客户端一方，短时间发送了大量的短连接（建立了链接又释放掉）

解决方法: 调参 or 连接池

### CloseWait

一般是服务端一方，没有主动关闭链接 or 服务处理的确很慢

解决方法: 先黑盒审查后白盒审查

## syn flood攻击

- 短时间高并发发出tcp syn包的源ip地址被强制随机造假
    * 服务端接收到syn后，迅速为每个syn包分配一个incomplete队列，其中的socket都是暂时没有完成连接的syn_rcvd状态socket, 这个队列迅速满了，消耗了服务器的资源，但又无法正确建立tcp三次握手连接（服务端的syn/ack根据之前的syn包找到的是错误的客户端IP地址，所以也就无法收到客户端的第三次握手ack包），资源耗尽，从而导致服务器无法响应正常的syn包。
- 从syn flood攻击可以得出讨论 --> tcp两次握手是万万不行的。
    * 轻易相信syn包就建立连接的两次握手，很容易让服务端因资源耗尽而无法提供服务。
- 预防syn flood攻击
    * 在RFC4987中给出了答案。 在syn到来的时候，服务端并不会为这个syn包分配资源，免得受骗上当。只有当服务端自己的syn/ack收到客户端的ack后，才会真正分配资源，此时才完成正常的连接。 由此可见，此时syn flood失效。
    * `cat  /proc/sys/net/ipv4/tcp_syncookies`，如果为1，表示开启，如果为0，表示关闭。
