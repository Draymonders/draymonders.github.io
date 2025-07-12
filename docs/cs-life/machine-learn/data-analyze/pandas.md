# pandas从入门到放弃

## Create/Read/Write

Create 

```python3
data = pd.DataFrame({"v1": [1,2,3], "v2": [4,5,6]})
```

Read

```python
data = pd.read_csv("xxx.csv")
```

Write 

```python
data.to_csv("xxx.csv")
```


## Index/Select/Assign

Index

- iloc: 基于整数位置进行数据选择
- loc: 基于标签（Label）索引进行数据选择


Select

```python
top_oceania_wines = reviews.loc[
    (reviews.country.isin(['Australia', 'New Zealand'])) & 
    (reviews.country.isin(['Australia', 'New Zealand'])) & (reviews.points >= 95) (reviews.points >= 95) 
]
```

Assign

```python
reviews['critic'] = 'everyone'
reviews['index_backwards'] = range(len(reviews), 0, -1)
```

## Summary/Map

Summary

```python
reviews.points.mean()   # 平均值
reviews.points.median() # 中位数
reviews.taster_name.unique() # 去重后的数据 set<tasker_name>
reviews.taster_name.value_counts() # 去重数据 以及出现的次数 map<tasker_name, int>
df.loc['A'].idxmax() # A列最大值的索引idx  (lambda df : min(df['A'].idx) => idx)
```

Map

- map：主要用于Series对象，可以方便地进行元素级别的转换，特别是基于映射关系（如字典）。
- apply：更为灵活，可用于DataFrame和Series对象，既能进行元素级别的转换，也能对整行或整列进行操作。

```python
n_trop = reviews.description.map(lambda desc: "tropical" in desc).sum()
df['A'] = df['A'].apply(lambda row: row['A'] + 5, axis=1)
```

需要注意的是，apply函数有个重要的参数 `axis`

- axis=0：默认值，表示对每列（列）应用函数。
- axis=1：表示对每行（行）应用函数。较为常用

```python
df = pd.DataFrame({
    'A': [1, 2, 3],
    'B': [10, 20, 30],
    'C': [100, 200, 300]
})
col_sum = df.apply(sum, axis=0) 
print(col_sum)
# 输出:
# A      6
# B     60
# C    600
# dtype: int64

row_sum = df.apply(sum, axis=1)
print(row_sum)
# 输出:
# 0    111
# 1    222
# 2    333
# dtype: int64
```


## Group/Sort

Group

```python
reviews.groupby('taster').size() # group by taster count(1)
reviews.groupby(["variety"]).price.agg([min, max]) # group by variety min(price), max(price)
```


Sort

```python
reviews.groupby('price').points.max().sort_index(ascending=True)
reviews.groupby(["variety"]).price.agg([min, max]).sort_values(by=["min", "max"], ascending=False)
```

## DataType/Missing Value

DataType

```python
reviews.points.dtype
reviews.points.astype('str')
```

MissingValue

```python
reviews[pd.isnull(reviews.price)]
reviews.region_1.fillna("Unknown")
```

## 数据预处理

```python3
import pandas as pd

a = [1,2,3,1,2]
b = [20,30,40,20,None]
c = [1749956606, 1749956605, 1749956604, 1749956606, 1749956602]
d = ["F", "M", "F", "F", "M"]
df = pd.DataFrame({"uid": a, "age": b, "ts": c, "gender": d}, columns=["uid", "age", "ts", "gender"])

# 去缺失值
df = df.dropna()
# 去重
df = df.drop_duplicates()

# 挑选数值列
cols = df.select_dtypes(include=['number']).columns
for col in cols:
    col_name = str(col)
    if col_name in ["uid", "ts"]:
        continue
    df[f"{col_name}_mean"] = df[col].mean()

# 时间戳
df['time'] = pd.to_datetime(df['ts'], unit='s')

# 类别处理
cols = df.select_dtypes(include=['object']).columns
df = pd.get_dummies(df, columns=cols, drop_first=True) # drop_first 是否删除第一个类别
```