一个demo，待实践

抽空运行一下go的结果
```go
package main

import (
	"fmt";
	"os"
)

func main() 
	name := "go.mod"
	f, err := os.Open(name)
	if err != nil {
		log.Println(err)
		os.Exit(1)
	}
	defer f.Close()
	f = nil
	// time.Sleep(10 * time.Second)
	if _, err := f.Stat(); err != nil {
		log.Println(err)
	}
	// 猜测err打印什么结果
	fmt.Println(err)
}
```

输出结果

```
invalid argument
<nil>
```