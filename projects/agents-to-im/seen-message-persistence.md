---
name: seenMessageIds 持久化修复
project: agents-to-im
type: bugfix
created: 2026-05-27
---

# seenMessageIds 持久化修复

## 问题

agents-to-im daemon 的 `seenMessageIds` 去重 Map 存在纯内存存储，重启后丢失：
- 飞书 SDK 重连时会重放最近消息
- 内存 Map 为空 → 所有消息被视为「未处理」→ 重复触发 Claude → 卡死雪崩

## 修复方案

将 `seenMessageIds` 从纯内存 `new Map()` 改为磁盘持久化 JSON 文件。

文件位置：`{CTI_HOME}/runtime/seen-messages.json`

| 实例 | CTI_HOME | 持久化文件 |
|------|----------|-----------|
| feishu-claude | /opt/.agents-to-im-claude | runtime/seen-messages.json |
| feishu-codex | /opt/.agents-to-im-codex | runtime/seen-messages.json |
| feishu-openhuman | /opt/.agents-to-im-openhuman | runtime/seen-messages.json |

### 初始化（启动时加载）

```javascript
seenMessageIds = (() => {
  try {
    const _f = __require("path").join(CTI_HOME, "runtime", "seen-messages.json");
    const _d = JSON.parse(__require("fs").readFileSync(_f, "utf8"));
    const _m = new Map();
    const _now = Date.now();
    for (const [k, v] of Object.entries(_d)) {
      if (_now - v < 86400000) _m.set(k, v);  // 24h 过期
    }
    return _m;
  } catch { return new Map(); }
})();
```

### 写入（每条新消息）

```javascript
markSeenMessage(messageId) {
  if (this.seenMessageIds.has(messageId)) return false;
  const _now = Date.now();
  this.seenMessageIds.set(messageId, _now);
  // 24h 过期清理
  for (const [k, v] of this.seenMessageIds) {
    if (_now - v > 86400000) this.seenMessageIds.delete(k);
  }
  // 持久化到磁盘
  try {
    const _f = __require("path").join(CTI_HOME, "runtime", "seen-messages.json");
    const _o = Object.fromEntries(this.seenMessageIds);
    __require("fs").writeFileSync(_f, JSON.stringify(_o));
  } catch (_e) { console.warn("[seenMessageIds] persist failed:", _e?.message); }
  return true;
}
```

## 关键设计

| 特性 | 说明 |
|------|------|
| 动态路径 | 使用 `CTI_HOME` 环境变量，三个实例各自独立 |
| 24h 自动过期 | 防止文件无限增长 |
| 写失败不阻断 | try-catch 保护，写盘失败只 warn 不崩溃 |
| 启动时过滤 | 加载时跳过超过 24h 的旧记录 |

## 修改文件

- `/opt/agents-to-im/dist/daemon.mjs`（构建产物，直接修改）
- 备份：`/opt/agents-to-im/dist/daemon.mjs.bak.20260527`

## 验证

```bash
# 查看持久化文件
cat /opt/.agents-to-im-claude/runtime/seen-messages.json | python3 -m json.tool

# 查看各实例持久化条数
for d in claude codex openhuman; do
  f="/opt/.agents-to-im-$d/runtime/seen-messages.json"
  echo "$d: $(python3 -c "import json; print(len(json.load(open('$f'))))" 2>/dev/null || echo '无文件') 条"
done
```
