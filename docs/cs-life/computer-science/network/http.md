# 图解http

粗略读了一下 <<图解http>>这本书  摘抄了部分内容

## https简单流程

1. client先请求server
2. server返回数字证书
3. client使用CA机构的颁发的公钥对数字证书进行解密，然后通过摘要算法计算出的值和数字签名进行验证，相等则通过
4. client生成session_key, 并且用上一步解出来的公钥进行加密传送给server
5. server根据私钥去解 session_key, 然后就可以对要发送的内容使用session_key进行加解密了

### 数字证书

- 数字证书我的理解是有四个重要的组成，公钥，非对称加密算法etc...摘要算法，摘要值
    * 客户端公钥进行解密一个东西，然后利用摘要算法计算出摘要值和数字证书里面的摘要值进行比对
- [数字签名、数字证书与HTTPS是什么关系](https://www.zhihu.com/question/52493697/answer/130903797)

### 数字证书和数字签名的区别

- 首先要知道https是一个三方（client, server, CA机构）加解密的过程
- server对公钥申请证书, 先对公钥进行`摘要`算法(hash算法)，生成`数字签名`(如果公钥被篡改，那么hash值会变)
- CA机构使用私钥对server申请的公钥和数字签名进行加密即生成`数字证书`

## http

### http常用方法

常用的http方法有 `get` `post` `put` `delete` `head` `options`
 - post 传输实体(参数)
 - put 传输文件
 - options 获取服务端接受的方法

### http 1.0

http1.0是**建立一个http就用一个tcp连接**

### http1.1

 - 持久连接的特点是，只要任意一端没有明确提出断开连接，则保持TCP连接状态
 - 管道化技术，就是发送请求不用等响应回来，就可以继续发送请求，异步的体现

### 多部分对象集合

有两种形式
 - multipart/form-data
 - multipart/byteranges
报文起始是 `--filekey`  终止是`--filekey--`
部分内容请求头
 - Range 0-1000

### 状态码

- 200  ok
- 201  created
- 204  no content
- 206  partial content
- 301  move permanently永久
- 302  found 临时，保存的书签还是最原始的
- 303  see other
- 304  not modify 
- 400  bad request
- 401  unauthorized 未认证
- 403  forbidden 资源有，没权限
- 404  not found
- 500  internal server error
- 503  service unavailable

### header部分字段

header有四种，通用header，请求header，响应header，实体header

**cache-control**

- no cache 客户端不要过期数据，但是代理服务器可以缓存，只是每次请求时候，代理服务器去检验一下自身缓存是否需要更新

**connection**

- 控制不在转发给代理的字段，减少传输数据
- 管理持久连接

**accept**

- 客户端能接收的文件类型

**host**

确定是一台物理机中确定的那个虚拟服务器

**if-match**

比较客户端和服务端的etag值(猜测是文件更新需要用到

**if-range**

如果成功，返回分片，不成功，返回全部内容。

**accept-ranges**

如果value 为bytes服务端可以接受分片

**server**

服务端信息。

**location**

跳转到value(url更新 状态码为30X redirect

## cookie

服务端向客户端的响应报文的头部有set_cookie字段，客户端拿到后，存起来，下次发送的时候，就带上cookie字段

- 服务端set-cookie
- 客户端cookie
- httponly是指，js不能去读取cookie

## websocket

全双工，服务端不用等客户端就可以推送

## web攻击

 - 表单处本身是form，里面添加一些js，导致action地址转向攻击者
 - js去获取cookie并且发送
 - sql注入 and 1=1
 - 调用shell命令去获取一些权限并且发送
 - header改写
 - 重定向

## http client

- [http client](https://blog.csdn.net/yi_master/article/details/80595372)
