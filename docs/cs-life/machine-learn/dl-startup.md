# 深度学习

## 入门教程

依据pytorch官方文档以及土堆pytorch视频，训练一个模型，分别有如下几步


1. 挑选数据集
2. 网络模型构建 (线性层，非线性激活，卷积层，池化层)
3. loss函数 (分类用交叉熵，回归用均方差)
4. 优化函数（梯度下降）
5. 设置超参数（lr，epoch，batch_size）
6. 模型训练
7. 模型保存
- (optional). TensorBoard画图 观察

```python3
import torch.utils.data
import torchvision
from PIL import Image
import torchvision.transforms as transforms
from torch import nn
from torch.optim import SGD
from torch.utils.tensorboard import SummaryWriter
from torchvision.utils import make_grid
from tqdm import tqdm


def choose_device():
    return ("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")

device = choose_device()
print(device)
# 确保使用 LANCZOS 替代 ANTIALIAS
if not hasattr(Image, 'ANTIALIAS'):
    Image.ANTIALIAS = Image.LANCZOS

# 图片转tensor
transform = transforms.Compose([
    transforms.ToTensor()
])

# 超参数
lr = 0.01
epoches = 100
batch_size = 64

# 数据集
train_dataset = torchvision.datasets.CIFAR10("../data", train=True, transform=transform, download=True)
test_dataset = torchvision.datasets.CIFAR10("../data", train=False, transform=transform, download=True)
train_dataloader = torch.utils.data.DataLoader(dataset=train_dataset, batch_size=batch_size, shuffle=True)
test_dataloader = torch.utils.data.DataLoader(dataset=test_dataset, batch_size=batch_size)


# 模型
class Model(nn.Module):
    # 输入是64*3*32*32
    def __init__(self):
        super().__init__()
        # 卷积层
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels=3, out_channels=3, kernel_size=3, stride=1,padding=1, device=device),
            nn.MaxPool2d(kernel_size=2), # 3*16*16
            nn.Conv2d(in_channels=3, out_channels=3, kernel_size=3, stride=1, padding=1, device=device),
            nn.MaxPool2d(kernel_size=2), # 3*8*8
        )

        # 线性层
        self.line = nn.Sequential(
            nn.Flatten(),
            nn.Linear(in_features=3*8*8, out_features=128, device=device),
            nn.ReLU(),
            nn.Linear(in_features=128, out_features=64, device=device),
            nn.ReLU(),
            nn.Linear(in_features=64, out_features=10, device=device),
            nn.ReLU(),
        )

    def forward(self, X):
        X = self.conv(X)
        X = self.line(X)
        return X

m = Model()

step = 1
loss_fn = nn.CrossEntropyLoss()
opti = SGD(params=m.parameters(), lr=lr)

#writer = SummaryWriter(log_dir="./board")

for epoch in range(epoches):
    loss_all, correct = 0.0, 0
    print(f"==== epoch {epoch} start ====")
    m.train()
    for imgs, target in tqdm(train_dataloader, desc="train"):
        imgs = imgs.to(device)
        target = target.to(device)
        #print(f"imgs shape {imgs.shape} target shape {target.shape}")
        pred = m(imgs)
        opti.zero_grad()
        loss = loss_fn(pred, target)
        loss_all += loss.item()
        loss.backward()
        opti.step()
        step += 1

    m.eval()
    for imgs, target in tqdm(test_dataloader, desc="eval"):
        with torch.no_grad():
            imgs = imgs.to(device)
            target = target.to(device)
            pred = m(imgs)
            classes = torch.argmax(pred, dim=1)
            correct += (classes == target).sum()
    #if step % 100 == 0:
    print(f"correct: {correct / len(test_dataset) * 100}%")
    #for imgs, target in test_dataset:
    # print(f"pred shape {pred.shape}")
    #writer.add_image(tag="img", img_tensor=make_grid(imgs, ncols=8), global_step=step)
    #writer.add_image(tag="pred", img_tensor=make_grid(pred, ncols=8), global_step=step)
# writer.close()
```

## 引用

- [pytorch官方文档](https://pytorch.org/docs/stable/index.html)
- [土堆pytorch视频](https://www.bilibili.com/video/BV1hE411t7RN)