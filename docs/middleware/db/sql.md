# SQL训练

## 部署mysql

```sql
docker run -it --name mysql -e MYSQL_ROOT_PASSWORD=123456 -p 3306:3306 -d mysql/mysql-server

docker exec -it ${containerName} bash

create database demo;

create table user ( id bigint primary key auto_increment, name varchar(15));

insert into user(`name`) values ('a'), ('b');
```


## distinct

原始数据

```sql

mysql> select * from user;
+----+------+
| id | name |
+----+------+
|  1 | a    |
|  2 | b    |
|  3 | c    |
|  4 | a    |
+----+------+
4 rows in set (0.00 sec)
```

distinct一个字段

```sql
mysql> select distinct name from user;
+------+
| name |
+------+
| a    |
| b    |
| c    |
+------+
3 rows in set (0.00 sec)
```

distinct 不加括号，多个字段

```sql
mysql> select distinct name,id from user;
+------+----+
| name | id |
+------+----+
| a    |  1 |
| b    |  2 |
| c    |  3 |
| a    |  4 |
+------+----+
4 rows in set (0.00 sec)
```

## rank 函数

原始数据

```sql
mysql> select * from user;
+----+------+
| id | name |
+----+------+
|  1 | a    |
|  2 | b    |
|  3 | c    |
|  4 | a    |
+----+------+
4 rows in set (0.00 sec)
```

rank 操作

```

mysql> select
    -> name,
    -> rank() over ( order by name asc) rk
    -> from
    -> user;
+------+----+
| name | rk |
+------+----+
| a    |  1 |
| a    |  1 |
| b    |  3 |
| c    |  4 |
+------+----+
4 rows in set (0.00 sec)
```

rank操作
```sql
mysql> select id, name,  rank() over ( partition by id % 2 order by name asc) rk from  user;
+----+------+----+
| id | name | rk |
+----+------+----+
|  4 | a    |  1 |
|  2 | b    |  2 |
|  1 | a    |  1 |
|  3 | c    |  2 |
+----+------+----+
4 rows in set (0.00 sec)
```