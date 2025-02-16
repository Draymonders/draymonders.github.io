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