# 结构diff

## 背景

1. 对于字段特别多的 Object，有时候我们想实现 deepEqual的功能
2. 按字段一个一个的去diff，后续维护比较麻烦
3. 某些字段有特殊的逻辑


## 实现

```go
package utils

import (
	"reflect"
)

type ICompare interface {
	Equal(interface{}) bool
}

// 建议特殊字段实现上面这个ICompare接口
func DeepEqual(x, y interface{}) (bool, []string) {

	v1 := reflect.ValueOf(x)
	v2 := reflect.ValueOf(y)
	if v1.Type() != v2.Type() {
		// 类型都不一样
		logs.Warn(defines.UnusualAlarm+"v1Type=%+v, v2Type=%+v, x=%+v, y=%+v", v1.Type(), v2.Type(), x, y)
		return false, nil
	}

	t := reflect.TypeOf(x)
	switch v1.Kind() {
	case reflect.Ptr:
		return deepEqualWithField(v1.Elem(), v2.Elem(), t.Elem())
	case reflect.Struct:
		return deepEqualWithField(v1, v2, t)
	default:
		// 不支持
		logs.Warn(defines.UnusualAlarm+"kind=%+v, x=%+v, y=%+v", v1.Kind(), x, y)
		return false, nil
	}
}

func deepEqualWithField(v1, v2 reflect.Value, t reflect.Type) (bool, []string) {
	diffNames := make([]string, 0)

	// 遍历所有的字段
	for i := 0; i < v1.NumField(); i++ {
		// field为type StructField类型
		field := v1.Field(i)
		if !isEqual(field.Interface(), v2.Field(i).Interface()) {
			diffNames = append(diffNames, t.Field(i).Name)
		}
	}

	return len(diffNames) == 0, diffNames
}

func isEqual(x, y interface{}) bool {
	if x, ok := x.(ICompare); ok {
		if x.Equal(y) {
			return true
		}
		return false
	}
	return reflect.DeepEqual(x, y)
}

```