# Vim

## 移动光标

- h j k l  左 下 上 右
- w b 单词向后（word） 向前（back）
- lineNumber+gg 跳到对应的行
- number + j k 跳转到curLine+number行， curLine-number行

## 多列选中

- vim文件，多列选中
    * 使用 `ctrl + v`进行列选择

## 上下翻页

- ctrl+f  ctrl+b   向下翻页  向上翻页

## 查找单词

- /word 查询对应的word的位置，n shift+n 跳转到下一个word，跳转到上一个word

## 复制粘贴

- cc 剪切并进入编辑模式，最后一个回车不会剪走
- dd 剪切，最后一个回车会剪走
- c+Number+c 剪切Number行并且进入编辑模式
- yy 复制 
- p paste 粘贴 
- u undo 撤销

## 代码补全

- ctrl+n 自动补全，在编辑模式下使用，只补全当前文件已经出现过的单词

## Vim plug插件

- 内网环境下安装 https://github.com/junegunn/vim-plug
- 自己找插件学习使用 https://vimawesome.com/