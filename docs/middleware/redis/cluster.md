# Redis 集群

## 集群搭建

- 准备 vmware 和 ubuntu-server 
- 修改hostname
    * `sudo hostnamectl set-hostname ${hostname}`
- 安装vim和ssh
    * `apt-get install -y vim ssh`
- 修改hosts文件

```
$ vim /etc/hosts

192.168.222.128 node1
192.168.222.129 node2
192.168.222.130 node3
```

后面照着文档操作:

https://www.cnblogs.com/Yunya-Cnblogs/p/14608937.html