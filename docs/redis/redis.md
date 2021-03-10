# Redis

## 分布式锁

`ex`表示`expire`，`nx`表示`if not exist`
```shell
set redis-key clientId ex 5 nx
```

