---
title: "LiteLLM PR #27585 反馈问题记录"
category: project-decisions
date: 2026-05-10 23:07
tags: ["litellm","codex","pr-feedback","bugfix"]
---

> **TL;DR** LiteLLM PR #27585 反馈问题记录


sourceType: report
certainty: fact
status: active# LiteLLM PR #27585 反馈问题记录

## PR #27585 官方机器人反馈问题

### P0 问题（必须修复）
1. **README 替换问题**：不能把官方 README 替换成 Fork 版本内容，需要恢复官方 README，兼容说明放在单独文件
2. **Tool类型过滤全局生效**：过滤 `code_interpreter`/`file_search`/`local_shell` 等会影响 OpenAI 等原生支持的 provider，需要改成 provider 限定版本
3. **`_clean_schema` 全局生效**：清理 `strict`/`additionalProperties` 会破坏 OpenAI structured outputs，需要限定到国内模型 provider

### P1 问题
4. **`client_metadata` 全局过滤**：不应该对所有 provider 都过滤，需要改成 provider 限定版本

### 修复方案
- 过滤逻辑只在 `custom_openai` provider 或特定国内模型 endpoint 时生效
- README 恢复官方版本，兼容说明移到 `CODEX_COMPATIBILITY.md` 文件
