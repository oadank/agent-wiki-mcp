---
description: 从源码构建、运行、测试和发布 OpenHuman。
icon: code-branch
lang: zh-CN
---

# 概览

OpenHuman 在 [github.com/tinyhumansai/openhuman](https://github.com/tinyhumansai/openhuman) 以 GPLv3 协议开源。本节面向贡献者和所有从源码运行 OpenHuman 的人。

如果你只是想使用应用，请前往[[.overview/getting-started.zh-CN|快速开始]]。如果你来这里是为了阅读架构文档、hack 一个新特性，或者提交一个 PR，那你来对地方了。

***

## 代码结构

| 路径 | 内容 |
| ---- | ---- |
| `app/` | pnpm workspace `openhuman-app`。Vite + React 前端（`app/src/`）和 Tauri 桌面宿主（`app/src-tauri/`）。 |
| `src/` | Rust 库 crate `openhuman`，并包含 `openhuman-core` CLI 二进制文件。领域逻辑、JSON-RPC、MCP 路由。 |
| `gitbooks/` | 本站（面向公众的文档）。 |
| `docs/` | 尚未迁移到 GitBook 的深层参考资料（记忆流水线图、智能体流程等）。 |

仓库根目录的 `CLAUDE.md` 是给在该代码库上工作的 AI 智能体的权威参考。人类也适用同样的规则。

***

## 从这里开始

如果你是第一次拉取仓库：

1. [[getting-set-up.zh-CN|**环境搭建**]]。工具链、依赖、vendored Tauri CLI、sidecar staging —— 让 `pnpm dev` 真正跑起来所需的一切。
2. [[building-rust-core.zh-CN|**构建 Rust 核心**]]。仅针对仓库根目录 Rust crate 的新机搭建：固定工具链、OS 包，以及精确的 `cargo` 命令。
3. [[architecture.zh-CN|**架构**]]。桌面应用、Rust 核心 sidecar、JSON-RPC 桥接，以及双 socket 如何协同工作。在做非平凡改动之前先读这个。
4. [[architecture/frontend.zh-CN|**前端**]] 和 [[architecture/tauri-shell.zh-CN|**Tauri 壳层**]]。React 应用，以及包裹它的桌面宿主。
5. [[mcp-server.zh-CN|**MCP 服务器**]]。可选的 stdio MCP 模式，将只读的 OpenHuman 记忆工具暴露给本地客户端。

***

## 测试

OpenHuman 有三层测试。知道你的改动属于哪一层：

* [[testing-strategy.zh-CN|**测试策略**]]。什么时候写 Vitest、什么时候写 cargo tests、什么时候写 WDIO。
* [[e2e-testing.zh-CN|**E2E 测试**]]。WDIO/Appium spec、双平台设置（Linux tauri-driver、macOS Appium Mac2），以及如何在本地运行单个 spec。
* [[agent-observability.zh-CN|**智能体可观测性**]]。让 E2E 和智能体运行事后可调试的工件捕获层。

PR 必须通过 **变更行覆盖率 ≥ 80%** 的门禁。为新行为添加测试，不要只测 happy path。

***

## 发布

* [[release-policy.zh-CN|**发布策略**]]。版本策略、发布节奏、OAuth + 安装包规则。
* [[.features/cloud-deploy|**云端部署**]]。当变更跨越桌面边界时，后端/云端侧的部署。

***

## 深入探索

* [[architecture/agent-harness.zh-CN|**Agent Harness**]]。智能体面向代码的工具表面，以及如何扩展它。
* [[cef.zh-CN|**Chromium Embedded Framework**]]。嵌入式提供商 webview 如何工作、为什么不运行注入的 JS，以及各提供商 scanner 实际上做了什么。

对于仍在构建中的特性，[[.features/subconscious.zh-CN|Subconscious Loop]] 页面从头到尾涵盖了后台任务评估系统。

***

## 贡献

* 在 [tinyhumansai/openhuman](https://github.com/tinyhumansai/openhuman) 提交 issue 和 PR。
* PR 目标分支为 `main`。推送到你的 fork，不要推 upstream。
* 遵循 [[..CONTRIBUTING|`CONTRIBUTING.md`]] 和 issue/PR 模板。
* 保持改动聚焦。一个 bug fix 不需要附带周边清理；一个一次性操作不需要 helper。

帮助构建 AGI 并不意味着一定要提交内核代码 —— bug 修复、文档、集成和测试都在推动进展。
