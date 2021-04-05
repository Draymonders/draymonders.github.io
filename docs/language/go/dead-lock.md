# 死锁

## 缓存太小而阻塞

推测是因为只有一个协程，因为 `buffer`满了，并没有另外协程去取，导致一直阻塞而死锁

```go
func testBufferedChannel() {
	c := make(chan int, 1)
	c <- 1
	c <- 2
	fmt.Println(<-c)
	fmt.Println(<-c)
}
```