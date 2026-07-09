---
  title: "MiMo 流式输出修复"
  category: shared
  date: 2026-06-12 09:46
  tags: ["mimo","agents-to-im","bugfix","streaming"]
  ---
  # MiMo 流式输出修复
  
  MiMo 流式输出修复。文件：/opt/agents-to-im/src/providers/mimo/mimo-provider.ts。改动1：onAcpData的agent_message_chunk处理中，正文累积后立刻emit text事件，实现流式。改动2：startCleanupTimer中，idle cleanup清理前先通知cached.currentSettle，避免prompt干等到超时。改完执行cd /opt/agents-to-im && npm run build
  