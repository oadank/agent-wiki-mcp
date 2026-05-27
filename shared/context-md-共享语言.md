---
title: "CONTEXT.md - 共享语言"
category: shared
tags: []
sources:
  - knowledge/shared/CONTEXT.md
sourceType: document
certainty: question
status: active
created: "2026-05-27T06:24:26.211577+00:00"
updated: "2026-05-27T06:24:26.211614+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** CONTEXT.md - 共享语言

# CONTEXT.md - 共享语言

> 减少冗长描述，提高沟通效率。
> 只收录项目特有术语，通用编程概念不收录。

## 核心术语

### Agent 相关

| 术语 | 定义 | 避免 |
|------|------|------|
| **Agent** | 自主执行任务的 AI 系统，具备感知-压缩-决策-行动-反馈循环 | 机器人、AI助手、智能体 |
| **Harness** | Agent 的运行环境和工具集，决定了 Agent 能做什么。不是模型本身，是模型之外的一切 | 框架、平台、基础设施 |
| **Skill** | 可复用的任务执行模式，由 Agent 从经验中结晶而成。一个 Skill = 一个 SKILL.md 文件 | 技能包、插件、功能模块 |
| **Memory** | Agent 的持久化信息存储，分为 L0-L4 五层。不是数据库，是压缩后的经验 | 记忆库、知识库、存储 |
| **Token** | LLM 处理文本的最小单位，约 0.75 个英文单词或 0.5 个中文字。是 Agent 的货币 | 词元、标记 |
| **Context Window** | LLM 单次对话能处理的最大 token 数。是 Agent 最稀缺的资源 | 上下文长度、对话窗口 |

### 流程相关

| 术语 | 定义 | 避免 |
|------|------|------|
| **PPAF 循环** | 感知→规划→行动→反馈，Agent 的四阶段执行循环。每一步都是压缩 | 执行流程、工作流 |
| **Grill Session** | 开工前 agent 追问需求直到明确的对话过程。一次问一个问题，等反馈后再继续。本质是信息压缩 | 需求确认、需求分析、对齐会议 |

### 记忆相关

| 术语 | 定义 | 避免 |
|------|------|------|
| **Working Memory** | 当前任务的临时上下文，有容量限制（7±2，Miller's Law）和 TTL 过期机制。优先级驱逐，不持久化 | 短期记忆、上下文窗口、会话历史 |
| **Forgetting Curve** | 基于 Ebbinghaus 模型的记忆衰减机制。R=e^(-t/S)，访问增强：S×1.1，t 重置。保留率<0.1→标记 stale | 手动清理、定期压缩、永不过期 |
| **Ambient Recall** | harness 自动注入相关记忆到上下文，不依赖 agent 主动查询。解决"agent 不知道自己不知道什么"的根本问题 | 主动回忆、显式搜索、记忆工具调用 |

### 验证相关

| 术语 | 定义 | 避免 |
|------|------|------|
| **Proof-Attempt** | 证明式推理框架。不是"找问题"，而是"证明属性成立"。失败时追溯到具体阶段。误报率远低于 bug-hunting | 问题搜索、错误检测、bug hunting |
| **Semi-Black-Box Trust** | 对 agent 产出的信任模式——不逐行审查，而是通过反复成功建立信任。但 agent 没有声誉约束，需要 proof-attempt 补偿 | 完全信任、逐行审查、盲目依赖 |

## 关系图

```
Agent 由 Harness 包裹
Harness 包含多个 Skill
Agent 的经验通过压缩结晶为 Skill
Context Window 是 Agent 最稀缺的资源，Token 是货币
Memory 分 L0-L4 五层，L0 是行为规则，L4 是会话档案
Working Memory 是 Memory 的临时层，容量有限（7±2），不持久化
Forgetting Curve 是 Memory 的衰减机制，解决知识膨胀问题
Ambient Recall 是 Harness 管理记忆的被动注入模式
Proof-Attempt 是验证 Agent 行为是否符合规则的方法
Semi-Black-Box Trust 需要 Proof-Attempt 补偿 agent 的无声誉约束
```

## 示例对话

```
群主: "帮我搭一个软著生成项目"
MiMo: "在动手之前，我需要确认几个问题：
1. 用什么技术栈？Python + FastAPI 可以吗？
2. LLM 用哪个？你有 API key 吗？
3. 输出格式是 Word 还是 PDF？"
群主: "Python + FastAPI，用 OpenAI 兼容 API，输出 Word"
MiMo: "好，我现在开始搭。完成后群里通知你。"
```

## 扩展术语

完整术语表（含学术研究级概念）见 Wiki：`/opt/agent-wiki-mcp`

---
最后更新：2026-05-27