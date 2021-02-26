# sql练习

## Table定义

1.学生表

Student(SId,Sname,Sage,Ssex)

SId 学生编号,Sname 学生姓名,Sage 出生年月,Ssex 学生性别

2.课程表

Course(CId,Cname,TId)

CId 课程编号,Cname 课程名称,TId 教师编号

3.教师表

Teacher(TId,Tname)

TId 教师编号,Tname 教师姓名

4.成绩表

SC(SId,CId,score)

SId 学生编号,CId 课程编号,score 分数

## 01. 查询课程01比课程02成绩高的学生姓名及课程分数

```sql
select c1.name, c1.score, c2.score
from (
    select s.Sname as name, sc.CId, sc.score
    from Student as s, SC as sc
    where sc.CId = "01" and sc.SID = s.SId
) as c1, (
    select s.Sname as name, sc.CId, sc.score
    from Student as s, SC as sc
    where sc.CId = "02" and sc.SID = s.SId
) as c2
where c1.score > c2.score and c1.name = c2.name;
```

## 02. 查询同时存在课程01和课程02的情况

```sql
select S1.name
from (
    select s.Sname as name, sc.CId, sc.score
    from Student as s, SC as sc
    where sc.CId = "01" and sc.SID = s.SId
) as S1, (
    select s.Sname as name, sc.CId, sc.score
    from Student as s, SC as sc
    where sc.CId = "02" and sc.SID = s.SId    
) as S2
where S1.name = S2.name;
```

## 03. 查询存在课程01,但不一定存在课程02的情况

使用left join
```sql
select *
from (
    select * from SC as sc where sc.CId = "01"
) as S1
left join (
    select * from SC as sc where sc.CId = "02"
) as S2
on S1.SID = S2.SID;
```

## 04. 查询存在课程02,但不一定存在课程01的情况

使用right join
```sql
select *
from (
    select * from SC as sc where sc.CId = "01"
) as S1
right join (
    select * from SC as sc where sc.CId = "02"
) as S2
on S1.SID = S2.SID;
```

## table schema

Student

```sql
create table Student(SId varchar(10),Sname varchar(16),Sage datetime,Ssex varchar(10)) CHARSET=UTF8 ENGINE=InnoDB;
insert into Student values('01' , '01' , '1990-01-01' , '0');
insert into Student values('02' , '02' , '1990-12-21' , '0');
insert into Student values('03' , '03' , '1990-12-20' , '1');
insert into Student values('04' , '04' , '1990-12-06' , '1');
insert into Student values('05' , '05' , '1991-12-01' , '0');
insert into Student values('06' , '06' , '1992-01-01' , '0');
insert into Student values('07' , '07' , '1989-01-01' , '0');
insert into Student values('09' , '09' , '2017-12-20' , '0');
insert into Student values('10' , '10' , '2017-12-25' , '0');
insert into Student values('11' , '11' , '2012-06-06' , '0');
insert into Student values('12' , '12' , '2013-06-13' , '0');
insert into Student values('13' , '13' , '2014-06-01' , '0');
```

Course 

```sql
create table Course(CId varchar(10),Cname nvarchar(10),TId varchar(10));
insert into Course values('01' , 'Chinese' , '02');
insert into Course values('02' , 'Math' , '01');
insert into Course values('03' , 'English' , '03');
```

Teacher

```sql
create table Teacher(TId varchar(10),Tname varchar(10));
insert into Teacher values('01' , 'Zhang san');
insert into Teacher values('02' , 'Li si');
insert into Teacher values('03' , 'Wang wu');
```

SC

```sql
create table SC(SId varchar(10),CId varchar(10),score decimal(18,1));
insert into SC values('01' , '01' , 80);
insert into SC values('01' , '02' , 90);
insert into SC values('01' , '03' , 99);
insert into SC values('02' , '01' , 70);
insert into SC values('02' , '02' , 60);
insert into SC values('02' , '03' , 80);
insert into SC values('03' , '01' , 80);
insert into SC values('03' , '02' , 80);
insert into SC values('03' , '03' , 80);
insert into SC values('04' , '01' , 50);
insert into SC values('04' , '02' , 30);
insert into SC values('04' , '03' , 20);
insert into SC values('05' , '01' , 76);
insert into SC values('05' , '02' , 87);
insert into SC values('06' , '01' , 31);
insert into SC values('06' , '03' , 34);
insert into SC values('07' , '02' , 89);
insert into SC values('07' , '03' , 98);
```