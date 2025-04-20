# 文章

- [Linux DNS网络解析](https://cloud.tencent.com/developer/article/1083206)
- [nslookup命令](https://cloud.tencent.com/developer/article/1083201)
- [dig命令](https://cloud.tencent.com/developer/article/1083192)

命令使用如下
```shell
nslookup www.baidu.com

dig -trace sturnus.yitu-inc.com
dig -x 10.60.24.37
```

## k8s dns

配置`k8s` pod 看到了`/etc/resolv.conf`

内容如下

```
nameserver 10.96.0.10
search default.svc.cluster.local svc.cluster.local cluster.local
options ndots:5
```

关键词解释
```
nameserver    //定义DNS服务器的IP地址
domain       //定义本地域名
search        //定义域名的搜索列表
sortlist        //对返回的域名进行排序
```

domian:声明主机在那个域 search
表示如果没有给FQDN(完整域名:port)的情况下，比如只给主机名`redis-server`, resolver要去那个域查询主机

## 查找顺序

一般查询的顺序是先看自己的hosts文件，如果查不到就像所连接的DNS服务器去查，也就是nameserver，DNS会根据你所提供的域名来查对应的服务器IP，如果查到了就会返回结果。