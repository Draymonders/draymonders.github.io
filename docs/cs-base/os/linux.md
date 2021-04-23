# Linux基础使用

## 文件及目录管理

- 目录/文件 的创建、删除、查询
    * mkdir, rm, cp, mv, `ln -s`软连接, ln硬连接
- 文件的查询和检索
    * find, locate
- 查看文件内容
    * cat, vi, tail, more
- 将标准输出和标准错误重定向到同一文件
    * 2>&1
- 找一个目录下的所有的java文件 
    * `find . -maxdepth 2 -name "*.java"`
- 将docker log 追加到文件中 
    * `docker logs ${containerId} | less | tee -a service.log`

## 工作相关

- echo 
    * echo "xxx" 会带上回车
    * echo -n "xxx" 不会带回车
- tee
    * tee -a xxx.log （append文件尾部）
- watch 
    * 观察命令执行结果的变化
- time xxxx 
    * 命令xxx的耗时
- grep 
    * -i 是 ignore case
    * -A after
    * -B before
- date
    * date "+%Y%m%d-%H%M%S"
- cut
    * echo -n "122" | md5sum | cut -d " " -f1
- tr
    * echo -n "12 2" | tr ' ' ':'
- export & source
    * 变量少的情况下，可以显示得export声明环境变量，不过它生效仅限于当前的shell 
    * 变量多的情况下 可以写到一个文件里面，然后source
- set
    * set -x （用于 shell debug）
- envsubst
- ethtool
- df 
    * df -h
- lsof
    * sudo lsof -i:3306
- Linux 程序后台运行的方法
    * set pid, nohup, &

### 场景

- 获取当前目录下所有不同的文件后缀
    * ls | cut -d'.' -f2 | sort | uniq
- Docker相关
    * docker images | grep none | awk '{ print $3 }' | xargs -r docker rmi
    * docker ps -a | awk '{ print $1 }' | grep -v "CONTAINER" | xargs -r docker rm -f 
- 停止某个应用程序
    * ps -aux | grep python3 | awk '{ print $2 }' | xargs kill -9
- 查看cpu信息
    * cat /proc/cpuinfo | grep name | cut -d: -f 2 | uniq -c  

## 文本处理

- 查询socket状态 
    * `sudo netstat -autpn | awk '/^tcp/ { ++S[$6] } END { for(a in S) print a,S[a] }'`
- 取linux文件第4行，有用\t分割的若干个ip地址。统计出来出现次数最多的前四个。
    * 获取ip地址有两种思路
        * `cat test | head -4 | tail -1 | xargs -d'\t' -r -i echo {}`
        * `sed -n 4p test | sed "s#\t#\n#g"` (推荐)
    * 排序获取topK
        * `sort -n | uniq -c | sort -r -n -k1 | head -4`
- 形如“a=xx||b=yy||c=zz”的log，求b>5
    * `sed 's/||/\ /g' temp1.log | awk '{ split($2,a,"="); if (a[2]>5) print $0 }'`

## 截屏

- Linux截图快捷键
    * `ctrl shift PrtSc`
