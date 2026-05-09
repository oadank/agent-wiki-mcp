---
title: pgvector 迁移决策
category: project-decisions
date: 2026-05-09T14:55:00+08:00
tags: ["pgvector", "migration", "n5105", "performance"]
---

# pgvector 迁移决策

## 决策内容

将 wiki 向量存储从 LanceDB 迁移到 PostgreSQL + pgvector。

## 原因

| 原因 | 说明 |
|------|------|
| 多 AI 共用 | PostgreSQL 数据库，多 Agent 可共用 |
| 并发查询 | PG 多进程，查询性能更强 |
| 成熟稳定 | PG 生态验证多年 |
| N5105 兼容 | pgvector 无 AVX 硬依赖 |

## N5105 卡死问题

### 原因
HNSW 索引在每次 INSERT 时实时更新，N5105 CPU 算力不足。

### 解决方案
**延迟索引策略**：
1. 入库前删除 HNSW 索引
2. 批量 INSERT（无索引压力）
3. 每批后 sleep 给系统呼吸
4. 入库完成后一次性重建索引

## 脚本功能

| 命令 | 功能 |
|------|------|
| `build` | 全量重建（延迟索引） |
| `incremental` | 增量入库（不重建索引） |
| `add <路径>` | 单文件入库 |
| `delete <路径>` | 单文件删除 |
| `reindex` | 手动重建索引 |

## 防卡参数

- BATCH_SIZE: 10
- BATCH_DELAY: 3s
- EMBED_DELAY: 0.5s

## 后续维护

单文件更新用 `add/delete`，增量入库用 `incremental`，大量入库后手动 `reindex`。

## Why

LanceDB 入库快但不支持多 AI 共用。pgvector 适合多 Agent 场景，但 N5105 需防卡策略。

## How to apply

增量入库时不重建索引，单条操作轻量化。大批量入库必须先删索引后重建。