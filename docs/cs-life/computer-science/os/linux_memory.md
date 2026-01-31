# Linux 内存管理：演进与核心概念

## 1. 技术演进：从简单到复杂的变革

Linux 内存管理的发展史，就是一部不断平衡**性能**、**碎片化**和**隔离性**的历史。

### 1.1 早期阶段：基础构建
- **虚拟内存 (Virtual Memory)**: 引入虚拟地址空间，隔离了进程间的内存访问，使得每个进程都认为自己拥有独立的连续内存。
- **Buddy System (伙伴系统)**: 解决了物理页面的分配与回收问题，有效缓解了**外部碎片**。
- **Slab Allocator**: 在 Buddy System 之上，专门用于管理内核小对象（如 `task_struct`, `inode`），解决了**内部碎片**问题，并引入了对象缓存复用机制。

### 1.2 中期发展：性能与规模的挑战 (2.6 Kernel 时代)
- **NUMA (Non-Uniform Memory Access) 支持**: 随着多核 CPU 的普及，内存控制器被集成到 CPU 内部。Linux 引入了 NUMA 架构支持，尽量让 CPU 访问本地内存，减少跨 Node 访问带来的延迟。
- **Rmap (Reverse Mapping)**: 为了更高效地回收内存，引入了反向映射机制，可以快速找到物理页被哪些页表引用，极大地提升了页面回收（Page Reclaim）的效率。
- **OOM Killer 改进**: 更加智能地选择被杀死的进程，引入 `oom_score_adj` 让用户可控。

### 1.3 现代演进：容器化与大数据 (3.x - 5.x+)

- **Cgroups Memory Controller**: 容器技术的基石。它不仅限制了进程组的内存使用上限 (Hard Limit)，还引入了 Soft Limit 和复杂的回收策略，使得多租户隔离成为可能。
- **THP (Transparent Huge Pages)**: 针对内存密集型应用（如数据库、大数据处理），自动将 4KB 小页合并为 2MB 大页，减少 TLB Miss，提升性能。但也带来了内存碎片和分配延迟（Latency）的挑战。
- **PSI (Pressure Stall Information)**: Facebook 贡献的特性。传统的 Load Average 无法准确反映内存压力，PSI 通过量化因资源缺乏导致的“任务停顿时间”，提供了更精准的系统压力指标。
- **eBPF Tracing**: 利用 eBPF 技术，可以低开销地对内存分配路径（kmalloc/kfree）、缺页异常（page fault）进行细粒度观测。

## 2. 核心概念深度解析

### 2.1 内存寻址与分页 (Addressing & Paging)
Linux 使用多级页表（Page Table）将虚拟地址映射到物理地址。

- **MMU (Memory Management Unit)**: 硬件负责地址转换。
- **TLB (Translation Lookaside Buffer)**: 页表的缓存。TLB Miss 是内存密集型应用性能杀手之一。
- **Page Fault**:
    - **Minor Fault**: 页面在内存中（如 Page Cache），只需建立映射。
    - **Major Fault**: 页面不在内存，需要从磁盘读取（Swap 或文件），开销巨大。

### 2.2 内存分配器 (Allocators)

- **Buddy System**: 物理内存的“批发商”，以页（4KB）为单位管理。
- **Slab/Slub/Slob**: 物理内存的“零售商”。现代 Linux 默认使用 **Slub**，它是 Slab 的优化版，去除了复杂的队列管理，更加适应多核扩展。
- **Vmalloc vs Kmalloc**: `kmalloc` 分配物理连续内存（性能好，适合 DMA），`vmalloc` 分配虚拟连续但物理不连续内存（适合大块分配）。

### 2.3 内存回收 (Page Reclaim)

当内存不足时，内核通过 `kswapd` 线程回收内存。

- **LRU 链表**: Active/Inactive List，区分匿名页（Anon）和文件页（File）。
    - **File Pages**: 容易回收，直接丢弃（Clean）或回写（Dirty）。
    - **Anon Pages**: 必须通过 **Swap** 机制交换到磁盘才能回收。
- **Swappiness**: 控制内核回收匿名页和文件页的倾向性。`vm.swappiness=0` 并不意味着禁用 Swap，而是最大限度优先回收文件页。

## 3. 常用观测与分析

### 3.1 理解 `free` 命令
使用 `free -m` 时，关注 `available` 字段而非 `free`。

> **Note**: `available` 包含了 `free` 以及可被立即回收的 Page Cache。
> `The "available" memory accounts for that. It sums up all memory that is unused or can be freed immediately.`

```shell
              total        used        free      shared  buff/cache   available
Mem:          15903        3288        7868         878        4747       11442
Swap:             0           0           0
```

### 3.2 关键指标
- **Buffer vs Cache**:
    - `Buffer`: 块设备（Block Device）的元数据缓存。
    - `Cache`: 文件系统（File System）的数据缓存（Page Cache）。
- **SReclaimable**: `cat /proc/meminfo` 中可以看到，这部分是 Slab 中可回收的内存（如 dentry, inode cache）。如果这部分很大，说明存在大量文件操作。

### 3.3 常见问题模式
- **内存泄漏 (Memory Leak)**: 进程申请内存不释放。可通过 `valgrind` 或 eBPF 工具排查。
- **内存碎片 (Fragmentation)**: `cat /proc/buddyinfo` 查看。如果低阶页很多但高阶页为 0，说明碎片严重，可能导致高阶内存申请（如 Huge Pages）失败。
- **False OOM**: 看起来还有 `free` 内存却发生了 OOM，通常是因为 LowMem 耗尽（32位系统）或碎片化导致无法分配连续物理内存。
