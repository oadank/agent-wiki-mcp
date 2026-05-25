# 429 错误后自动恢复对话上下文

## commit
`b7b8b9e` (2026-05-23)

## 问题
LiteLLM 返回 429（速率限制）时，SDK CLI 进程崩溃，sdkSessionId 失效，下次对话丢失上下文。

## 解决方案：两层防御

### 第一层：session_invalid 事件
- 检测 429/CLI 崩溃
- 清除无效的 sdkSessionId/threadId
- 改动：`sdk-provider.ts`, `host.ts`, `conversation-engine.ts`

### 第二层：历史消息注入
sdkSessionId 为空时，注入 conversationHistory：

| Runtime | 触发条件 |
|---------|---------|
| Claude | `sdkSessionId` 为空 |
| Codex | `isFresh=true` |
| OpenHuman | 每次注入 |

## 流程
```
正常 → resume → SDK 内部恢复
↓
429/崩溃 → session_invalid → 清除 ID
↓
下次调用 → ID 空 → 注入历史 → 恢复上下文
```

## 文件
- `src/providers/claude/sdk-provider.ts`
- `src/providers/codex/codex-provider.ts`
- `src/providers/openhuman/openhuman-provider.ts`
- `src/bridge/host.ts`
- `src/bridge/conversation-engine.ts`

## 测试
```bash
cd /opt/agents-to-im
npm test  # llm-provider: 70 pass, codex-provider: 20 pass
```