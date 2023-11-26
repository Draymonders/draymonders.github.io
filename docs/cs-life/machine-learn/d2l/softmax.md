# softmax 

用作多分类

想预测 m 个结果

- 输入矩阵 X `(n, feature_num)`
- 权重矩阵 W `(feature_num, m)`
- 偏差 b `(1, m)`

某一行预测的值加和为 1，并且每个值非负，这里用到了 e^x 指数函数，因为 e^x >= 0 （当x无穷小）


## 原生实现

思路

1. 加载 mnist 数据集，分为训练集 train_set 和 测试集 test_set
2. 预测  `y_hat = softmax(W*x+b)` 与 y 的误差，误差函数采用 `交叉熵函数`，使用随机梯度下降更新 `W` 和 `b` ？？？ 表述对么？
3. 设置 学习率 和 批大小，对模型进行优化

实现代码

```python
import torch
import torchvision
from torch.utils import data
from torchvision import transforms
from d2l import torch as d2l
from IPython import display

# labels为[0,1,2,4,3]这种，转换为真实的类别英文
def get_fashion_mnist_labels(labels):
    text_labels = ['t-shirt', 'trouser', 'pullover', 'dress', 'coat',
                   'sandal', 'shirt', 'sneaker', 'bag', 'ankle boot']
    return [text_labels[int(i)] for i in labels]

# 根据batch_size抽取训练集和测试集，(train_iter, test_iter)
# 每个iter有X和y，X为对应的张量，y为对应的label index
def load_data_fashion_mnist(batch_size, resize=None):
    """下载Mnist数据集，将其加载到内存中"""
    trans = [transforms.ToTensor()]
    
    if resize:
        trans.insert(0, transforms.Resize(resize))
    #print(trans)
    trans = transforms.Compose(trans)
    
    mnist_train = torchvision.datasets.FashionMNIST(
        root="../data", train=True, transform=trans, download=True
    )
    mnist_test = torchvision.datasets.FashionMNIST(
        root="../data", train=False, transform=trans, download=True
    )
    
    return (data.DataLoader(mnist_train, batch_size, shuffle=True,
                           num_workers=4),
           data.DataLoader(mnist_test, batch_size, shuffle=True,
                           num_workers=4),
           )

# 使用softmax来保证每行的每项都是>=0，并且每行总和加和=1
def softmax(X):
    X_exp = torch.exp(X)
    partition = X_exp.sum(1, keepdim=True)
    #print(f'X {X} \nX_exp {X_exp} \npartition {partition}')
    return X_exp / partition

# 模型
def net(X):
    return softmax(
        torch.matmul(X.reshape(-1, W.shape[0]), W) + b
    )

# 损失函数，交叉熵损失 -log(y_hat * y)
def cross_entropy(y_hat, y):
    return -torch.log(y_hat[range(len(y_hat)), y])

# 平方损失函数
def L2(y_hat, y):
    return (y_hat.reshape(y.shape) - y) ** 2 / 2

#随机梯度下降 更新w和b
def updater(batch_size): 
    return d2l.sgd([W,b], lr, batch_size)

# 准确评估函数，对于每行最大值作为预测结果，判断预测准确精度
def accuracy(y_hat, y):
    if len(y_hat.shape) > 1 and y_hat.shape[1] > 1:
        y_hat = y_hat.argmax(axis=1) # 找到每一行最大值的index
    #print(f'y_hat {y_hat}')
    cmp = y_hat.type(y.dtype) == y
    return float(cmp.type(y.dtype).sum())

# 网络训练
def train_epoch_ch3(net, train_iter, loss, updater):
    if isinstance(net, torch.nn.Module):
        net.train()
    # 训练损失总和，训练准确度总和，样本数
    metric = d2l.Accumulator(3)
    for X, y in train_iter:
        y_hat = net(X)
        l = loss(y_hat, y)
        if isinstance(updater, torch.optim.Optimizer):
            updater.zero_grad()
            l.mean().backward()
            updater.step()
        else:
            l.sum().backward()
            updater(X.shape[0])
        
        metric.add(float(l.sum()), accuracy(y_hat, y), y.numel())
    # 返回训练损失和 和 训练精度
    return metric[0] / metric[2], metric[1] / metric[2]

# 通过渐变图形观测结果
def train_ch3(net, train_iter, test_iter, loss, num_epochs, updater):
    animator = d2l.Animator(xlabel='epoch', xlim=[1, num_epochs],
                       ylim=[0.3, 0.9], legend=['train loss', 'train acc', 'test acc']
                   )
    for epoch in range(num_epochs):
        train_metrics = train_epoch_ch3(net, train_iter, loss, updater)
        
        test_acc = d2l.evaluate_accuracy(net, test_iter)
        animator.add(epoch+1, train_metrics + (test_acc,))
        
    train_loss, train_acc = train_metrics
    assert train_loss < 0.5, train_loss
    assert train_acc <= 1 and train_acc > 0.7, train_acc
    assert test_acc <= 1 and test_acc > 0.7, test_acc

batch_size = 256
train_iter, test_iter = load_data_fashion_mnist(batch_size)
# 图片是 1*28*28的
num_inputs = 28*28
num_outputs = 10
W = torch.normal(0, 0.01, size=(num_inputs, num_outputs), requires_grad=True)
b = torch.zeros(num_outputs, requires_grad=True)

lr = 0.1
num_epochs = 10

train_ch3(net, train_iter, test_iter, cross_entropy, num_epochs, updater)
```


## torch工具类实现


```python

import torch
from torch import nn
from d2l import torch as d2l

batch_size = 256
train_iter, test_iter = d2l.load_data_fashion_mnist(batch_size)

net = nn.Sequential(nn.Flatten(), nn.Linear(784, 10))

def init_weights(m):
    if type(m) == nn.Linear:
        nn.init.normal_(m.weight, std=0.01)
    
net.apply(init_weights)

trainer = torch.optim.SGD(net.parameters(), lr=0.1)
num_epochs = 10
loss = nn.CrossEntropyLoss(reduction='none')

d2l.train_ch3(net, train_iter, test_iter, loss, num_epochs, trainer)



```