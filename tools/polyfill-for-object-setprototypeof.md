---
title: "Polyfill for `Object.setPrototypeOf`"
category: tools
tags: []
sources:
  - ./mcp_server/node_modules/setprototypeof/README.md
sourceType: article
certainty: fact
status: active
created: "2026-05-22T17:50:11.446905+00:00"
updated: "2026-05-22T17:50:11.446944+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** Polyfill for `Object.setPrototypeOf`

# Polyfill for `Object.setPrototypeOf`

[![NPM Version](https://img.shields.io/npm/v/setprototypeof.svg)](https://npmjs.org/package/setprototypeof)
[![NPM Downloads](https://img.shields.io/npm/dm/setprototypeof.svg)](https://npmjs.org/package/setprototypeof)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/standard/standard)

A simple cross platform implementation to set the prototype of an instianted object.  Supports all modern browsers and at least back to IE8.

## Usage:

```
$ npm install --save setprototypeof
```

```javascript
var setPrototypeOf = require('setprototypeof')

var obj = {}
setPrototypeOf(obj, {
  foo: function () {
    return 'bar'
  }
})
obj.foo() // bar
```

TypeScript is also supported:

```typescript
import setPrototypeOf from 'setprototypeof'
```