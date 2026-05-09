---
title: 项目跟踪文件编写指南
category: template
---

# 项目跟踪文件编写指南

> 任何 AI 注册或更新项目时，必须遵循此指南。

---

## 一、progress.md 编写规范

### 必须包含的结构

```markdown
---
title: {{项目名}} 进度记录
category: project
---

# {{项目名}} 进度记录

> 任何 AI 接手此项目时，先阅读此文件了解当前状态。

## 项目概述

- **项目名**: {{项目名}}
- **目标**: {{一句话描述项目目标}}
- **负责人**: {{用户名}}
- **创建时间**: {{YYYY-MM-DD}}

---

## 当前状态

| 状态 | 说明 |
|------|------|
| 🚧/✅/❌ | {{当前阶段}} |
| 下一步 | {{待办任务}} |
| 阻塞 | {{如有阻塞问题，写在这里；无则写"无"}} |

---

## 进度日志

| 时间 | AI | 任务 | 状态 | 备注 |
|------|----|----|------|------|
| {{YYYY-MM-DD HH:mm}} | {{Claude/Codex/OpenClaw}} | {{任务描述}} | ✅/🚧/❌ | {{详细信息}} |
```

### 重要规则

1. **表格必须有换行符**：每行 `|` 结尾后必须有换行
2. **时间格式统一**：`YYYY-MM-DD HH:mm`（不要用 ISO 格式）
3. **AI 名称统一**：Claude / Codex / OpenClaw / Hermes（不要写其他）
4. **状态符号统一**：✅ 完成 / 🚧 进行中 / ❌ 失败

---

## 二、meta.json 编写规范

### 必填字段

```json
{
  "projectName": "{{项目名}}",
  "realPath": "{{项目实际路径}}",
  "status": "active",
  "createdAt": "{{ISO时间}}",
  "lastSession": "{{ISO时间}}",
  "lastAI": "{{Claude/Codex/OpenClaw}}",
  "currentTask": "{{当前任务描述}}",
  "taskStatus": "✅",
  "indexed": false,
  "daysSinceUpdate": 0
}
```

### 可选字段

| 字段 | 说明 | 使用场景 |
|------|------|----------|
| `relatedPaths` | 关联路径数组 | 多实例项目（如 agents-to-im） |
| `description` | 项目描述 | 复杂项目需要额外说明 |
| `pendingChanges` | 待处理变更 | **最多 20 条**，超过则截断 |

### 禁止事项

1. **禁止记录过多文件**：`pendingChanges.files` 最多 20 条
2. **禁止缺少必填字段**：projectName、realPath、status、lastAI 必须有
3. **禁止用错误路径**：realPath 必须是项目实际路径，不是 wiki 路径

---

## 三、registry.json 编写规范

### 单路径项目

```json
{
  "projects": {
    "my-app": {
      "path": "/opt/my-app",
      "status": "active",
      "createdAt": "2026-05-09T10:00:00Z",
      "lastCheck": "2026-05-09T12:00:00Z"
    }
  }
}
```

### 多路径项目

```json
{
  "projects": {
    "agents-to-im": {
      "path": "/opt/.agents-to-im-claude",
      "status": "active",
      "relatedPaths": [
        "/opt/.agents-to-im-codex",
        "/usr/bin/agents-to-im"
      ],
      "description": "飞书桥接软件（Claude + Codex 两个实例）"
    }
  }
}
```

---

## 四、常见错误示例

### ❌ 错误的 progress.md

```markdown
| 时间 | AI | 任务 | 状态 | 备注 |
|------|----|----|------|------|
| 2026-05-09 22:53 | Claude | 创建文件 | ✅ | 初始化 || 2026-05-09 22:54 | Codex | 测试 | ✅ | 成功 |
```

**问题**：表格行缺少换行符，两行合并成一行。

### ✅ 正确的 progress.md

```markdown
| 时间 | AI | 任务 | 状态 | 备注 |
|------|----|----|------|------|
| 2026-05-09 22:53 | Claude | 创建文件 | ✅ | 初始化 |
| 2026-05-09 22:54 | Codex | 测试 | ✅ | 成功 |
```

---

### ❌ 错误的 meta.json

```json
{
  "pendingChanges": [
    {
      "files": ["134个文件...全部列出"]
    }
  ]
}
```

**问题**：记录过多文件，导致 meta.json 过大（可能超过 10KB）。

### ✅ 正确的 meta.json

```json
{
  "pendingChanges": [
    {
      "type": "files_modified",
      "count": 134,
      "files": ["前 20 个文件...截断显示"]
    }
  ]
}
```

---

## 五、AI 执行流程

### 注册新项目

```
1. 检查项目路径是否存在
2. 创建 projects/{{项目名}}/ 目录
3. 写入 progress.md（遵循上述格式）
4. 写入 meta.json（必填字段齐全）
5. 更新 registry.json
6. 入库到向量库
```

### 更新进度

```
1. 读取现有 progress.md
2. 在进度日志表格追加新行（注意换行符）
3. 更新 meta.json 的 lastSession、lastAI、currentTask
4. 入库到向量库
```

---

## 六、检查清单

AI 完成项目注册或更新后，必须自查：

| 检查项 | 要求 |
|------|------|
| progress.md 表格换行 | 每行独立，无合并 |
| progress.md 时间格式 | YYYY-MM-DD HH:mm |
| meta.json 必填字段 | projectName、realPath、status、lastAI |
| meta.json 文件大小 | < 2KB（pendingChanges 限制 20 条） |
| registry.json 路径正确 | path 是项目实际路径 |