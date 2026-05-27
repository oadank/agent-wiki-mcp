---
name: 飞书 post 类型消息支持
date: 2026-05-26
type: fix
---

## 问题

飞书用户复制富文本内容（表格、格式化文本）发送给 Bot 时，消息被丢弃：
```
[feishu-adapter] Dropped inbound message ...: unsupported message type (type=post)
```

## 根因

`inbound-handler.ts` 第 165 行只处理 `text` 类型消息：
```typescript
if (data.message.message_type !== 'text') {
  return; // 直接丢弃
}
```

飞书的 `post` 类型是富文本消息（包含格式、表格等），被过滤掉了。

## 修复

修改条件，允许 `post` 类型：
```typescript
// 支持 text 和 post（富文本）类型消息
if (data.message.message_type !== 'text' && data.message.message_type !== 'post') {
  return;
}
```

`parseTextContent` 函数已支持从 post 的 JSON 结构中提取纯文本。

## 文件

- `/opt/agents-to-im/src/feishu/handlers/inbound-handler.ts`
- 备份：`inbound-handler.ts.bak.20260526_post`

## 验证

在飞书发送包含格式的消息（如复制表格），确认 Bot 能正常接收处理。
