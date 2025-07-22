# Agent

## 通用 Agent

Manus的发布让人眼前一亮，突出的点在于

- 处理任务会先生成TodoList，过程中不断更新TodoList
- 能较好的利用工具、包括浏览器、搜索引擎、生成文档

Manus官方的[Context Engineer的经验分享](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)

核心点

- 利用 KV Cache，降低模型调用成本
- 利用 响应预填充，引导模型强制使用对应的工具

## 代码 Agent

当前市场上比较较为火的是 Cursor、Claude Code、Trae

### Trae Agent

本人用的公司的Trae，简单看了下现有[开源引擎的代码](https://github.com/bytedance/trae-agent)

文章解读：https://www.cnblogs.com/xiaoqi/p/18971235/Trae-Agent

新奇的点

- [Prompt](https://github.com/bytedance/trae-agent/blob/main/trae_agent/prompt/agent_prompt.py)
- [Ckg（Code Knowledge Grpah）](https://github.com/bytedance/trae-agent/blob/main/trae_agent/tools/ckg/ckg_database.py): 维护代码的函数和类的原信息到本地数据库，
- [sequential thinking](https://github.com/bytedance/trae-agent/blob/main/trae_agent/tools/sequential_thinking_tool.py)：对之前想法进行质疑和修改，

代码入口

```python
task_args = {
    "project_path": working_dir,
    "issue": task,
    "must_patch": "true" if must_patch else "false",
    "patch_path": patch_path,
}
agent.new_task(task, task_args)
_ = asyncio.run(agent.execute_task())
```

## 感想

现有的Agent的使用体验

- 对于从0到1的项目的构建提效是很大的
- 对于维护很久的代码仓需要更大的上下文才能使Agent理解，这是未来的突破点