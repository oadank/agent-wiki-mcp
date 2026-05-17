---
title: 项目进度模板
category: template
type: progress
---

# litellm-codex-domestic 进度记录

> 任何 AI 接手此项目时，先阅读此文件了解当前状态。

## 项目概述

- **项目名**: {{项目名}}
- **目标**: {{简要描述项目目标}}
- **负责人**: {{用户名}}
- **创建时间**: {{创建日期}}

---

## 当前状态

| 状态 | 说明 |
|------|------|
| 🚧 进行中 | {{当前阶段}} |
| 下一步 | {{待办任务}} |
| 阻塞 | {{如有阻塞问题，写在这里}} |

---

## 进度日志

| 时间 | AI | 任务 | 状态 | 备注 |
|------|----|----|------|------|
| {{YYYY-MM-DD HH:mm}} | {{Claude/Codex/Hermes}} | {{任务描述}} | ✅/🚧/❌ | {{详细信息}} |

---

## 技术决策

| 日期 | 决策 | 原因 | AI |
|------|------|------|----|
| {{YYYY-MM-DD}} | {{决策内容}} | {{为什么这样做}} | {{Claude/Codex}} |

---

## 相关资源

- 文档链接: {{相关 wiki 页面}}
- 代码仓库: {{GitHub 链接}}
- 配置文件: {{关键配置路径}}

---

## AI 接手指南

1. 先读取此文件了解进度
2. 查看 `decisions.md` 了解技术决策背景
3. 执行任务后，调用 `wiki_update_progress` 更新此文件
4. 如遇阻塞，记录到"阻塞"字段| 2026-05-12 21:16 | Claude | LiteLLM Responses API 国内模型兼容修复 | 🚧 | handler.py + transformation.py 参数过滤，tool call JSON 格式修复，orphan tool output 过滤 |
| 2026-05-13 00:42 | Claude | 修复国内模型 400 错误 - 过滤旧格式参数 | 🚧 | 添加 functions/function_call 旧格式参数过滤，同步+异步版本 |
| 2026-05-13 00:43 | Claude | 修复国内模型 400 错误 - 过滤旧格式参数 | 🚧 | 已推送到 GitHub codex-domestic-fix 分支 |
| 2026-05-13 01:33 | Claude | 修复 No tool calls but found tool output 错误 | 🚧 | 处理 orphan tool output: 当 tool message 没有 corresponding tool_call 且无法重建时，对于国内模型直接删除 |
| 2026-05-13 01:41 | Claude | 国内模型参数在生成阶段过滤 | 🚧 | 在 transformation.py 生成阶段不添加 reasoning_effort/parallel_tool_calls/stream_options 参数 |
| 2026-05-13 01:47 | Claude | 修复 function.arguments must be in JSON format 错误 | 🚧 | 添加 _ensure_all_tool_calls_have_valid_json_arguments 方法，发送请求前验证 arguments JSON 格式 |
| 2026-05-13 01:56 | Claude | 添加更多国内模型不支持参数的过滤 | 🚧 | 添加 frequency_penalty/presence_penalty/logprobs/response_format/seed/logit_bias/n/service_tier 参数过滤 |
| 2026-05-13 02:17 | Claude | 修复 No tool calls but found tool output 错误 | 🚧 | 在 session handler 前设置 model_name/api_base，确保 orphan tool output 过滤能正确判断国内模型 |
| 2026-05-13 02:20 | Claude + Codex | 修复国内模型 Responses API 兼容性问题 | ✅ | 测试通过：完整工具调用流程正常，No tool calls but found tool output 错误已修复 |
| 2026-05-13 02:22 | Claude | LiteLLM 国内模型 Responses API 兼容性修复完成 | ✅ | 所有测试通过：简单问答、tools参数、tool_choice=auto、多轮对话、工具结果回传、完整工具调用流程。国内模型 Responses API 兼容性修复完成。 |
| 2026-05-13 02:48 | Claude | 修复 function.arguments JSON 格式问题 | 🚧 | 修复非 dict 类型 tool_calls 对象处理（使用 getattr 处理 Pydantic 对象） |
