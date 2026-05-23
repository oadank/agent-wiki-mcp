---
summary: "Agent 接入 IM 平台的标准流程与注意事项"
read_when:
  - 需要将 Agent 接入 IM 平台时
  - 排查 Agent 与 IM 通信问题时
title: "Agent 接入 IM 平台"
---

sourceType: document
certainty: fact
status: active
updated: "2026-05-23"

# Agent 接入 IM 平台

> 记录 2026-05-23 Codex Agent 接入 IM 平台的完整操作过程

## 背景

需要将 Codex Agent（运行于 `/opt`）接入 IM 平台，实现用户通过 IM 与 Agent 交互。

## 架构概览

```
IM 平台 ←→ Gateway ←→ Codex Agent Runtime
```

- **Gateway**：负责与 IM 平台的长连接、消息收发、事件处理
- **Codex Agent**：嵌入式运行时，通过 Gateway 接收消息并返回响应

## 关键配置

### LiteLLM 代理

Codex 通过 LiteLLM 代理连接国内模型：

| 项目 | 值 |
|------|-----|
| 代理地址 | `http://127.0.0.1:4000/v1` |
| 模型名 | `codex-model` |
| 协议 | Responses API |

### Codex 配置

- 配置文件：`/opt/.codex/config.toml`
- 记忆文件：`/opt/.codex/memory/`

## 操作流程

### 1. 确认 IM 通道支持

查看 `agent-wiki-mcp/channels/` 下已有通道文档，确认目标 IM 是否在支持列表中。

### 2. 配置 Gateway

在 Gateway 配置中添加对应 IM channel 的连接信息（token、secret、回调地址等）。

### 3. 验证消息链路

- 发送测试消息，确认 IM → Gateway → Agent → Gateway → IM 全链路畅通
- 检查日志确认消息格式、编码正常

### 4. 服务管理

```bash
# 重启服务
systemctl restart feishu-codex

# 查看状态
systemctl status feishu-codex
```

## 注意事项

1. **修改配置前必须先通知用户**
2. **临时修改配置后必须恢复原值并通知用户**
3. 不同 IM 平台的消息格式差异较大，注意处理群消息、@消息、图片消息等边界情况
4. 确保 LiteLLM 代理正常运行（`systemctl status` 检查 4000 端口）

## 参考

- [Agent Runtime](./agent-runtime.md)
- [Agent Workspace](/concepts/agent-workspace)
- Wiki 根目录：`/opt/agent-wiki-mcp`
