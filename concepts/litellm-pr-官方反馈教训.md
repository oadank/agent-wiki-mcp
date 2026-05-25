---
title: "LiteLLM PR 官方反馈教训"
category: project-decisions
date: 2026-05-11 17:55
tags: ["litellm","pr-review","code-quality","architecture","lessons-learned"]
---

> **TL;DR** LiteLLM PR 官方反馈教训


sourceType: document
certainty: fact
status: active# LiteLLM PR 官方反馈教训

## LiteLLM PR 官方 Reviewer 反馈教训 (PR #27604)

### 架构问题
1. **Provider-specific 代码位置**：必须放在 `litellm/llms/<provider>/` 目录，不能放在根目录
   - 正确位置：`litellm/llms/domestic/domestic_utils.py`
   - 错误位置：`litellm/domestic_utils.py`

2. **硬编码模型列表违规**：模型能力定义应放在 `model_prices_and_context_window.json`，通过 `get_model_info` 读取
   - 禁止在代码中硬编码模型名/端点列表
   - 新模型支持应无需改代码或升级版本

3. **检测逻辑重复**：禁止在多处复制相同逻辑
   - 解决：统一模块导入，如 `from litellm.llms.domestic.domestic_utils import is_domestic_model_or_endpoint`

### API 兼容性问题
4. **退出选项必须提供**：静默过滤用户参数必须有 opt-out 机制
   - 解决：添加环境变量 `LITELLM_DISABLE_DOMESTIC_COMPATIBILITY=true`

5. **返回类型变更需文档化**：函数返回类型从 `List` 改为 `Optional[List]` 需明确记录
   - 可能破坏调用者，需提供 None guard

6. **参数过滤顺序**：必须在 merge 之后执行 pop
   - 正确顺序：`completion_args.update(kwargs)` → `completion_args.update(request)` → `pop("client_metadata")`
   - 错误顺序：先 pop 再 merge，导致 client_metadata 从 request 中存活

### CI 问题
7. **MyPy 上游既有错误**：`litellm/responses/litellm_completion_transformation/transformation.py` 有 3 个预存在错误
   - 行 204/207：类型不兼容赋值
   - 行 1489：变量重复定义
   - 这是官方仓库 bug，需官方先修复
