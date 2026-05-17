---
title: "LiteLLM 源码修改：推理模型默认处理"
category: shared
date: 2026-05-16 01:05
tags: ["LiteLLM","源码修改","推理模型","reasoning_content","workaround"]
---
# LiteLLM 源码修改：推理模型默认处理

## LiteLLM 源码修改：推理模型默认处理 reasoning_content

**修改文件**: `/opt/litellm-source/litellm/litellm_core_utils/streaming_handler.py`

**修改位置**: 第 121-123 行

**原代码**:
```python
self.merge_reasoning_content_in_choices: bool = (
    litellm_params.merge_reasoning_content_in_choices or False
)
```

**修改后**:
```python
self.merge_reasoning_content_in_choices: bool = (
    litellm_params.merge_reasoning_content_in_choices or True  # 默认启用，推理模型自动处理
)
```

**效果**: 所有推理模型（小米 MiMo、DeepSeek thinking mode）自动处理 reasoning_content，无需在 litellm_config.yaml 里单独配置 `merge_reasoning_content_in_choices: true`

**备份**: `streaming_handler.py.bak`（同目录）

**注意**: LiteLLM 升级后需要重新修改此文件
