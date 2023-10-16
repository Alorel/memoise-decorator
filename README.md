# Memoise decorator

An ES7 decorator for memoising (caching) a method's response

[![MASTER CI status](https://github.com/Alorel/memoise-decorator/actions/workflows/core.yml/badge.svg)](https://github.com/Alorel/memoise-decorator/actions/workflows/core.yml?query=branch%3Amaster)
[![crates.io badge](https://img.shields.io/npm/v/%40aloreljs/memoise-decorator)](https://www.npmjs.com/package/%40aloreljs/memoise-decorator)
[![dependencies badge](https://img.shields.io/librariesio/release/npm/%40aloreljs/memoise-decorator)](https://libraries.io/npm/@aloreljs%2Fmemoise-decorator)
[![Coverage Status](https://coveralls.io/repos/github/Alorel/memoise-decorator/badge.svg)](https://coveralls.io/github/Alorel/memoise-decorator)

-----

# Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Compatibility](#compatibility)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Custom Cache Key Generator](#custom-cache-key-generator)
  - [Memoising all method calls disregarding parameters](#memoising-all-method-calls-disregarding-parameters)
  - [Direct access to the cache](#direct-access-to-the-cache)
  - [Memoising arbitrary functions](#memoising-arbitrary-functions)
- [Migrating from v2](#migrating-from-v2)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation

    npm install @aloreljs/memoise-decorator

# Compatibility

The library's only goal is to be compatible with Typescript 5 decorators which, at the time of writing, use the [2022-03 stage 3 decorators proposal](https://2ality.com/2022/10/javascript-decorators.html).

# Usage
## Basic Usage

```typescript
import {Memoise} from '@aloreljs/memoise-decorator';

class MyClass {
  @Memoise()
  someMethod(a, b, c) {
  }
  
  @Memoise()
  static someStaticMethod(a, b, c) {
  }
}
```

## Custom Cache Key Generator

The decorator uses `JSON.stringify` on the method arguments to generate a cache key by default, which should work for
most scenarios, but can be inefficient or unusable in others. You can replace it by passing your own cache key
generator to the decorator function. It will be called with the class instance as an argument.

The function can return anything that's uniquely identifiable in a Map.

```typescript
import {Memoise} from '@aloreljs/memoise-decorator';

class MyClass {
  constructor() {
    this.someId = 'foo';
  }
  
  @Memoise(function(this: MyClass, label: string, data: number) {
    return `${this.someId}:${label}:${data}`;
  })
  someMethod(label: string, data: number): void {
  }
}
```

## Memoising all method calls disregarding parameters

This might be useful for methods that don't accept parameters in the first place.

```javascript
import {MemoiseAll} from '@aloreljs/memoise-decorator';

class MyClass {
  @MemoiseAll()
  method() {
    return 'foo';
  }
}
```

## Direct access to the cache

After being called at least once, the method will get a `MEMOISE_CACHE` property containing the cache.

```typescript
import {MEMOISE_CACHE, Memoise} from '@aloreljs/memoise-decorator';

class MyClass {
  @Memoise()
  method(a) {
    return a + 10;
  }
}
const instance = new MyClass();
instance.method(instance.method(1));
console.log(instance.method[MEMOISE_CACHE]!.get(defaultSerialiser(1))); // 11, or our argument of 1 + 10
```

## Memoising arbitrary functions

```typescript
import {memoiseArglessFunction, memoiseFunction} from '@aloreljs/memoise-decorator';

const fn1 = memoiseArglessFunction(() => Math.random());
const fn2 = memoiseFunction((a, b) => a + b);
```

# Migrating from v2

- Instead of `@Memoise.all()` use `@MemoiseAll()`
- Typings added for `MEMOISE_CACHE`
- Dropped support for typescript's experimental decorators
- Added functions exports for memoising arbitrary functions
