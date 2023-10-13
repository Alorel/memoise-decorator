import {expect} from 'chai';
import type {Cache} from './core';
import {defaultSerialiser, Memoise, MEMOISE_CACHE, MemoiseAll, memoiseArglessFunction, memoiseFunction} from './index';

/* eslint-disable @typescript-eslint/no-magic-numbers,max-lines-per-function */

describe('Static', () => {
  function customSerialiser(num: number): number {
    return num * 2;
  }

  class Foo {
    public static alls = 0;

    public static keys = 0;

    @MemoiseAll()
    public static all(): void {
      ++this.alls;
    }

    @Memoise(customSerialiser)
    public static key(key: number): { key: number } {
      ++this.keys;

      return {key};
    }
  }

  const C_KEY = Foo.key[MEMOISE_CACHE]!;
  const C_ALL = Foo.all[MEMOISE_CACHE]!;

  afterEach(() => {
    Foo.alls = Foo.keys = 0;
    C_KEY.clear();
    C_ALL.clear();
  });

  it('Should return function value', () => {
    expect(Foo.key(10)).to.deep.eq({key: 10});
  });

  it('Should memoise identical calls', () => {
    const a = Foo.key(1);
    Foo.key(0);
    expect(Foo.key(1)).to.eq(a);
    expect(Foo.keys).to.eq(2);
  });

  it('Should not throw on undecorated override', () => {
    class Undecorated extends Foo {
      public static override key(key: number): { key: number } {
        return super.key(key);
      }
    }

    Undecorated.key(1);
  });

  describe('Private methods', () => {
    const INPUT = 5;

    for (const rawDecorator of [Memoise, MemoiseAll]) {
      const decorator = rawDecorator as typeof Memoise;
      const expectation = rawDecorator === Memoise ? INPUT : undefined;

      describe(`@${decorator.name}`, () => {
        class Bar {
          public static noop(num: number): { num: number } {
            return this.#x(num);
          }

          @decorator()
          static #x(num: number): { num: number } {
            return {num};
          }
        }

        it('Should memoise the response', () => {
          const r = Bar.noop(INPUT);

          expect(r).to.deep.eq({num: expectation}, 'deep');
          expect(Bar.noop(INPUT)).to.eq(r, 'shallow');
        });
      });
    }
  });

  describe('.has(), .delete() & .clear()', () => {
    const K_0 = customSerialiser(0);
    const K_1 = customSerialiser(1);

    it('Should return false for both keys initially', () => {
      expect(C_KEY.has(K_0)).to.eq(false, 'initial .has(K0)');
      expect(C_KEY.has(K_1)).to.eq(false, 'initial .has(K1)');
    });

    it('Should return true appropriately post-call', () => {
      Foo.key(0);

      expect(C_KEY.has(K_0)).to.eq(true, 'after .key(0) .has(K0)');
      expect(C_KEY.has(K_1)).to.eq(false, 'after .key(0) .has(K1)');
    });

    it('Should return false post-clear', () => {
      Foo.key(0);
      C_KEY.clear();

      expect(C_KEY.has(K_0)).to.eq(false, 'after .clear() .has(K0)');
      expect(C_KEY.has(K_1)).to.eq(false, 'after .clear() .has(K1)');
    });

    it('Should use provided serialiser', () => {
      Foo.key(10);
      expect(C_KEY.has(customSerialiser(10))).to.eq(true, 'custom');
      expect(C_KEY.has(defaultSerialiser(10))).to.eq(false, 'default');
    });

    it('Should delete keys', () => {
      Foo.key(0);
      Foo.key(1);
      C_KEY.delete(K_0);

      expect(C_KEY.has(K_0)).to.eq(false, 'after .delete(K0) .has(K0)');
      expect(C_KEY.has(K_1)).to.eq(true, 'after .delete(K0) .has(K1)');
    });
  });

  describe('When overriding a decorated method…', () => {
    class Sub extends Foo {
      public static sKeys = 0;

      @Memoise()
      public static override key(key: number): { key: number } {
        ++this.sKeys;

        return super.key(key);
      }
    }

    const C_SKEYS = Sub.key[MEMOISE_CACHE]!;

    beforeEach(() => {
      Sub.key(0);
      Sub.key(0);
      Sub.key(1);
    });

    afterEach(() => {
      C_SKEYS.clear();
      Sub.sKeys = Sub.keys = Sub.alls = 0;
    });

    it('Should memoise child class', () => {
      expect(Sub.sKeys).to.eq(2);
    });

    it('Should memoise superclass', () => {
      expect(Sub.keys).to.eq(2);
    });
  });
});

describe('Instance', () => {
  class Foo {
    public calls = 0;

    @Memoise()
    public bar(key: number): { key: number } {
      ++this.calls;

      return {key};
    }
  }

  it('Should return function value', () => {
    expect(new Foo().bar(10)).to.deep.eq({key: 10});
  });

  it('Should memoise identical calls', () => {
    const inst = new Foo();
    const a = inst.bar(1);
    inst.bar(0);
    const b = inst.bar(1);

    expect(inst.calls).to.eq(2);
    expect(a).to.eq(b);
  });

  it('Should throw on undecorated override', () => {
    class Undecorated extends Foo {
      public override bar(key: number): { key: number } {
        return super.bar(key);
      }
    }

    expect(() => new Undecorated()).to
      .throw('The `bar` method is decorated with @Memoise or @MemoiseAll in the superclass; decorated instance methods cannot use inheritance unless the subclass method is decorated with @Memoise or @MemoiseAll as well.');
  });

  describe('Should disallow decorating private methods', () => {
    for (const rawDecorator of [Memoise, MemoiseAll]) {
      const decorator = rawDecorator as typeof MemoiseAll;

      it(`@${decorator.name}`, () => {
        expect(() => class {
          public constructor() {
            this.#x();
          }

          @decorator() // eslint-disable-line class-methods-use-this
          #x() {
            // void
          }
        }).to.throw('Can\'t memoise private instance methods');
      });
    }
  });

  describe('.has(), .delete() & .clear()', () => {
    let inst: Foo;
    let cache: Cache;

    const K_0 = defaultSerialiser(0);
    const K_1 = defaultSerialiser(1);

    beforeEach(() => {
      inst = new Foo();
      cache = inst.bar[MEMOISE_CACHE]!;
    });

    it('.has() should return false for both keys initially', () => {
      expect(cache.has(K_0)).to.eq(false, 'initial .has(K0)');
      expect(cache.has(K_1)).to.eq(false, 'initial .has(K1)');
    });

    it('.should return true appropriately post-call', () => {
      inst.bar(0);

      expect(cache.has(K_0)).to.eq(true, 'after .bar(0) .has(K0)');
      expect(cache.has(K_1)).to.eq(false, 'after .bar(0) .has(K1)');
    });

    it('Should return false post-clear', () => {
      inst.bar(0);
      cache.clear();

      expect(cache.has(K_0)).to.eq(false, 'after .clear() .has(K0)');
      expect(cache.has(K_1)).to.eq(false, 'after .clear() .has(K1)');
    });

    it('Should delete keys', () => {
      inst.bar(0);
      inst.bar(1);
      cache.delete(K_0);

      expect(cache.has(K_0)).to.eq(false, 'after .delete(K0) .has(K0)');
      expect(cache.has(K_1)).to.eq(true, 'after .delete(K0) .has(K1)');
    });
  });

  describe('When overriding a decorated method…', () => {
    class Sup {
      public calls = 0;

      @Memoise(() => 0)
      public foo(_v: number): void { // eslint-disable-line @typescript-eslint/no-unused-vars
        ++this.calls;
      }
    }

    class Sub extends Sup {
      public sCalls = 0;

      @Memoise()
      public override foo(v: number): void {
        ++this.sCalls;
        return super.foo(v);
      }
    }

    let inst: Sub;
    before(() => {
      inst = new Sub();
      inst.foo(1);
      inst.foo(0);
      inst.foo(1);
    });

    it('Should memoise subclass calls', () => {
      expect(inst.sCalls).to.eq(2);
    });

    it('Should bypass superclass memoisation', () => {
      expect(inst.calls).to.eq(2);
    });
  });

  describe('When argless…', () => {
    class Argless {
      public calls = 0;

      @MemoiseAll()
      public foo(): void {
        ++this.calls;
      }
    }

    let inst: Argless;
    let cache: Cache;
    beforeEach(() => {
      inst = new Argless();
      cache = inst.foo[MEMOISE_CACHE]!;
    });

    it('Should memoise all calls', () => {
      (inst.foo as Function).call(inst, 0);
      (inst.foo as Function).call(inst, 1);

      expect(inst.calls).to.eq(1);
    });

    it('Should clear', () => {
      inst.foo();
      cache.clear();
      inst.foo();

      expect(inst.calls).to.eq(2);
    });

    it('.has', () => {
      inst.foo();
      expect(cache.has(Math.random())).to.eq(true);
      inst.foo[MEMOISE_CACHE]!.clear();
      expect(cache.has(Math.random())).to.eq(false);
    });

    it('.delete', () => {
      inst.foo();
      expect(cache.has(Math.random())).to.eq(true, 'pre-delete');

      cache.delete(Math.random());
      expect(cache.has(Math.random())).to.eq(false, 'post-delete');
    });
  });
});

describe('Arbitrary fn serialisation', () => {
  it('With args', () => {
    const fn = memoiseFunction((a: number) => ({a}));

    const a = fn(1);

    expect(a).to.deep.eq({a: 1}, 'deep');
    expect(fn(1)).to.eq(a, 'shallow');
    expect(fn(0)).to.deep.eq({a: 0}, 'repeat');
  });

  it('Without args', () => {
    let calls = 0;
    const fn = memoiseArglessFunction(() => {
      ++calls;
    });

    fn();
    fn();

    expect(calls).to.eq(1);
  });
});
