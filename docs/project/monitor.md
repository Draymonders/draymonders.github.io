# 打点以及监控

## 按时间维度去做不同的监控判断

```bosun
$second = (epoch() + (3600 * 8)) % 86400
$hour = ($second / 3600)

$key = "sum:ecqc.verify.fxg_product.ProductHumanAudit{ProductHumanProjectId=6964615879510229536}"

$q1 = avg(q($key, "2m", "1m")) // 前2分钟到前1分钟
$q2 = avg(q($key, "3m", "2m"))
$q3 = avg(q($key, "4m", "3m"))
$q4 = avg(q($key, "5m", "4m"))
$q5 = avg(q($key, "6m", "5m"))

warn = $q1 < 0.03 && $q2 < 0.03 && $q3 < 0.03 && $q4 < 0.03 && $q5 < 0.03 && ($hour >= 6 && $hour < 24) || ($hour >= 0 && $hour < 2)
runEvery=1
```

## 剔除压测集群的报警

```bosun
not_literal_or(stress)
```

## 监控子任务

tagName="deploy_stage"

在grafana的alias填写如下

```bosun
monitor_$tag_deploy_stage
```

监控会显示 `monitor_canary`,`monitor_single_dc`,`monitor_all_dc`
