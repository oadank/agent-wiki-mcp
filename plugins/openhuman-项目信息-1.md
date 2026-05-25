---
title: "OpenHuman 项目信息"
category: plugins
tags: []
sources:
  - openhuman-project.md
sourceType: article
certainty: fact
status: active
created: "2026-05-22T17:49:44.371047+00:00"
updated: "2026-05-22T17:49:44.371079+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** OpenHuman 项目信息

# OpenHuman 项目信息

> 更新时间：2026-05-23
> 录入时间：2026-05-17

## 基本信息

| 项目 | 内容 |
|------|------|
| **项目名** | OpenHuman |
| **仓库** | https://github.com/AusAgentSmith/openhuman（修改版） |
| **上游** | https://github.com/tinyhumansai/openhuman（官方） |
| **版本** | 0.54.1 |
| **语言** | Rust (core) + TypeScript/React (frontend) |
| **协议** | GPL-3.0 |
| **状态** | Early Beta |

## 部署架构

**纯 Server 部署**（headless，无桌面端）：

```
┌─────────────────────────────────────────────┐
│  Debian 12 (N5105, 8GB)                     │
│                                             │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │ openhuman     │    │ openhuman-web     │   │
│  │ (Rust core)   │    │ (Python http)     │   │
│  │ :7788         │    │ :7799             │   │
│  │ JSON-RPC      │    │ 静态 SPA          │   │
│  └──────┬───────┘    └────────┬──────────┘   │
│         │                     │              │
│         └──── Socket.IO ──────┘              │
│                                             │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │ LiteLLM       │    │ BGE Embedding     │   │
│  │ :4000         │    │ :11435            │   │
│  │ 模型代理       │    │ 本地向量           │   │
│  └──────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────┘
```

## 服务清单

| 服务 | 端口 | systemd | 说明 |
|------|------|---------|------|
| `openhuman.service` | 7788 | 系统级 | Core JSON-RPC 服务器 |
| `openhuman-web.service` | 7799 | 系统级 | Web 前端（Python http.server） |
| `litellm.service` | 4000 | 系统级 | 模型代理 |
| `bge-embedding` | 11435 | — | 本地 embedding 服务 |

## 安装方式

### 1. 编译 openhuman-core

```bash
# 依赖
apt-get install -y build-essential cmake pkg-config libssl-dev \
  libasound2-dev libxdo-dev libxtst-dev libx11-dev libevdev-dev clang mold

# Rust 1.93.0（项目 pinned）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup install 1.93.0

# 编译
cd /opt/openhuman
cargo build --release --bin openhuman-core
# N5105 约 40 分钟（首次），有增量缓存后几秒

# 安装
cp target/release/openhuman-core /usr/local/bin/
```

### 2. 构建 Web 前端

```bash
cd /opt/openhuman/app
pnpm install
pnpm build:web  # 产物在 app/dist-web/
```

### 3. 配置 systemd

**openhuman.service:**
```ini
[Unit]
Description=OpenHuman Core Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
EnvironmentFile=/root/.openhuman/.env
ExecStart=/usr/local/bin/openhuman-core run
WorkingDirectory=/root/.openhuman
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**openhuman-web.service:**
```ini
[Unit]
Description=OpenHuman Web Client
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 -m http.server 7799 --directory /opt/openhuman/app/dist-web --bind 0.0.0.0
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### 4. 环境变量

`/root/.openhuman/.env`:
```bash
OPENHUMAN_CORE_TOKEN=<rand-hex-32>
OPENHUMAN_CORE_HOST=0.0.0.0
OPENHUMAN_CORE_PORT=7788
RUST_LOG=info
```

## 配置方式

### 配置文件位置

`/root/.openhuman/users/<user-id>/config.toml`

- `user-id` 从 `/root/.openhuman/active_user.toml` 读取
- 当前用户：`6a0bd5556b16f2d8e561ee92`

### ⚠️ 配置重置陷阱

**Core 启动时会解析 config.toml，如果遇到无效值，会用默认配置覆盖并写回文件！**

- `autonomy.level` 合法值：`readonly`、`supervised`、`full`（**不是** `agentic`）
- 修改配置后必须验证合法性，否则重启后全部丢失
- 正确的改配置流程：`systemctl stop openhuman` → 改文件 → `systemctl start openhuman`

### 模型配置

通过 `config.toml` 的 `*_provider` 字段和 `[[cloud_providers]]` 配置：

```toml
default_model = "claude-model"
chat_provider = "anthropic:claude-model"
reasoning_provider = "anthropic:claude-model"
agentic_provider = "anthropic:claude-model"
coding_provider = "anthropic:claude-model"
memory_provider = "anthropic:claude-model"
embeddings_provider = "openai:bge-small-zh-v1.5"

[[cloud_providers]]
id = "p_anthropic_claude"
slug = "anthropic"
label = "Anthropic (LiteLLM)"
endpoint = "http://localhost:4000/"
auth_style = "bearer"
```

**注意：**
- `auth_style` 合法值：`bearer`、`anthropic`、`none`（**不是** `openai`）
- `slug` 决定 provider 类型，必须跟 `*_provider` 里的前缀匹配
- embedding 用本地 BGE（localhost:11435），不走 LiteLLM

### 权限配置

```toml
[autonomy]
level = "full"                    # 合法值：readonly / supervised / full
workspace_only = false            # false = 可访问系统目录
allowed_commands = ["*"]          # 允许所有命令
forbidden_paths = []              # 不禁止任何路径
block_high_risk_commands = false
require_approval_for_medium_risk = false
max_actions_per_hour = 200
max_cost_per_day_cents = 50000
max_tool_iterations = 30          # 工具调用次数上限（默认 10 太小）
```

### 工具启用

`app-state.json` 里的 `enabledTools` 控制 agent 可用的工具：

文件：`/root/.openhuman/users/<user-id>/workspace/state/app-state.json`

必须包含的工具（默认可能缺失）：
```json
{
  "onboardingTasks": {
    "enabledTools": [
      "shell", "git_operations", "file_read", "file_write",
      "screenshot", "image_info", "web_search",
      "memory_store", "memory_recall", "memory_forget",
      "cron", "schedule",
      "glob", "list_dir", "grep", "edit_file", "apply_patch",
      "csv_export", "spawn_subagent", "spawn_parallel_agents",
      "todo", "plan_exit", "current_time",
      "skill_invoke", "http_request", "curl",
      "cron_add", "cron_list", "cron_remove", "cron_update", "cron_run", "cron_runs",
      "memory_tree", "update_check", "update_apply",
      "proxy_config", "pushover"
    ]
  }
}
```

**缺失工具会导致 agent 报 `unknown tool requested` 错误。**

## 飞书桥接（2026-05-23 上线）

### 架构

```
飞书用户 → 飞书 App (cli_a9313c8bbc799bb5)
         → WebSocket 长连接（无需公网 IP）
         → bridge.py (localhost:13580)
         → OpenHuman Core (localhost:7788, JSON-RPC)
         → 回复 → 飞书用户
```

### 飞书 App 信息

| 项目 | 值 |
|------|----|
| 应用名称 | OpenHuman |
| App ID | `cli_a9313c8bbc799bb5` |
| App Secret | `KgDhxUTjl6LXWNavb922scKwBmEaKjPc` |
| 连接方式 | WebSocket 长连接 |
| 事件权限 | `im.message.receive_v1` |

### 服务信息

| 项目 | 值 |
|------|----|
| 脚本路径 | `/opt/.agents-to-im-openhuman/bridge.py` |
| 配置文件 | `/opt/.agents-to-im-openhuman/config.env` |
| systemd | `openhuman-feishu-bridge.service`（系统级） |
| 端口 | 无需（WebSocket 出站连接） |
| 开机自启 | ✅ |

### 功能特性

- 飞书 SDK WebSocket 长连接（无需公网 IP/域名）
- 消息去重（60 秒 TTL，防止飞书重试推送导致重复回复）
- 线程模式：按飞书用户 open_id 维护独立对话线程（支持上下文记忆）
- 降级机制：线程模式失败时回退到一次性 `agent_chat`
- 完整错误处理和日志

### config.env

```bash
FEISHU_APP_ID=cli_a9313c8bbc799bb5
FEISHU_APP_SECRET=KgDhxUTjl6LXWNavb922scKwBmEaKjPc
OPENHUMAN_CORE_URL=http://localhost:7788/rpc
OPENHUMAN_CORE_TOKEN=<openhuman-core-token>
USE_THREAD=true
LOG_LEVEL=INFO
```

### 踩坑记录

**2026-05-23：环境变量冲突**
- 服务器 `/etc/environment` 有全局 `FEISHU_APP_SECRET`（给 OpenClaw 网关用的另一个 App）
- bridge.py 用 `os.environ.get()` 读到了错误的值，导致飞书 SDK 报 `1000040345: app_id or app_secret is invalid`
- **修复**：在 bridge.py 开头加了 config.env 自动加载，用 `os.environ.setdefault()` 确保自身配置优先
- **教训**：多 App 共存时，不能依赖全局环境变量，必须从各自的配置文件加载

### 管理命令

```bash
# 查看状态
systemctl status openhuman-feishu-bridge

# 查看日志
journalctl -u openhuman-feishu-bridge -f

# 重启
systemctl restart openhuman-feishu-bridge

# 停止
systemctl stop openhuman-feishu-bridge
```

---

## 渠道

| 渠道 | 状态 | 说明 |
|------|------|------|
| Telegram | ✅ 正常 | 通过 bot_token 连接 |
| Web | ⚠️ 受限 | 纯浏览器部署下聊天功能有 bug，只能看不能发 |
| CLI | ✅ 可用 | `channels_config.cli = true` |

**Web 聊天问题**：Web UI 的聊天依赖 Socket.IO 连接 + `channel_web_chat` RPC。Socket.IO 连接正常，RPC 也正常，但前端 UI 的输入框被状态锁住（`composerInteractionBlocked`），无法发送消息。这是前端 bug，不是配置问题。

## 端点

| 端点 | 说明 | 认证 |
|------|------|------|
| `GET /` | 服务器信息 | 无 |
| `GET /health` | 健康检查 | 无 |
| `POST /rpc` | JSON-RPC 入口 | Bearer Token |
| `GET /events` | SSE 事件流 | 无 |
| `GET /socket.io/` | Socket.IO | 无 |
| `GET /schema` | RPC schema | Bearer Token |

## 已知问题

1. **配置重置**：config.toml 解析失败时 core 用默认值覆盖。改配置前必须验证合法性。
2. **Web 聊天不可用**：纯浏览器部署下前端 UI 聊天输入框被锁住。
3. **Composio 警告**：`composio.enabled = false` 时 UI 仍显示 stale status 警告，可忽略。
4. **memory_tree 配置**：`memory_tree.llm_extractor_model` 和 `llm_summariser_model` 不跟 `chat_provider` 联动，需要单独改。
5. **编译耗时**：N5105 首次编译约 40 分钟，增量编译几秒。保留 `target/` 目录可避免重编。
6. **ALSA/X11 依赖**：即使 headless 模式也需要 `libasound2-dev`、`libx11-dev` 等开发库。

## 更新方式

```bash
cd /opt/openhuman
git pull

# 编译
cargo build --release --bin openhuman-core
cp target/release/openhuman-core /usr/local/bin/

# Web 前端
cd app && pnpm build:web

# 重启
systemctl restart openhuman openhuman-web
```

## 涉及文件

| 文件 | 作用 |
|------|------|
| `/usr/local/bin/openhuman-core` | Core 二进制 |
| `/opt/openhuman/` | 源码 + 编译产物 + web 前端 |
| `/opt/openhuman/app/dist-web/` | Web SPA 静态文件 |
| `/root/.openhuman/` | 运行时数据（用户、记忆、缓存） |
| `/root/.openhuman/.env` | 环境变量（token、端口） |
| `/root/.openhuman/users/<uid>/config.toml` | 主配置文件 |
| `/root/.openhuman/users/<uid>/workspace/state/app-state.json` | 工具启用状态 |
| `/etc/systemd/system/openhuman.service` | Core systemd 服务 |
| `/etc/systemd/system/openhuman-web.service` | Web systemd 服务 |
| `/opt/.agents-to-im-openhuman/bridge.py` | 飞书桥接脚本 |
| `/opt/.agents-to-im-openhuman/config.env` | 飞书桥接配置 |
| `/etc/systemd/system/openhuman-feishu-bridge.service` | 飞书桥接 systemd 服务 |