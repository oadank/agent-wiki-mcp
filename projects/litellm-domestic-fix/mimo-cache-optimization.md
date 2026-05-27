---
name: MiMo 缓存优化全方案
project: litellm-domestic-fix
type: architecture
created: 2026-05-27
---

# MiMo 缓存优化全方案

## 背景

小米 MiMo 于 2026-05 进行计费调整，采用精细化按量计费：
- **缓存命中**：2.5 Credits/Token（近乎免费）
- **缓存未命中**：300 Credits/Token
- **输出**：600 Credits/Token

缓存命中与否，成本差 **120 倍**。820 亿 Credits 月度额度下，必须最大化缓存命中率。

## 架构总览

```
飞书用户 → agents-to-im daemon → Claude Code SDK → LiteLLM (port 4000)
                                                      ├─ claude-model  → MiMo-Anthropic (主力)
                                                      ├─ codex-model   → MiMo-OpenAI (98%主力)
                                                      ├─ MiMo-Anthropic (独立直通)
                                                      └─ MiMo-OpenAI (独立直通)
                                                   
                                                   callbacks:
                                                      ├─ cache_logger.py   (命中率实时日志)
                                                      └─ cache_optimizer.py (日期前缀剥离)
```

## LiteLLM 配置

配置文件：`/usr/local/litellm/litellm_config.yaml`

### 模型分组

| 分组 | 主力模型 | 备用模型 | 用途 |
|------|---------|---------|------|
| claude-model | glm-5, qwen3.6-plus, kimi-k2.5 | 火山系列 | Claude Code 默认 |
| codex-model | **openai/mimo-v2.5-pro (98%)** | glm-5, qwen3.6-plus, kimi-k2.5 | OpenHuman / Codex CLI |
| MiMo-Anthropic | anthropic/mimo-v2.5-pro | - | 飞书-Claude 直通 |
| MiMo-OpenAI | openai/mimo-v2.5-pro | - | Codex 直通 |

### codex-model 加权路由

`simple-shuffle` 策略按 RPM 做加权随机：
- MiMo-OpenAI: rpm=100000 (98.3%)
- glm-5: rpm=2000 (1.9%)
- kimi-k2.5: rpm=1000 (1.0%)
- qwen3.6-plus: rpm=500 (0.5%)
- 火山 x4: rpm=50x4 (0.2%)

### Router 设置

```yaml
router_settings:
  routing_strategy: simple-shuffle
  num_retries: 3
  allowed_fails: 5
  cooldown_time: 120
  fallbacks:
  - claude-model: [anthropic/glm-5, anthropic/qwen3.6-plus, anthropic/kimi-k2.5]
  - codex-model: [openai/glm-5, openai/qwen3.6-plus, openai/kimi-k2.5]
  - MiMo-Anthropic: [anthropic/glm-5]
  - MiMo-OpenAI: [openai/glm-5]
```

### Callbacks

```yaml
litellm_settings:
  drop_params: true
  callbacks:
    - cache_logger.cache_logger
    - cache_optimizer.cache_optimizer
```

回调文件放在 `/usr/local/litellm/` 目录下，由 LiteLLM proxy 按 `module.instance` 规则加载。

## 缓存命中日志 (cache_logger.py)

路径：`/usr/local/litellm/cache_logger.py`

功能：每次 API 响应后输出缓存命中率，兼容流式/非流式。

输出格式：
```
[CACHE] model=mimo-v2.5-pro | prompt=99979 | cached_hit=99840 | cache_creation=0 | completion=103 | hit_rate=99.9%
```

智能提取逻辑（5 条路径）：
1. `response_obj.usage` 标准对象属性
2. `response_obj` 是 dict 时的 `usage` 字典
3. `kwargs["original_response"]` / `kwargs["hidden_params"]` 中嵌套的 usage
4. 遍历 kwargs 找任何含 `usage` 的 dict
5. `response_obj._hidden_params.stream_usage`

当 prompt=0 + completion>0 时判定解析失败，打印 RAW DUMP（限 3 次），输出 `PARSE_FAIL` 错误日志。

查看实时日志：
```bash
# 终端别名（已配置在 ~/.bashrc）
cache

# 原始命令
journalctl -u litellm -f | grep "\[CACHE"
```

## 日期前缀剥离 (cache_optimizer.py)

路径：`/usr/local/litellm/cache_optimizer.py`

功能：拦截请求，将 System Prompt 中的动态日期移到 messages 末尾。

问题：Claude Code 每次启动注入 `Today's date is 2026-05-27.`，每天变化导致 MiMo 前缀缓存失效。

解决方案：
1. 正则匹配 `Today's date is YYYY-MM-DD.` 从 system message 中剥离
2. 以 `<!-- Today's date is 2026-05-27. -->` HTML 注释形式追加到最后一条 user 消息
3. 模型仍能获取日期信息，但 system prompt 前缀保持静态

## 实测数据

| 指标 | 值 |
|------|-----|
| 缓存命中率 | 99.7% ~ 99.9% |
| codex-model MiMo 路由占比 | 5/5 = 100% |
| 日期剥离钩子 | 全局生效（claude-model + codex-model） |

## 快速命令

```bash
# 查看实时缓存命中率
cache

# 重启 LiteLLM
systemctl restart litellm

# 查看 LiteLLM 状态
systemctl status litellm

# 查看 LiteLLM 错误日志
journalctl -u litellm --since "1 hour ago" | grep -i error
```
