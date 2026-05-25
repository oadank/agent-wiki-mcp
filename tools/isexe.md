---
title: "isexe"
category: tools
tags: []
sources:
  - ./mcp_server/node_modules/isexe/README.md
sourceType: document
certainty: inference
status: active
created: "2026-05-22T17:50:15.700619+00:00"
updated: "2026-05-22T17:50:15.700669+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** isexe

# isexe

Minimal module to check if a file is executable, and a normal file.

Uses `fs.stat` and tests against the `PATHEXT` environment variable on
Windows.

## USAGE

```javascript
var isexe = require('isexe')
isexe('some-file-name', function (err, isExe) {
  if (err) {
    console.error('probably file does not exist or something', err)
  } else if (isExe) {
    console.error('this thing can be run')
  } else {
    console.error('cannot be run')
  }
})

// same thing but synchronous, throws errors
var isExe = isexe.sync('some-file-name')

// treat errors as just "not executable"
isexe('maybe-missing-file', { ignoreErrors: true }, callback)
var isExe = isexe.sync('maybe-missing-file', { ignoreErrors: true })
```

## API

### `isexe(path, [options], [callback])`

Check if the path is executable.  If no callback provided, and a
global `Promise` object is available, then a Promise will be returned.

Will raise whatever errors may be raised by `fs.stat`, unless
`options.ignoreErrors` is set to true.

### `isexe.sync(path, [options])`

Same as `isexe` but returns the value and throws any errors raised.

### Options

* `ignoreErrors` Treat all errors as "no, this is not executable", but
  don't raise them.
* `uid` Number to use as the user id
* `gid` Number to use as the group id
* `pathExt` List of path extensions to use instead of `PATHEXT`
  environment variable on Windows.