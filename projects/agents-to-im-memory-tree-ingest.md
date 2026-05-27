# agents-to-im 飞书消息 memory_tree 摄入

## 功能说明

飞书消息自动摄入到 OpenHuman memory_tree，实现语义搜索和记忆索引。

## 工作流程

```
飞书消息
    ↓
handleIncomingEvent (inbound-handler.ts)
    ↓
检查 CTI_DEFAULT_RUNTIME === 'openhuman'
    ↓
ingestToMemoryTree() — fire-and-forget
    ↓
调用 openhuman.memory_tree_ingest RPC
    ↓
评分管道：
    - score ≤ 0.15 → dropped（垃圾）
    - score ≥ 0.85 → 直接保留
    - 边界 → LLM 提取
    ↓
chunks 持久化 → memory_tree 可查询
```

## 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/feishu/types.ts` | 添加 `ingestToMemoryTree` 方法声明 |
| `src/feishu/adapter.ts` | 实现 `ingestToMemoryTree` 方法 |
| `src/feishu/handlers/inbound-handler.ts` | 在消息处理时调用摄入 |

## 关键配置

```bash
# .agents-to-im-openhuman/config.env
CTI_DEFAULT_RUNTIME=openhuman
OPENHUMAN_USER_ID=6a0bd5556b16f2d8e561ee92  # OpenHuman 用户 ID
```

## 修复记录

### 2026-05-26 修复

| 问题 | 修复 |
|------|------|
| timestamp 格式错误 | ISO string → unix milliseconds |
| ReadableStream 崩溃 | enqueue 包在 try-catch |
| owner 不匹配 | senderId → OpenHuman 用户 ID |

## 数据结构

| 表 | 说明 |
|----|------|
| `mem_tree_chunks` | 存储消息 chunks，embedding 在 BLOB 列 |
| `mem_tree_buffers` | 待 seal 的 buffer |
| `mem_tree_summaries` | seal 后的摘要（查询依赖此表） |

## 查询说明

`memory_tree` 工具查询只返回 **sealed（已摘要化）的 tree**。

如果 `mem_tree_summaries` 表为空，查询返回 0。

## GitHub 分支

https://github.com/oadank/agents-to-im

分支：`openhuman`