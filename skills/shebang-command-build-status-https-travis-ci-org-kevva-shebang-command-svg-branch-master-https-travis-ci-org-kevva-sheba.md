---
title: "shebang-command [![Build Status](https://travis-ci.org/kevva/shebang-command.svg?branch=master)](https://travis-ci.org/kevva/shebang-command)"
category: skills
tags: []
sources:
  - ./mcp_server/node_modules/shebang-command/readme.md
sourceType: document
certainty: question
status: active
created: "2026-05-22T17:50:14.177014+00:00"
updated: "2026-05-22T17:50:14.177048+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** shebang-command [![Build Status](https://travis-ci.org/kevva/shebang-command.svg?branch=master)](https://travis-ci.org/kevva/shebang-command)

# shebang-command [![Build Status](https://travis-ci.org/kevva/shebang-command.svg?branch=master)](https://travis-ci.org/kevva/shebang-command)

> Get the command from a shebang


## Install

```
$ npm install shebang-command
```


## Usage

```js
const shebangCommand = require('shebang-command');

shebangCommand('#!/usr/bin/env node');
//=> 'node'

shebangCommand('#!/bin/bash');
//=> 'bash'
```


## API

### shebangCommand(string)

#### string

Type: `string`

String containing a shebang.