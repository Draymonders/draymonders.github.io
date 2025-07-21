# Trae Agent： AI Coding Agent

> 代码仓库：https://github.com/bytedance/trae-agent

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