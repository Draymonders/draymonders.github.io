# Go

## 基础用法

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
