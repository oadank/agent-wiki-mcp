---
title: "History"
category: references
tags: []
sources:
  - ./mcp_server/node_modules/forwarded/HISTORY.md
sourceType: article
certainty: fact
status: active
created: "2026-05-22T17:50:21.934035+00:00"
updated: "2026-05-22T17:50:21.934072+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** History

0.2.0 / 2021-05-31
==================

  * Use `req.socket` over deprecated `req.connection`

0.1.2 / 2017-09-14
==================

  * perf: improve header parsing
  * perf: reduce overhead when no `X-Forwarded-For` header

0.1.1 / 2017-09-10
==================

  * Fix trimming leading / trailing OWS
  * perf: hoist regular expression

0.1.0 / 2014-09-21
==================

  * Initial release