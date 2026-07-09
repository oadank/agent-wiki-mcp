---
title: "FreeTheAi 配置指南"
category: infrastructure
date: 2026-07-04 11:17
tags: ["freetheai","免费api","openai兼容"]
---
# FreeTheAi 配置指南

# FreeTheAi 配置指南

## 基本信息
- 官网: https://freetheai.xyz
- Base URL: `https://api.freetheai.xyz/v1`
- 模型: 60+ 活跃模型（12个前缀）
- 费用: 免费，无需信用卡

## 注册
1. Discord: https://discord.gg/secrets
2. `/signup` 获取 Key（前缀应为 `fta_`）
3. **每天 `/checkin`** 激活

## 支持功能
Chat/流式/Tool Calling/图片生成/TTS/STT/Anthropic Messages/OpenAI Responses

## 模型分类（FreeLLMAPI Custom provider 用）

### chat
bbl/gemini-3.5-flash, bbl/gemini-3.0-flash, bbl/gemini-2.5-flash, bbl/gemini-2.5-flash-lite, bbl/gpt-5.5-mini, bbl/gpt-4.1, bbl/grok-4.1-fast-non-reasoning, glm/glm-5.2, glm/glm-5.1, glm/glm-5-turbo, glm/glm-5, glm/glm-4.7, glm/glm-4.6, glm/glm-4.5, glm/glm-4.5-air, kai/openrouter/owl-alpha, kai/nvidia/nemotron-3-ultra-550b-a55b:free, kai/nvidia/nemotron-3-super-120b-a12b:free, kai/stepfun/step-3.7-flash:free, kai/cohere/north-mini-code:free, kai/poolside/laguna-m.1:free, kai/kilo-auto/free, mim/mimo-v2-pro, mim/mimo-v2.5-pro, mim/mimo-v2-omni, olm/deepseek-v3.1, olm/deepseek-v4-pro, olm/kimi-k2.7-code, opc/big-pickle, opc/deepseek-v4-flash-free, opc/mimo-v2.5-free, opc/minimax-m3-free, opc/nemotron-3-super-free, opc/nemotron-3-ultra-free, opc/north-mini-code-free, wsf/kimi-k2.6, wsf/swe-1.5, wsf/swe-1.6, exa/search, exa/search-deep, exa/search-fast, pplx/search

### image
eve/gpt-image-2, eve/gpt-image-2-low, eve/gpt-image-2-medium

### audio
mim/mimo-v2.5-tts, mim/mimo-v2.5-tts-voiceclone, mim/mimo-v2.5-tts-voicedesign, mim/mimo-v2.5-asr, xai/grok-stt, xai/grok-tts

## 限速
Tier1: 10RPM/1并发 → Tier5: 35RPM/3并发
每日上限250次，通过Discord邀请解锁层级

## Role-gated 模型
exa/*, pplx/*, xai/* 需要 Discord seems_legit 角色
