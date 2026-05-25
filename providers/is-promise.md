---
title: "is-promise"
category: providers
tags: []
sources:
  - ./mcp_server/node_modules/is-promise/readme.md
sourceType: document
certainty: fact
status: active
created: "2026-05-22T17:50:14.245569+00:00"
updated: "2026-05-22T17:50:14.245606+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** is-promise

<a href="https://promisesaplus.com/"><img src="https://promisesaplus.com/assets/logo-small.png" align="right" /></a>

# is-promise

  Test whether an object looks like a promises-a+ promise

 [![Build Status](https://img.shields.io/travis/then/is-promise/master.svg)](https://travis-ci.org/then/is-promise)
 [![Dependency Status](https://img.shields.io/david/then/is-promise.svg)](https://david-dm.org/then/is-promise)
 [![NPM version](https://img.shields.io/npm/v/is-promise.svg)](https://www.npmjs.org/package/is-promise)



## Installation

    $ npm install is-promise

You can also use it client side via npm.

## API

```typescript
import isPromise from 'is-promise';

isPromise(Promise.resolve());//=>true
isPromise({then:function () {...}});//=>true
isPromise(null);//=>false
isPromise({});//=>false
isPromise({then: true})//=>false
```

## License

  MIT