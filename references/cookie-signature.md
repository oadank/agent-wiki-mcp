---
title: "cookie-signature"
category: references
tags: []
sources:
  - ./mcp_server/node_modules/cookie-signature/Readme.md
sourceType: article
certainty: fact
status: active
created: "2026-05-22T17:50:21.760145+00:00"
updated: "2026-05-22T17:50:21.760177+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** cookie-signature

# cookie-signature

  Sign and unsign cookies.

## Example

```js
var cookie = require('cookie-signature');

var val = cookie.sign('hello', 'tobiiscool');
val.should.equal('hello.DGDUkGlIkCzPz+C0B064FNgHdEjox7ch8tOBGslZ5QI');

var val = cookie.sign('hello', 'tobiiscool');
cookie.unsign(val, 'tobiiscool').should.equal('hello');
cookie.unsign(val, 'luna').should.be.false;
```

## License

MIT.

See LICENSE file for details.