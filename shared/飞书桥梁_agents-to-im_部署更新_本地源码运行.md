---
title: "飞书桥梁 agents-to-im 部署更新：本地源码运行"
category: shared
date: 2026-05-23 16:26
tags: ["infrastructure","feishu","agents-to-im","deployment","systemd"]
---
# 飞书桥梁 agents-to-im 部署更新：本地源码运行

## 部署方式（2026-05-23 更新）

**已改为本地源码运行，不再使用全局 npm 安装。**

### 源码路径
- `/opt/agents-to-im/` — agents-to-im 源码仓库（fork: oadank/agents-to-im）

### 三个 systemd 服务
| 服务 | CTI_HOME | Dashboard Port | 状态 |
|------|----------|----------------|------|
| `feishu-claude.service` | `/opt/.agents-to-im-claude` | 13579 | Claude 实例 |
| `feishu-codex.service` | `/opt/.agents-to-im-codex` | 13580 | Codex 实例 |
| `agents-to-im-openhuman.service` | `/opt/.agents-to-im-openhuman` | 13581 | OpenHuman 实例 |

### 启动命令（所有实例）
```
ExecStart=/usr/bin/node /opt/agents-to-im/dist/daemon.mjs
```

### 更新流程
```bash
cd /opt/agents-to-im
npm run build          # 编译 daemon.mjs
systemctl restart feishu-claude.service   # 重启对应实例
```

### 飞书命令
- `/new:claude` `/resume:claude` — Claude 会话
- `/new:codex` `/resume:codex` — Codex 会话  
- `/new:openhuman` `/resume:openhuman` — OpenHuman 会话

### Git 状态
- 分支：`my-changes`
- 仓库：`https://github.com/oadank/agents-to-im`
- 最新 commit：`7248041` feat: OpenHuman runtime + 私聊自动建会话

---

## 历史记录
- 2026-05-23：从全局 npm 安装迁移到本地源码运行，卸载全局包，更新三个 systemd service 文件
- 2026-05-23：添加 OpenHuman runtime 支持，私聊自动建会话（不再建群），SSE 格式修复
- 2026-05-23：权限审批卡片状态更新修复（使用 cardkit.card.update）
- 2026-05-09：首次部署三个实例（Claude + Codex）
