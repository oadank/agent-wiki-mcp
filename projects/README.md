---
title: 项目目录说明
category: projects
---

# projects/ 目录

按项目维度组织知识，实现"换 AI 不丢进度"。

---

## 目录结构

```
projects/
├── .templates/           # 模板文件
│   ├── progress.md       # 进度记录模板
│   └── decisions.md      # 技术决策模板
├── {{项目名}}/           # 具体项目目录
│   ├── progress.md       # 项目进度（AI 必读）
│   ├── decisions.md      # 技术决策记录
│   ├── current-state.md  # 当前状态快照
│   └── references/       # 相关文档链接
```

---

## 使用方法

### 创建新项目

```bash
# 复制模板
cp projects/.templates/progress.md projects/my-project/progress.md
cp projects/.templates/decisions.md projects/my-project/decisions.md

# 入库
python3 .pgvector/wiki-pgvector.py add projects/my-project/progress.md
```

### AI 接手项目

```bash
# 查询项目进度
wiki_query "my-project progress"

# 或 MCP 调用
wiki_recall "my-project"
```

### 更新进度

```bash
# MCP 调用（AI 完成任务后）
wiki_update_progress "my-project" "完成数据库迁移" "Claude" "✅"
```

---

## 设计理念

1. **进度可见**: 任何 AI 都能读取 progress.md 了解项目状态
2. **决策传承**: decisions.md 记录"为什么"，避免重复讨论
3. **原子更新**: wiki_update_progress 单条追加，不重建索引
4. **跨平台**: MCP 协议，Claude/Codex/Hermes/OpenClaw 都可用