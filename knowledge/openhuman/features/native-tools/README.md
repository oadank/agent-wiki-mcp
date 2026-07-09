---
description: >-
  The full toolset OpenHuman's agent has out of the box - research, code,
  control your machine, schedule jobs, talk back to you, and call into 118+
  third-party services.
icon: toolbox
---

# Native Tools

OpenHuman's agent doesn't ship empty. Every model behind the agent has a curated set of tools available the moment you install - no plugin marketplace, no API keys to wire up, no MCP servers to register. The whole toolbelt is in the box.

This page is the index. Each subpage covers one family of tools.

## Why ship them natively

A plugin-only model means tools live in different processes, behind RPC, with their own auth and packaging stories. That's fine for open-ended extensibility, but for the **core** tools every agent needs (read a file, search the web, edit code, set a reminder, join a meeting), shipping them in-process means:

* Consistent error handling.
* Zero install friction.
* All output passes through [[.token-compression|Smart Token Compression]] for free.
* Predictable security boundary - filesystem tools respect workspace scoping, and network tools use the managed OpenHuman proxy by default unless you opt into a self-hosted path such as SearXNG.

## The toolbelt

| Family | What it covers |
| ------ | -------------- |
| [[web-search|Web Search]] | Search the live web via the managed proxy, or opt into self-hosted SearXNG. |
| [[web-scraper|Web Scraper]] | Pull clean text out of any URL - articles, docs, READMEs. |
| [[coder|Coder]] | Read/write/edit/patch files, glob, grep, git, lint, test. |
| [[browser-and-computer|Browser & Computer Control]] | Open URLs, screenshot, click, type, move the mouse. |
| [[cron|Cron & Scheduling]] | Recurring jobs, one-off reminders, scheduled agent runs. |
| [[voice|Voice]] | Speech-to-text in, text-to-speech out, live Google Meet agent. |
| [[memory-tools|Memory Tools]] | Recall, store, forget, and search the [[.obsidian-wiki/memory-tree|Memory Tree]]. |
| [[.integrations/README|Third-party Integrations]] | The agent's view of the [[.integrations/README|118+ connected services]]. |
| [[agent-coordination|Agent Coordination]] | Spawn subagents, delegate to skills, plan, ask the user. |
| [[system-and-utilities|System & Utilities]] | Shell, node, SQL, current time, push notifications, LSP. |

## See also

* [[.token-compression|Smart Token Compression]] - what keeps tool output costs bounded.
* [[.integrations/README|Third-party Integrations]] - the user-facing pitch and OAuth flow for the 118+ catalog.
* [[.privacy-and-security|Privacy & Security]] - the boundary every tool runs inside.
