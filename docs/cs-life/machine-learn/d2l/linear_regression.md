# 线性回归

## 原生实现

思路，数据是线性分布的，即 `y = w * x + b`

1. 人工生成w_real，b_real，并以此生成特征集 和 结果
2. 随机生成拟合的 w_predict 和 b_predict
3. 设置 learning_rate(学习率), batch_size(随机样本大小)，epoch(训练次数) 超参数
4. 对于特征集和结果，每次训练，随机抽取 batch_size 的数据，进行训练
    - 对 `w_predict * x + b_predict`与 真实y 进行平方差 求梯度
    - 按照 `负梯度*学习率` 对w_predict和b_predict进行更新

```python

import math
import time
import numpy as np
import torch
import random
from d2l import torch as d2l

# 生成数据  wx+b=y, n是case数量
def gen_data(w, b, n):
    x = torch.normal(0, 1, (n, len(w)))
    y = torch.matmul(x, w) + b
    y += torch.normal(0, 1, y.shape)
    return x, y.reshape(-1, 1)

# 对于features/labels，每次随机抽batch_size的数据用作训练
def data_iter(features, labels, batch_size):
    ndim = len(features)
    idx = [i for i in range(ndim)]
    idx = random.shuffle(idx)
    for i in range(ndim):
        st, ed = i, min(i+batch_size, ndim)
        yield features[st:ed], labels[st:ed]

# 预测值与真实值的 R2 距离
def squared_loss(y_predict, y):
    return (y - y_predict.reshape(y.shape))**2 / 2

# 根据w,b计算预测值 （线性回归）
def linreg(X, w, b):
    return torch.matmul(X, w) + b

# 随机梯度下降
def sgd(params, lr, batch_size):
    with torch.no_grad():
        for param in params:
            down_grad = lr * param.grad / batch_size
            # print("param: ", param, "down_grad: ",down_grad)
            param -= down_grad
            param.grad.zero_()

w_real = torch.Tensor([2.0, -2])
b_real = -5
features, labels = gen_data(w_real, b_real, 100)

w = torch.zeros((2,1), requires_grad=True)
b = torch.zeros(1, requires_grad=True)
#print(w)

lr = 0.001 # learning rate
epochs = 50
net = linreg # 线性回归
loss = squared_loss #均方损失
batch_size = 10

epoch_ = []
loss_ = []

for epoch in range(epochs):
    for X, y in data_iter(features, labels, batch_size):
        l = loss(net(X, w, b), y)
        l.sum().backward()
        sgd([w, b], lr, batch_size)
    with torch.no_grad():
        train_l = loss(net(features, w, b), labels)
        real_loss = float(train_l.mean())
        #print(f'epoch {epoch + 1}, loss {real_loss:f}')
        epoch_.append(epoch)
        loss_.append(real_loss)
d2l.plt.plot(epoch_, loss_)


print(f'w估计误差: {w_real - w.reshape(w_real.shape)}')
print(f'b估计误差: {w_real - w.reshape(w_real.shape)}')
print(w_real, b_real)
print(w, b)

```

## torch工具类实现

```python
w_real = torch.Tensor([2.0, -2])
b_real = -5
features, labels = d2l.synthetic_data(w_real, b_real, 1000) # 生成数据

def load_array(data_arrays, batch_size, is_train=True):
    dataset = data.TensorDataset(*data_arrays)
    return data.DataLoader(dataset, batch_size, shuffle=is_train)


# next(iter(data_iter)) # 随机抽数据进行拟合
net = nn.Sequential(nn.Linear(2, 1))
net[0].weight.data.normal_(0, 0.01)
net[0].bias.data.fill_(0)
trainer = torch.optim.SGD(net.parameters(), lr=0.03) # sgd表示随机梯度下降

loss = nn.MSELoss() #平方差

batch_size = 10
data_iter = load_array((features, labels), batch_size)

epochs = 3
for epoch in range(epochs):
    for X, y in data_iter:
        l = loss(net(X), y)
        trainer.zero_grad()
        l.backward()
        trainer.step()
    l = loss(net(features), labels)
    print(f'epoch {epoch + 1}, loss {l:f}')

w = net[0].weight.data
b = net[0].bias.data

print(w_real, b_real)
print(w, b)

```