---
  title: "MiMo Code Agent 架构关键发现"
  category: project-decisions
  date: 2026-06-11 14:01
  tags: ["agents-to-im","architecture","mimo-code-agent","claude-sdk"]
  ---
  # MiMo Code Agent 架构关键发现
  
  # MiMo Code Agent 架构关键发现

## 架构概览
`agents-to-im` 框架支持多种 AI agent，通过不同的 provider 路由：

| Provider | 对应 Agent | 关键文件 | 系统提示来源 |
|----------|-----------|---------|------------|
| **Claude SDK** | **MiMo Code Agent（我）** | `providers/claude/sdk-provider.ts` | Claude CLI preset + `~/.claude.json` + MCP |
| **ZCode** | glm/gemini/opencode | `providers/zcode/zcode-provider.ts` | ACP 协议 + `mcpServers.json` |
| **Codex** | codex | `providers/codex/codex-provider.ts` | Codex 配置 |

## MiMo Code Agent 的工具来源
MiMo Code Agent 使用 Claude SDK provider，其工具来自：
1. Claude Code 内置工具（Read/Write/Bash 等）
2. `~/.claude.json` 中的 per-project MCP 配置
3. `~/.claude/mcp.json` 全�� MCP 配置
4. Claude CLI 内置的 wiki 等工具

## AgentMemory 接入
`~/.claude/mcp.json` 已配置 agentmemory，但可能需要：
- 确保 `AGENTMEMORY_URL` 环境变量指向 `http://localhost:3111`
- 或在 mcpServers 配置中加上 env 字段

## 需要修改的文件
1. **流式输出**：`sdk-provider.ts` 中的 `streamChat` 方法 + `bridge-manager.ts` 中的流式预览
2. **思维过程显示**：`bridge-manager.ts` 中的 `handleActivityEvent` reasoning_activity 处理
3. **AgentMemory**：`~/.claude/mcp.json` 配置或 SDK provider 的 MCP 加载逻辑
  