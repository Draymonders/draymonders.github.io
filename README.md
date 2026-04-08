# Blog Multi-Agent 协作系统

基于 Claude Code 多 Agent 协作范式的技术博客写作系统，为 [Draymonder Docs](https://draymonders.github.io/) 提供高质量的技术文章生产流水线。

## 项目结构

```
blog-multi-agent/
├── CLAUDE.md                              # 项目级指令文件
├── README.md                              # 本文件
├── .claude/
│   ├── settings.json                      # 权限与 Hooks 配置
│   ├── agents/                            # 子 Agent 定义
│   │   ├── content-planner.md             # 内容编排师
│   │   ├── tech-writer.md                 # 资深技术研发
│   │   └── tech-reviewer.md              # 技术 Reviewer
│   └── skills/                            # 技能定义
│       ├── write-blog/
│       │   └── SKILL.md                   # 端到端写作流水线
│       └── review-existing/
│           └── SKILL.md                   # 审核已有文章
└── output/                                # 输出目录
```

## 快速开始

### 前置条件
- 安装 [Claude Code](https://docs.claude.com/en/docs/claude-code)
- 确保有有效的 Anthropic API 密钥

### 使用方式

**1. 启动 Claude Code**

```bash
cd blog-multi-agent
claude
```

**2. 写一篇新文章**

```bash
# 使用技能命令（推荐）
/write-blog Go 语言中的并发模式：从 goroutine 到 Channel 再到 Context

# 或者手动编排
> 我想写一篇关于 Redis 分布式锁的技术博客，请依次使用 content-planner、tech-writer、tech-reviewer 完成
```

**3. 审核已有文章**

```bash
/review-existing docs/cs/middleware/database/redis.md
```

**4. 单独使用子 Agent**

```bash
# 只做内容规划
> 使用 content-planner 子 Agent 为"Kafka 消息可靠性保证"规划一篇文章大纲

# 只做 Review
> 使用 tech-reviewer 子 Agent 审核 output/draft.md
```

## 多 Agent 协作流程

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   用户输入    │ ──→ │ content-     │ ──→ │  tech-writer  │
│   写作主题    │     │ planner      │     │  撰写文章      │
└─────────────┘     │ 规划大纲      │     └───────┬───────┘
                    └──────────────┘             │
                                                 ▼
                    ┌──────────────┐     ┌───────────────┐
                    │   最终定稿    │ ←── │ tech-reviewer  │
                    │  output/     │     │  质量审核       │
                    │  final.md    │     └───────┬───────┘
                    └──────────────┘             │
                                          有 P0 问题？
                                          ──→ 回到 Writer
                                          （最多 2 轮）
```

## 子 Agent 说明

| Agent | 角色 | 核心能力 | 工具权限 |
|-------|------|----------|----------|
| **content-planner** | 内容编排师 | 选题定位、目录设计、关联分析 | Read, Grep, Glob, Bash |
| **tech-writer** | 资深技术研发 | 精通 Go/Python/TS/Java，深入浅出写作 | Read, Write, Edit, Bash, Grep, Glob |
| **tech-reviewer** | 技术 Reviewer | 2-3 年后端工程师视角审核 | Read, Grep, Glob（只读） |

### 设计理念

- **content-planner** 确保写对的东西（选题不偏、结构合理）
- **tech-writer** 确保写得好（深入浅出、代码可运行）
- **tech-reviewer** 确保读得懂（从读者视角验证）
- Reviewer **只有只读权限**，保证审核独立性
- 迭代次数限制为 2 轮，避免无限循环

## 自定义

### 修改技术栈偏好
编辑 `CLAUDE.md` 中的"技术栈偏好"部分。

### 调整 Review 标准
编辑 `.claude/agents/tech-reviewer.md` 中的审核维度和权重。

### 添加新的子 Agent
在 `.claude/agents/` 目录下创建新的 `.md` 文件，遵循 front matter 格式。

## License

MIT
