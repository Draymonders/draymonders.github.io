# Blog Multi-Agent 协作系统

## 项目概述
这是一个基于 Claude Code 多 Agent 协作范式的技术博客写作系统，为 [Draymonder Docs](https://draymonders.github.io/) 提供高质量的技术文章生产流水线。

## 博客结构
博客基于 MkDocs 构建，分为两大板块：
- **编码人生**：技术文章（计算机科学、中间件、系统设计、AI Agent 等）
- **点滴生活**：年度总结、书籍、运动、记录等

## 技术栈偏好（按优先级）
1. Go（主力后端语言）
2. Python（AI/数据相关）
3. TypeScript（前端）
4. Java（中间件/分布式）

## 文章风格规范
- 使用 Markdown 格式，兼容 MkDocs Material 主题
- 标题层级：一级标题仅用于文章名，正文从二级标题开始
- 代码示例必须可运行，标注语言类型
- 技术概念先给直觉解释，再深入原理
- 每篇文章需包含：背景/动机、核心内容、总结/思考
- 适当使用图表（Mermaid）辅助说明

## 多 Agent 工作流
本项目包含 3 个子 Agent，采用线性 Pipeline + 迭代循环模式：

```
用户输入主题 → [内容编排师] → [资深技术研发] → [技术Reviewer]
                                    ↑                    |
                                    └── 如有严重问题 ──────┘
```

1. **content-planner**（内容编排师）：选题定位、目录大纲、关联已有文章
2. **tech-writer**（资深技术研发）：基于大纲生成完整技术文章
3. **tech-reviewer**（技术 Reviewer）：从读者视角审核文章质量

## 工作流执行
- 当用户提出写作主题时，依次调用三个子 Agent
- Reviewer 反馈分为 P0（阻断）、P1（建议修改）、P2（优化建议）三级
- P0 问题必须回到 tech-writer 修改，最多迭代 2 轮
- 最终输出 Markdown 文件到 `output/` 目录

## 输出格式
最终文章需包含 MkDocs 兼容的 front matter：
```yaml
---
title: 文章标题
date: YYYY-MM-DD
categories:
  - 分类名
tags:
  - 标签1
  - 标签2
---
```
