import {expect} from 'chai';
import type {
  Cache} from './index';
import {
  Memoise,
  MEMOISE_CACHE,
  MEMOISE_CACHE_TYPED,
  MemoiseAll,
  memoiseArglessFunction,
  memoiseFunction,
  MemoiseIdentity
} from './index';

/* eslint-disable @typescript-eslint/no-magic-numbers,class-methods-use-this,max-lines-per-function,no-new,max-lines */

function abSerialiser(this: Base, a: number, b: number) {
  return `${a}|${b}`;
}

function abSSerialiser(this: typeof Base, a: number, b: number) {
  return `${a}|${b}`;
}

class Base {
  public static nMemoed = 0;

  public static nUnmemoed = 0;

  public static rets: any[] = [];

  public static initArgChecks(beforeCB: () => void): void {
    this.initCommon();
    before(beforeCB);

    it('Should have 3 memoed calls', () => {
      expect(this.nMemoed).to.eq(3);
    });

    it('All duplicate calls should return same object reference', () => {
      for (let i = 0; i < this.rets.length; i += 2) {
        const r1 = this.rets[i];
        const r2 = this.rets[i + 1];

        expect(Array.isArray(r1)).eq(true, `Idx ${i} is array`);
        expect(r1).to.eq(r2, `Idx ${i} obj ref`);
      }
    });
  }

  public static initValue(beforeCallback: () => void): void {
    this.initCommon();
    before(beforeCallback);

    it('Should have 2 unmemoed called', () => {
      expect(this.nUnmemoed).to.eq(2);
    });

    it('Should have 1 memoed call', () => {
      expect(this.nMemoed).to.eq(1);
    });

    it('Should return same object reference', () => {
      expect(this.rets[0]).to.deep.eq({});
      expect(this.rets[0]).to.eq(this.rets[1]);
    });
  }

  public static reset(): void {
    Base.nMemoed = Base.nUnmemoed = 0;
    Base.staticArgedPublicDefault[MEMOISE_CACHE]!.clear();
    Base.#staticArgedPrivateDefault[MEMOISE_CACHE]!.clear();
    Base.memoedStatic[MEMOISE_CACHE]!.clear();
    Base.#privateStatic[MEMOISE_CACHE]!.clear();
  }

  public static runMemoedStatics(): void {
    this.rets = [this.runMemoedStatic(), this.runMemoedStatic()];
  }

  public static runPrivateStatics() {
    this.rets = [this.runPrivateStatic(), this.runPrivateStatic()];
  }

  public static runStaticArgedPrivateDefaults(): void {
    this.rets = [
      this.#staticArgedPrivateDefault(1, 2),
      this.#staticArgedPrivateDefault(1, 2),

      this.#staticArgedPrivateDefault(1, 1),
      this.#staticArgedPrivateDefault(1, 1),

      this.#staticArgedPrivateDefault(2, 1),
      this.#staticArgedPrivateDefault(2, 1)
    ];
  }

  public static runStaticArgedPrivateDefaultsS(): void {
    this.rets = [
      this.#staticArgedPrivateDefaultS(1, 2),
      this.#staticArgedPrivateDefaultS(1, 2),

      this.#staticArgedPrivateDefaultS(1, 1),
      this.#staticArgedPrivateDefaultS(1, 1),

      this.#staticArgedPrivateDefaultS(2, 1),
      this.#staticArgedPrivateDefaultS(2, 1)
    ];
  }

  public static runStaticArgedPublicDefaults(): void {
    this.rets = [
      this.staticArgedPublicDefault(1, 2),
      this.staticArgedPublicDefault(1, 2),

      this.staticArgedPrivateDefault(1, 1),
      this.staticArgedPrivateDefault(1, 1),

      this.staticArgedPrivateDefault(2, 1),
      this.staticArgedPrivateDefault(2, 1)
    ];
  }

  public static runStaticArgedPublicDefaultsS(): void {
    this.rets = [
      this.staticArgedPublicDefaultS(1, 2),
      this.staticArgedPublicDefaultS(1, 2),

      this.staticArgedPublicDefaultS(1, 1),
      this.staticArgedPublicDefaultS(1, 1),

      this.staticArgedPublicDefaultS(2, 1),
      this.staticArgedPublicDefaultS(2, 1)
    ];
  }

  public static staticArgedPrivateDefault(a: number, b: number) {
    return this.#staticArgedPrivateDefault(a, b);
  }

  @Memoise()
  public static staticArgedPublicDefault(a: number, b: number) {
    ++Base.nMemoed;
    return [a, b] as const;
  }

  @Memoise(abSSerialiser)
  public static staticArgedPublicDefaultS(a: number, b: number) {
    ++Base.nMemoed;
    return [a, b];
  }

  protected static runMemoedStatic() {
    ++Base.nUnmemoed;
    return this.memoedStatic();
  }

  protected static runPrivateStatic() {
    ++this.nUnmemoed;
    return this.#privateStatic();
  }

  @MemoiseAll()
  static #privateStatic() {
    ++this.nMemoed;
    return {};
  }

  @Memoise()
  static #staticArgedPrivateDefault(a: number, b: number) {
    ++Base.nMemoed;
    return [a, b] as const;
  }

  @Memoise(abSSerialiser)
  static #staticArgedPrivateDefaultS(a: number, b: number) {
    ++Base.nMemoed;
    return [a, b];
  }

  private static initCommon() {
    after(Base.reset);
  }

  @MemoiseAll()
  private static memoedStatic() {
    ++Base.nMemoed;
    return {};
  }

  public get publicCache(): Cache | undefined {
    return this.memoedInstance[MEMOISE_CACHE];
  }

  public argedInstancePrivateDefaultS(a: number, b: number) {
    return this.#argedInstancePrivateDefaultS(a, b);
  }

  @Memoise()
  public argedInstancePublicDefault(a: number, b: number): [number, number] {
    ++Base.nMemoed;
    return [a, b];
  }

  @Memoise(abSerialiser)
  public argedInstancePublicDefaultS(a: number, b: number): [number, number] {
    ++Base.nMemoed;
    return [a, b];
  }

  public runInstanceArgedPrivateDefaults(): void {
    Base.rets = [
      this.#argedInstancePrivateDefault(1, 2),
      this.#argedInstancePrivateDefault(1, 2),

      this.#argedInstancePrivateDefault(1, 1),
      this.#argedInstancePrivateDefault(1, 1),

      this.#argedInstancePrivateDefault(2, 1),
      this.#argedInstancePrivateDefault(2, 1)
    ];
  }

  public runInstanceArgedPrivateDefaultsS(): void {
    Base.rets = [
      this.#argedInstancePrivateDefaultS(1, 2),
      this.#argedInstancePrivateDefaultS(1, 2),

      this.#argedInstancePrivateDefaultS(1, 1),
      this.#argedInstancePrivateDefaultS(1, 1),

      this.#argedInstancePrivateDefaultS(2, 1),
      this.#argedInstancePrivateDefaultS(2, 1)
    ];
  }

  public runInstanceArgedPublicDefaults(): void {
    Base.rets = [
      this.argedInstancePublicDefault(1, 2),
      this.argedInstancePublicDefault(1, 2),

      this.argedInstancePublicDefault(1, 1),
      this.argedInstancePublicDefault(1, 1),

      this.argedInstancePublicDefault(2, 1),
      this.argedInstancePublicDefault(2, 1)
    ];
  }

  public runInstanceArgedPublicDefaultsS(): void {
    Base.rets = [
      this.argedInstancePublicDefaultS(1, 2),
      this.argedInstancePublicDefaultS(1, 2),

      this.argedInstancePublicDefaultS(1, 1),
      this.argedInstancePublicDefaultS(1, 1),

      this.argedInstancePublicDefaultS(2, 1),
      this.argedInstancePublicDefaultS(2, 1)
    ];
  }

  public runPrivateInstances(): void {
    Base.rets = [this.runPrivateInstance(), this.runPrivateInstance()];
  }

  public runPublicInstances(): void {
    Base.rets = [this.runMemoedInstance(), this.runMemoedInstance()];
  }

  protected runMemoedInstance() {
    ++Base.nUnmemoed;
    return this.memoedInstance();
  }

  protected runPrivateInstance() {
    ++Base.nUnmemoed;
    return this.#privateInstance();
  }

  @Memoise()
  #argedInstancePrivateDefault(a: number, b: number): [number, number] {
    ++Base.nMemoed;
    return [a, b];
  }

  @Memoise(abSerialiser)
  #argedInstancePrivateDefaultS(a: number, b: number): [number, number] {
    ++Base.nMemoed;
    return [a, b];
  }

  @MemoiseAll()
  #privateInstance() {
    ++Base.nMemoed;
    return {};
  }

  @MemoiseAll()
  private memoedInstance() {
    ++Base.nMemoed;
    return {};
  }
}

describe('Value return', () => {
  describe('Private static', () => {
    Base.initValue(() => Base.runPrivateStatics());
  });

  describe('Private instance', () => {
    Base.initValue(() => {
      new Base(); // warm up
      return new Base().runPrivateInstances();
    });
  });

  describe('Public/protected static', () => {
    Base.initValue(() => Base.runMemoedStatics());
  });

  describe('Public/protected instance', () => {
    let b: Base;
    Base.initValue(() => {
      new Base(); // warm up
      b = new Base();
      b.runPublicInstances();
    });
  });
});

describe('Default serialiser', () => {
  describe('Public static', () => {
    Base.initArgChecks(() => Base.runStaticArgedPublicDefaults());
  });
  describe('Private static', () => {
    Base.initArgChecks(() => Base.runStaticArgedPrivateDefaults());
  });
  describe('Public instance', () => {
    new Base(); // warm up
    Base.initArgChecks(() => new Base().runInstanceArgedPublicDefaults());
  });
  describe('Private instance', () => {
    new Base(); // warm up
    Base.initArgChecks(() => new Base().runInstanceArgedPrivateDefaults());
  });
});

describe('Custom serialiser', () => {
  describe('Public static', () => {
    Base.initArgChecks(() => Base.runStaticArgedPublicDefaultsS());
  });
  describe('Private static', () => {
    Base.initArgChecks(() => Base.runStaticArgedPrivateDefaultsS());
  });
  describe('Public instance', () => {
    new Base(); // warm up
    Base.initArgChecks(() => new Base().runInstanceArgedPublicDefaultsS());
  });
  describe('Private instance', () => {
    new Base(); // warm up
    Base.initArgChecks(() => new Base().runInstanceArgedPrivateDefaultsS());
  });

  it('Rich key', () => {
    class Rich {
      public arr: readonly string[] = [];

      public numCalls = 0;

      @Memoise(function (this: Rich) {
        return this.arr;
      })
      public len(): number {
        ++this.numCalls;

        return this.arr.length;
      }
    }

    let inst: Rich;

    for (let i = 1; i <= 2; ++i) {
      inst = new Rich();
      let expectedCalls = 0;

      expect(inst.len()).to.eq(0, 'len (0)');
      expect(++expectedCalls).to.eq(1, 'calls (0)');

      expect(inst.len()).to.eq(0, 'len (1)');
      expect(expectedCalls).to.eq(1, 'calls (1)');

      inst.arr = ['a'];
      expect(inst.len()).to.eq(1, 'len (2)');
      expect(++expectedCalls).to.eq(2, 'calls (2)');

      expect(inst.len()).to.eq(1, 'len (3)');
      expect(expectedCalls).to.eq(2, 'calls (3)');

      inst.arr = [...inst.arr, 'b'];
      expect(inst.len()).to.eq(2, 'len (4)');
      expect(++expectedCalls).to.eq(3, 'calls (4)');
    }
  });
});

describe('Concurrent', () => {
  function inst(
    label: string,
    makeValue: (i: Base) => [number, number] | readonly [number, number]
  ) {
    function check(v1: any, v2: any) {
      expect(v1).to.deep.eq([1, 1], 'value');
      expect(v1).to.deep.eq(v2, 'v1 == v2');
      expect(v1).to.not.eq(v2, 'v1 !== v2');
      expect(Base.nMemoed).to.eq(2, 'nMemoed');
    }

    describe(label, () => {
      afterEach(Base.reset);

      it('Should not share cache between two instances created before the 1st call', () => {
        const i1 = new Base();
        const i2 = new Base();

        const v1 = makeValue(i1);
        const v2 = makeValue(i2);
        check(v1, v2);
      });

      it('Should not share cache between two instances created after the 1st call', () => {
        const i1 = new Base();
        const v1 = makeValue(i1);

        const i2 = new Base();
        const v2 = makeValue(i2);
        check(v1, v2);
      });
    });
  }

  function stati(
    label: string,
    makeValue: () => [number, number] | readonly [number, number]
  ) {
    function check(v1: any, v2: any) {
      expect(v1).to.deep.eq([1, 1], 'value');
      expect(v1).to.eq(v2, 'v1 === v2');
      expect(Base.nMemoed).to.eq(1, 'nMemoed');
    }

    describe(label, () => {
      afterEach(Base.reset);

      it('Should share cache between two calls', () => {
        const v1 = makeValue();
        const v2 = makeValue();
        check(v1, v2);
      });
    });
  }

  inst('Public instance', i => i.argedInstancePublicDefault(1, 1));
  inst('Private instance', i => i.argedInstancePrivateDefaultS(1, 1));

  stati('Public static', () => Base.staticArgedPublicDefault(1, 1));
  stati('Private static', () => Base.staticArgedPrivateDefault(1, 1));
});

describe('Class extensions', () => {
  class Sup {
    public static callCount = 0;

    public static reset(): void {
      Sup.callCount = 0;
      Sup.sPub[MEMOISE_CACHE]!.clear();
    }

    @MemoiseAll()
    public static sPub() {
      return {};
    }

    @MemoiseAll()
    iPub() {
      return {};
    }
  }

  class SubDeco extends Sup {

    @MemoiseAll()
    public static override sPub() {
      return [super.sPub(), Sup.callCount++] as const;
    }

    @MemoiseAll()
    public override iPub() {
      return [super.iPub(), Sup.callCount++] as const;
    }
  }

  class SubUndeco extends Sup {

    public static override sPub() {
      return [super.sPub(), Sup.callCount++] as const;
    }

    public override iPub() {
      return [super.iPub(), Sup.callCount++] as const;
    }
  }

  afterEach(Sup.reset);

  describe('Instance', () => {
    it('Should only memoise super call if sub call is not decorated', () => {
      const inst = new SubUndeco();
      const r1 = inst.iPub();
      const r2 = inst.iPub();

      expect(r1).to.not.eq(r2, 'r1 !== r2');
      expect(r1[0]).to.eq(r2[0], 'r1[0] === r2[0]');
      expect([r1[1], r2[1]]).to.deep.eq([0, 1], 'calls');
    });

    it('Should memoise both calls if sub call is decorated', () => {
      const inst = new SubDeco();
      const r1 = inst.iPub();
      const r2 = inst.iPub();

      expect(r1).to.eq(r2, 'r1 === r2');
      expect(r1[0]).to.eq(r2[0], 'r1[0] === r2[0]');
      expect([r1[1], r2[1]]).to.deep.eq([0, 0], 'calls');
    });
  });

  describe('Static', () => {
    it('Should only memoise super call if sub call is not decorated', () => {
      const r1 = SubUndeco.sPub();
      const r2 = SubUndeco.sPub();

      expect(r1).to.not.eq(r2, 'r1 !== r2');
      expect(r1[0]).to.eq(r2[0], 'r1[0] === r2[0]');
      expect([r1[1], r2[1]]).to.deep.eq([0, 1], 'calls');
    });

    it('Should memoise both calls if sub call is decorated', () => {
      const r1 = SubDeco.sPub();
      const r2 = SubDeco.sPub();

      expect(r1).to.eq(r2, 'r1 === r2');
      expect(r1[0]).to.eq(r2[0], 'r1[0] === r2[0]');
      expect([r1[1], r2[1]]).to.deep.eq([0, 0], 'calls');
    });
  });
});

describe('Cache', () => {
  describe('Access', () => {
    class Source {
      public static get sPriv(): (this: typeof Source) => number {
        return Source.#sPriv;
      }

      public static reset(): void {
        Source.sPub[MEMOISE_CACHE]!.clear();
        Source.#sPriv[MEMOISE_CACHE]!.clear();
      }

      @MemoiseAll()
      public static sPub() {
        return 1;
      }

      @MemoiseAll()
      static #sPriv() {
        return 3;
      }

      public get iPriv(): (this: Source) => number {
        return this.#iPriv;
      }

      @MemoiseAll()
      public iPub() {
        return 2;
      }

      @MemoiseAll()
      #iPriv() {
        return 4;
      }
    }

    afterEach(Source.reset);

    it('Public instance', () => {
      const i1 = new Source();

      i1.iPub();
      expect(i1.iPub[MEMOISE_CACHE]!.has(Math.random())).to.eq(true, '1st instance');

      const i2 = new Source();
      expect(i2.iPub[MEMOISE_CACHE]!.has(Math.random())).to.eq(false, '2nd instance');
    });

    it('Private instance', () => {
      const i1 = new Source();

      i1.iPriv();
      expect(i1.iPriv[MEMOISE_CACHE]!.has(Math.random())).to.eq(true, '1st instance');

      const i2 = new Source();
      expect(i2.iPriv[MEMOISE_CACHE]!.has(Math.random())).to.eq(false, '2nd instance');
    });

    it('Public static', () => {
      expect(Source.sPub[MEMOISE_CACHE]!.has(Math.random())).to.eq(false, 'pre');
      Source.sPub();
      expect(Source.sPub[MEMOISE_CACHE]!.has(Math.random())).to.eq(true, 'post');
    });

    it('Private static', () => {
      expect(Source.sPriv[MEMOISE_CACHE]!.has(Math.random())).to.eq(false, 'pre');
      Source.sPriv();
      expect(Source.sPriv[MEMOISE_CACHE]!.has(Math.random())).to.eq(true, 'post');
    });
  });

  describe('Manipulation', () => {
    it('Argless', () => {
      class Src {
        @MemoiseAll()
        public static foo() {
          return {};
        }
      }

      const cache = Src.foo[MEMOISE_CACHE]!;
      expect(cache.has(Math.random())).to.eq(false, 'has/initial');

      const ret = Src.foo();
      expect(cache.has(Math.random())).to.eq(true, 'has/post-get');

      const ret2 = Src.foo();
      expect(ret).to.eq(ret2, '1st cached return');

      expect(cache.delete(Math.random())).to.eq(true, 'delete');
      expect(cache.has(Math.random())).to.eq(false, 'has/post-delete');

      const ret3 = Src.foo();
      expect(ret3).to.not.eq(ret, '2nd return');

      cache.clear();
      expect(cache.has(Math.random())).to.eq(false, 'has/post-clear');
    });

    it('Arg…ful', () => {
      class Src {
        @Memoise(n => n)
        public static foo(n: number) {
          return {n} as const;
        }
      }

      const cache = Src.foo[MEMOISE_CACHE]!;
      expect(cache.has(1)).to.eq(false, 'has/initial');

      const ret = Src.foo(1);
      expect(cache.has(1)).to.eq(true, 'has/post-get');
      expect(cache.has(10)).to.eq(false, 'has/diff key/post-get');

      const ret2 = Src.foo(1);
      expect(ret).to.eq(ret2, '1st cached return');

      expect(cache.delete(1)).to.eq(true, 'delete');
      expect(cache.has(1)).to.eq(false, 'has/post-delete');

      const ret3 = Src.foo(1);
      expect(ret3).to.not.eq(ret, '2nd return');

      cache.clear();
      expect(cache.has(1)).to.eq(false, 'has/post-clear');
    });
  });
});

describe('Memoised functions', () => {
  it('Argless', () => {
    const memoed = memoiseArglessFunction(() => ({}));

    const r1 = memoed();
    const r2 = memoed();
    memoed[MEMOISE_CACHE].clear();
    const r3 = memoed();

    expect(r1).to.deep.eq({}, 'r1 === {}');
    expect(r1).to.eq(r2, 'r1 === r2');
    expect(r1).to.not.eq(r3, 'r1 !== r3');
  });

  it('Argy', () => {
    const memoed = memoiseFunction((x: number) => ({x}));

    const r1 = memoed(1);
    const r2 = memoed(1);
    const r3 = memoed(2);
    memoed[MEMOISE_CACHE].clear();
    const r4 = memoed(1);

    expect(r1).to.deep.eq({x: 1}, 'r1 === {}');
    expect(r1).to.eq(r2, 'r1 === r2');
    expect(r1).to.not.deep.eq(r3, 'r1 !== r3');
    expect(r1).to.not.eq(r4, 'r1 !== r4');
  });
});

describe('identity', () => {
  class Src {
    @MemoiseIdentity()
    static foo(x: number) {
      return {x};
    }
  }

  const c1 = Src.foo(1);
  const c2 = Src.foo(1);
  const c3 = Src.foo(0);
  const c4 = Src.foo(0);

  expect(c1).to.deep.eq({x: 1});
  expect(c3).to.deep.eq({x: 0});
  expect(c1).to.eq(c2, 'c1 === c2');
  expect(c3).to.eq(c4, 'c3 === c4');
});

describe('has/delete by args', () => {
  interface Spec<T, A extends any[]> {
    args: () => A,

    label: string;

    call(inst: T, args: A): any;

    getCache(inst: T): Cache<T, A> | undefined;

    has(cache: Cache<T, A>, args: A): boolean;

    init(): T;

    rm(cache: Cache<T, A>, args: A): boolean;
  }

  class Src {
    @MemoiseAll()
    public static s0() {
      return {};
    }

    @Memoise()
    public static s2(a: number, b: number) {
      return {a, b};
    }

    @MemoiseAll()
    public i0() {
      return {};
    }

    @Memoise()
    public i2(a: string, b: string) {
      return {a, b};
    }
  }

  const fnArgless = memoiseArglessFunction(function fnArgless() {
    return {};
  });

  const fnArged = memoiseFunction(function fnArged(a: number, b: number) {
    return [a, b] as const;
  });

  const specs = [
    {
      args: () => [],
      call: inst => inst(),
      getCache: inst => inst[MEMOISE_CACHE_TYPED](),
      has: cache => cache.hasWithArgs(),
      init: () => fnArgless,
      label: 'Argless fn',
      rm: cache => cache.deleteWithArgs()
    } satisfies Spec<typeof fnArgless, []>,

    {
      args: () => [0, 1],
      call: (inst, args) => inst(...args),
      getCache: inst => inst[MEMOISE_CACHE_TYPED](),
      has: (cache, args) => cache.hasWithArgs(...args),
      init: () => fnArged,
      label: 'Arged fn',
      rm: (cache, args) => cache.deleteWithArgs(...args)
    } satisfies Spec<typeof fnArged, [number, number]>,

    // /////////////////////////
    {
      args: () => [],
      call: inst => inst.s0(),
      getCache: inst => inst.s0[MEMOISE_CACHE_TYPED](),
      has: cache => cache.hasWithArgs(),
      init: () => Src,
      label: 'Argless static decorated',
      rm: cache => cache.deleteWithArgs()
    } satisfies Spec<typeof Src, []>,

    {
      args: () => [0, 1],
      call: (inst, args) => inst.s2(...args),
      getCache: inst => inst.s2[MEMOISE_CACHE_TYPED](),
      has: (cache, args) => cache.hasWithArgs(...args),
      init: () => Src,
      label: 'Arged static decorated',
      rm: (cache, args) => cache.deleteWithArgs(...args)
    } satisfies Spec<typeof Src, [number, number]>,

    {
      args: () => [],
      call: inst => inst.i0(),
      getCache: inst => inst.i0[MEMOISE_CACHE_TYPED](),
      has: cache => cache.hasWithArgs(),
      init: () => new Src(),
      label: 'Argless instance decorated',
      rm: cache => cache.deleteWithArgs()
    } satisfies Spec<Src, []>,

    {
      args: () => ['a', 'b'],
      call: (inst, args) => inst.i2(...args),
      getCache: inst => inst.i2[MEMOISE_CACHE_TYPED](),
      has: (cache, args) => cache.hasWithArgs(...args),
      init: () => new Src(),
      label: 'Arged instance decorated',
      rm: (cache, args) => cache.deleteWithArgs(...args)
    } satisfies Spec<Src, [string, string]>
  ];

  for (const spec of specs as Array<Spec<any, any[]>>) {
    it(spec.label, () => {
      const state = spec.init();
      const cache = spec.getCache(state)!;

      expect(cache.hasWithArgs(...spec.args())).to.eq(false, 'has [1]');
      expect(cache.deleteWithArgs(...spec.args())).to.eq(false, 'delete [1]');

      spec.call(state, spec.args());
      expect(cache.hasWithArgs(...spec.args())).to.eq(true, 'has [2]');
      expect(cache.deleteWithArgs(...spec.args())).to.eq(true, 'delete [2]');

      expect(cache.hasWithArgs(...spec.args())).to.eq(false, 'has [3]');
      expect(cache.deleteWithArgs(...spec.args())).to.eq(false, 'delete [3]');
    });
  }
});
