# Memoise decorator

An ES7 decorator for memoising (caching) a method's response

[![Build Status](https://travis-ci.com/Alorel/memoise-decorator.svg?branch=1.1.1)](https://travis-ci.com/Alorel/memoise-decorator)
[![Coverage Status](https://coveralls.io/repos/github/Alorel/memoise-decorator/badge.svg?branch=1.1.1)](https://coveralls.io/github/Alorel/memoise-decorator?branch=1.1.1)
[![Greenkeeper badge](https://badges.greenkeeper.io/Alorel/memoise-decorator.svg)](https://greenkeeper.io/)

-----

# Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
- [Polyfills Required](#polyfills-required)
- [Compatibility](#compatibility)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Custom Cache Key Generator](#custom-cache-key-generator)
  - [Using Instance Methods as Cache Key Generators](#using-instance-methods-as-cache-key-generators)
    - [Typescript](#typescript)
    - [Babel](#babel)
  - [Memoising all method calls disregarding parameters](#memoising-all-method-calls-disregarding-parameters)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation

    npm install @aloreljs/memoise-decorator
  
# Polyfills Required

`Symbol` construction via `Symbol('someName')` must be available.

# Compatibility

- Typescript - full
- Spec-compliant decorator proposal - full
- Babel (current proposal) - full
- Babel (legacy) - full

# Usage
## Basic Usage

```javascript
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
generator to the decorator function.

```javascript
import {Memoise} from '@aloreljs/memoise-decorator';

class MyClass {
  @Memoise((label, data) => `${label}:${data.id}`)
  someMethod(label, data) {
  }
}
```

## Using Instance Methods as Cache Key Generators

The cache generator function gets called with `fn.apply(instance, methodArguments)` and therefore can access instance
data. The syntax is a bit different for Typescript and Babel.

### Typescript

Decorators get applied after your class is already established, therefore the syntax is simple

```typescript
import {Memoise} from '@aloreljs/memoise-decorator';

class MyClass {
  public readonly multiplier = 5;
  
  @Memoise(MyClass.prototype.serialiser)
  public method(num: number): string {
    return `The number is ${num}`;
  }
  
  private serialiser(num: number): number {
    return num * this.multiplier;
  }
}
```

### Babel

Decorators get applied as part of the class definition, therefore you need to wrap the cache key generator:

```javascript
import {Memoise} from '@aloreljs/memoise-decorator';

class MyClass {
  constructor() {
    this.multiplier = 5;
  }
  
  @Memoise(function() { // Arrow functions will not work
    return MyClass.prototype.serialiser.apply(this, arguments);
  })
  method(num) {
    return `The number is ${num}`;
  }
  
  serialiser(num) {
    return num * this.multiplier;
  }
}
```

## Memoising all method calls disregarding parameters

This might be useful for methods that don't accept parameters in the first place.

```javascript
import {Memoise} from '@aloreljs/memoise-decorator';

class MyClass {
  @Memoise.all()
  method() {
    return 'foo';
  }
}
```
