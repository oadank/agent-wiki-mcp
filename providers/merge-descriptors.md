---
title: "merge-descriptors"
category: providers
tags: []
sources:
  - ./mcp_server/node_modules/merge-descriptors/readme.md
sourceType: document
certainty: question
status: active
created: "2026-05-22T17:50:10.486564+00:00"
updated: "2026-05-22T17:50:10.486603+00:00"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

> **TL;DR** merge-descriptors

# merge-descriptors

> Merge objects using their property descriptors

## Install

```sh
npm install merge-descriptors
```

## Usage

```js
import mergeDescriptors from 'merge-descriptors';

const thing = {
	get name() {
		return 'John'
	}
}

const animal = {};

mergeDescriptors(animal, thing);

console.log(animal.name);
//=> 'John'
```

## API

### merge(destination, source, overwrite?)

Merges "own" properties from a source to a destination object, including non-enumerable and accessor-defined properties. It retains original values and descriptors, ensuring the destination receives a complete and accurate copy of the source's properties.

Returns the modified destination object.

#### destination

Type: `object`

The object to receive properties.

#### source

Type: `object`

The object providing properties.

#### overwrite

Type: `boolean`\
Default: `true`

A boolean to control overwriting of existing properties.