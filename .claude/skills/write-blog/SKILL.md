---
name: write-blog
description: 端到端博客写作流水线。输入一个技术主题，依次调用内容编排师、技术研发、技术 Reviewer 三个子 Agent，输出高质量的技术博客文章。
disable-model-invocation: true
---

# 博客写作流水线

你将按照以下流程为 Draymonder Docs 博客创作一篇技术文章。

## 输入
用户提供的写作主题：$ARGUMENTS

## 执行步骤

### 第一步：内容规划
使用 `content-planner` 子 Agent 完成选题规划：
- 分析主题的技术定位和目标读者
- 设计文章目录大纲
- 检查与博客已有文章的关联关系
- 将规划结果保存到 `output/plan.json`

### 第二步：文章撰写
使用 `tech-writer` 子 Agent 完成文章撰写：
- 基于第一步的大纲生成完整文章
- 确保代码示例可运行
- 包含 Mermaid 图表
- 将文章保存到 `output/draft.md`

### 第三步：质量审核
使用 `tech-reviewer` 子 Agent 完成文章审核：
- 从读者视角逐维度审核
- 输出结构化 Review 结果
- 将 Review 结果保存到 `output/review.json`

### 第四步：迭代修改（条件触发）
如果 Review 结果中存在 P0 问题（verdict 为 REVISE 或 REWRITE）：
1. 将 Review 反馈传给 `tech-writer` 子 Agent 进行修改
2. 再次使用 `tech-reviewer` 子 Agent 审核修改后的版本
3. 最多迭代 2 轮

### 第五步：最终输出
- 将最终文章保存到 `output/final.md`
- 输出文章摘要信息（标题、字数、分类、标签）
- 如果经过迭代，输出修改概要

## 输出目录结构
```
output/
├── plan.json        # 内容规划
├── draft.md         # 初稿
├── review.json      # Review 结果
├── revision_1.md    # 第一次修改（如有）
├── review_2.json    # 第二次 Review（如有）
└── final.md         # 最终定稿
```
