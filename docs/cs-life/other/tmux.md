# Tmux 基础使用


## Tmux 操作


新建会话

```
tmux new -s xv5
```

列出当前会话

```
tmux ls
```

删除会话

```
tmux kill-session -t xv6
```

关闭当前窗格

```
ctrl + b x: 关闭当前pane
```

将当前窗格全屏
```
ctrl + b z: 全屏当前pane
```

## tmux配置

默认放在 `~/.tmux.conf`

```
set-option -g default-shell /usr/bin/zsh  # 以zsh shell打开

set -sg escape-time 1

bind | split-window -h  # ctrl + b + |   分屏
bind - split-window -v  # ctrl + b + - 

bind h select-pane -L   # ctrl + b + h 左移窗格
bind j select-pane -D   # ctrl + b + j 下移窗格
bind k select-pane -U   # ctrl + b + k 上移窗格
bind l select-pane -R   # ctrl + b + l 右移窗格

bind H resize-pane -L 5  
bind J resize-pane -D 5
bind K resize-pane -U 5
bind L resize-pane -R 5


set -g mouse on      # 开启鼠标

set -g set-clipboard on

setw -g mode-keys vi  # 进入复制模式的时候使用 vi 键位（默认是 EMACS）
```

更改文件后，需要手动刷新配置

```
# c+b 之后，输入
:source ~/.tmux.conf
```


## Mac复制与粘贴

Mac的iterm2

找到 `Settings > General > Secetion >Applications in terminal may access clipboard`并勾选

![tmux复制与粘贴](./tmux_copy_paste.png)