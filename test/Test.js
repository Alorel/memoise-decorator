const {expect} = require('chai');
const _ = require('lodash');
const {Memoise, MEMOISE_CACHE} = require('../dist');

describe(_.startCase(TEST_TYPE), () => {
  describe('Should fail on...', () => {
    const cases = [
      ['class decoration', () => {
        @Memoise()
        class Clazz {
        }
      }],
      ['getter decoration', () => {
        class Clazz {
          @Memoise()
          get foo() {
          }
        }
      }],
      ['setter decoration', () => {
        class Clazz {
          @Memoise()
          set foo(_v) {
          }
        }
      }],
      ['static getter decoration', () => {
        class Clazz {
          @Memoise()
          static get foo() {
          }
        }
      }],
      ['static setter decoration', () => {
        class Clazz {
          @Memoise()
          static set foo(_v) {
          }
        }
      }],
      ['property decoration', () => {
        class Clazz {
          @Memoise()
          foo
        }
      }],
      ['static property decoration', () => {
        class Clazz {
          @Memoise()
          static foo
        }
      }],
    ];

    for (const [label, fn] of cases) {
      it(label, () => {
        expect(fn).to.throw('@Memoise can only decorate methods');
      });
    }
  });

  it('Should serialise instance method', () => {
    class Clazz {
      constructor() {
        this.value = 0;
      }

      @Memoise()
      incrementWithKeys(_a, _b) {
        return this.value++;
      }
    }

    for (let i = 1; i < 3; i++) {
      const label = `Instance ${i}: `;
      const inst1 = new Clazz();
      expect(inst1.incrementWithKeys('foo', 'bar')).to.eq(0, `${label}: 1st bar`);
      expect(inst1.incrementWithKeys('foo', 'qux')).to.eq(1, `${label}: 1st qux`);
      expect(inst1.incrementWithKeys('foo', 'qux')).to.eq(1, `${label}: 2nd qux`);
      expect(inst1.value).to.eq(2, `${label}: value`);
    }
  });

  it('Should serialise static method', () => {
    class Clazz {
      static value = 0;

      @Memoise()
      static incrementWithKeys(_a, _b) {
        return this.value++;
      }
    }

    expect(Clazz.incrementWithKeys('foo', 'bar')).to.eq(0, '1st bar');
    expect(Clazz.incrementWithKeys('foo', 'qux')).to.eq(1, '1st qux');
    expect(Clazz.incrementWithKeys('foo', 'qux')).to.eq(1, '2nd qux');
    expect(Clazz.value).to.eq(2, 'value');
  });

  describe('Cache map', () => {
    describe('on static', () => {
      let clazz;

      beforeEach(() => {
        class Clazz {
          @Memoise()
          static s() {
          }
        }

        clazz = Clazz;
      });

      it('Should not have a cache map initially', () => {
        expect(clazz.s[MEMOISE_CACHE]).to.eq(undefined);
      });

      it('Should create cache map after first call', () => {
        clazz.s();
        expect(clazz.s[MEMOISE_CACHE]).to.deep.eq(new Map([
          ['[]', undefined]
        ]));
      });
    });

    describe('on instance', () => {
      let inst;

      beforeEach(() => {
        class Clazz {
          @Memoise()
          x() {
          }
        }

        inst = new Clazz();
      });

      it('Should not have a cache map initially', () => {
        expect(inst.x[MEMOISE_CACHE]).to.eq(undefined);
      });

      it('Should create cache map after first call', () => {
        inst.x();
        expect(inst.x[MEMOISE_CACHE]).to.deep.eq(new Map([
          ['[]', undefined]
        ]));
      });
    });

    it('Should allow clearing', () => {
      class C {
        static callCount = 0;

        @Memoise()
        static foo() {
          this.callCount++;
        }
      }

      C.foo();
      C.foo();
      C.foo[MEMOISE_CACHE].clear();
      C.foo();
      expect(C.callCount).to.eq(2);
    })
  });

  it('Memoise.all should memoise every subsequent call', () => {
    class C {
      static counter = 0;

      @Memoise.all()
      static foo() {
        return ++this.counter;
      }
    }

    C.foo('a');
    C.foo('b');
    expect(C.foo[MEMOISE_CACHE]).to.deep.eq(new Map([[null, 1]]), 'first check');
  });

  it('Should accept a custom serialiser', () => {
    class C {
      constructor() {
        this.start = 'ci';
        this.fooCalls = 0;
      }

      @Memoise(function (a, b) {
        return `${this.start}:${a}:${b}`;
      })
      foo(a, b) {
        this.fooCalls++;
        return `${this.start}:${a + b}`;
      }
    }

    const inst = new C();
    const expectation = 'ci:2';
    expect(inst.foo(1, 1)).to.eq(expectation, '1st insert');
    expect(inst.foo(1, 1)).to.eq(expectation, '2nd insert');
    expect(inst.fooCalls).to.eq(1, 'foo calls');
    expect(inst.foo[MEMOISE_CACHE]).to.deep.eq(new Map([['ci:1:1', expectation]]));
  });
});
