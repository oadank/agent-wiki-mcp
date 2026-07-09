---
  title: "agents-to-im MiMo Code Agent 改造进度"
  category: project-decisions
  date: 2026-06-11 13:59
  tags: ["agents-to-im","mimo-code-agent","streaming","thinking","agentmemory"]
  ---
  # agents-to-im MiMo Code Agent 改造进度
  
  # agents-to-im MiMo Code Agent 改造进度

## 用户需求
1. 修改 MiMo Code Agent 本身，支持显示思维过程
2. 实时流式输出（现在卡很久，最后一下全部发过来）
3. 思考和正文分开展示
4. 给 MiMo Code Agent 加 AgentMemory MCP 工具注册

## 关键发现（重要！）
- **MiMo Code Agent** 使用 **Claude SDK provider**（`sdk-provider.ts`），不是 zcode provider
- **zcode provider** 是给 zcode agents（glm/gemini/opencode）用的，不是给我用的
- MiMo Code Agent 的 system prompt 由 `agents-to-im` 框架在启动时注入
- Wiki 工具（`wiki_wiki_*`）是 Claude SDK 通过 `~/.claude.json` 和 `~/.claude/mcp.json` 配置的 MCP 工具
- AgentMemory 配置在 `/root/.claude/mcp.json` 但没生效

## 已完成（但方向错误）
- ❌ 修改了 zcode-provider.ts（给错误的 agent 改的）
- ❌ 修改了 tool-executor.ts（给错误的 agent 改的）
- ✅ bridge-manager.ts 的思维格式改进（这个是对的，但未应用）

## 正确方向
- 需要修改 `sdk-provider.ts`（Claude SDK provider）
- 需要修改 `bridge-manager.ts`（流式输出和思维显示）
- 需要修改 `conversation-engine.ts`（流式消费）

## 下一步
1. 研究 sdk-provider.ts 如何处理流式输出和思维
2. 研究 bridge-manager.ts 如何显示思维过程
3. 实施正确的修改
  