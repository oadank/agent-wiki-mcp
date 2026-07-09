---
description: Build, run, test, and ship OpenHuman from source.
icon: code-branch
---

# Overview

OpenHuman is open source under GPLv3 at [github.com/tinyhumansai/openhuman](https://github.com/tinyhumansai/openhuman). This section is for contributors and anyone running OpenHuman from source.

If you just want to use the app, head to [[.overview/getting-started|Getting Started]]. If you're here to read the architecture, hack on a feature, or land a PR, you're in the right place.

***

## Where things live

| Path        | What's there                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `app/`      | pnpm workspace `openhuman-app`. Vite + React frontend (`app/src/`) and the Tauri desktop host (`app/src-tauri/`). |
| `src/`      | Rust crate `openhuman_core` and the `openhuman-core` CLI binary. Domains, JSON-RPC, MCP routing.                  |
| `gitbooks/` | This site (the public-facing docs).                                                                               |
| `docs/`     | Older deep references not yet migrated to GitBook (memory pipeline diagrams, agent flows, etc.).                  |

`CLAUDE.md` at the repo root is the source of truth for AI agents working on the codebase. Same rules apply to humans.

***

## Start here

If it's your first time pulling the repo:

1. [[getting-set-up|**Getting Set Up**]]. Toolchain, dependencies, the vendored Tauri CLI, sidecar staging - everything `pnpm dev` needs to actually start.
2. [[building-rust-core|**Building the Rust Core**]]. Fresh-machine setup for the repo-root Rust crate only: pinned toolchain, OS packages, and exact `cargo` commands.
3. [[architecture|**Architecture**]]. How the desktop app, the Rust core sidecar, the JSON-RPC bridge, and the dual sockets fit together. Read this before you make non-trivial changes.
4. [[architecture/frontend|**Frontend**]] and [[architecture/tauri-shell|**Tauri Shell**]]. The React app and the desktop host that wraps it.
5. [[mcp-server|**MCP Server**]]. Opt-in stdio MCP mode for exposing read-only OpenHuman memory tools to local clients.

***

## Testing

OpenHuman ships with three test layers. Know which one your change belongs in:

* [[testing-strategy|**Testing Strategy**]]. When to write Vitest vs cargo tests vs WDIO.
* [[e2e-testing|**E2E Testing**]]. WDIO/Appium specs, dual-platform setup (Linux tauri-driver, macOS Appium Mac2), and how to run a single spec locally.
* [[agent-observability|**Agent Observability**]]. The artifact-capture layer that makes E2E and agent runs debuggable after the fact.

PRs must clear the **≥ 80% coverage on changed lines** gate. Add tests for new behavior, not just the happy path.

***

## Shipping

* [[release-policy|**Release Policy**]]. Version policy, release cadence, OAuth + installer rules.
* [[.features/cloud-deploy|**Cloud Deploy**]]. Backend/cloud-side deployment when a change crosses the desktop boundary.

***

## Going deeper

* [[architecture/agent-harness|**Agent Harness**]]. The agent's code-focused tool surface and how to extend it.
* [[cef|**Chromium Embedded Framework**]]. How embedded provider webviews work, why they don't run injected JS, and what the per-provider scanners do instead.

For features still being built, the [[.features/subconscious|Subconscious Loop]] page covers the background task evaluation system end-to-end.

***

## Contributing

* Open issues and PRs at [tinyhumansai/openhuman](https://github.com/tinyhumansai/openhuman).
* PRs target `main`. Push to your fork, not upstream.
* Follow [[..CONTRIBUTING|`CONTRIBUTING.md`]] and the issue/PR templates.
* Keep changes focused. A bug fix doesn't need surrounding cleanup; a one-shot operation doesn't need a helper.

Help building toward AGI doesn't have to mean shipping a kernel - bugfixes, docs, integrations, and tests all move the bar.
