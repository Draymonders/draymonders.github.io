# python env

`pyenv` 是保证可以切换python版本以及对应的pip

`virtualenv`是用来管理python的依赖关系，不同的project依赖不同的package的version

## pyenv

```shell
pyenv install ${version}                      # 如 pyenv install 3.6.3
pyenv versions                                      # 列出所有的本地的python版本
pyenv global 3.6.3                                 # 设置全局 python环境
```

## virtualenv

```shell
virtualenv ${name}                                  # 创建
source   ${name}/bin/activate                 # 使虚拟环境生效
pip list --format=columns  # 查看pip包
deactivate                 # 退出
```