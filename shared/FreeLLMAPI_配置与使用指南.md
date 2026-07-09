---
title: "FreeLLMAPI 配置与使用指南"
category: infrastructure
date: 2026-07-04 10:07
tags: ["freellmapi","litellm","免费模型","api网关","cloudflare","openrouter"]
---
# FreeLLMAPI 配置与使用指南

# FreeLLMAPI 配置与使用指南

## 基本信息
- **地址**: http://100.83.107.20:3001
- **端口**: 3001
- **用途**: 聚合免费 LLM API，提供统一 OpenAI 兼容接口

## 功能特性
- 聚合 10+ 免费提供商（Cloudflare, OpenRouter, Google, NVIDIA, 智谱, Agnes 等）
- 53+ 免费模型可用
- 自动路由：一个提供商失败自动切换下一个
- Free tier 目录 + Premium 目录（$19/年可解锁更多模型）
- Custom provider 支持：可手动添加未收录的提供商

## 配置过的提供商

| 提供商 | 模型 | 状态 | 说明 |
|--------|------|------|------|
| Cloudflare | gpt-oss-120b, gpt-oss-20b | ✅ | 404已修复 |
| OpenRouter | llama-3.3-70b, Hermes 3 405B, Dolphin Mistral 24B | ⚠️ | 429限速，自动恢复 |
| Google | gemini-3.5-flash | ⚠️ | 503高负载 + 429 |
| NVIDIA | glm-5.1 | ✅ | 之前410，现已恢复 |
| 智谱 | glm-4.7-flash | ✅ | 响应正常 |
| GitHub | gpt-4.1 | ✅ | 免费 tier |
| Agnes | agnes-2.0-flash（文本+图片） | ✅ | Custom provider |

## 已知限制

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Google thought_signature | FreeLLMAPI bug | 等上游修复 |
| OpenRouter 429 | 免费 RPM 限制 | 等重置，自动恢复 |
| Premium 模型目录限制 | 新提供商优先进 Premium | Custom provider 或等30天下放 |

## LiteLLM 集成配置

### 添加 FreeLLMAPI 为 LiteLLM 后端

在 `/opt/litellm/config.yaml` 的模型组中添加：

```yaml
model_list:
  - model_name: claude-model
    litellm_params:
      model: openai/gpt-4.1
      api_base: http://100.83.107.20:3001
      api_key: sk-free          # FreeLLMAPI 默认 key
      weight: 2                 # 免费 fallback 权重
```

### 重试与限流配置

```yaml
router_settings:
  num_retries: 5
  allowed_fails: 3
  cooldown_time: 60
  retry_after: 5
```

## Custom Provider 添加方法

1. 打开 Dashboard: http://100.83.107.20:3001
2. Keys 页面 → 点击 Custom provider
3. 填入：
   - Base URL: 提供商 API 地址
   - API Key: 你的 key
   - Model: 模型名称
4. 保存

## 使用场景

- **OpenClaw**: 作为免费模型后端，替代付费 API
- **LiteLLM**: 添加为 fallback 模型组，降低主模型压力
- **本地测试**: 快速验证 prompt，无需付费
