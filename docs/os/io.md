# Linux IO

# 用户态，内核态切换

用户进程在系统中运行时，大部分时间是处在用户态空间里的，在其需要操作系统帮助完成一些用户态没有特权和能力完成的操作时就需要切换到内核态。那么用户进程如何切换到内核态去使用那些内核资源呢？答案是：1) 系统调用（trap），2) 异常（exception）和 3) 中断（interrupt）。

- 系统调用：用户进程主动发起的操作。用户态进程发起系统调用主动要求切换到内核态，陷入内核之后，由操作系统来操作系统资源，完成之后再返回到进程。
- 异常：被动的操作，且用户进程无法预测其发生的时机。当用户进程在运行期间发生了异常（比如某条指令出了问题），这时会触发由当前运行进程切换到处理此异常的内核相关进程中，也即是切换到了内核态。异常包括程序运算引起的各种错误如除 0、缓冲区溢出、缺页等。
- 中断：当外围设备完成用户请求的操作后，会向 CPU 发出相应的中断信号，这时 CPU 会暂停执行下一条即将要执行的指令而转到与中断信号对应的处理程序去执行，如果前面执行的指令是用户态下的程序，那么转换的过程自然就会是从用户态到内核态的切换。中断包括 I/O 中断、外部信号中断、各种定时器引起的时钟中断等。中断和异常类似，都是通过中断向量表来找到相应的处理程序进行处理。区别在于，中断来自处理器外部，不是由任何一条专门的指令造成，而异常是执行当前指令的结果。

## read / write 系统调用

- 32位系统下，4GB的内存空间，前3G为用户空间，最后1G为系统空间
- 当发生系统调用时，会产生中断，进程从用户空间切换到系统空间
- 用户空间向内核空间交换数据使用`copy_from_user`, `copy_to_user`两个函数


## 读磁盘写出到网卡流程

一次完整的读磁盘文件然后写出到网卡的底层传输过程如下：

[![6rodsS.png](https://s3.ax1x.com/2021/03/16/6rodsS.png)](https://imgtu.com/i/6rodsS)


## reference
- [Linux I/O 原理和 Zero-copy 技术全面揭秘](https://strikefreedom.top/linux-io-and-zero-copy)