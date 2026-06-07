# AI 认知

- 知识平权
- AI是能力放大器，不是生成器
- 学会结构化表达，造原子能力，由大模型去执行编排
- AI能力很强，人要站在更高角度去拆解任务，分派任务，协调任务
- AI Agent First，构建个人知识库，重复执行的事渐渐放权给AI去做
- AI 搭建自己的工作流


## 发展历程

prompt engineer -> context engineering -> harness engineering

[openAI文章:在智能体优先的世界中利用 Codex](https://openai.com/zh-Hans-CN/index/harness-engineering/)
[Anthropic文章:Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

## 飞速发展思考

对比去年的话，我想到的是几个改变应该是 

1. skills机制、渐进性披露信息 
2. 模型能力的提升，对于命令行工具的使用，炉火纯青；多轮对话仍然能正常处理信息
3. 大量使用文件系统(*.md)作为模型的长期记忆
4. claude code/codex提供的Agent Teams机制，越来越像人类办公的模式，leader分配任务，大头兵解决任务

发现

1. AI 提效的关键不是盲目信任，而是把问题分析、结果校验、上下游协议和 SOP 管理好，让 AI 参与完整协同链路，而不只是输出代码。
2. 身边大致有两类人：一类极致使用 AI，主动沉淀文档、工作流和方法论；另一类主要把 AI 当补全工具，用来写函数或小接口。
3. AI 确实提升了效率，但组织预期也随之提高，更多任务会抵消一部分提效体感。
4. 新人更容易拥抱 AI；有经验的人受古法编程、排期压力、上下文梳理成本和信任问题影响，往往需要看到明确收益后才会切换。

## 个人感悟

我分享下我的感悟哈，当然仅限于我的经历； 

最开始我入职更多的是，把自己当工具人，来需求接需求，没需求就会慌自己是不是要被裁了；

后来团队尝试自行发现问题，让研发直接搞轮子/产品，这时候就过渡成 => 人要能发现你所在的小组/部门的当前核心问题是哪些，出方案优化并解决