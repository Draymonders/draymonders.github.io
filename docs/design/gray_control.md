# 灰度控制

## 需求

好用的灰度逻辑必然少不了以下几点

1. 是否开启，只有在开启的情况下才会走后续逻辑
2. 黑名单，命中黑名单的直接走老逻辑
    - 兜底使用，防止新逻辑在某种情况下有问题，及时止损，先加入到黑名单，后续代码修复完，继续走新逻辑
3. 白名单，命中白名单的直接通过，走新逻辑
4. 按比例灰度，比如 productId, shopId, holderId


## 代码欣赏

```golang
type GrayConfig struct {
	Switch    bool    `json:"switch"`
	Range     int64   `json:"range"`
	WhiteList []int64 `json:"white_list,omitempty"`
	BlockList []int64 `json:"block_list,omitempty"`
}

func IsGray(ctx context.Context, grayKey string, id int64) bool {
	key := grayKey

	val, err := tccClient.Get(ctx, key)
	if err != nil {
		logs.CtxError(ctx, "[%s] tccClient.Get fail, err: %v", key, err)
		return false
	}
	if env.IsBoe() || env.IsPPE() {
		logs.CtxNotice(ctx, "[%s] val %s", key, val)
	}
	grayConfig := &GrayConfig{}
	if err = json.Unmarshal([]byte(val), &grayConfig); err != nil {
		logs.CtxError(ctx, "[%s] json.Unmarshal fail, err: %v", key, err)
		return false
	}
    if !grayConfig.Switch {
        return false
    }

	for _, blockObj := range grayConfig.BlockList {
		if id == blockObj {
			return false
		}
	}

	for _, whiteObj := range grayConfig.WhiteList {
		if id == whiteObj {
			return true
		}
	}

	return id%10000 < grayConfig.Range
}
```