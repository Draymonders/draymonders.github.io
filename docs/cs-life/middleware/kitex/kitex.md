# KiteX

官方文档 https://www.cloudwego.io/docs/

## 代码生成

最简单的thift文件  `echo.thrift`

```thrift
namespace go api

struct Request {
  1: string message
}

struct Response {
  1: string message
}

service EchoService {
    Response echo(1: Request req)
}
```

`kitex -service cn.test.example echo.thrift` 生成客户端、服务端相关文件

目录树
```
.
├── build.sh                             - 编译文件
├── conf                            
│   └── kitex.yml                        - 配置文件
├── echo.thrift                          - thrift配置
├── handler.go                           - idl接口Impl，写rpc业务逻辑
├── kitex_gen
│   └── api
│       ├── echoservice
│       │   ├── client.go
│       │   ├── echo.go
│       │   ├── invoker.go
│       │   └── server.go
│       ├── echo.go                      - idl生成的实体，包括req、resp、service
│       ├── k-consts.go
│       └── k-echo.go
├── main.go
└── script
    ├── bootstrap.sh
    └── settings.py
```

