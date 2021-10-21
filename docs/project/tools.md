# 提效工具

## 常用工具

- [Jetbrains软件试用](https://shimo.im/docs/WY3hd8Jt8KHgvVty/read)
- zsh, tmux 
    - 常用的插件 `zsh-autosuggestions, autojump, zsh-syntax-highlighting`
- uTools
    - 常用插件：时间格式
- [画图工具 draw.io](https://github.com/jgraph/drawio-desktop/releases)
- [Mongo client: Robo3t](https://robomongo.org/download)
- [Redis client: Another.Redis](https://github.com/qishibo/AnotherRedisDesktopManager)
- [Kafka client: Kafka Tool 2](https://www.kafkatool.com/) 
- Mysql Client
    - MyCli
    - [MySQL client: dbeaver](https://github.com/dbeaver/dbeaver) 
    - [DataGrip](https://www.jetbrains.com/datagrip/) 
- sdkman (linux)
- docker, docker compose, kubernetes


## 二进制文件内容查看

Sublime

- 快捷键`Command+Shift+P`，选择`Package Control`: 
- Install Package安装插件搜索`HexViewer`并等待安装成功
- 打开要查看的二进制文件，这个时候还是没有以HexViewer模式打开的按下快捷键`Command+Shift+P`，搜索并选择`HexViewer`
- `Toggle Hex View`，回车骚等片刻后即可

## 网络代理

### 正向代理

场景：

在公司我想通过通过访问本地2208端口（consul暴露的端口），将请求打到开发机的2208端口（consul agent实际节点），在`本地`用下面的命令


```
alias ssh2dev="ssh -f -N -L 2280:127.0.0.1:2280 serverUser@serverIp"
```

### 反向代理

场景：

1. 公司内部有一台服务器1，ip地址为: 10.12.10.11，只有公司内部同一网段的设备才能访问
2. 公司外面有一台公网ip的服务器2，ip地址为: 45.32.127.32，所有人都可以访问

假如我们需要公司外部的人也能访问服务器1需要怎么做呢？在`内网服务器`上执行如下命令

```
ssh -fNR 8000:localhost:80 root@45.32.127.32
```

这段命令的意思是把对服务器2的8000端口请求转发到服务器1的80端口，这样我们访问 http://45.32.127.32:8000 就相当于访问 http://10.12.10.11:80

还有一点非常重要，你需要在45.32.127.32这台服务器开启ssh一个配置（linux系统里面一般是在/etc/ssh/sshd_config文件）：

```
GatewayPorts yes
```