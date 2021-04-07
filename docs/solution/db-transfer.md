# 数据迁移

## MySQL迁移

- `${host}`为主机
- `${user}`为用户名
- `${database}`为数据库

### 导出

#### 只导表结构

```sql
mysqldump -h ${host} -u ${user} -p -R -d -B ${database} > ~/create_table.sql
```

#### 只导表数据

```sql
mysqldump -h ${host} -u ${user} -p -R -t -B ${database} > ~/data.sql
```

### 导入

```sql
mysql -h ${host} -u ${user} -p ${database} < create_table.sql
mysql -h ${host} -u ${user} -p ${database} < data.sql
```

## MongoDB迁移

- `${host}`为主机
- `${port}`为端口
- `${user}`为用户名
- `${password}`为密码
- `${database}`为数据库

### 导出

```
mongodump -h ${host} --port ${port} -d ${database} --authenticationDatabase admin -u ${user} -p${passwrod} -o ./
```

### 导入

```
mongorestore -h ${host} --port ${port} -d ${database} --drop ./
```