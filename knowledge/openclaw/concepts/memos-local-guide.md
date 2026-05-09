---
title: MemOS 本地记忆插件指南
category: concepts
tags:
  - memory
  - memos
  - bge
  - embedding
sources:
  - internal configuration
summary: 完整的 MemOS 本地记忆插件使用、配置和开发指南
---

# MemOS 本地记忆插件 (memos-local-openclaw-plugin)

## 概述

MemOS 是 OpenClaw 的默认记忆系统，提供本地、私有、离线的语义记忆功能，无需第三方云服务。

### 核心特性
✅ 100% 本地运行，数据不离开服务器
✅ 混合搜索：关键词 + 向量 + 语义
✅ 中文优化：BGE-Small-ZH-v1.5 嵌入式模型
✅ Dreaming 自动记忆整理
✅ 与技能系统深度集成
✅ 跨会话记忆共享

---

## 核心组件

### 1. 存储结构
| 位置 | 说明 |
|------|------|
| `/opt/.openclaw/workspace/MEMORY.md` | 长期核心记忆，增量追加 |
| `/opt/.openclaw/workspace/memory/YYYY-MM-DD.md` | 每日会话原始记录 |
| `~/.openclaw/memory/<agent-id>.sqlite` | SQLite 索引库 + 向量数据库 |
| `http://127.0.0.1:11435/v1` | BGE 本地嵌入式服务 |

### 2. 搜索算法
MemOS 默认使用混合搜索，自动加权：
| 类型 | 技术 | 权重 |
|------|------|------|
| 关键词搜索 | SQLite FTS5 BM25 | 60% |
| 向量搜索 | BGE-Small-ZH-v1.5 | 40% |

### 3. 嵌入配置
```json
"embedding": {
  "provider": "openai_compatible",
  "model": "bge-small-zh-v1.5",
  "endpoint": "http://127.0.0.1:11435/v1"
}
```

---

## 工作原理

### 1. 记忆生命周期
```
对话产生 → 分块 (400 token，重叠 80 token) → 计算向量 → 索引入库
↑
搜索召回 ← 匹配查询向量 ← 自动召回/手动搜索
↑
自动提升 (Dreaming) ← 多次召回 / 高相关度 ← 用户确认
```

### 2. 自动召回机制
每次对话开始时，MemOS 自动：
1. 提取当前用户消息的核心语义
2. 搜索向量库匹配相关记忆
3. 最高 5 条相关记忆注入对话上下文
4. 自动过滤低相关度内容 (阈值 0.45)

### 3. Dreaming 自动整理（凌晨 3 点执行）
| 阶段 | 动作 |
|------|------|
| **Light** | 排序短期记忆，计算相关性分数 |
| **REM** | 语义聚类，发现记忆主题和趋势 |
| **Deep** | 自动提升高价值记忆到 `MEMORY.md` |

#### 提升评分优先级
1. **回忆频率**：被搜索召回次数最多
2. **检索相关性**：用户搜索时相关性最高
3. **查询多样性**：被不同类型的查询搜到
4. **时间接近度**：最近的内容权重更高（半衰期 14 天，30 天后不再考虑）
5. **跨天巩固**：连续多天出现的主题优先
6. **概念丰富度**：包含知识、决定、观点、规则的内容优先

---

## 工具 API

### 核心记忆工具
| 工具 | 参数 | 作用 |
|-----|------|------|
| `memory_search` | `query=<搜索词>`, `maxResults=<数量=10>`, `minScore=<阈值=0.45>`, `role=<用户/助手/系统>` | 搜索长期记忆，自动召回不足时主动调用 |
| `memory_get` | `chunkId=<记忆ID>`, `maxChars=<最大字符=2000>` | 获取搜索命中 chunk 的完整原始内容 |
| `memory_store` | `content=<内容>`, `summary=<摘要>` | 保存重要事实、偏好、决定到本地记忆 |
| `memory_forget` | `chunkId=<记忆ID>` | 删除匹配的记忆 |
| `memory_timeline` | `chunkId=<记忆ID>`, `window=<前后N条=2>` | 查看命中记忆的前后对话上下文 |
| `task_summary` | `taskId=<任务ID>` | 获取完整任务详情，搜索结果带 `task_id` 时调用 |
| `memory_viewer` | 无参数 | 返回记忆管理界面 URL，用户问如何查看/管理记忆时调用 |

### 技能工具
| 工具 | 作用 |
|-----|------|
| `skill_search` | `query=<技能关键词>` | 搜索可用技能 |
| `skill_get` | `skillId=<技能ID>` / `taskId=<任务ID>` | 获取技能详情 |
| `skill_install` | `skillId=<技能ID>` | 安装技能到本地环境 |
| `skill_publish` | `skillId=<技能ID>`, `target=<agents/hub>` | 共享技能给其他用户/团队 |

---

## 常用 CLI 命令

```bash
# 检查记忆系统状态
openclaw memory status --deep --agent main

# 强制重建索引（索引损坏/不完整时）
openclaw memory index --force --agent main

# 搜索记忆
openclaw memory search "项目配置" --maxResults 20

# 预览记忆提升候选
openclaw memory promote --limit 10 --minScore 0.75

# 手动确认提升到 MEMORY.md
openclaw memory promote --apply

# 解释记忆提升原因
openclaw memory promote-explain "路由器配置"

# 预览 REM 阶段反思结果
openclaw memory rem-harness

# 查看长期记忆（LanceDB 插件）
openclaw ltm list
openclaw ltm search "关键词"
```

---

## 最佳实践

### 1. 搜索技巧
❌ 不要直接传完整用户消息作为搜索词
✅ 提取核心关键词，生成 2-5 词短查询
✅ 多个角度拆分查询，多次搜索
✅ 增加 `role=user` 过滤用户说过的内容

### 2. 记忆管理
✅ 重要决定手动调用 `memory_store` 标记
✅ 定期 `openclaw memory promote` 整理记忆
✅ 敏感信息手动 `memory_forget` 删除
❌ 不要存大段日志、临时内容
❌ 不要存重复内容

### 3. 性能优化
✅ 记忆总大小控制在 1000 条以内
✅ 无关记忆及时删除
✅ 每月 `openclaw memory index --force` 重建索引优化性能
✅ 嵌入模型用 BGE-Small-ZH-v1.5（中文最优平衡）

---

## 常见问题

### Q: 记忆搜索不到相关内容？
A:
1. 检查嵌入服务状态：`systemctl status bge-embedding`
2. 重建索引：`openclaw memory index --force`
3. 降低 `minScore` 阈值再搜索
4. 用更简短的关键词搜索

### Q: 自动召回不相关内容？
A:
1. 提高 `minScore` 阈值
2. 删除过时无关记忆
3. 重建索引

### Q: Dreaming 不自动提升记忆？
A:
1. 检查定时任务状态：`systemctl --user status openclaw-scheduler`
2. 手动运行一次：`openclaw memory promote --apply`
3. 降低 `minScore`/`minRecallCount` 阈值

---

## 相关文档
- [记忆架构](memory.md)
- [Dreaming 机制](dreaming.md)
- [内置记忆引擎](memory-builtin.md)
- [LanceDB 记忆插件](memory-lancedb.md)
- [记忆配置参考](../plugins/memory-configuration-reference.md)

---

**⚠️ 记忆：本文档是手动导入的 Wiki，需要手动运行索引更新才能被语义搜索找到：**
```bash
python3 /opt/.openclaw/workspace/skills/agent-wiki-mcp/scripts/wiki-quick-ingest.py
```