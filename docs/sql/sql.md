# 关键字

写 sql语句 `distinct`, `order by`, `between`, `union`, `group by`, `having`, `limit`, `offset`

# 

```
ID Name City Address
1 包彦钦 北京 北京市东四北大街520号
2 王洪涛 北京 北京市西单北大街151号
3 张立涛 大连 大连市西岗区新开路69号
4 佘高峰 济南 山东省济南市泺文路50号
5 徐俊 上海 上海市静安区南阳路46号
6 张忠飞 上海 上海市肇嘉浜路414号
7 徐俊 上海 上海市乳山路150号
```
返回表中有两名以上学员的城市的所有学员信息

```sql
select * from Table1 where city in (
    select city from Table1 
    group by city 
    having count(*) >= 2
);
```
