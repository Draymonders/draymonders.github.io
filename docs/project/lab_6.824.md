# MIT 6.824

## Lab1. Map and Reduce

目标: 实现一个`Map Reduce`程序，有很多测试，对我来说很友好


- 实现 `mapper/reducer`
- 考虑RPC请求，我设计了两个RPC请求
    - `AssignRpc` worker向coordinator申领任务
    - `CompleteRpc` worker完成任务后，告知coordinator
- 这里还涉及到了**分配任务**的状态
- `coordiantor`实现，重点就在于**判断map/reduce任务的状态**

### 状态设计
```go
type AssignType int
const (
	TypeWait     AssignType = iota // 等待任务分配状态(map/reduce分配了，还未执行完; 所以有等待状态)
	TypeMap                        // 分配任务为map
	TypeReduce                     // 分配任务为reduce
	TypeComplete                   // 分配任务为shutdown
)

// State 一个Job的状态
type State int64

const (
	MapAssign    State = iota // map分配/执行中
	ReduceAssign              // reduce分配/执行中
	Done                      // 完成
)

// TaskState 单独一个map/reduce任务的状态
type TaskState int64

const (
	Idle     TaskState = iota // 空闲中
	Running                   // 运行中
	Abort                     // 超时被废弃
	Finished                  // 完成
)
```

### 实体设计

```go
type Coordinator struct {
	mux               *sync.RWMutex // 保护共享变量
	inputFiles        []string      // 输入文件
	nReduce           int64         // nReduce 个reducer
	State                           // 整体状态
	intermediateFiles [][]string    // 中间文件
	*idGenerator                    // workerId生成器
	taskQueue         chan *task    // 任务队列，存有 map 和 reduce 任务
	taskMetas         []*taskMeta   // 任务携带的meta信息，用来判断运行状态，以及超时处理
}

type Mapper struct {
	Id        int64
	filenames []string // 目前一个mapper只有一个filename，方便后续拓展
	mapf      func(string, string) []KeyValue
	nReduce   int64
}

type Reducer struct {
	Id        int64
	filenames []string // reducer会接受多个file
	reducef   func(string, []string) string
}
```

### RPC请求

```go
// AssignRequest 分配请求
type AssignRequest struct {
}

// AssignResponse 分配响应
type AssignResponse struct {
	Id         int64    // WorkerId，每个worker请求都会返回一个全局不同的Id
	AssignType          // 任务类型
	Filenames  []string // 文件名，map 需要1个文件，reduce需要多个文件
	NReduce    int64    // reduce worker num, mapWorker need
}

// CompleteRequest 任务完成
type CompleteRequest struct {
	Id        int64    // 完成任务的id
	Filenames []string // 任务生成的文件名
}

// CompleteResponse 任务完成响应
type CompleteResponse struct {
}
```

### 感受

- `log`写的标准，耐心测试，很容易看到代码存在的漏洞

## Lab 2. Raft KV

TODO 