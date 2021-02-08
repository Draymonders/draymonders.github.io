## go踩坑

### go proxy

设置 `GOPROXY` 变量， 详细点击 https://goproxy.io/

### go mod

创建module `go mod init steed`

### goland keymap

- `Reformat Code` `ctrl + 1`
- `Back` `ctrl + alt + ,`
- `Forward` `ctrl + alt + .`

### log

```go
log.SetFlags(log.Ltime + log.Lshortfile)
```

### error

```go
err := errors.New("empty name")
if err != nil {
    log.Fatal(err)
}
```

### rand

```go
rand.Seed(time.Now().Unix())

rand.Int()
rand.Intn(n int32)
```

### struct

`struct`是值类型
```go
type A struct {
	a int
}

type B struct {
	a A
}

func useB(b B) {
	b.a = A{a: 1}
}

func useBWithPointer(b *B) {
	log.Printf("val: %v\n", b.a)
}

func testStruct1() {
	b := B{
		a: A{
			a: 233,
		},
	}
	useB(b)
	useBWithPointer(&b)
}
```

结果
```
val: {233}
```

### new和make

- new allocates memory, does not initialize the memory, it only **zeros** it.
    * `new(File)` 和 `&File{}` 等价
- make creates slices, maps, and channels only, and it returns an initialized (**not zeroed**) value of type `T`.

### Array

- Arrays are values. Assigning one array to another copies all the elements.
- In particular, if you pass an array to a function, it will receive a copy of the array, not a pointer to it.
- The size of an array is part of its type. The types `[10]int` and `[20]int` are distinct.

```go
func Sum(a *[3]float64) (sum float64) {
    for _, v := range *a {
        sum += v
    }
    return
}

array := [...]float64{7.0, 8.5, 9.1}
x := Sum(&array)  // Note the explicit address-of operator
```


### Concurrency

- Do not communicate by sharing memory; instead, share memory by communicating.
- 