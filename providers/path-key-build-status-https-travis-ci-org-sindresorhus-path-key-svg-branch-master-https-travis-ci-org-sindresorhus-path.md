---
title: "path-key [![Build Status](https://travis-ci.org/sindresorhus/path-key.svg?branch=master)](https://travis-ci.org/sindresorhus/path-key)"
category: providers
tags: []
sources:
  - ./mcp_server/node_modules/path-key/readme.md
sourceType: document
certainty: question
status: active
created: "2026-05-22T17:50:10.410934+00:00"
updated: "2026-05-22T17:50:10.410969+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** path-key [![Build Status](https://travis-ci.org/sindresorhus/path-key.svg?branch=master)](https://travis-ci.org/sindresorhus/path-key)

# path-key [![Build Status](https://travis-ci.org/sindresorhus/path-key.svg?branch=master)](https://travis-ci.org/sindresorhus/path-key)

> Get the [PATH](https://en.wikipedia.org/wiki/PATH_(variable)) environment variable key cross-platform

It's usually `PATH`, but on Windows it can be any casing like `Path`...


## Install

```
$ npm install path-key
```


## Usage

```js
const pathKey = require('path-key');

const key = pathKey();
//=> 'PATH'

const PATH = process.env[key];
//=> '/usr/local/bin:/usr/bin:/bin'
```


## API

### pathKey(options?)

#### options

Type: `object`

##### env

Type: `object`<br>
Default: [`process.env`](https://nodejs.org/api/process.html#process_process_env)

Use a custom environment variables object.

#### platform

Type: `string`<br>
Default: [`process.platform`](https://nodejs.org/api/process.html#process_process_platform)

Get the PATH key for a specific platform.


---

<div align="center">
	<b>
		<a href="https://tidelift.com/subscription/pkg/npm-path-key?utm_source=npm-path-key&utm_medium=referral&utm_campaign=readme">Get professional support for this package with a Tidelift subscription</a>
	</b>
	<br>
	<sub>
		Tidelift helps make open source sustainable for maintainers while giving companies<br>assurances about security, maintenance, and licensing for their dependencies.
	</sub>
</div>