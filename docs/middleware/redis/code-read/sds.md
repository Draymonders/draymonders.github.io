# sds

简单动态字符串

## 数据结构

```cpp
struct __attribute__ ((__packed__)) sdshdr8 {
    uint8_t len; /* used */
    uint8_t alloc; /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
```

- `__attribute__ ((__packed__))`这个是为了字节对齐，不按照默认的元素的最小公倍数对齐，而是按照`1`字节进行对齐
- sds对外暴露的是`buf`指针，flags的低三位可以获取当前`sds`的结构体类型，从而确定结构体的整体大小(hdr8, hdr16, hdr32...)

### 扩容操作

`SDS_MAX_PREALLOC = 1M`

```cpp
if (newlen < SDS_MAX_PREALLOC)
    newlen *= 2;
else
    newlen += SDS_MAX_PREALLOC;
```

## Reference

- Redis 5设计与源码分析
- [Redis的Simple Dynamic String](https://axlgrep.github.io/tech/redis-sds.html)