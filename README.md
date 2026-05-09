# Agent Wiki MCP

基于 PostgreSQL + pgvector + BGE 向量嵌入的本地知识库，支持 MCP 跨平台调用。

---

## 功能特性

| 功能 | 说明 |
|------|------|
| **混合搜索** | grep 精确匹配 + pgvector 语义搜索，双重验证 |
| **MCP 支持** | Claude Code / Codex / Cursor / VS Code Copilot |
| **多格式导入** | PDF / DOCX / XLSX / Markdown 自动解析 |
| **增量索引** | 新文档随时添加，向量 INSERT 更新 |
| **共享记忆** | user-preferences / project-decisions 跨 AI 共享 |
| **多 AI 并发** | PostgreSQL 多进程，适合多 Agent 共用 |

---

## 为什么用 pgvector？

| 对比 | pgvector | LanceDB |
|------|----------|---------|
| **并发查询** | ✅ PG 多进程强 | ⚠️ 单进程 |
| **成熟稳定** | ✅ PG 生态验证 | ⚠️ 较新 |
| **SQL 接口** | ✅ 纯 SQL 操作 | ❌ Python/JS API |
| **ACID 支持** | ✅ 强一致性 | ⚠️ 较弱 |
| **增量向量** | ✅ INSERT/UPDATE | ✅ 自动 |
| **自动索引** | ⚠️ 需手动 REINDEX | ✅ 自动 |
| **N5105 兼容** | ✅ 无 AVX 依赖 | ✅ 无 AVX 依赖 |

**结论**：多 AI 共用场景选 pgvector（本项目），单 AI 场景可用 LanceDB。

---

## 目录结构

```
agent-wiki-mcp/
├── mcp_server/               # MCP Server（跨平台调用）
│   ├── server.js             # MCP 入口
│   └── MCP_CONFIG.md         # 配置指南
├── shared/                   # 共享知识（跨 AI 可用）
│   ├── user-preferences/     # 用户偏好
│   ├── project-decisions/    # 项目决策
│   └── technical-facts/      # 技术事实
├── scripts/                  # 搜索脚本
│   ├── unified-search.js     # 统一搜索入口
│   ├── wiki-quick-ingest.py  # 快速入库（0 token）
│   └── parsers/              # 多格式解析
├── .pgvector/                # pgvector 向量存储
│   ├── wiki-pgvector.py      # 向量搜索脚本
│   └── wiki_vectors 表       # PostgreSQL 表
├── knowledge/                # 知识库（整理后）
│   ├── openclaw/             # OpenClaw 核心（21 子目录）
│   ├── litellm/              # LiteLLM 文档（24 子目录）
│   ├── gateway/              # Gateway 配置
│   ├── plugins/              # 插件文档
│   └── channels/             # 频道文档
├── _raw/                     # 原始文件（待入库）
├── .manifest.json            # 来源映射清单
├── index.md                  # 全量索引（人类可读）
└── SKILL.md                  # 技能定义（Agent 必读）
```

---

## MCP 工具列表

| 工具名 | 功能 | 用途 |
|--------|------|------|
| `wiki_query` | 快速搜索 | 返回匹配页面列表 |
| `wiki_deep_query` | 深度搜索 | LLM 综合回答复杂问题 |
| `wiki_brief` | 工作摘要 | 近 24 小时操作记录 |
| `wiki_status` | Wiki 状态 | 目录、索引完整性 |
| `wiki_ingest_status` | 消化状态 | 待消化源文件 |
| `wiki_ingest` | 消化文件 | raw → wiki 页面 |
| `wiki_pages` | 列出页面 | 查看所有 wiki 页面 |
| `wiki_rebuild_index` | 重建索引 | 更新搜索索引 |
| `wiki_validate` | 验证结构 | 检查 wiki 完整性 |
| `wiki_remember` | 记录知识 | 保存共享知识 |
| `wiki_recall` | 查询记忆 | 搜索共享知识 |
| `wiki_explain` | 解释来源 | 显示页面原始 URL |

---

## 快速搜索

```bash
# pgvector 向量搜索
python3 .pgvector/wiki-pgvector.py search "关键词" 5

# grep 精确匹配
grep -r "关键词" knowledge/ --include="*.md"

# MCP 调用（Claude Code / Codex）
wiki_query "litellm config"
wiki_deep_query "gateway 报错排查"
```

---

## 导入新文档

```bash
# 快速入库（0 token，秒级）
python3 scripts/wiki-quick-ingest.py <文件路径> [分类]

# 批量入库
python3 scripts/wiki-quick-ingest.py --batch <目录>

# 增量更新向量
python3 .pgvector/wiki-pgvector.py build  # 全量重建
# 或手动 INSERT 单条
```

---

## 索引维护

```bash
# 重建向量索引
python3 .pgvector/wiki-pgvector.py build

# 清理已删除页面
python3 .pgvector/wiki-pgvector.py clean

# 重建 HNSW 索引（增量更新后）
psql -U postgres -c "REINDEX INDEX wiki_embedding_idx;"
```

---

## PostgreSQL 表结构

```sql
CREATE TABLE wiki_vectors (
  id SERIAL PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  title TEXT,
  summary TEXT,
  content TEXT,
  embedding vector(512),        -- BGE-Small-ZH 512 维
  category TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX wiki_embedding_idx 
ON wiki_vectors USING hnsw (embedding vector_cosine_ops);
```

---

## 环境配置

```bash
# 必填
EMBEDDING_URL=http://localhost:11435/v1/embeddings  # BGE 嵌入服务

# PostgreSQL
PG_HOST=localhost
PG_DATABASE=postgres
PG_USER=postgres
```

---

## 更新日志

- **2026-05-09**: LanceDB → pgvector 迁移完成
- **2026-05-09**: 目录结构大重构 → knowledge/ 统一组织
- **2026-05-09**: pgvector 0.8.2 安装，wiki_vectors 表创建
- **2026-05-07**: 清理重复文件，修复 `.manifest.json` 路径映射
- **2026-04-28**: 初始导入 487 页 OpenClaw 文档

---

## 相关链接

- OpenClaw 官方文档: https://docs.openclaw.ai
- GitHub: https://github.com/openclaw/openclaw
- pgvector: https://github.com/pgvector/pgvector
- BGE Embedding: https://huggingface.co/BAAI/bge-small-zh-v1.5