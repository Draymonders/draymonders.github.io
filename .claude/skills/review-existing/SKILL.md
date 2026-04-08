---
name: review-existing
description: 审核已有博客文章。输入文章路径，使用技术 Reviewer 子 Agent 进行质量评估。
disable-model-invocation: true
---

# 审核已有文章

对 Draymonder Docs 博客中已有的文章进行质量审核。

## 输入
文章路径或 URL：$ARGUMENTS

## 执行步骤

1. 读取指定文章内容
2. 使用 `tech-reviewer` 子 Agent 进行全维度审核
3. 输出 Review 结果到 `output/review-existing.json`
4. 生成改进建议摘要
