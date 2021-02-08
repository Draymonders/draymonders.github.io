- OSI七层模型
    * 物理层，传输比特流`bit`
    * 数据链路层，传输局域网内的帧`frame`，有差错校验，流量控制
    * 路由层(ip)，提供网络设备间的路由功能，数据报 `Packet` or `Datagram`
    * 传输层(TCP / UDP)，提供通信子网和资源子网的交互，传输段`segment`
    * 会话层，提供资源间的会话管理和控制
    * 表示层，数据格式的转换，加解密
    * 应用层，提供计算机访问网络的接口，供用户使用，消息`message`
- [TCP/IP](https://zhuanlan.zhihu.com/p/266505297)
    * TCP是一个**面向连接**的、**可靠**的、基于**字节流**的传输层协议。而 UDP是一个面向无连接的传输层协议。
- 三次握手
    * 首先，server端保持`LISTEN`状态
    * client端 发送 SYN, seq=x的请求后处于`SYN-SEND`
    * server端接收到，回传client SYN, ACK，seq=y, ack=x+1的请求后由`LISTEN`处于`SYN-RECEIVED`
    * client端收到后，回传ACK,seq=x+1,ack=y+1请求后进入`ESTABLISHED`
    * server端接收到，也进入`ESTABLISHED`
- 为什么不可以是两次握手
    * 根本原因: 无法确认客户端的接收能力。
    * 防止之前导致丢的链接建立的报文，在client与server已经关闭的情况下，又建立了链接，造成资源浪费
- 为什么不可以是四次握手
    * 三次握手的目的是确认双方 发送和 接收的能力，那四次握手可以嘛？当然可以，100 次都可以。但为了解决问题，三次就足够了，再多用处就不大了。
- 如何应对 SYN Flood 攻击
    * 增加 SYN 连接，也就是增加半连接队列的容量。
    * 减少 SYN + ACK 重试次数，避免大量的超时重发。
    * 利用 SYN Cookie 技术，在服务端接收到 SYN后不立即分配连接资源，而是根据这个 SYN计算出一个Cookie，连同第二次握手回复给客户端，在客户端回复 ACK的时候带上这个 Cookie值，服务端验证 Cookie 合法之后才分配连接资源。
- 四次挥手
    * 首先，client和server都是`EATABLISHED` (在这里，我们称主动关闭的一方叫client)
    * client 发送 FIN, client 进入`FIN-WAIT1`
    * server 收到后，发送 ACK, server进入`CLOSE_WAIT` 
    * client 收到后, 进入`FIN-WAIT2`
    * server处理完剩余的数据后，发送 FIN 和 ACK，进入`LAST-ACk`
    * client收到后，发送ACK，进入`TIME_WAIT`，过2MSL进入`CLOSED`
    * server收到后，也进入`CLOSED`
- 大量 CLOSE_WAIT 状态分析
    * 大概率是**服务端处理较慢，资源迟迟释放不掉**
    * 如果服务端在处理过程中，耗时较长，（进入死循环、等锁、下游服务响应慢等），假设20s才返回，但是客户端明显不可能等那么久，一般5-10s就超时了。超时了，客户端发起fin，服务器回ack，此时服务器端应该就是close_wait。
- 大量 TIME_WAIT 状态分析
    * 客户端建立链接较多, 短连接 -> 长连接
* 为什么要2MSL(`Maximum Segment Lifetime`，报文最大生存时间)
    * 1 个 MSL 确保四次挥手中主动关闭方最后的 ACK 报文最终能达到对端
    * 1 个 MSL 确保对端没有收到 ACK 重传的 FIN 报文可以到达
- 如何标识唯一标识一个连接
    * 四元组 (源ip, 目的ip, 源端口，目的端口)
- TCP 的流量控制
    - 主要的方式就是接收方返回的 ACK 中会包含自己的接收窗口的大小，并且利用大小来控制发送方的数据发送。
- TCP 的拥塞控制
    - 慢启动(到阈值前，从1到阈值，翻倍上升)
    - 拥塞避免(到达阈值后，每次加1)
    - 快速重传(当收到重复的ACK三次，立马重传数据)
    - 快恢复