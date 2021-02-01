一个demo，待实践

抽空运行一下go的结果
```go
package main

import (
	"fmt";
	"os"
)

func main() {
    name := "test.txt"
	f, err := os.Open(name)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	if d, err := f.Stat(); err != nil {
		f.Close()
		_ = d
		fmt.Println(err)
		os.Exit(1)
    }
    // 猜测err打印什么结果
	fmt.Println(err)
}
```