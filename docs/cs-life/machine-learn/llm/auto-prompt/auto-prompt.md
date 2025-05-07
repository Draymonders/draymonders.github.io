# LLM大模型

## Prompt Engineer

有没有可能像深度学习一样，可以借助大模型进行prompt的自我完善与迭代？

```python
init_prompt = "prompt随便写"
datasets = [{"input": "", "y": ""}] # 上下文信息
dataloader = dataloader(datasets,batch_size=10)

prompt = init_prompt

#迭代轮次
for epoch in range(epoches): 
	datas = dataloader.load()
	# 自主推导
	cot = train(datas['input'], prompt) 
	# 推导符合预期
	if cot['result'] == datas['y']: 
		# 应用思维链到prompt里
		prompt = apply_cot(prompt, cot)
	else:
		# 反思哪里不对
		cot = reflect(datas['input'], cot, datas['y'])
		prompt = apply_cot(prompt, cot)
```

新版本思路

```python
init_prompt = "初始版提示词"
datasets = [{"input": "业务输入", "label": "场景A"}]
dataloader = dataloader(datasets, batch_size=10)

prompt = init_prompt

for epoch in range(epoches):
	datas = dataloader.load()
	# 批量推理
	pred_datas = batch_llm(prompt, datas['input']) 

	# 找出推理不符合预期的数据
	error_datas = pred_datas[scene] != datas['label']
	# 思考哪里不符合预期
	step_cot_datas = batch_llm(error_datas['input', 'scene', 'label'])
	# 优化prompt
	prompt = batch_llm(prompt, step_cot_datas)
```
