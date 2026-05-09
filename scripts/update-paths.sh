#!/bin/bash
# 批量更新路径引用

VAULT="/opt/.openclaw/workspace/skills/agent-wiki-mcp"

# 更新 .manifest.json
sed -i 's|"plugins/|"knowledge/plugins/|g' "$VAULT/.manifest.json"
sed -i 's|"channels/|"knowledge/channels/|g' "$VAULT/.manifest.json"
sed -i 's|"gateway/|"knowledge/gateway/|g' "$VAULT/.manifest.json"
sed -i 's|"automation/|"knowledge/openclaw/automation/|g' "$VAULT/.manifest.json"
sed -i 's|"concepts/|"knowledge/openclaw/concepts/|g' "$VAULT/.manifest.json"
sed -i 's|"cli/|"knowledge/openclaw/cli/|g' "$VAULT/.manifest.json"
sed -i 's|"install/|"knowledge/openclaw/install/|g' "$VAULT/.manifest.json"
sed -i 's|"start/|"knowledge/openclaw/start/|g' "$VAULT/.manifest.json"
sed -i 's|"nodes/|"knowledge/openclaw/nodes/|g' "$VAULT/.manifest.json"
sed -i 's|"platforms/|"knowledge/openclaw/platforms/|g' "$VAULT/.manifest.json"
sed -i 's|"providers/|"knowledge/openclaw/providers/|g' "$VAULT/.manifest.json"
sed -i 's|"security/|"knowledge/openclaw/security/|g' "$VAULT/.manifest.json"
sed -i 's|"tools/|"knowledge/openclaw/tools/|g' "$VAULT/.manifest.json"
sed -i 's|"help/|"knowledge/openclaw/help/|g' "$VAULT/.manifest.json"
sed -i 's|"debug/|"knowledge/openclaw/debug/|g' "$VAULT/.manifest.json"
sed -i 's|"diagnostics/|"knowledge/openclaw/diagnostics/|g' "$VAULT/.manifest.json"
sed -i 's|"docs/|"knowledge/openclaw/docs/|g' "$VAULT/.manifest.json"
sed -i 's|"mac/|"knowledge/openclaw/mac/|g' "$VAULT/.manifest.json"
sed -i 's|"reference/|"knowledge/openclaw/reference/|g' "$VAULT/.manifest.json"
sed -i 's|"references/|"knowledge/openclaw/references/|g' "$VAULT/.manifest.json"
sed -i 's|"skills/|"knowledge/openclaw/skills/|g' "$VAULT/.manifest.json"
sed -i 's|"templates/|"knowledge/openclaw/templates/|g' "$VAULT/.manifest.json"
sed -i 's|"web/|"knowledge/openclaw/web/|g' "$VAULT/.manifest.json"
sed -i 's|"claude-code-docs/|"knowledge/openclaw/claude-code-docs/|g' "$VAULT/.manifest.json"
sed -i 's|"projects/|"knowledge/openclaw/projects/|g' "$VAULT/.manifest.json"

# litellm 特殊处理
for name in adding-provider anthropic-unified caching completion contribute-integration contributing core debugging embedding extras guides integrations langchain learn observability pass-through projects provider-registration providers proxy search secrets troubleshoot vector-stores; do
  sed -i 's|"litellm-$name/|"knowledge/litellm/$name/|g' "$VAULT/.manifest.json"
done

echo "manifest.json updated"
