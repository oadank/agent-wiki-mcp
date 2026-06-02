# agents-to-im 项目进度

## 项目信息
- **路径**：`/opt/.agents-to-im-claude`（主）、`/opt/.agents-to-im-codex`、`/usr/bin/agents-to-im`
- **描述**：飞书桥接软件（Claude + Codex 两个实例 + 全局二进制程序）
- **状态**：✅ active

## 进度记录

| 日期 | 任务 | AI | 状态 | 备注 |
|------|------|-----|------|------|
| 2026-05-09 | 首次注册项目 | Codex | ✅ | 三个路径关联，project tracking 功能测试 |
| 2026-05-09 15:05 | Claude | 项目注册完成 | ✅ | 关联三个路径：Claude实例、Codex实例、全局二进制 |
| 2026-05-23 09:29 | Claude | 为 agents-to-im 添加 OpenHuman runtime 支持 | 🚧 | 方案E：修改 agents-to-im 添加 openhuman runtime，保留飞书交互体验（标签确认、流式输出、互动卡片） |
| 2026-05-23 10:51 | Claude | 为 agents-to-im 添加 OpenHuman runtime 支持 | ✅ | 已推送：RuntimeName 添加 openhuman、RUNTIME_CAPABILITIES 配置、OpenHumanProvider/Driver、getProvider/getDriver 分支 |
| 2026-05-23 10:53 | Claude | 创建 agents-to-im-openhuman 飞书桥接服务 | ✅ | 创建了 systemd 服务，飞书 App 已配置（cli_a9313c8bbc799bb5），服务运行中 |
| 2026-05-25 | Claude | 修复消息撤回导致上下文丢失问题 | ✅ | - 添加 im.message.recalled_v1 事件处理器
- 清理撤回消息的 preview artifacts 和 lastIncomingMessageId
- 捕获 "message withdrawn" 错误，fallback 到创建新消息
- 防止 session lost 导致注入错误历史
- 推送到 oadank/agents-to-im (commit e5bce2a) |
| 2026-05-25 | Claude | 飞书语音消息支持（ASR + TTS） | ✅ | - inbound-audio-service.ts：语音转写（sherpa-onnx）
- outbound-audio-service.ts：语音回复（小米 TTS）
- inbound-handler.ts：标记 fromAudio，触发语音回复
- adapter.ts：pendingAudioReply 状态管理
- tts-wrapper.mjs：[TTS_OUTPUT] stderr 输出
- 用户发语音 → Claude 自动语音回复
- 推送到 oadank/agents-to-im (commit f8c1899) |
| 2026-06-01 | Claude | compact 压缩机制全面升级 | ✅ | LLM 摘要替代硬截断，基于 cc-haha partialCompact 设计 |
| 2026-06-01 | Claude | chatType 字段 + 232008 修复 | ✅ | ChannelBinding 添加 chatType: p2p/group，syncChatName 跳过私聊 |
| 2026-06-01 | Claude | clearSessionMessages sessionId 修复 | ✅ | 根因：persistMessages() 未传 sessionId → 写入 undefined.json |
| 2026-06-01 | Claude | 远端冲突代码清理 | ✅ | 删除重复 compact 机制、简化 post 消息处理、保留 clearAllCodexThreadIds + MAX_MESSAGE_LENGTH |
| 2026-06-01 | Claude | 两轮代码审计共 11 个 bug 修复 | ✅ | 见下方详细记录 |

## 2026-06-01 compact 全面升级 + 代码审计详情

### 核心改动

**compact.ts（新建）**：
- `compactConversation()` — LLM 部分压缩：旧消息摘要 + 保留最近 6 条原文
- `applyCompactResult()` — 原子写入（setMessages），防连续 user 消息
- `callCompactApi()` — 调用 Anthropic Messages API via LiteLLM proxy
- `compactLocks` — 逐会话锁，防并发压缩
- `COMPACT_PROMPT` — 基于 cc-haha partialCompact 的摘要提示词

**types.ts**：ChannelBinding 添加 `chatType?: 'p2p' | 'group'`

**host.ts**：BridgeStore 添加 `setMessages()`、`clearSessionMessages()` 接口

**store.ts**：
- `setMessages()` — 原子写入，内存构建 + 单次 persistMessages
- `updateSdkSessionId()` — 同时更新 sessions 和 bindings
- `clearSessionMessages(sessionId)` — 修复 persistMessages 未传 sessionId
- 保留 `MAX_MESSAGE_LENGTH=50000`、`clearAllCodexThreadIds()`
- 删除：MAX_MESSAGES、COMPACT_THRESHOLD、getMessageTotalChars、needsCompaction、compactMessages

**inbound-handler.ts**：
- /compact（p2p + group）：compactConversation → applyCompactResult → updateSdkSessionId('')
- clearSdkSession 配置检查
- 简化 post 消息处理（远端方案）
- p2p 自动绑定 chatType: 'p2p'

**adapter.ts**：
- chatType: 'group' 在 createBoundSession 设置
- syncChatName：`chatType !== 'group'` 时跳过（含旧绑定 undefined 兼容）
- 删除 p2pNoRenameChats 旧 workaround

**main.ts**：
- idle-compact：每 30min 检查空闲 >1.5h、≥20 条消息的会话
- loadConfig() 移入 setInterval 回调，运行时改 config 生效
- 启动时 clearAllCodexThreadIds

### 两轮审计修复清单

| # | 严重度 | 描述 | 文件 |
|---|--------|------|------|
| 1 | 🔴 CRITICAL | applyCompactResult 连续 user 消息致 API 400 | compact.ts |
| 2 | 🟡 HIGH | clearSdkSession 配置未生效 | inbound-handler.ts, main.ts |
| 3 | 🟡 HIGH | [COMPACTED_HISTORY] 死代码 | conversation-engine.ts |
| 4 | 🟡 HIGH | syncChatName 重复 console.warn | adapter.ts |
| 5 | 🟢 MEDIUM | promptFile 配置从未使用 | config.ts, main.ts, store.ts |
| 6 | 🟢 MEDIUM | compact.ts try 块缩进不一致 | compact.ts |
| 7 | 🟢 MEDIUM | idle-compact 冗余 getMessages(limit:1) | main.ts |
| 8 | 🟡 HIGH | limit:9999 截断致超长会话消息丢失 | compact.ts |
| 9 | 🟡 HIGH | 旧 p2p 绑定缺 chatType 触发 232008 | adapter.ts |
| 10 | 🟢 MEDIUM | idle-compact config 启动后冻结 | main.ts |
| 11 | 🟢 MEDIUM | applyCompactResult 无事务保护 | compact.ts, host.ts, store.ts |

### Git 推送记录

| commit | 说明 |
|--------|------|
| e6a7b10 | feat: compact 压缩机制全面升级 + 232008 修复 + clearSessionMessages 修复 |
| 690f45a | refactor: 移除远端 compact 冲突代码 |
| 0b3de7c | fix: formatSummary 未定义 + inbound-handler 类型错误 |
| febb765 | fix: 7 个 compact 相关 bug |
| 34f235f | fix: 4 个第二轮审计 bug（limit/chatType/config/事务） |

### 部署状态
- **N5105**：已构建 + 运行中（3 个实例）
- **Debian 13**：已同步 + 重启 + WS 连接正常（PID 94763）
