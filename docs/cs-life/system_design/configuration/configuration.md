# 配置化

B端业务发展迅速，有很多个性化的诉求，但是部分功能是可以沉淀下来的，配置化的结果。

像现在哨兵提供的，就是通用的能力

- 离线数据回扫，过哨兵策略，执行动作
- 在线事件，数据源，因子，策略，执行动作
- 策略命中监控

配置化的结果就是，上下游从原先的**强IDL字段定义**，过渡为 `map[key][ interface{} | json ]`  （有点儿像强类型 弱化成 弱类型的数据）

## 实现

### 基础数据加载


上下游数据交互有大概几种方式

- Rpc
- http
- MQ
- Redis
- Mysql


Rpc:

> 泛化调用不需要依赖二方包，使用其特定的GenericService接口，传入需要调用的方法名、方法签名和参数值进行调用服务。

需要如下信息 `psm`, `idl-branch`, `idl-version`, `method`, `cluster` 以及 `request`

MQ:

需要如下信息 `topic`, `cluster`, `mq type`, `partition key`, `msgBody`, `duration`（延时时间）

- [曹大：一劳永逸接入下游系统](https://xargin.com/integrate-downstream-data-system-all-in-one/)

```go
type RpcTengoAdapter interface {
	Call(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	CallWithOption(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	BatchRpc(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	SingleBatchRpc(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	Init(psm string, initiator generic.InitiatorType) error
	// Refresh(psm string, initiator generic.InitiatorType) error
}

type RpcCompatAdapter interface {
	Call(ctx context.Context, args ...ecom_tengo.Object) (ret ecom_tengo.Object, err error)
	CallWithOptions(ctx context.Context, args ...ecom_tengo.Object) (ret ecom_tengo.Object, err error)
	BatchCall(ctx context.Context, args ...ecom_tengo.Object) (result ecom_tengo.Object, err error)
	SingleBatchCall(ctx context.Context, args ...ecom_tengo.Object) (result ecom_tengo.Object, err error)
}

type MqTengoAdapter interface {
	SendRocketMq(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	SendEventbus(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
}

type MetricsAdapter interface {
	CtxCounter(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	CtxRateCounter(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	CtxTimer(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	CtxMeter(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
}

type BatchAdapter interface {
	CallEx(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
}

type CacheAdapter interface {
	Get(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	Del(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	HGet(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	HDel(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	BatchHGet(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	MGet(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	LPop(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	LLen(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	SPop(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	SCard(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	GeoRadius(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	ZScore(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	Set(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	MSet(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	SetNX(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	HSet(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	HMSet(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	HIncrBy(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	Incr(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
	IncrBy(ctx context.Context, args ...ecom_tengo.Object) (r ecom_tengo.Object, err error)
}
```

### 数据组装编排

- `DAG` 编排


## 引用文档

- https://tech.meituan.com/2018/07/26/sep-service-arrange.html