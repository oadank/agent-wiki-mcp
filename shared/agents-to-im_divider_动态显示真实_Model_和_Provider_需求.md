---
title: "agents-to-im divider 动态显示真实 Model 和 Provider 需求"
category: project-decisions
date: 2026-06-19 20:43
tags: ["agents-to-im","divider","model","provider","runtime","architecture","P0"]
---
# agents-to-im divider 动态显示真实 Model 和 Provider 需求

## 需求背景

当前 agents-to-im 的 divider 显示的 Model 和 Provider 是静态配置或硬编码，不是真实值。存在以下问题：

1. **配置不统一**：显示的和实际使用的可能是两处配置
2. **session.model 历史问题**：创建会话后切换模型不生效，因为 model 绑定在聊天记录上
3. **runtime 配置分散**：不同 runtime（claude、codex、mimo、zcode、openhuman）的模型配置没有统一管理
4. **agents 回答假话**：提示词里的模型信息是假的，agents 回答时说的模型信息不真实

## 需求目标

divider 显示的信息必须是真实的：

- **Agent**: 后端 agent 实例名（如 feishu-mimo、feishu-claude）
- **Model**: 实际调用的模型（从 runtime 真实配置读取）
- **Provider**: 实际的服务商（从 runtime 真实配置读取）

## 核心原则

1. **配置统一**：显示的和实际使用的必须是同一个配置
2. **真实使用**：聊天时从配置读取，调用对应的模型
3. **真实显示**：divider 从配置读取，显示真实的 model 和 provider
4. **真实回答**：提示词中使用这些配置，agents 回答时说真实的模型信息

## 实现思路

1. 为每个 runtime 定义配置项：`model` 和 `provider`
2. 这些配置存储在 runtime 的配置文件中（如 claude 的配置、mimo 的配置等）
3. 聊天时从这些配置读取真实的 model 和 provider
4. divider 显示时也从这些配置读取
5. 提示词中也使用这些真实的配置信息

## 验收标准

1. 切换模型后，divider 自动显示新模型（不需要改配置）
2. 不同 runtime 显示各自的真实模型
3. Provider 显示实际的服务商，不是硬编码
4. agents 回答时说的模型信息是真实的

## 状态

- **优先级**: P0（架构问题，需要大改）
- **状态**: 待实现
- **备注**: 不解决不删除此文档
