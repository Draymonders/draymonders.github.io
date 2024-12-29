# pandas从入门到放弃

## Create/Read/Write

Create 

```python3
data = pd.DataFrame({"v1": [1,2,3], "v2": [4,5,6]})
```

Read

```python3
data = pd.read_csv("xxx.csv")
```

Write 

```python3
data.to_csv("xxx.csv")
```


## Index/Select/Assign

Index

- iloc: 基于整数位置进行数据选择
- loc: 基于标签（Label）索引进行数据选择


Select

```python3
top_oceania_wines = reviews.loc[
    (reviews.country.isin(['Australia', 'New Zealand'])) & 
    (reviews.country.isin(['Australia', 'New Zealand'])) & (reviews.points >= 95) (reviews.points >= 95) 
]
```

Assign

```python3
reviews['critic'] = 'everyone'
reviews['index_backwards'] = range(len(reviews), 0, -1)
```

## Summary/Map

Summary

```python3
reviews.points.mean()   # 平均值
reviews.points.median() # 中位数
reviews.taster_name.unique() # 去重后的数据 set<tasker_name>
reviews.taster_name.value_counts() # 去重数据 以及出现的次数 map<tasker_name, int>
df.loc['A'].idxmax() # A列最大值的索引idx  (lambda df : min(df['A'].idx) => idx)
```

Map

- map：主要用于Series对象，可以方便地进行元素级别的转换，特别是基于映射关系（如字典）。
- apply：更为灵活，可用于DataFrame和Series对象，既能进行元素级别的转换，也能对整行或整列进行操作。

```python3
n_trop = reviews.description.map(lambda desc: "tropical" in desc).sum()
```

```python3
# 示例数据
data = {
    'A': [1, 2, 3],
    'B': [10, 20, 30]
}
df = pd.DataFrame(data)

# 使用apply将函数应用于整个DataFrame的每列
def add_5(x):
    return x + 5

df['A'] = df['A'].apply(add_5)
print(df)

>>> 输出结果
   A   B
0  6  10
1  7  20
2  8  30
```


```python3
# 使用apply将函数应用于每一行
def sum_row(row):
    return row['A'] + row['B']

df['sum'] = df.apply(sum_row, axis=1)
print(df)
>>> 输出结果
   A   B  sum
0  6  10   16
1  7  20   27
2  8  30   38
```

## Group/Sort

Group

```python3
reviews.groupby('taster').size() # group by taster count(1)
reviews.groupby(["variety"]).price.agg([min, max]) # group by variety min(price), max(price)
```


Sort

```python3
reviews.groupby('price').points.max().sort_index(ascending=True)
reviews.groupby(["variety"]).price.agg([min, max]).sort_values(by=["min", "max"], ascending=False)
```

## DataType/Missing Value

DataType

```python3
reviews.points.dtype
reviews.points.astype('str')
```

MissingValue

```python3
reviews[pd.isnull(reviews.price)]
reviews.region_1.fillna("Unknown")
```

