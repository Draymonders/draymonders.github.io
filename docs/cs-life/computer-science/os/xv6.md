# xv6操作系统

## 开发环境构建

以mac系统为例

1. 安装virtual box，并加载 ubuntu 22.04镜像
    - virtual box 开启端口映射 
        * 主机端口:虚拟机端口 `2222:22`
        * 通过 `ssh -p 2222 bing@localhost` 访问虚拟机

2. 安装依赖 
    - 需要的依赖
        * `sudo apt-get install -y gcc build-essential gdb gcc-multilib qemu-system-i386`
    - b站作者git仓库 
        * `git clone https://github.com/Jeanhwea/xv6-course.git`
    - 官方xv6仓库  
        * `git clone https://github.com/mit-pdos/xv6-public.git`
        * 安装后进行 `make` 和 `make qemu-nox-gdb`


## 开篇-操作系统接口

### 标准输入输出

按照惯例，进程从文件描述符0读入（标准输入），从文件描述符1输出（标准输出），从文件描述符2输出错误（标准错误输出）

`ls existing-file non-exsiting-file > tmp1 2>&1`

`2>&1` 告诉 shell 给这条命令一个复制描述符1的描述符2。

这样 existing-file 的名字和 non-exsiting-file 的错误输出都将出现在 tmp1 中

### 为何 fork 和 exec 是单独的两种系统调用？

这种区分使得 shell 可以在子进程执行指定程序之前对子进程进行修改。

举例
```c
int main()
{
    char *argv[2];
    argv[0] = "cat";

    if (fork() == 0) {
        close(0); // 关闭标准输入
        int fd = open("input.txt", O_RDONLY); // 返回0
        printf("fd %d\n", fd); // fd 0

        execv("/bin/cat", argv);
    }
    return 0;
}
```

### 为啥 kernel.s 可以在qemu里关中断，但在用户态程序里不行？

```
# kernal.s文件

kernel.out:     file format elf32-i386


Disassembly of section .text:

00007c00 <start>:
    7c00:       fa                      cli
    7c01:       b8 01 00                mov    $0x1,%ax
    7c04:       fb                      sti

00007c05 <spin>:
    7c05:       eb fe                   jmp    7c05 <spin>
```

在操作系统中，关中断与能否执行特权指令有关。关中断通常是由操作系统的核心部分，也就是内核来处理的。内核运行在特权态（在x86架构中通常是0级），可以执行诸如修改中断控制器状态之类的特权指令。

在你所提供的 kernel.s 中的 cli 指令和 sti 指令，分别表示关中断和开中断，它们都是特权指令，只有在内核态（Ring 0）中才能执行。
而用户态程序运行在非特权态（在x86架构中通常是3级），不能直接执行特权指令，包括开关中断等操作，否则会触发异常。这是因为用户程序可以由任何人编写和执行，如果允许用户态程序随意关闭或打开中断，那么系统的稳定性和安全性就无法保障。

所以，kernel.s 能在 qemu（模拟的内核态环境）中关闭中断，而在用户态程序中不能关闭中断。


## 页表

dir、页目录

- pgdir: 页目录基地址，是虚拟地址	
- PDX:  PDX(va) 获取虚拟地址（32位）的前10位
- pde: 页目录项，pgdir[0-1023]的一个元素，存储的是 (pgtab的物理地址|权限）

table、页表

- pgtab: 页表基地址，是虚拟地址
- PTX: PTX(va) 获取虚拟地址（32位）的前11-20位
- pte: 页表项，pgtab[0-1023]的一个元素，存储的是（元素的物理地址|权限）
- PTE_ADDR: 根据pde，获取实际pgtab的物理地址


## 整体启动流程

1. 启动流程
    - 从磁盘加载kernel文件到内存
    - 通过 elf的entry 调用 main
2. 虚拟内存申请与分配
    - 创建kernel的页表，进行虚拟地址和物理地址映射
3. 运行用户进程
    - userinit 
        + 申请并初始化进程
        + 将initcode.S 代码加载到进程的页目录内存
    - mpmain:scheduler
        + 获取当前cpu，以及可运行的进程
        + 切换用户进程的页表
        + 保存cpu寄存器的数据，栈切换到进程
            * forkret 释放进程锁
            * trapret 栈上取出寄存器的值
    - initcode
        + 执行exec("/init")
    - init `pid=1`
        + 创建console
        + fork后执行 exec("sh")
    - sh `pid=2`
        + 循环监听用户键盘输入
        + `cd`命令，改变目录
        + 其他命令，fork后exec(`pid=3`)，执行后子进程退出，sh程序继续运行

### xv6启动流程详细分析

1. bootasm.S
    1. 加载lgdt表
    2. 调用 bootmain.c:bootmain()
2. bootmain.c
    1. 加载 kernel 到内存
    2. 解析 elf 头
    3. 跳转 elf->entry()
3. entry.S
    1. 初始化
    2. 跳转 main.c:main()
4. main

### syscall流程

1. initcode.asm
    - int $T_SYSCALL (0x40)
2. vector.S
    - vector64
3. alltraps
    - call trap
4. trap
5. syscall
6. sys_exec
7. exec
    - load elf
    - alloc uvm（virtual memory）
    - fill ustack
    - replace old uvm to new uvm

## 用户态程序


不同的用户程序

- cat：读取fd，输出
- ls: 扫描当前文件/目录，输出
- echo: 写入fd
- find: 递归扫描目录，找到符合条件的文件
- grep: 文件内容按行切分，找到match pattern的行
- xargs: 根据输入，截取换行符，每个程序依次执行
    * find . b | xargs grep hello
     => xargs grep hello ./a/b 

scause 0x000000000000000d
sepc=0x0000000080002052 stval=0x0000000000000000

b *0x0000000080002052

## 固件，bios，rom

固件，ROM 和 BIOS 是计算机硬件和软件关键组成部分，它们在系统中扮演不同角色：
- 固件（Firmware）: 固件是嵌入到硬件设备中的软件，例如：路由器，网卡等。它提供了硬件设备的低级控制，用于硬件中的特定模型或设备类型。固件能够在设备电源关闭后保持存储，但可被特殊程序更新或替换。
- ROM（只读存储器）: ROM是一种存储媒介，用于计算机，它存储的数据是永久性的，即使在电源关断时也不会消失。ROM中的数据是在制造过程中写入的，含有初始启动程序（BIOS）或者其他系统必需的固件。
- BIOS（基本输入/输出系统）: BIOS是系统启动时第一个运行的软件，存在于ROM中，它初始化并测试硬件，然后从硬盘或其他设备加载操作系统。BIOS可能包含额外的软件服务和诊断程序。
综上，固件，ROM和BIOS三者关系紧密。固件是一种特殊类型的软件，通常被烧录到ROM中，这样硬件就可以在电源打开时立刻开始工作。而其中的BIOS固件负责在启动时初始化硬件并加载操作系统。

## 进程

the trampoline page contains the code to transition in and out of the kernel
mapping the trapframe is necessary to save/restore the state of the user proces

the state of a thread (local variables, function call return addresses) is stored on the thread’s stacks.


## 页表

三层结构允许以一种节省内存的方式记录 PTE。在大范围虚拟地址没有映射的常见情况下，三级结构可以省略整个页目录。


为什么是三级页表？

1. 存储成本考虑
    - 只有一层需要2^27的索引项，但是如果是三层，是按需分配，用到多少就分配多少，比如只用了[0][0][0] 最终只生成了3*2^9个索引项
2. cpu性能
    - 避免从物理内存加载 PTE 的成本，RISC-V CPU 将页表条目缓存在转换后备缓冲区 (TLB) 中


pgTable 是4096字节；int64指针占用8字节；因此一页可以分配512（2^9）个PTE
`(pte >> 10) << 12` 一个PTE指向一个4096字节的物理页面，右移10位是为了去掉flags位，左移12位是，对齐一个4096的页面