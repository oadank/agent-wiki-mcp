---
title: LiteLLM 本地模型配置
category: litellm
type: config
updated: 2026-05-23
---

# LiteLLM 本地模型配置

> **配置文件**: `/usr/local/litellm/litellm_config.yaml`
> **备份目录**: `/usr/local/litellm/litellm_config.yaml.bak.*`
> **服务管理**: `systemctl restart litellm`
> **API 地址**: `http://127.0.0.1:4000`
> **Master Key**: `sk-200418`

## 当前模型分组（2026-05-23 精简后）

### Embedding（1 条）
- 本地 BGE-small-zh-v1.5（`localhost:11435`）

### claude-model（Anthropic 接口，8 条）

**阿里云（主力，tpm=100000）：**
| 模型 | api_base |
|------|----------|
| qwen3.6-plus | coding.dashscope.aliyuncs.com/apps/anthropic |
| glm-5 | 同上 |
| kimi-k2.5 | 同上 |

**火山（备选，tpm=10000）：**
| 模型 | api_base |
|------|----------|
| ark-code-latest | ark.cn-beijing.volces.com/api/coding |
| doubao-seed-2.0-pro | 同上 |
| glm-5.1 | 同上 |
| kimi-k2.6 | 同上 |
| deepseek-v4-pro | 同上 |

### codex-model（OpenAI 接口，8 条）

**阿里云（主力，tpm=100000）：**
| 模型 | api_base |
|------|----------|
| qwen3.6-plus | coding.dashscope.aliyuncs.com/v1 |
| glm-5 | 同上 |
| kimi-k2.5 | 同上 |

**火山（备选，tpm=10000）：**
| 模型 | api_base |
|------|----------|
| ark-code-latest | ark.cn-beijing.volces.com/api/coding/v3 |
| doubao-seed-2.0-pro | 同上 |
| glm-5.1 | 同上 |
| kimi-k2.6 | 同上 |
| deepseek-v4-pro | 同上 |

### mimo-v2.5-pro（单独模型，1 条）
- 小米 MiMo，tpm=50000
- api_base: token-plan-cn.xiaomimimo.com/v1
- 额度即将用完

## 路由策略
- **策略**: `usage-based-routing`
- **优先级**: 阿里云 tpm=100000 > 火山 tpm=10000 > 小米 tpm=50000
- **fallback 顺序**: 阿里云优先
- **重试**: 2 次，cooldown 30s

## 历史变更

| 日期 | 变更 | 原因 |
|------|------|------|
| 2026-05-23 | 从 43 条精简到 17 条 | 内存优化，删除 auto/test/chat-v1 重复模型 |
| 2026-05-23 | 加 tpm 优先级 | 阿里云为主力，火山为备选 |
| 2026-05-23 | 删除 deepseek 直连 | 账户没钱 |
| 2026-05-23 | OpenHuman 改用 codex-model | chat-v1 已删除 |

## API Key 归属

| 平台 | Key 前缀 | 用途 |
|------|----------|------|
| 阿里云 DashScope | sk-sp- | 主力模型 |
| 火山引擎 | bc88bb | 备选模型 |
| 小米 MiMo | tp-cbt | 单独模型 |
| MiniMax | sk-cp- | 已删除 |
| DeepSeek | sk-1c1 | 已删除（余额不足） |
