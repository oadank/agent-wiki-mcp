---
title: "unpipe"
category: providers
tags: []
sources:
  - ./mcp_server/node_modules/unpipe/README.md
sourceType: document
certainty: question
status: active
created: "2026-05-22T17:50:21.411637+00:00"
updated: "2026-05-22T17:50:21.411670+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** unpipe

# unpipe

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

Unpipe a stream from all destinations.

## Installation

```sh
$ npm install unpipe
```

## API

```js
var unpipe = require('unpipe')
```

### unpipe(stream)

Unpipes all destinations from a given stream. With stream 2+, this is
equivalent to `stream.unpipe()`. When used with streams 1 style streams
(typically Node.js 0.8 and below), this module attempts to undo the
actions done in `stream.pipe(dest)`.

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/unpipe.svg
[npm-url]: https://npmjs.org/package/unpipe
[node-image]: https://img.shields.io/node/v/unpipe.svg
[node-url]: http://nodejs.org/download/
[travis-image]: https://img.shields.io/travis/stream-utils/unpipe.svg
[travis-url]: https://travis-ci.org/stream-utils/unpipe
[coveralls-image]: https://img.shields.io/coveralls/stream-utils/unpipe.svg
[coveralls-url]: https://coveralls.io/r/stream-utils/unpipe?branch=master
[downloads-image]: https://img.shields.io/npm/dm/unpipe.svg
[downloads-url]: https://npmjs.org/package/unpipe