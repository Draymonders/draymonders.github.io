# 延迟队列

探索下延迟队列的实现方式

> 以下均为自行猜想，并未看过源码！

## 多级队列

1. producer 发往 中转的队列 topic_delay_1s / topic_delay_1h / topic_delay_1d （每个mirror_topic 是有序的）
2. broker 内部，监听中转队列的队首的index，如果发现大于当前时间，就将消息转移到真实的topic内


## 有序性的可持久化

eg. 堆，二叉树之类可持久化的数据结构

1. 维护 延时时间戳以及对应的msgId 
2. 监听最小时间的数据，如果发现大于当前时间，就将消息转移到真实的topic内


```go
func NewDelayMessage(topic string, delayLevel int32, body []byte) *Message {
	return NewDefaultMessage(topic, body).WithDelayLevel(delayLevel)
}

func NewDeferMessage(topic string, deferDuration time.Duration, body []byte) *Message {
	return NewDefaultMessage(topic, body).WithDeferMillis(deferDuration)
}
```

## 时间轮实现

TODO