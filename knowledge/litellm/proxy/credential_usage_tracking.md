---
title: "Credential Usage Tracking"
category: "litellm-proxy"
tags:
  - litellm
  - litellm-proxy
sources:
  - "/opt/openclaw/data/workspace/refs/litellm-docs/docs/proxy/credential_usage_tracking.md"
summary: "When a model is attached to a [[ui_credentials|reusable credential]], LiteLLM automatically injects the credential name as a tag on every request that uses that model. This means credential-level "
---

# Credential Usage Tracking

# Credential Usage Tracking

When a model is attached to a [[ui_credentials|reusable credential]], LiteLLM automatically injects the credential name as a tag on every request that uses that model. This means credential-level spend and usage are tracked with zero extra configuration.

## How It Works

When you attach a model to a reusable credential via `litellm_credential_name`, each request routed through that model is tagged `Credential: <name>` (for example, `Credential: xAI`). This tag flows into `DailyTagSpend` and appears in the **Tag** view on the Usage page, where you can filter spend and usage by credential.

If a model has no credential attached, behavior is unchanged—no credential tag is added.

## Viewing Credential Usage

In the Admin UI, go to **Usage → Tag** and look for tags with the `Credential: ` prefix. These represent aggregated spend and token usage across all requests that used that credential.

## Related Documentation

- [[ui_credentials|Adding LLM Credentials]] - How to create and attach reusable credentials to models
- [[tag_budgets|Tag Budgets]] - Setting spend limits on tags
- [[tag_routing|Tag Routing]] - Routing requests based on tags
