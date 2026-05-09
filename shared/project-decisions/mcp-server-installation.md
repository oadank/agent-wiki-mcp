---
title: "MCP Server 安装记录"
category: project-decisions
date: 2026-05-09T11:07:00+08:00
tags: ["mcp", "wiki", "跨平台"]
---

# MCP Server 安装记录

## 决策

为 agent-wiki-mcp 添加 MCP Server 支持，实现跨平台可用。

## 技术选择

| 选择 | 原因 |
|------|------|
| Node.js | 与现有脚本同语言，依赖少 |
| FastMCP | MCP SDK 官方实现 |
| stdio transport | 本地进程通信 |

## 安装位置

```
/opt/.openclaw/workspace/skills/agent-wiki-mcp/mcp_server/
```

## MCP 工具列表

1. `wiki_query` — 快速搜索
2. `wiki_deep_query` — 深度搜索（LLM综合）
3. `wiki_brief` — 工作摘要
4. `wiki_status` — Wiki 状态
5. `wiki_ingest_status` — 消化状态
6. `wiki_ingest` — 消化文件
7. `wiki_pages` — 列出页面
8. `wiki_rebuild_index` — 重建索引
9. `wiki_validate` — 验证结构
10. `wiki_remember` — 记录知识
11. `wiki_recall` — 查询记忆
12. `wiki_explain` — 解释来源

## 配置位置

| 平台 | 配置文件 |
|------|----------|
| Claude Code | `/opt/.mcp.json` |
| Codex | `~/.codex/config.toml` + `~/.codex/AGENTS.md` |