# Go 的 Web / RPC 框架

## web工作方式的几个概念

Request：用户请求的信息，用来解析用户的请求信息，包括post、get、cookie、url等信息

Response：服务器需要反馈给客户端的信息

Conn：用户的每次请求链接

Handler：处理请求和生成返回信息的处理逻辑

## 1. net/http 运行机制

下图是Go实现Web服务的工作模式的流程图

![](http.png?raw=true)

图1. http包执行流程

1. 创建Listen Socket, 监听指定的端口, 等待客户端请求到来。

2. Listen Socket接受客户端的请求, 得到Client Socket, 接下来通过Client Socket与客户端通信。

3. 处理客户端的请求, 首先从Client Socket读取HTTP请求的协议头, 如果是POST方法, 还可能要读取客户端提交的数据, 然后交给相应的handler处理请求, handler处理完毕准备好客户端需要的数据, 通过Client Socket写给客户端。

这整个的过程里面我们只要了解清楚下面三个问题，也就知道Go是如何让Web运行起来了

- 如何监听端口？
- 如何接收客户端请求？
- 如何分配handler？

前面小节的代码里面我们可以看到，Go是通过一个函数`ListenAndServe`来处理这些事情的，其实现源码如下：

```Go
func ListenAndServe(addr string, handler Handler) error {
	server := &Server{Addr: addr, Handler: handler}
	return server.ListenAndServe()
}

```

`ListenAndServe`会初始化一个`sever`对象，然后调用了`Server`对象的方法`ListenAndServe`。其源码如下：

```Go
func (srv *Server) ListenAndServe() error {
	if srv.shuttingDown() {
		return ErrServerClosed
	}
	addr := srv.Addr
	if addr == "" {
		addr = ":http"
	}
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}
	return srv.Serve(ln)
}

```

`ListenAndServe`调用了`net.Listen("tcp", addr)`，也就是底层用TCP协议搭建了一个服务，最后调用`src.Serve`监控我们设置的端口。监控之后如何接收客户端的请求呢？

`Serve`的具体实现如下(为突出重点，仅展示关键代码)，通过下面的分析源码我们可以看到客户端请求的具体处理过程：

```Go

func (srv *Server) Serve(l net.Listener) error {
	...

	ctx := context.WithValue(baseCtx, ServerContextKey, srv)
	for {
		rw, err := l.Accept()
		...

		connCtx := ctx
		if cc := srv.ConnContext; cc != nil { // wrap ctx
			connCtx = cc(connCtx, rw)
			if connCtx == nil {
				panic("ConnContext returned nil")
			}
		}
		...
		c := srv.newConn(rw)
		c.setState(c.rwc, StateNew, runHooks) // before Serve can return
		go c.serve(connCtx)
	}
}

```

这个函数里面起了一个`for{}`，首先通过Listener接收请求：`l.Accept()`，其次创建一个Conn：`c := srv.newConn(rw)`，最后单独开了一个goroutine，把这个请求的数据当做参数扔给这个conn去服务：`go c.serve(connCtx)`。这个就是高并发体现了，用户的每一次请求都是在一个新的goroutine去服务，相互不影响。

那么如何具体分配到相应的函数来处理请求呢？我们继续分析conn的`serve`方法，其源码如下(为突出重点，仅展示关键代码)：

```Go
func (c *conn) serve(ctx context.Context) {
    ...

	ctx, cancelCtx := context.WithCancel(ctx)
	c.cancelCtx = cancelCtx
	defer cancelCtx()

	c.r = &connReader{conn: c}
	c.bufr = newBufioReader(c.r)
	c.bufw = newBufioWriterSize(checkConnErrorWriter{c}, 4<<10)

	for {
		w, err := c.readRequest(ctx)
        ...

		// HTTP cannot have multiple simultaneous active requests.[*]
		// Until the server replies to this request, it can't read another,
		// so we might as well run the handler in this goroutine.
		// [*] Not strictly true: HTTP pipelining. We could let them all process
		// in parallel even if their responses need to be serialized.
		// But we're not going to implement HTTP pipelining because it
		// was never deployed in the wild and the answer is HTTP/2.
		serverHandler{c.server}.ServeHTTP(w, w.req)
		w.cancelCtx()
        ...

	}
}
```

conn首先会解析request:`w, err := c.readRequest(ctx)`, 然后获取相应的handler去处理请求:`serverHandler{c.server}.ServeHTTP(w, w.req)`，`ServeHTTP`的具体实现如下：

```Go
func (sh serverHandler) ServeHTTP(rw ResponseWriter, req *Request) {
	handler := sh.srv.Handler
	if handler == nil {
		handler = DefaultServeMux
	}
	if req.RequestURI == "*" && req.Method == "OPTIONS" {
		handler = globalOptionsHandler{}
	}
	handler.ServeHTTP(rw, req)
}
```

`sh.srv.Handler`就是我们刚才在调用函数`ListenAndServe`时候的第二个参数，我们前面例子传递的是nil，也就是为空。

那么默认获取`handler = DefaultServeMux`,那么这个变量用来做什么的呢？

对，这个变量就是一个路由器，它用来匹配url跳转到其相应的handle函数，那么这个我们有设置过吗?

有，我们调用的代码里面第一句不是调用了`http.HandleFunc("/", sayhelloName)`嘛。

这个作用就是注册了请求`/`的路由规则，当请求uri为"/"，路由就会转到函数sayhelloName，DefaultServeMux会调用ServeHTTP方法，这个方法内部其实就是调用sayhelloName本身，最后通过写入response的信息反馈到客户端。

详细的整个流程如下图所示：

![](illustrator.png?raw=true)

图2. 一个http连接处理流程


## 2. net/rpc 运行机制



看下net/rpc框架的实现

![](rpc.png?raw=true)

图3. net/rpc框架连接处理流程


### 2.1 client 源码简易分析

简述

1. client 使用了生产者消费者的模式，解耦了消息发送与消息接受的处理
2. client 采用自增序列号，实现了 链接的多路复用（避免一个rpc，创建一个tcp链接）


首先Dial，和server建立链接

```go
// Dial connects to an RPC server at the specified network address.
func Dial(network, address string) (*Client, error) {
	conn, err := net.Dial(network, address)
	...
	return NewClient(conn), nil
}
```

接着查看 `NewClient`，着重看 `client.input`的实现

```go
func NewClient(conn io.ReadWriteCloser) *Client {
	encBuf := bufio.NewWriter(conn)
	client := &gobClientCodec{conn, gob.NewDecoder(conn), gob.NewEncoder(encBuf), encBuf}
	return NewClientWithCodec(client)
}

func NewClientWithCodec(codec ClientCodec) *Client {
	client := &Client{
		codec:   codec,
		pending: make(map[uint64]*Call),
	}
	go client.input() // 开一个协程处理当前链接的所有请求和响应
	return client
}

func (client *Client) input() {
	for err == nil {
		response = Response{}
		err = client.codec.ReadResponseHeader(&response) // 如果没有输出流，则阻塞等待，否则读一下conn的输出流的header，并decode，
		...
		seq := response.Seq // 拿到响应序号（客户端生成的请求序号）
		client.mutex.Lock()
		call := client.pending[seq]  // 拿到对应的call对象
		delete(client.pending, seq)
		client.mutex.Unlock()

		switch {
			... 
		default:
			err = client.codec.ReadResponseBody(call.Reply) // 将Resp.Body赋值给 call.Reply，并通知call.Done()
			...
			call.done()
		}
	}
}

func (call *Call) done() {
	select {
	case call.Done <- call:
		// ok
		... 
	default:
		...
	}
}
```


client执行的请求的时候，同步调用Call方法（本质上是构建call对象，并等待call对象里面的Done chan消息）

```go
args := &Args{7, 8}
reply := new(Reply)
err := client.Call("Arith.Add", args, reply)

func (client *Client) Call(serviceMethod string, args interface{}, reply interface{}) error {
	call := <-client.Go(serviceMethod, args, reply, make(chan *Call, 1)).Done
	return call.Error
}

func (client *Client) Go(serviceMethod string, args interface{}, reply interface{}, done chan *Call) *Call {
	call := new(Call)
	call.ServiceMethod = serviceMethod
	call.Args = args
	call.Reply = reply
	...
	call.Done = done
	client.send(call) 
	return call
}

func (client *Client) send(call *Call) {
	client.reqMutex.Lock()
	defer client.reqMutex.Unlock()

	// Register this call.
	client.mutex.Lock()
	...
	seq := client.seq
	client.seq++   // 每次请求序号自增下
	client.pending[seq] = call // 将call加入到 pending list里，由input()方法来消费
	client.mutex.Unlock()

	// Encode and send the request.
	client.request.Seq = seq
	client.request.ServiceMethod = call.ServiceMethod
	err := client.codec.WriteRequest(&client.request, call.Args)
	....
}
```


### 2.2 server 源码简易分析

简述

1. 消费者同http框架，对于每个conn都进行异步处理，每个req又单独开了协程去处理，有效提升服务端的吞吐。
2. 采用了反射，将method挂靠在一个struct对象（将struct注册为一个Service），并对方法实现有着严格定义，必须符合 `func (t *structName) Add(args *Args, reply *Reply) error`


看下server对象的定义

```go
// Server represents an RPC Server.
type Server struct {
	serviceMap sync.Map   // map[string]*service  存放service
	reqLock    sync.Mutex // protects freeReq
	freeReq    *Request
	respLock   sync.Mutex // protects freeResp
	freeResp   *Response
}
```

首先Register service

```go
// Register publishes the receiver's methods in the DefaultServer.
func Register(rcvr interface{}) error { return DefaultServer.Register(rcvr) }

func (server *Server) Register(rcvr interface{}) error {
	return server.register(rcvr, "", false)
}

func (server *Server) register(rcvr interface{}, name string, useName bool) error {
	s := new(service)
	s.typ = reflect.TypeOf(rcvr)
	s.rcvr = reflect.ValueOf(rcvr)
	sname := reflect.Indirect(s.rcvr).Type().Name() // 获取struct name
	if useName {
		sname = name
	}
	... 
	s.name = sname

	// Install the methods
	s.method = suitableMethods(s.typ, true) // 遍历所有符合条件的Methods
	... 
	if _, dup := server.serviceMap.LoadOrStore(sname, s); dup {
		return errors.New("rpc: service already defined: " + sname)
	}
	return nil
}
```

接着如同 http server 一样，绑定端口，`ListenAndServe`

``` go
var l net.Listener
l, newServerAddr = listenTCP()
log.Println("NewServer test RPC server listening on", newServerAddr)
go newServer.Accept(l)

func listenTCP() (net.Listener, string) {
	l, e := net.Listen("tcp", "127.0.0.1:0") // any available address
	if e != nil {
		log.Fatalf("net.Listen tcp :0: %v", e)
	}
	return l, l.Addr().String()
}

func (server *Server) Accept(lis net.Listener) {
	for {
		conn, err := lis.Accept()
		if err != nil {
			log.Print("rpc.Serve: accept:", err.Error())
			return
		}
		go server.ServeConn(conn)
	}
}

func (server *Server) ServeConn(conn io.ReadWriteCloser) {
	buf := bufio.NewWriter(conn)
	srv := &gobServerCodec{
		rwc:    conn,
		dec:    gob.NewDecoder(conn),
		enc:    gob.NewEncoder(buf),
		encBuf: buf,
	}
	// 主要定义好 编码
	server.ServeCodec(srv)  
}

func (server *Server) ServeCodec(codec ServerCodec) {
	sending := new(sync.Mutex)
	wg := new(sync.WaitGroup)
	for {
		// 根据request 获取 service，method，req，argv，replyv
		service, mtype, req, argv, replyv, keepReading, err := server.readRequest(codec)
		...
		wg.Add(1)
		go service.call(server, sending, wg, mtype, req, argv, replyv, codec)
	}
	// We've seen that there are no more requests.
	// Wait for responses to be sent before closing codec.
	wg.Wait()
	codec.Close()
}

func (server *Server) readRequest(codec ServerCodec) (service *service, mtype *methodType, req *Request, argv, replyv reflect.Value, keepReading bool, err error) {
	service, mtype, req, keepReading, err = server.readRequestHeader(codec)
	if err != nil {
		...
	}

	// Decode the argument value.
	argIsValue := false // if true, need to indirect before calling.
	if mtype.ArgType.Kind() == reflect.Ptr {
		argv = reflect.New(mtype.ArgType.Elem())
	} else {
		argv = reflect.New(mtype.ArgType)
		argIsValue = true
	}
	// argv guaranteed to be a pointer now.
	if err = codec.ReadRequestBody(argv.Interface()); err != nil {
		return
	}
	if argIsValue {
		argv = argv.Elem()
	}

	replyv = reflect.New(mtype.ReplyType.Elem())

	switch mtype.ReplyType.Elem().Kind() {
	case reflect.Map:
		replyv.Elem().Set(reflect.MakeMap(mtype.ReplyType.Elem()))
	case reflect.Slice:
		replyv.Elem().Set(reflect.MakeSlice(mtype.ReplyType.Elem(), 0, 0))
	}
	return
}

// 根据请求获取 mtype，req （mtype是method的反射信息）
func (server *Server) readRequestHeader(codec ServerCodec) (svc *service, mtype *methodType, req *Request, keepReading bool, err error) {
	// Grab the request header.
	req = server.getRequest()
	err = codec.ReadRequestHeader(req)
	...

	// We read the header successfully. If we see an error now,
	// we can still recover and move on to the next request.
	keepReading = true

	// 请求传来的 ServiceMethod 是 serviceName.MethodName
	dot := strings.LastIndex(req.ServiceMethod, ".")
	...
	serviceName := req.ServiceMethod[:dot]
	methodName := req.ServiceMethod[dot+1:]

	// Look up the request.
	svci, ok := server.serviceMap.Load(serviceName)
	...
	svc = svci.(*service)
	mtype = svc.method[methodName]
	if mtype == nil {
		err = errors.New("rpc: can't find method " + req.ServiceMethod)
	}
	return
}

// 根据获取的method和req，反射执行方法
func (s *service) call(server *Server, sending *sync.Mutex, wg *sync.WaitGroup, mtype *methodType, req *Request, argv, replyv reflect.Value, codec ServerCodec) {
	if wg != nil {
		defer wg.Done()
	}
	mtype.Lock()
	mtype.numCalls++
	mtype.Unlock()
	function := mtype.method.Func
	// Invoke the method, providing a new value for the reply.
	returnValues := function.Call([]reflect.Value{s.rcvr, argv, replyv})
	// The return value for the method is an error.
	errInter := returnValues[0].Interface()
	errmsg := ""
	if errInter != nil {
		errmsg = errInter.(error).Error()
	}
	server.sendResponse(sending, req, replyv.Interface(), codec, errmsg)
	server.freeRequest(req)
}
```