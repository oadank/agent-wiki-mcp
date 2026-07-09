---
description: >-
  OpenHuman 智能体开箱即用的完整工具集——研究、编码、
  控制你的机器、安排任务、回复你，以及调用 118+ 第三方服务。
icon: toolbox
---

# 原生工具

OpenHuman 的智能体并非空载交付。智能体背后的每个模型在安装瞬间就有一套精选工具可用——无需插件市场、无需接入 API 密钥、无需注册 MCP 服务器。整个工具带都在盒子里。

本页是索引。每个子页面覆盖一个工具族。

## 为什么原生提供这些工具

纯插件模式意味着工具跑在不同进程里，通过 RPC 交互，各自维护认证和打包逻辑。这对于开放式扩展性没问题，但对于每个智能体都需要的**核心**工具（读文件、搜索网页、编辑代码、设提醒、加入会议），以内置方式提供意味着：

* 一致的错误处理。
* 零安装门槛。
* 所有输出自动经过[[.token-compression.zh-CN|智能 Token 压缩]]。
* 可预测的安全边界——文件系统工具遵守工作区作用域，网络工具通过 OpenHuman 代理。

## 工具带

| 类别 | 包含内容 |
| ------ | -------------- |
| [[web-search.zh-CN|网络搜索]] | 无需自带 API key 搜索实时网页。 |
| [[web-scraper.zh-CN|网页抓取]] | 从任意 URL 拉取干净文本——文章、文档、README。 |
| [[coder.zh-CN|编码器]] | 读/写/编辑/补丁文件，glob，grep，git，lint，test。 |
| [[browser-and-computer.zh-CN|浏览器与计算机控制]] | 打开 URL、截图、点击、输入、移动鼠标。 |
| [[cron.zh-CN|定时任务与调度]] | 循环任务、一次性提醒、定时智能体运行。 |
| [[voice.zh-CN|语音]] | 语音转文字输入、文字转语音输出、实时 Google Meet 智能体。 |
| [[memory-tools.zh-CN|记忆工具]] | 在[[.obsidian-wiki/memory-tree.zh-CN|记忆树]]中召回、存储、遗忘和搜索。 |
| [[.integrations/README.zh-CN|第三方集成]] | 智能体视角中的 [[.integrations/README.zh-CN|118+ 已连接服务]]。 |
| [[agent-coordination.zh-CN|智能体协作]] | 生成子智能体、委托给技能、规划、询问用户。 |
| [[system-and-utilities.zh-CN|系统与工具]] | Shell、node、SQL、当前时间、推送通知、LSP。 |

## 另见

* [[.token-compression.zh-CN|智能 Token 压缩]] —— 保持工具输出成本有界的机制。
* [[.integrations/README.zh-CN|第三方集成]] —— 118+ 目录的面向用户介绍和 OAuth 流程。
* [[.privacy-and-security.zh-CN|隐私与安全]] —— 每个工具运行所在的安全边界。
