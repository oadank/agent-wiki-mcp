---
title: "escape-html"
category: references
tags: []
sources:
  - ./mcp_server/node_modules/escape-html/Readme.md
sourceType: report
certainty: fact
status: active
created: "2026-05-22T17:50:16.095917+00:00"
updated: "2026-05-22T17:50:16.095963+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** escape-html

# escape-html

  Escape string for use in HTML

## Example

```js
var escape = require('escape-html');
var html = escape('foo & bar');
// -> foo &amp; bar
```

## Benchmark

```
$ npm run-script bench

> escape-html@1.0.3 bench nodejs-escape-html
> node benchmark/index.js


  http_parser@1.0
  node@0.10.33
  v8@3.14.5.9
  ares@1.9.0-DEV
  uv@0.10.29
  zlib@1.2.3
  modules@11
  openssl@1.0.1j

  1 test completed.
  2 tests completed.
  3 tests completed.

  no special characters    x 19,435,271 ops/sec ±0.85% (187 runs sampled)
  single special character x  6,132,421 ops/sec ±0.67% (194 runs sampled)
  many special characters  x  3,175,826 ops/sec ±0.65% (193 runs sampled)
```

## License

  MIT