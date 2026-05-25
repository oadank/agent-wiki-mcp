---
title: "pkce-challenge"
category: security
tags: []
sources:
  - ./mcp_server/node_modules/pkce-challenge/README.md
sourceType: document
certainty: fact
status: active
created: "2026-05-22T17:50:13.777712+00:00"
updated: "2026-05-22T17:50:13.777742+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** pkce-challenge

# pkce-challenge

Generate or verify a Proof Key for Code Exchange (PKCE) challenge pair.

Read more about [PKCE](https://www.oauth.com/oauth2-servers/pkce/authorization-request/).

## Installation

```bash
npm install pkce-challenge
```

## Usage

Default length for the verifier is 43

```js
import pkceChallenge from "pkce-challenge";

await pkceChallenge();
```

gives something like:

```js
{
    code_verifier: 'u1ta-MQ0e7TcpHjgz33M2DcBnOQu~aMGxuiZt0QMD1C',
    code_challenge: 'CUZX5qE8Wvye6kS_SasIsa8MMxacJftmWdsIA_iKp3I'
}
```

### Specify a verifier length

```js
const challenge = await pkceChallenge(128);

challenge.code_verifier.length === 128; // true
```

### Challenge verification

```js
import { verifyChallenge } from "pkce-challenge";

(await verifyChallenge(challenge.code_verifier, challenge.code_challenge)) ===
  true; // true
```

### Challenge generation from existing code verifier

```js
import { generateChallenge } from "pkce-challenge";

(await generateChallenge(challenge.code_verifier)) === challenge.code_challenge; // true
```