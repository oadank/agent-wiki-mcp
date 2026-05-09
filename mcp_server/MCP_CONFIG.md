# OpenClaw Wiki MCP Server 配置指南

## 安装位置
```
/opt/.openclaw/workspace/skills/agent-wiki-mcp/mcp_server/
```

## MCP 工具列表

| 工具名 | 功能 | 用途 |
|--------|------|------|
| `wiki_query` | 快速搜索 | 搜索关键词，返回匹配页面列表 |
| `wiki_deep_query` | 深度搜索 | LLM 综合回答复杂问题 |
| `wiki_brief` | 工作摘要 | 预加载近 24 小时操作记录 |
| `wiki_status` | Wiki 状态 | 检查目录、索引完整性 |
| `wiki_ingest_status` | 消化状态 | 检查待消化源文件 |
| `wiki_ingest` | 消化文件 | 将 raw 文件转为 Wiki 页面 |
| `wiki_pages` | 列出页面 | 查看所有 Wiki 页面 |
| `wiki_rebuild_index` | 重建索引 | 更新搜索索引 |
| `wiki_validate` | 验证结构 | 检查 Wiki 完整性 |
| `wiki_remember` | 记录知识 | 保存共享知识到 Wiki |
| `wiki_recall` | 查询记忆 | 搜索共享知识 |
| `wiki_explain` | 解释来源 | 显示页面原始 URL |

---

## Claude Code 配置

**文件**: `/opt/.claude/settings.json`

```json
{
  "mcpServers": {
    "openclaw-wiki": {
      "command": "node",
      "args": [
        "/opt/.openclaw/workspace/skills/agent-wiki-mcp/mcp_server/server.js"
      ]
    }
  }
}
```

---

## Codex 配置

**文件**: `~/.codex/config.toml`

```toml
[mcp_servers.openclaw-wiki]
command = "node"
args = ["/opt/.openclaw/workspace/skills/agent-wiki-mcp/mcp_server/server.js"]
```

⚠️ 注意: Codex 目前 `disable_mcp = true`，需改为 `disable_mcp = false` 才能使用 MCP。

---

## Cursor 配置

**文件**: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "openclaw-wiki": {
      "command": "node",
      "args": [
        "/opt/.openclaw/workspace/skills/agent-wiki-mcp/mcp_server/server.js"
      ]
    }
  }
}
```

---

## VS Code Copilot 配置

在 VS Code 设置中添加 MCP server 配置（需安装 MCP 扩展）。

---

## AGENTS.md 入口（Codex 自动读取）

**文件**: `~/.codex/AGENTS.md` 或项目级 `./AGENTS.md`

```markdown
## OpenClaw Wiki 知识库

遇到 OpenClaw 相关问题，先用 MCP 工具查询 wiki：

- `wiki_query` — 快速搜索关键词
- `wiki_deep_query` — 深度搜索（复杂问题）
- `wiki_brief` — 工作前预加载状态
- `wiki_remember` — 记录重要决策/偏好
- `wiki_recall` — 查询历史记忆

示例：
- "LiteLLM 怎么配置" → `wiki_query "litellm config"`
- "gateway 报错排查" → `wiki_deep_query "gateway error"`
```

---

## 记忆层结构

```
wiki/
├── shared/               ← 共享知识（所有 AI 可用）
│   ├── user-preferences/
│   ├── project-decisions/
│   └── technical-facts/
└── memories/             ← 真记忆（按 AI 分离，非自我认知）
    ├── claude/
    ├── codex/
    └── openclaw/
```

**关键规则**:
- `wiki_remember` 写入 `shared/`（共享知识）
- AI 自我认知由各 AI 自己管理，不共享