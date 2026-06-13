---
title: "OpenClaw 飞书流式输出 bug 及补丁"
category: project-decisions
date: 2026-06-08 19:03
tags: ["openclaw","feishu","streaming","bug-fix","dist-patch"]
---
# OpenClaw 飞书流式输出 bug 及补丁

## 问题
OpenClaw 飞书插件（openclaw-lark）的 dist 文件 monitor.account-*.js 中，流式卡片更新有 bug，导致飞书聊天没有瀑布流效果，消息整块蹦出。

## 补丁内容
文件：`/usr/lib/node_modules/openclaw/dist/monitor.account-*.js`

**Patch 1（约 1178 行）**：appendContent → mergedText（发全文）
```
原逻辑：this.state.currentText + delta（追加增量）
修复后：mergedText = mergeStreamingText(this.state.currentText, nextText) → 发送全文
```

**Patch 2（约 1217 行）**：delta → text（发全文）
```
原逻辑：最终更新只发 delta 增量
修复后：最终更新发送完整 text
```

## 其他配置
- openclaw.json 中 `feishu.enabled: false`，使用 `openclaw-lark: true`
- renderMode 需设为 `card`（不能用 auto）

## ⚠️ 注意
dist 文件的 patch 在 OpenClaw 升级后会被覆盖丢失。升级后需要：
1. 检查 `monitor.account-*.js` 是否有 `mergedText` 关键字
2. 如果没有，重新打补丁
3. 备份：`monitor.account-*.js.bak.{date}`
