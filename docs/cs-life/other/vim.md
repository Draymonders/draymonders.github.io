# Vim

## 执行命令

```vim
:! gcc demo.c && ./a.out # 在vim里面运行编译
```

## 移动光标

- h j k l  (← ↓ ↑ →)
- `w` 单词向后（word）
- `b`  向前（back）
- `ctrl+f`   向下翻页 || `ctrl+b`    向上翻页
- `lineNumber + gg` 或者 `:lineNumber` 跳到对应的行
- number + j k 跳转到curLine+number行， curLine-number行
- `0` 行首 || `$` 行尾

## 字符串匹配

- `/word` 查询对应的word的位置，n shift+n 跳转到下一个word，跳转到上一个word
- `%`，匹配配对的括号，支持 `{`, `(`, `[`
- `*` 匹配当前的单词，移动到下一个相同的单词
- `#`  匹配当前的单词，移动上一个相同的单词

## 文本操作

- `u` undo 撤销
- `ctrl + r` redo，恢复撤销
- `cc` 剪切并进入编辑模式，最后一个回车不会剪走
- dd 剪切，最后一个回车会剪走
- c+Number+c 剪切Number行并且进入编辑模式
- yy 复制 
- p paste 向后粘贴，`shift+p` 向前粘贴
- 全局替换字符串 `:%s/gcc .* -c/gcc -c/g`  将`gcc -m xxx -c` 替换成`gcc -c`


## 代码补全

- `ctrl+n`, 自动补全，在编辑模式下使用，只补全当前文件已经出现过的单词
- `ctrl+p`

## 多行选中

- vim文件，多列选中
    * 使用 `ctrl + v`进行列选择
- 多行注释 (亲测有效)
    1. `ctrl + v` 选中多行
    2. 按下 `shift + i`，进入编辑模式
    3. 输入`//`，然后按下`ESC` （此时发现多行代码都被注释了）

## 多文件跳转

- 从当前目录挑选文件
    `: -e .` 

## Vim plug插件

- 内网环境下安装 https://github.com/junegunn/vim-plug
- 自己找插件学习使用 https://vimawesome.com/


## 案例

要生成`day1-1.jpeg, day1-2.jpeg, day1-3.jpeg ... day1-100.jpeg`

实现方式：

1. 在 Vim 中打开一个新的空白文档。
2. 在第一行输入 "day1-1.jpeg"。
3. 把光标放在 "1" 上，然后输入 "qa" 开始录制宏 "a"。
4. 输入两次 "Y"，复制当前行， 然后 "p"，粘贴到下一行。
5. 按下v，选中数字"1"到行尾，输入 "Ctrl+A" 自增当前行的数字
6. 按 "q" 停止录制宏。
7. 输 "99@a" 执行该宏99次。这将生成从 "day1-2.jpeg" 到 "day1-100.jpeg" 的剩余文件名。