# 深度学习基础：从线性回归到深度神经网络

本文将将从最基础的线性回归出发，逐步推演至Softmax回归、多层感知机（MLP），最后通过一个完整的PyTorch工程实践，展示如何构建、训练并部署一个深度学习模型。

## 1. 深度学习的数学基石：线性回归

线性回归是神经网络最简单的形式（单层网络）。它试图通过特征的线性组合来拟合目标值。

### 1.1 理论模型
假设输入特征为 $x \in \mathbb{R}^d$，权重为 $w \in \mathbb{R}^d$，偏置为 $b \in \mathbb{R}$，则预测值 $\hat{y}$ 为：

$$ \hat{y} = w^T x + b $$

为了衡量预测值与真实值 $y$ 的差异，我们通常使用**均方误差（MSE）**作为损失函数：

$$ L(\hat{y}, y) = \frac{1}{2} (\hat{y} - y)^2 $$

训练的目标是找到 $w$ 和 $b$，使得所有样本的平均损失最小化。

### 1.2 原生实现（基于 PyTorch Autograd）
我们不依赖高级API，仅使用张量和自动求导来实现随机梯度下降（SGD）。

```python
import torch
import random
import numpy as np
import matplotlib.pyplot as plt

# 1. 生成合成数据 y = Xw + b + noise
def synthetic_data(w, b, num_examples):
    X = torch.normal(0, 1, (num_examples, len(w)))
    y = torch.matmul(X, w) + b
    y += torch.normal(0, 0.01, y.shape)
    return X, y.reshape((-1, 1))

true_w = torch.tensor([2, -3.4])
true_b = 4.2
features, labels = synthetic_data(true_w, true_b, 1000)

# 2. 定义模型参数
w = torch.normal(0, 0.01, size=(2, 1), requires_grad=True)
b = torch.zeros(1, requires_grad=True)

# 3. 定义模型与损失
def linreg(X, w, b):
    return torch.matmul(X, w) + b

def squared_loss(y_hat, y):
    return (y_hat - y.reshape(y_hat.shape)) ** 2 / 2

# 4. 优化算法：随机梯度下降
def sgd(params, lr, batch_size):
    with torch.no_grad():
        for param in params:
            param -= lr * param.grad / batch_size
            param.grad.zero_()

# 5. 训练循环
lr = 0.03
num_epochs = 3
batch_size = 10

for epoch in range(num_epochs):
    for i in range(0, len(features), batch_size):
        X = features[i:i+batch_size]
        y = labels[i:i+batch_size]
        l = squared_loss(linreg(X, w, b), y)
        l.sum().backward()
        sgd([w, b], lr, batch_size)
    
    with torch.no_grad():
        train_l = squared_loss(linreg(features, w, b), labels)
        print(f'epoch {epoch + 1}, loss {float(train_l.mean()):f}')
```

## 2. 处理分类问题：Softmax 回归

线性回归适用于预测连续值，而对于分类问题（如手写数字识别），我们需要输出属于每个类别的概率。

### 2.1 核心概念
*   **Logits**: 模型的原始输出 $o = Wx + b$。
*   **Softmax**: 将Logits映射为概率分布，保证所有概率非负且和为1。

    $$
    \hat{y}_j = \frac{\exp(o_j)}{\sum_k \exp(o_k)}
    $$

*   **交叉熵损失 (Cross Entropy)**: 衡量两个概率分布的差异。

    $$
    L(y, \hat{y}) = - \sum_j y_j \log \hat{y}_j
    $$


### 2.2 PyTorch 简洁实现
利用 `torch.nn` 模块，我们可以更高效地实现Softmax回归。

```python
import torch
from torch import nn

# 定义网络：输入维度784 (28x28图片展平)，输出维度10 (10个类别)
# PyTorch的CrossEntropyLoss已经内置了Softmax，所以网络只需输出Logits
net = nn.Sequential(nn.Flatten(), nn.Linear(784, 10))

# 初始化权重
def init_weights(m):
    if type(m) == nn.Linear:
        nn.init.normal_(m.weight, std=0.01)
net.apply(init_weights)

# 损失函数与优化器
loss = nn.CrossEntropyLoss()
trainer = torch.optim.SGD(net.parameters(), lr=0.1)

# 训练代码（伪代码）
# for X, y in train_iter:
#     l = loss(net(X), y)
#     trainer.zero_grad()
#     l.backward()
#     trainer.step()
```

## 3. 引入非线性：多层感知机 (MLP)

线性模型（线性回归和Softmax回归）的局限性在于它们只能学习线性决策边界。为了解决复杂问题（如XOR问题），我们需要引入隐藏层和非线性激活函数。

### 3.1 网络结构
*   **输入层**: 特征向量
*   **隐藏层**: $H = \sigma(W_1 X + b_1)$，其中 $\sigma$ 是非线性激活函数。
*   **输出层**: $O = W_2 H + b_2$

### 3.2 常见激活函数
*   **ReLU**: $\max(0, x)$。计算简单，缓解梯度消失，是目前最主流的选择。
*   **Sigmoid**: $\frac{1}{1+e^{-x}}$。将输出压缩到(0,1)，但在深层网络中易导致梯度消失。
*   **Tanh**: 双曲正切，输出范围(-1, 1)。

### 3.3 实现 MLP
```python
net = nn.Sequential(
    nn.Flatten(),
    nn.Linear(784, 256),  # 隐藏层：256个神经元
    nn.ReLU(),            # 非线性激活
    nn.Linear(256, 10)    # 输出层
)

# 权重初始化
def init_weights(m):
    if type(m) == nn.Linear:
        nn.init.xavier_uniform_(m.weight)
net.apply(init_weights)
```

## 4. 计算机视觉核心：卷积神经网络 (CNN)

多层感知机（MLP）在处理图像时面临两个主要问题：

1.  **参数量爆炸**：全连接层需要将图像展平，忽略了像素间的空间结构。对于高分辨率图像，参数量会非常巨大。
2.  **忽略局部相关性**：图像中的物体（如猫）可能出现在任何位置，全连接层难以高效捕捉这种平移不变性。

卷积神经网络（CNN）通过**局部感受野**和**权值共享**解决了这些问题。

### 4.1 核心组件

#### 卷积层 (Convolutional Layer)
卷积层通过滑动一个小的“滤波器”（Kernel）在图像上提取特征（如边缘、纹理）。

*   **计算公式**：
    输出特征图 $Y$ 的某个位置 $(i,j)$ 的计算如下：
    $$
    Y_{i,j} = \sum_m \sum_n X_{i+m, j+n} \cdot K_{m,n} + B
    $$
*   **关键参数**：
    *   **Kernel Size**: 卷积核大小（如 3x3）。
    *   **Stride**: 滑动步长，步长越大，输出尺寸越小。
    *   **Padding**: 填充边缘，保持输出尺寸或保留边缘信息。

#### 池化层 (Pooling Layer)

池化层用于降维和提取主要特征，增加模型的鲁棒性。
*   **Max Pooling**: 取窗口内的最大值。
*   **Average Pooling**: 取窗口内的平均值。

### 4.2 PyTorch 实现 CNN Block
一个典型的 CNN 模块包含：卷积 -> 激活 -> 池化。

```python
import torch
from torch import nn

# 定义一个简单的 CNN 块
cnn_block = nn.Sequential(
    # 卷积层: 输入通道3 (RGB)，输出通道32，卷积核3x3，填充1
    nn.Conv2d(in_channels=3, out_channels=32, kernel_size=3, padding=1),
    # 激活函数
    nn.ReLU(),
    # 池化层: 2x2 最大池化，特征图长宽减半
    nn.MaxPool2d(kernel_size=2, stride=2)
)

# 测试输入 (Batch=1, Channel=3, Height=32, Width=32)
x = torch.randn(1, 3, 32, 32)
output = cnn_block(x)
print(output.shape) 
# 输出: torch.Size([1, 32, 16, 16])
# 通道数变为32，尺寸 32x32 -> 16x16
```

## 5. PyTorch 深度学习工程实践

整合以上知识，我们以 CIFAR-10 数据集为例，构建一个完整的深度学习训练流程。我们将利用 CNN 的能力来识别图像。

### 5.1 完整训练 Pipeline

一个标准的深度学习工程包含以下步骤：
1.  **数据准备**: Dataset 与 DataLoader
2.  **模型构建**: 继承 `nn.Module`
3.  **损失与优化**: Loss Function & Optimizer
4.  **训练循环**: Forward -> Loss -> Backward -> Step
5.  **评估与保存**

```python
import torch
import torchvision
import torchvision.transforms as transforms
from torch import nn
from torch.optim import SGD
from tqdm import tqdm

# 1. 设备配置
device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
print(f"Using device: {device}")

# 2. 数据预处理与加载
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)) # 标准化
])

batch_size = 64
train_dataset = torchvision.datasets.CIFAR10(root="../data", train=True, download=True, transform=transform)
test_dataset = torchvision.datasets.CIFAR10(root="../data", train=False, download=True, transform=transform)

train_dataloader = torch.utils.data.DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
test_dataloader = torch.utils.data.DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

# 3. 构建模型 (简单的 CNN)
class CNNModel(nn.Module):
    def __init__(self):
        super().__init__()
        # 特征提取层
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2), # 32x16x16
            
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2), # 64x8x8
        )
        # 分类层
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 8 * 8, 512),
            nn.ReLU(),
            nn.Linear(512, 10)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

model = CNNModel().to(device)

# 4. 损失函数与优化器
criterion = nn.CrossEntropyLoss()
optimizer = SGD(model.parameters(), lr=0.01, momentum=0.9)

# 5. 训练与评估循环
epochs = 10

for epoch in range(epochs):
    # --- 训练阶段 ---
    model.train()
    running_loss = 0.0
    for inputs, labels in tqdm(train_dataloader, desc=f"Epoch {epoch+1} Train"):
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()       # 清空梯度
        outputs = model(inputs)     # 前向传播
        loss = criterion(outputs, labels) # 计算损失
        loss.backward()             # 反向传播
        optimizer.step()            # 更新参数
        
        running_loss += loss.item()
    
    # --- 评估阶段 ---
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for inputs, labels in test_dataloader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
    acc = 100 * correct / total
    print(f"Epoch {epoch+1} Loss: {running_loss/len(train_dataloader):.3f} | Test Acc: {acc:.2f}%")

# 6. 保存模型
torch.save(model.state_dict(), "cifar10_cnn.pth")
```

## 总结

从最简单的线性回归到复杂的卷积神经网络，深度学习的核心思想是一致的：通过**数据驱动**，利用**梯度下降**算法，不断优化**模型参数**以最小化**损失函数**。掌握这些基础构建模块（Linear, Conv2d, ReLU, CrossEntropy等），是理解和构建现代大规模AI模型（如Transformer, LLM）的必经之路。

## 参考资料

- [PyTorch 官方文档](https://pytorch.org/docs/stable/index.html)
- [Dive into Deep Learning (d2l.ai)](https://d2l.ai/)
