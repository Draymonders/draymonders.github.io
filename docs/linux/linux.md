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

### 文本处理

- 查询socket状态 
    * `sudo netstat -autpn | awk '/^tcp/ { ++S[$6] } END { for(a in S) print a,S[a] }'`
- 取linux文件第4行，有用\t分割的若干个ip地址。统计出来出现次数最多的前四个。
    * `cat test | head -4 | tail -1 | xargs -d'\t' -r -i echo {} | sort -n | uniq -c | sort -r -k1 | head -4`
    * `sed -n 4p test | sed "s#\t#\n#g" | sort -n | uniq -c | sort -r -k1 | head -4` (推荐)

## 截屏

- Linux截图快捷键
    * `ctrl shift PrtSc`