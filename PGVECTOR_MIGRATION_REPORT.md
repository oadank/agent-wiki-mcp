# pgvector 迁移完工报告

## 项目信息

| 项目 | 说明 |
|------|------|
| 仓库名 | agent-wiki-mcp |
| GitHub | https://github.com/oadank/agent-wiki-mcp |
| 完成时间 | 2026-05-09 |
| 入库数量 | 1570 页 |

---

## 迁移概述

### 原方案：LanceDB
- 嵌入式数据库，Arrow 文件追加
- 自动索引，写入即建
- 单进程，无通信开销
- 入库 1571 页用时 ~5 分钟

### 新方案：PostgreSQL + pgvector
- 服务端数据库，SQL 接口
- HNSW 索引，需手动维护
- 多进程（Python + BGE + PostgreSQL）
- 入库用时更长（延迟索引策略）

---

## 为什么迁移

| 原因 | 说明 |
|------|------|
| **多 AI 并发** | pgvector 支持 PG 多进程，查询更强 |
| **数据共享** | PostgreSQL 数据库，多 Agent 共用 |
| **成熟稳定** | PG 生态验证，工具丰富 |
| **SQL 接口** | 纯 SQL 操作，调试方便 |
| **N5105 兼容** | pgvector 无 AVX 硬依赖 |

---

## 核心问题：N5105 卡死

### 原因分析

| 因素 | LanceDB | pgvector |
|------|---------|----------|
| 实时索引 | Arrow 追加（无压力） | HNSW 写时更新（CPU密集） |
| 进程数 | 1（Node.js） | 3+（Python+BGE+PG） |
| 通信开销 | 无（本地文件） | 每次跨进程 SQL+WAL |

**核心瓶颈**：HNSW 索引在每次 INSERT 时更新树结构，N5105 CPU 不够。

### 解决方案：延迟索引策略

```
1. 删除 HNSW 索引（入库时不更新）
2. 批量 INSERT 数据（无索引压力）
3. 每批后 sleep 给系统呼吸
4. 入库完成后一次性重建索引
```

---

## 脚本功能

### wiki-pgvector.py

| 命令 | 功能 | 说明 |
|------|------|------|
| `build` | 全量重建 | 删除索引 → 清空 → 入库 → 重建索引 |
| `incremental` | 增量入库 | 只入库新增页面，不重建索引 |
| `add <路径>` | 单文件入库 | 单条 INSERT，轻量操作 |
| `delete <路径>` | 单文件删除 | 单条 DELETE |
| `search "关键词"` | 向量搜索 | HNSW 索引查询 |
| `clean` | 清理已删除 | 扫描文件，DELETE 不存在的 |
| `reindex` | 重建索引 | 手动触发 HNSW 重建 |

### 防卡参数

| 参数 | 值 | 说明 |
|------|-----|------|
| BATCH_SIZE | 10 | 每批处理数量 |
| BATCH_DELAY | 3s | 每批后等待 |
| EMBED_DELAY | 0.5s | 每次 embedding 后等待 |

---

## 数据库结构

```sql
CREATE TABLE wiki_vectors (
  id SERIAL PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  title TEXT,
  summary TEXT,
  content TEXT,
  embedding vector(512),        -- BGE-Small-ZH 512维
  category TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX wiki_embedding_idx 
ON wiki_vectors USING hnsw (embedding vector_cosine_ops);
```

---

## 目录结构

```
agent-wiki-mcp/
├── mcp_server/               # MCP Server
├── shared/                   # 共享知识
├── scripts/                  # 搜索脚本
├── .pgvector/                # pgvector 存储
│   ├── wiki-pgvector.py      # 入库/搜索脚本
│   └── (wiki_vectors 表)    # PostgreSQL 表
├── knowledge/                # 知识库
│   ├── openclaw/             # 21 子目录
│   ├── litellm/              # 24 子目录
│   ├── gateway/
│   ├── plugins/
│   └── channels/
├── README.md                 # 说明文档
└── index.md                  # 全量索引
```

---

## GitHub 推送记录

| 提交 | 说明 |
|------|------|
| `feat: LanceDB → pgvector 迁移` | 目录重构 + README 更新 |
| `perf: pgvector 入库优化` | 延迟索引策略 |
| `feat: 增量入库 + 删除功能` | incremental/add/delete 命令 |
| `perf: sleep 改为 1s` | 提速优化 |

---

## 后续维护

### 单文件更新

```bash
# 新增文件入库
python3 .pgvector/wiki-pgvector.py add knowledge/plugins/new.md

# 删除文件
python3 .pgvector/wiki-pgvector.py delete knowledge/plugins/old.md
```

### 增量入库

```bash
# 扫描新增页面入库（不重建索引）
python3 .pgvector/wiki-pgvector.py incremental
```

### 批量后重建索引

```bash
# 大量入库后手动重建索引
python3 .pgvector/wiki-pgvector.py reindex
```

---

## 性能对比

| 维度 | LanceDB | pgvector |
|------|---------|----------|
| 入库速度 | ~5 分钟 | ~15 分钟（延迟索引） |
| 查询速度 | 快 | 快（HNSW 索引） |
| 并发能力 | 单进程 | PG 多进程强 |
| 系统影响 | 低 | 需防卡策略 |
| 维护成本 | 低 | 需手动 reindex |

---

## 总结

pgvector 迁移完成，支持多 AI 共用和并发查询。N5105 需采用延迟索引策略避免卡死。增量入库功能已就绪，后续维护轻量化。