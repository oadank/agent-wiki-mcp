# cc-haha 项目进度

## 项目信息
- **路径**：`/home/code/cc-haha`
- **GitHub**：https://github.com/oadank/cc-haha
- **描述**：Claude Code 本地源码（泄露版本），bun 直接运行，被 `/usr/local/bin/claude` 包装调用
- **状态**：✅ active

## 关键文件
- 入口：`src/entrypoints/cli.tsx`
- 消息处理：`src/utils/messages.ts`
- 工具系统：`src/Tool.js`、`src/utils/api.ts`
- 启动包装：`/usr/local/bin/claude`（bash 脚本，cd 到源码目录用 bun 跑）

## 运行方式
```bash
# /usr/local/bin/claude 内部调用
cd /home/code/cc-haha
bun --env-file=.env ./src/entrypoints/cli.tsx --dangerously-skip-permissions ...
```

## 进度记录

| 日期 | 任务 | AI | 状态 | 备注 |
|------|------|-----|------|------|
| 2026-05-24 15:21 | 修复 normalizeMessagesForAPI 数组保护 | Codex | ✅ | commit 456e97e，已 push 到 GitHub |

## 2026-05-24 修复详情：飞书 Claude 报错 content.map is not a function

**报错**：
```
Error: Claude Code returned an error result: message.message.content.map is not a function.
```

**排查路径**：
1. 报错出现在飞书消息里，看 `/opt/.agents-to-im-claude/logs/bridge.log`
2. 错误源 `[llm-provider] SDK query error`，定位到 `agents-to-im` 的 `sdk-provider.ts`
3. 但 agents-to-im 自己的代码有 `Array.isArray` guard，根因不在这里
4. 报错文字含 `toolMatchesName`、`normalizeToolInputForAPI`，这俩不在 agents-to-im
5. 看 `/usr/local/bin/claude` 启动脚本，发现 Claude CLI 是 bun 跑 `/home/code/cc-haha` 源码
6. 在源码里 grep 到根因：`src/utils/messages.ts:2211`

**根因**：
`normalizeMessagesForAPI` 函数处理 `assistant` 类型消息时直接 `.map()` 了 `message.message.content`，没做数组检查。当 LiteLLM 代理返回错误响应、`content` 不是数组（可能是字符串或对象）时直接崩溃。

**修复**：
- 文件：`src/utils/messages.ts`
- 改动：两处 `.content.map` 之前加 `Array.isArray` guard，非数组时用 `[]` 兜底
  - 第 2207-2210 行（`normalizeMessagesForAPI` 内 `case 'assistant'`）
  - 第 1758 行（另一处工具输入清理函数）
- commit：`456e97e fix(messages): guard against non-array content in normalizeMessagesForAPI`

**注意事项**：
1. 改完源码**不需要 build**，bun 直接跑 ts/tsx
2. 但飞书 Claude 用的是 `@anthropic-ai/claude-agent-sdk` 调起独立的 claude CLI 子进程，所以必须 `systemctl restart feishu-claude` 让 SDK 重新拉起子进程
3. agents-to-im 那边的 catch 拦截（`sdk-provider.ts`）也加了兜底，避免再出现类似 SDK bug 时崩溃
