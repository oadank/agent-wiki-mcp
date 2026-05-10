---
title: LiteLLM 国内模型兼容修复
category: litellm-domestic-fix
type: progress
---

# litellm-domestic-fix 进度记录

> 任何 AI 接手此项目时，先阅读此文件了解当前状态。

## 项目概述

- **项目名**: litellm-domestic-fix
- **目标**: 修复 LiteLLM Responses API 对国内模型的兼容问题
- **负责人**: 阿丹
- **创建时间**: 2026-05-11
- **代码仓库**: https://github.com/oadank/litellm/tree/codex-domestic-fix
- **PR 地址**: https://github.com/BerriAI/litellm/pull/27604
- **目标分支**: litellm_internal_staging（外部 PR 正确目标）

---

## 当前状态

| 状态 | 说明 |
|------|------|
| 🚧 进行中 | PR #27604 审核中，已修复官方反馈的所有问题 |
| 下一步 | 等待 CI 检查完成 |
| 已修复 | P0/P1 问题 4 个，添加退出选项 |

---

## 进度日志

| 时间 | AI | 任务 | 状态 | 备注 |
|------|----|----|------|------|
| 2026-05-11 01:23 | Claude | LiteLLM Responses API 国内模型兼容修复 | ✅ | 双重判断 model名+api_base |
| 2026-05-11 01:27 | Claude | 补充遗漏的国内模型判断特征 | ✅ | 添加 kimi/moonshot/bigmodel |
| 2026-05-11 01:28 | Claude | PR #27585 提交 | ❌ | 已关闭，目标分支错误 |
| 2026-05-11 02:09 | Claude | 修复 Win 桌面版工具参数报错 | ✅ | MCP/web_search 类型过滤 |
| 2026-05-11 02:45 | Claude | 创建 PR #27602 | ❌ | 已关闭，目标分支错误 |
| 2026-05-11 02:49 | Claude | 创建 PR #27603 | ❌ | 已关闭，分支被误删 |
| 2026-05-11 03:19 | Claude | 修复 P1: domestic_utils.py 位置 | ✅ | 移到 llms/domestic/ |
| 2026-05-11 03:19 | Claude | 修复 P1: 返回类型兼容性 | ✅ | 恢复 List，调用者处理空数组 |
| 2026-05-11 03:31 | Claude | 修复 P0: utils.py 重复代码 | ✅ | 删除重复函数，统一导入 |
| 2026-05-11 03:31 | Claude | 修复 P1: client_metadata 过滤顺序 | ✅ | 先合并再过滤 |
| 2026-05-11 03:31 | Claude | 修复 P0: 硬编码+向后兼容 | ✅ | 添加退出选项环境变量 |

---

## 技术决策

| 日期 | 决策 | 原因 | AI |
|------|------|------|----|
| 2026-05-11 | 双重判断（model名 + api_base） | 解决 model 组名不包含模型特征的问题 | Claude |
| 2026-05-11 | 过滤不支持的工具类型 | 国内模型不支持 Codex/OpenAI 特有工具 | Claude |
| 2026-05-11 | domestic_utils 放在 llms/domestic/ | 遵循项目规则：provider-specific 代码放 llms/ | Claude |
| 2026-05-11 | 返回 List 而非 Optional[List] | 保持原有 API 签名不变 | Claude |
| 2026-05-11 | 添加退出选项环境变量 | 解决向后不兼容问题，用户可禁用过滤 | Claude |

---

## 退出选项

设置环境变量可完全禁用兼容过滤：

```bash
export LITELLM_DISABLE_DOMESTIC_COMPATIBILITY=true
```

用户即使模型名包含 "deepseek" 等，也可使用完整 OpenAI 参数（strict、additionalProperties 等）。

---

## 国内模型判断覆盖

### Model 名特征（7 个）

| Pattern | 覆盖模型 |
|---------|----------|
| qwen | 阿里云 Qwen 系列 |
| glm | 智谱 GLM 系列 |
| doubao | 火山引擎 Doubao 系列 |
| minimax | MiniMax 系列 |
| mimo | 小米 MiMo 系列 |
| deepseek | DeepSeek 系列 |
| kimi | Moonshot Kimi 系列 |

### Endpoint 特征（7 个）

| Endpoint | 平台 |
|----------|------|
| dashscope.aliyuncs.com | 阿里云 DashScope |
| ark.cn-beijing.volces.com | 火山引擎 |
| api.minimaxi.com | MiniMax 官方 |
| xiaomimimo.com | 小米 MiMo |
| api.deepseek.com | DeepSeek 官方 |
| moonshot.cn | Moonshot 官方 |
| bigmodel.cn | 智谱 AI 官方 |

---

## 相关资源

- **PR**: https://github.com/BerriAI/litellm/pull/27604
- **Fork**: https://github.com/oadank/litellm/tree/codex-domestic-fix
- **本地代码**: /opt/litellm-source
- **测试文件**: tests/litellm/test_domestic_utils.py（28 个测试）

---

## AI 接手指南

1. 先读取此文件了解进度
2. 查看 PR #27604 反馈状态
3. CI 检查结果可通过 GitHub API 查看
4. 执行任务后更新此文件