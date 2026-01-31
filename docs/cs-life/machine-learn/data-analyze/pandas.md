# Pandas 进阶：工程实践与性能优化

本文档旨在从资深研发角度出发，探讨 Pandas 在数据处理中的最佳实践、性能优化及底层原理，帮助开发者从“会用”进阶到“高效工程化”。

## 1. 高效 I/O (Efficient I/O)

在生产环境中，I/O 往往是瓶颈。CSV 虽通用但效率低下且丢失类型信息。

### 推荐实践
*   **优先使用二进制格式**：`Parquet` 或 `Feather`。它们支持列式存储、压缩和类型保留，读写速度比 CSV 快 10x 以上。
*   **大文件处理**：使用 `chunksize` 分块读取，避免 OOM (Out Of Memory)。

```python
# 写入 Parquet (推荐 snappy 或 zstd 压缩)
df.to_parquet("data.parquet", compression="zstd")

# 读取 Parquet
df = pd.read_parquet("data.parquet", columns=["col1", "col2"]) # 只读所需列

# 分块读取 CSV
chunk_iter = pd.read_csv("large_file.csv", chunksize=10000)
for chunk in chunk_iter:
    process(chunk)
```

## 2. 索引与切片：View vs Copy

理解 Pandas 的 `View` (视图) 和 `Copy` (副本) 是避免 `SettingWithCopyWarning` 和隐式 Bug 的关键。

### 核心原则
*   **严禁链式索引 (Chained Indexing)**：`df[mask]['col'] = val` 是不安全的。
*   **使用显式访问器**：始终使用 `.loc` (标签) 或 `.iloc` (位置)。

```python
# ❌ Bad: 链式索引，Pandas 无法保证返回的是 View 还是 Copy
df[df['A'] > 5]['B'] = 10 

# ✅ Good: 原子操作，明确修改原 DataFrame
df.loc[df['A'] > 5, 'B'] = 10
```

## 3. 向量化运算 (Vectorization)

Pandas 建立在 NumPy 之上，核心优势是向量化。

### 性能阶梯 (由快到慢)
1.  **NumPy Core / Pandas Vectorized Ops**: `df['a'] + df['b']` (利用 SIMD 指令)
2.  **Cython Routines**: `df['a'].isin(...)`
3.  **Apply (Cython-optimized)**: `df['a'].apply(...)` (部分内置函数如 sum 经过优化)
4.  **Apply (Python lambda)**: `df.apply(lambda x: ...)` (Python 循环，慢)
5.  **Itertuples / Iterrows**: 显式 Python 循环 (极慢)

### 优化案例

```python
# ❌ Bad: 使用 apply 进行行级运算 (Python Loop)
def calculate(row):
    return row['A'] + row['B'] if row['C'] > 0 else 0
df['D'] = df.apply(calculate, axis=1)

# ✅ Good: 向量化操作 (C Level Speed)
import numpy as np
df['D'] = np.where(df['C'] > 0, df['A'] + df['B'], 0)
```

## 4. 高级分组 (Advanced GroupBy)

`groupby` 不仅仅是 `split-apply-combine`，更应灵活运用 `transform` 和 `filter`。

*   **Aggregation**: 降维 (多行 -> 一行)。
*   **Transform**: 保持维度 (多行 -> 多行)，常用于组内标准化、填充缺失值。
*   **Filter**: 过滤组。

```python
# 组内标准化 (Z-Score)
# 无需手动 merge 回原表，transform 直接返回与原表对齐的 Series
df['val_norm'] = df.groupby('category')['val'].transform(lambda x: (x - x.mean()) / x.std())

# 过滤掉记录数少于 10 的组
df_filtered = df.groupby('category').filter(lambda x: len(x) >= 10)
```

## 5. 内存优化 (Memory Optimization)

处理千万级数据时，内存管理至关重要。

### 技巧
*   **Category 类型**：对于低基数（Low Cardinality）的字符串列（如国家、状态），转换为 `category` 类型可节省 90% 内存并加速 GroupBy。
*   **Downcasting**：将 `float64` / `int64` 降级为 `float32` / `int16`。

```python
# 查看内存占用
print(df.info(memory_usage='deep'))

# 转换 Category
df['country'] = df['country'].astype('category')

# 自动降级数值类型
for col in df.select_dtypes(include=['float', 'int']):
    df[col] = pd.to_numeric(df[col], downcast='float')
```

## 6. 代码整洁之道：链式调用 (Method Chaining)

避免创建大量中间临时变量 (`df1`, `df2`, `df_tmp`)，使用链式调用让逻辑流线性化。配合 `assign` 和 `pipe` 使用。

```python
# ❌ Bad: 过程式代码，充斥中间变量
df = pd.read_csv('data.csv')
df = df.dropna()
df = df.loc[df['val'] > 0]
df['log_val'] = np.log(df['val'])
res = df.groupby('cat')['log_val'].mean()

# ✅ Good: 声明式风格，逻辑清晰
res = (
    pd.read_csv('data.csv')
    .dropna()
    .loc[lambda x: x['val'] > 0]  # 使用 lambda 引用当前流中的 DataFrame
    .assign(log_val=lambda x: np.log(x['val']))
    .groupby('cat')['log_val']
    .mean()
)
```

## 7. 实用代码片段 (Snippets)

### 时间序列重采样与窗口
```python
# 设置时间索引
df = df.set_index('timestamp')

# 降采样：每 5 分钟求均值
df_5min = df.resample('5T').mean()

# 滚动窗口：计算 7 天移动平均
df['ma7'] = df['price'].rolling(window='7D').mean()
```

### 调试与合并
```python
# Merge 并检查数据来源
# indicator=True 会增加 '_merge' 列，显示 left_only, right_only, both
merged = pd.merge(df1, df2, on='key', how='outer', indicator=True)

# 校验合并结果 (如确保是一对一合并)
pd.merge(df1, df2, on='key', validate='1:1')
```
