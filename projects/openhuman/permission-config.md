# OpenHuman 权限配置经验

## 问题背景

OpenHuman 默认配置过于保守：
- `StreamMode` 默认 `Off`，导致 Telegram 回复只有一句就卡住
- `AutonomyLevel` 默认 `Supervised`，需要审批
- `allowed_commands` 只有 12 个基本命令
- `forbidden_paths` 禁止了大量关键路径（/root, /home, /opt 等）
- `runtime_enabled` 默认 `true`，使用本地 Ollama 而非云端 LiteLLM
- Token 不统一，导致 401 Unauthorized

---

## 源码修改

修改 `/opt/openhuman/src/openhuman/config/schema/` 目录下的文件：

### 1. channels.rs - StreamMode 默认值

**文件**: `channels.rs` 第 94-100 行

```rust
// 原来：#[default] Off
// 改成：
pub enum StreamMode {
    Off,
    #[default]
    Partial,  // 流式回复，不卡顿
}
```

### 2. local_ai.rs - runtime_enabled 默认值

**文件**: `local_ai.rs` 第 142-152 行

```rust
fn default_runtime_enabled() -> bool {
    // 原来是 true（用本地 Ollama）
    // 改成 false（用云端 LiteLLM）
    false
}
```

### 3. policy.rs - AutonomyLevel 默认值

**文件**: `/opt/openhuman/src/openhuman/security/policy.rs` 第 10-20 行

```rust
pub enum AutonomyLevel {
    ReadOnly,
    #[default]  // 原来是 Supervised
    Supervised,
    #[default]  // 改成这里
    Full,  // 最大权限
}
```

### 4. autonomy.rs - allowed_commands 和 forbidden_paths

**文件**: `autonomy.rs`

```rust
fn default_allowed_commands() -> Vec<String> {
    vec![
        // 扩展为 ~80 个命令，包括：
        "git", "npm", "cargo", "curl", "wget", "ssh", "scp",
        "systemctl", "journalctl", "tmux", "screen",
        // ... 更多
    ]
}

fn default_forbidden_paths() -> Vec<String> {
    vec![]  // 空数组，不禁止任何路径
}
```

### 5. policy.rs - SecurityPolicy 默认值 ⚠️ 重要！

**文件**: `/opt/openhuman/src/openhuman/security/policy.rs`

`SecurityPolicy` 有独立的 Default 实现，必须单独修改：

```rust
impl Default for SecurityPolicy {
    fn default() -> Self {
        Self {
            autonomy: AutonomyLevel::Full,        // 原来是 Supervised
            workspace_only: false,                 // 原来是 true
            allowed_commands: vec![...100+命令...], // 原来只有 14 个
            forbidden_paths: vec![],               // 原来有大量路径
            require_approval_for_medium_risk: false, // 原来是 true
            block_high_risk_commands: false,        // 原来是 true
            ...
        }
    }
}
```

**注意**: 只改 `AutonomyConfig::default()` 不够，`SecurityPolicy::default()` 是另一个独立的 struct！
```

---

## 配置文件关键项

编译后，配置文件路径：`/root/.openhuman/users/<user_id>/config.toml`

关键配置项：

```toml
[autonomy]
level = "full"
workspace_only = false
allowed_commands = [ ... ~80 个命令 ... ]
forbidden_paths = []
require_approval_for_medium_risk = false
block_high_risk_commands = false
auto_approve = [ ... ~60 个工具 ... ]

[local_ai]
runtime_enabled = false  # 用云端 LiteLLM

[channels_config.telegram]
stream_mode = "partial"  # 流式回复

embedding_provider = "custom:http://localhost:11435/v1"  # BGE
chat_provider = "openai:codex-model"  # LiteLLM
cloud_providers = [{ endpoint = "http://localhost:4000/v1" }]
```

---

## Token 统一

**问题**: OpenHuman 从 `OPENHUMAN_CORE_TOKEN` 环境变量读取 token，但 `core.token` 文件里是旧的 token。

**解决**: 统一 token

```bash
# 正确的 token 在 .env 文件里
TOKEN=$(grep "OPENHUMAN_CORE_TOKEN" /opt/openhuman/.env | cut -d= -f2)
echo "$TOKEN" > /root/.openhuman/core.token
```

---

## 编译重启流程

```bash
# 编译
cd /opt/openhuman
cargo build --bin openhuman-core --release

# 更新二进制
pkill -9 -f openhuman-core
cp /opt/openhuman/target/release/openhuman-core /usr/local/bin/openhuman-core

# 重启
nohup openhuman-core serve > /root/.openhuman/logs/openhuman-core.log 2>&1 &
```

---

## 注意事项

1. **配置文件会被重写**: OpenHuman 运行时会动态管理配置，直接修改文件可能被覆盖。最稳妥的方式是修改源码默认值 + 删除旧配置后重启。

2. **Token 来源**: 优先检查 `.env` 文件里的 `OPENHUMAN_CORE_TOKEN`，这才是实际使用的 token。

3. **agents-to-im 集成**: OpenHuman 可以通过飞书桥梁 agents-to-im 使用，发送 `/new:openhuman` 创建会话。

---

## 日期

- 2026-05-24: 完成 OpenHuman 权限配置修复
- 2026-05-25: Shell 权限审批机制准备（进行中）

---

## Shell 权限审批机制（进行中）

### 背景

OpenHuman shell 工具执行高风险命令（如重定向 `>`）时，需要飞书审批流程。

### 当前状态

| 组件 | 状态 | 说明 |
|------|------|------|
| workspace_only 配置 | ✅ 已修复 | 改为 `false`，grep/shell 可访问任意路径 |
| PERMISSION_REQUIRED 返回 | ✅ 已实现 | shell 返回 `PERMISSION_REQUIRED:shell:<command>` |
| Socket.IO tool_result.output | ❌ 未完成 | 事件不包含实际错误消息，飞书无法识别 |

### 待完成

1. **OpenHuman**：修改 `ToolCallCompleted` 事件，添加 `output_preview` 字段
2. **飞书桥梁**：识别 `tool_result` 中的 PERMISSION_REQUIRED，发送审批卡片

### 相关改动

- `/opt/openhuman/src/openhuman/security/policy.rs`：返回 PERMISSION_REQUIRED 错误
- `/opt/openhuman/src/core/socketio.rs`：添加 permission_request_id 等字段
- `/opt/agents-to-im/src/providers/openhuman/openhuman-provider.ts`：识别 PERMISSION_REQUIRED