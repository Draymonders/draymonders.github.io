# Claude Code 核心观点与实践指引

以下是对这期 **Y Combinator 对话 Boris Cherny（Claude Code 创造者）** 的核心观点提取与实践指引：

[www.youtube.com](https://www.youtube.com/watch?v=PQU9o_5rHC4)

---

## 一、产品与战略思维

### 1. 为未来的模型而非当下的模型构建

> "We don't build for the model of today. We build for the model 6 months from now."

Boris 反复强调：**不要为当前模型的能力建产品，要为 6 个月后的模型建产品**。当下模型不擅长的事情，很快就会变好。如果你只基于今天的能力做优化，会被为下一代模型构建的人"跳过"。

**实践指引：** 评估你正在做的产品或工具，问自己——"如果模型能力提升 3-5 倍，我今天花大量精力做的这个 scaffolding/workaround 还有存在必要吗？" 如果答案是否，那可能不值得投入。把精力放在模型变强后依然有价值的部分。

---

### 2. 潜在需求（Latent Demand）是产品第一原则

> "People will only do a thing that they already do. You can't get people to do a new thing."

Boris 称"潜在需求"是他在产品上最重要的信念：**不要试图让用户做新的事情，而是让他们已经在做的事情变得更简单**。

- **Plan Mode 的诞生**：用户已经在浏览器里和 Claude 聊天来写 spec，Plan Mode 只是把这个行为内置到 Claude Code 中。
- **CLAUDE.md 的诞生**：用户已经在自己写 Markdown 文件让模型读取，CLAUDE.md 只是把它标准化了。
- **Co-work 的诞生**：设计师、财务、数据科学家已经在费力地安装终端工具来使用 Claude Code，Co-work 只是给了他们一个 GUI。

**实践指引：** 观察你的用户（或自己）正在用"笨办法"做什么。那些变通方案（workaround）就是产品机会。不要从"我觉得用户需要什么"出发，而是从"用户已经在做什么"出发。

---

### 3. 永远不要跟模型对赌（The Bitter Lesson）

> "Never bet against the model."

他们在办公室墙上挂了 Rich Sutton 的 ***The Bitter Lesson***。核心推论是：**更通用的方法终将打败更特化的方法**。你花大力气做的 scaffolding（模型外的工程辅助），可能 10-20% 的性能提升会在下一个模型发布时被"免费"获得。

**实践指引：** 在决定是否投入工程资源做某个"辅助框架"时，问自己——这是在帮模型做它即将自己能做的事吗？如果是，就等；如果模型不太可能自己解决（比如特定领域的数据连接、权限管理），那才值得投入。

---

## 二、工程实践与工具使用

### 4. CLAUDE.md 应保持精简，随模型升级不断瘦身

> "Delete your CLAUDE.md and just start fresh. With every model, you have to add less and less."

Boris 的个人 CLAUDE.md 只有两行指令。他建议：如果你的 CLAUDE.md 变得很长，**删掉它，从零开始**。只在模型犯错时才逐条加回去。你会发现每次模型升级，需要添加的指令越来越少。

**实践指引：** 定期审视你的 CLAUDE.md 或类似的 system prompt 文件，删掉那些"以前需要、现在可能已经不需要"的指令。保持最小化原则。

---

### 5. Plan Mode 的高效用法——多终端并行

Boris 80% 的会话以 Plan Mode 开始。他的工作流是：

1. 在终端 Tab 1 启动 Plan Mode → Claude 开始制定计划
2. 立刻切到 Tab 2 再启动一个 Plan Mode
3. Tab 用完了打开桌面端继续开 Tab
4. 计划定好后，让各自执行——**在 Opus 4.5+ 之后，计划一旦制定好，执行几乎不需要 babysit**

**实践指引：** 如果你使用 AI 编程工具，尝试"并行计划"工作流：同时让多个 agent 做不同任务的规划，然后批量执行。用 Plan Mode 控制方向，用并行扩展吞吐量。

---

### 6. 用子 Agent 做并行调试与研究

> "If the test seems kind of hard, I'll calibrate the number of sub-agents based on the difficulty of the task."

Boris 会根据任务难度决定使用多少子 agent：简单任务 1 个，困难 bug 用 3-5 甚至 10 个子 agent 并行搜索不同方向（一个看日志、一个看代码路径…）。

**实践指引：** 遇到复杂 bug 或探索性任务时，在 prompt 中明确要求"spawn N 个子 agent 并行调查不同方向"，而不是让一个 agent 线性排查。

---

## 三、团队与人才观

### 7. 最有效的工程师：极致专才 + 超级通才

> "It's very bimodal. Extreme specialists or hyper generalists."

Boris 观察到最高效的工程师分为两类：

- **极致专才**：比如对 JavaScript runtime 或 DevTools 有极深理解的人
- **超级通才**：横跨产品、设计、用户研究、甚至商业的人

中间地带的"普通全栈"反而不是最优。

**实践指引：** 审视自己的能力结构——你是在走专才路线还是通才路线？选一个方向深入。如果是通才，确保你真的能跨越"产品 + 设计 + 技术"的边界，而不只是每样都会一点。

---

### 8. 初心者心态（Beginner's Mindset）比经验更重要

> "The biggest skill is people that can think scientifically and from first principles."

资深工程师的强意见反而可能成为障碍。Boris 面试时会问："**说一个你犯过错误的例子**"——他看的是这个人能不能承认错误、从中学习。

**实践指引：** 定期问自己"我正在做的事，如果让一个没有包袱的新人来做，他会怎么做？"。如果你的方法论来自 6 个月前的经验，大概率需要更新。

---

### 9. "让 AI 自己写工具"的元能力

Boris 举了工程师 Daisy 的例子——她不是自己实现一个功能，而是**先给 Claude Code 写了一个"可以测试任意工具"的工具，然后让 Claude 自己实现那个功能**。这种"教 AI 造工具，再让 AI 用工具"的思维方式是新时代最稀缺的能力。

**实践指引：** 下次遇到重复性开发任务时，先想——"我能不能先造一个让 AI 自动化这件事的工具/流程？" 用 agent 自动化 code review、issue 分类、测试生成等环节。

---

## 四、关于代码与效率的趋势判断

### 10. 代码的"保质期"只有几个月

> "There is no part of Claude Code that was around 6 months ago. It's just constantly rewritten."

Claude Code 每隔几周就会新增/删除工具，整个代码库大约 80%+ 的代码不超过两个月历史。

**实践指引：** 接受"代码是临时性的"这一新现实。不要过度追求"完美架构"，而要追求**快速迭代、快速验证、快速重写**。写出容易被替换的代码，比写出"永恒"的代码更有价值。

---

### 11. "软件工程师"这个头衔将逐渐消失

> "Software engineers are also going to be writing specs, talking to users... Every single function on our team codes — PMs, designers, finance."

Boris 预测未来不再有纯粹的"软件工程师"，取而代之的是"Builder"或"Product Manager"。在 Anthropic 内部，PM 写代码、设计师写代码、财务写代码——**每个人都 code，但 code 不再是核心身份**。

**实践指引：** 如果你是工程师，开始有意识地拓展产品感觉、用户研究、设计审美等维度。如果你是非技术角色，开始学会用 AI 编程工具完成技术性任务。"会不会写代码"正在变得不重要，"能不能解决问题"才重要。

---

## 五、总结：一张实践检查表

| 维度 | 自查问题 |
| --- | --- |
| **战略视野** | 我在为今天的模型能力做优化，还是在为未来 6 个月的模型做准备？ |
| **产品直觉** | 我的产品创意来自"用户已经在做的事"，还是"我觉得用户应该做的事"？ |
| **工程投入** | 我正在写的 scaffolding，下一代模型会不会免费提供？ |
| **工具使用** | 我有没有利用并行 agent、子 agent 来提升效率？ |
| **CLAUDE.md** | 我的 system prompt 是否保持了最小化？上次清理是什么时候？ |
| **心态** | 我是否愿意承认"我 6 个月前的做法可能已经过时了"？ |
| **角色边界** | 我是否只在做"写代码"这一件事，还是在同时做产品、设计、用户研究？ |
