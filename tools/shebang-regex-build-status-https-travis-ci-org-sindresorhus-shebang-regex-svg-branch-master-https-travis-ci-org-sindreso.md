---
title: "shebang-regex [![Build Status](https://travis-ci.org/sindresorhus/shebang-regex.svg?branch=master)](https://travis-ci.org/sindresorhus/shebang-regex)"
category: tools
tags: []
sources:
  - ./mcp_server/node_modules/shebang-regex/readme.md
sourceType: article
certainty: question
status: active
created: "2026-05-22T17:50:20.807946+00:00"
updated: "2026-05-22T17:50:20.807976+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** shebang-regex [![Build Status](https://travis-ci.org/sindresorhus/shebang-regex.svg?branch=master)](https://travis-ci.org/sindresorhus/shebang-regex)

# shebang-regex [![Build Status](https://travis-ci.org/sindresorhus/shebang-regex.svg?branch=master)](https://travis-ci.org/sindresorhus/shebang-regex)

> Regular expression for matching a [shebang](https://en.wikipedia.org/wiki/Shebang_(Unix)) line


## Install

```
$ npm install shebang-regex
```


## Usage

```js
const shebangRegex = require('shebang-regex');

const string = '#!/usr/bin/env node\nconsole.log("unicorns");';

shebangRegex.test(string);
//=> true

shebangRegex.exec(string)[0];
//=> '#!/usr/bin/env node'

shebangRegex.exec(string)[1];
//=> '/usr/bin/env node'
```


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)