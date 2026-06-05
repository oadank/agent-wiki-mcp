---
title: "Diffs Language Pack"
category: plugins
sources:
  - "/usr/lib/node_modules/openclaw/docs/plugins/reference/diffs-language-pack.md"
tags: [plugins]
sourceType: document
certainty: high
status: active
syncedAt: 2026-06-05T06:46:58.874368+00:00
---

---
summary: "Adds syntax highlighting for languages outside the default diffs viewer set."
read_when:
  - You are installing, configuring, or auditing the diffs-language-pack plugin
title: "Diffs Language Pack plugin"
---

# Diffs Language Pack plugin

Adds syntax highlighting for languages outside the default diffs viewer set.

## Distribution

- Package: `@openclaw/diffs-language-pack`
- Install route: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Surface

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Added languages

The base `diffs` plugin already highlights the common languages documented in [Diffs](/tools/diffs). Install this language pack when you want syntax highlighting for a broader set of Shiki-supported languages. If the pack is not installed, those files still render as readable plain text.

Examples include Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, and diff files.

See [Shiki languages](https://shiki.style/languages) for Shiki's upstream language and alias catalog.

<!-- openclaw-plugin-reference:manual-end -->
