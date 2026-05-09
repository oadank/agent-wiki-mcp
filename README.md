# Agent Wiki MCP

基于 PostgreSQL + pgvector + BGE 向量嵌入的本地知识库，支持 MCP 跨平台调用。

---

## 项目来源

Fork 自 [oadank/openclaw-wiki-lancedb](https://github.com/oadank/openclaw-wiki-lancedb)。

**迁移记录**：
- 原方案：LanceDB（嵌入式向量库）
- 新方案：PostgreSQL + pgvector（服务端向量库）
- 原因：多 AI 共用场景，PG 并发更强
- 完成时间：2026-05-09

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
| `wiki_rebuild_index` | 重建索引 | 全量重建（慎用） |
| `wiki_validate` | 验证结构 | 检查 wiki 完整性 |
| `wiki_add` | 单文件入库 | 新增页面到向量库 |
| `wiki_delete` | 单文件删除 | 删除页面及向量 |
| `wiki_incremental` | 增量入库 | 扫描新增页面入库 |
| `wiki_remember` | 记录知识 | 保存共享知识 |
| `wiki_recall` | 查询记忆 | 搜索共享知识 |
| `wiki_explain` | 解释来源 | 显示页面原始 URL |

---

## MCP 配置

### Claude Code

**文件**: `/opt/.mcp.json`

```json
{
  "mcpServers": {
    "openclaw-wiki": {
      "command": "node",
      "args": ["/opt/.openclaw/workspace/skills/agent-wiki-mcp/mcp_server/server.js"]
    }
  }
}
```

### Codex

**文件**: `~/.codex/config.toml`

```toml
[mcp_servers.openclaw-wiki]
command = "node"
args = ["/opt/.openclaw/workspace/skills/agent-wiki-mcp/mcp_server/server.js"]
```

### Cursor / VS Code

参考 `mcp_server/MCP_CONFIG.md`

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
# 单文件入库（推荐）
python3 .pgvector/wiki-pgvector.py add knowledge/plugins/new.md

# 增量入库（扫描新增）
python3 .pgvector/wiki-pgvector.py incremental

# 全量重建（慎用，大批量）
python3 .pgvector/wiki-pgvector.py build
```

**建议**：日常用 `add` 单条入库，索引自动更新，不卡系统。

---

## 索引维护

```bash
# 单文件入库（索引自动更新）
python3 .pgvector/wiki-pgvector.py add knowledge/plugins/new.md

# 单文件删除（索引自动更新）
python3 .pgvector/wiki-pgvector.py delete knowledge/plugins/old.md

# 增量入库（新增页面）
python3 .pgvector/wiki-pgvector.py incremental

# 全量重建（大批量时使用）
python3 .pgvector/wiki-pgvector.py build
```

**N5105 防卡策略**：
- 单条操作：索引自动更新，无需手动干预
- 大批量（500+）：延迟索引（先删索引 → 入库 → 重建），防止卡死

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

- **2026-05-09**: LanceDB → pgvector 迁移（1570 页入库）
- **2026-05-09**: 目录重构 → knowledge/ 统一组织
- **2026-05-09**: pgvector 0.8.2 + wiki_vectors 表
- **2026-05-07**: 清理重复文件，修复路径映射
- **2026-04-28**: 初始导入 OpenClaw 文档

---

## 引用记录

| 来源 | 页数 | 说明 |
|------|------|------|
| OpenClaw 官方文档 | 487 | https://github.com/openclaw/openclaw |
| LiteLLM 文档 | 24 | Proxy/Core/Providers 等 |
| Gateway 配置 | 12 | 认证/路由/代理等 |
| 插件文档 | 100+ | channels/plugins/tools |

---

## 相关链接

- OpenClaw 官方文档: https://docs.openclaw.ai
- GitHub: https://github.com/openclaw/openclaw
- pgvector: https://github.com/pgvector/pgvector
- BGE Embedding: https://huggingface.co/BAAI/bge-small-zh-v1.5