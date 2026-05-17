---
title: "LiteLLM 国内模型兼容修复总结"
category: project-decisions
date: 2026-05-11 01:23
tags: ["litellm","codex","domestic-models","compatibility"]
---
# LiteLLM 国内模型兼容修复总结

## 国内模型判断逻辑

双重判断策略（model名 + api_base）：
1. Model 名特征：qwen, glm, doubao, minimax, mimo, deepseek
2. Endpoint 特征：dashscope.aliyuncs.com, ark.cn-beijing.volces.com, api.minimaxi.com, xiaomimimo.com, api.deepseek.com

只要任一匹配，就认为是国内模型，需要过滤：
- client_metadata 参数
- local_shell, namespace 等不支持的工具类型
- strict, additionalProperties schema 字段
- 空的 tools 数组返回 None

## 国内模型平台网址

| 平台 | 官方地址 | 服务商地址 |
|------|----------|------------|
| 阿里云 DashScope | dashscope.aliyuncs.com | coding.dashscope.aliyuncs.com |
| 火山引擎 Volcengine | ark.cn-beijing.volces.com | api/coding/v3 |
| MiniMax | api.minimaxi.com | 同官方 |
| 小米 MiMo | xiaomimimo.com | token-plan-cn.xiaomimimo.com |
| DeepSeek | api.deepseek.com | 同官方 |
| 智谱 GLM | bigmodel.cn | 通过 DashScope/火山代理 |
| Moonshot Kimi | moonshot.cn | 通过 DashScope/火山代理 |
