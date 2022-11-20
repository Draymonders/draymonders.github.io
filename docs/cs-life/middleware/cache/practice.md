# Cache 踩坑

## cache 和 db 不一致

背景：同步品牌资质表 t_brand 数据到 cache

通路是 mysql -> binlog -> redis

| key | value | 
| --- | --- | 
| relate_id | qualification_id | 


有一种场景，（用户店铺升级，并且不复用资质，仍然上传相同的商标注册证）

命中了同一个relate_id，生成了另外一个 qualification_id

> binlog 是乱序的（同一行的binlog可以保证顺序，不同行的不能保证顺序性）

binlog 存在了 先新增id=2，后删除id=1。

缓存变更后按照binlog顺序先插入了  `666 -> 2444`，后进行了删除。

此时：db数据如下：用户有一个资质id=2444, relate_id=666
但是缓存里 `666 -> null`

| id |  qualification_id | relate_id | create_time | update_time | deleted_time | 
| --- | --- | --- | --- | --- | --- |
| 1 |  2333 | 666 | "2022-08-22T10:00:00" | "2022-08-22T10:30:00" | "2022-08-22T10:30:00" | 
| 2 |  2444 | 666 | "2022-08-22T10:30:00" | "2022-08-22T10:30:00" | null | 