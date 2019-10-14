const {expect} = require('chai');
const _ = require('lodash');
const {Memoise} = require('../dist');

describe(_.startCase(TEST_TYPE), () => {
  describe('Instance serialiser', () => {
    let inst;

    before('Instantiate', () => {
      class Class {
        gets = 0;
        gets2 = 0;

        @Memoise()
        meth(v) {
          this.gets++;

          return v;
        }

        @Memoise()
        meth2(v) {
          this.gets2++;

          return v * 2;
        }
      }

      inst = new Class();
    });

    it('1st fetch', () => {
      expect(inst.meth(5)).to.eq(5, 'Response != 5');
      expect(inst.gets).to.eq(1, 'Gets != 1');
    });

    it('2nd fetch', () => {
      expect(inst.meth(1)).to.eq(1, 'Response != 1');
      expect(inst.gets).to.eq(2, 'Gets != 2');
    });

    it('3rd fetch', () => {
      expect(inst.meth(5)).to.eq(5, 'Response != 5');
      expect(inst.gets).to.eq(2, 'Gets != 2');
    });

    it('gets2 should still be 0', () => {
      expect(inst.gets2).to.eq(0);
    });

    it('4th fetch', () => {
      expect(inst.meth2(5)).to.eq(10, 'Return value');
      expect(inst.gets).to.eq(2, 'Gets');
      expect(inst.gets2).to.eq(1, 'Gets2');
    });
  });

  describe('Static serialiser', () => {
    class Class {
      static gets = 0;

      @Memoise()
      static meth(v) {
        this.gets++;

        return v;
      }
    }

    it('1st fetch', () => {
      expect(Class.meth(5)).to.eq(5, 'Response != 5');
      expect(Class.gets).to.eq(1, 'Gets != 1');
    });

    it('2nd fetch', () => {
      expect(Class.meth(6)).to.eq(6, 'Response != 6');
      expect(Class.gets).to.eq(2, 'Gets != 2');
    });

    it('3rd fetch', () => {
      expect(Class.meth(5)).to.eq(5, 'Response != 5');
      expect(Class.gets).to.eq(2, 'Gets != 2');
    });
  });

  describe('Binding', () => {
    class Class {
      static gets = 0;
      static foo = 'bar';
      gets = 0;
      foo = 'qux';

      @Memoise()
      static meth(v) {
        this.gets++;

        return `${this.foo}:${v}`;
      }

      @Memoise()
      meth(v) {
        this.gets++;

        return `${this.foo}:${v}`;
      }
    }

    const inst = new Class();

    it('Should correctly bind to static', () => {
      expect(Class.meth(10)).to.eq('bar:10');
    });

    it('Should correctly bind to instance', () => {
      expect(inst.meth(11)).to.eq('qux:11');
    });
  });

  describe('Custom serialiser', () => {
    describe('Bound', () => {
      let inst;

      before('Instantiate', () => {
        if (TEST_TYPE === 'typescript') {
          class Class {
            constructor() {
              this.num = 2;
            }

            @Memoise(Class.prototype.instanceSerialiser)
            meth(a, b) {
              return `${a}:${b}`;
            }

            instanceSerialiser(a, b) {
              this.lastKey = `${a}:${this.num * b}`;

              return this.lastKey;
            }
          }

          inst = new Class();
        } else {
          class Class {
            constructor() {
              this.num = 2;
            }

            @Memoise(function () {
              return Class.prototype.instanceSerialiser.apply(this, arguments);
            })
            meth(a, b) {
              return `${a}:${b}`;
            }

            instanceSerialiser(a, b) {
              this.lastKey = `${a}:${this.num * b}`;

              return this.lastKey;
            }
          }

          inst = new Class();
        }
      });

      it('lastKey should be undefined first', () => {
        expect(inst.lastKey).to.be.undefined;
      });

      it('lastKey should be foo:4', () => {
        inst.meth('foo', 2);
        expect(inst.lastKey).to.eq('foo:4');
      });

      it('lastKey should be bar:10', () => {
        inst.meth('bar', 5);
        expect(inst.lastKey).to.eq('bar:10');
      });

      it('lastKey should be bar:15', () => {
        inst.num = 3;
        inst.meth('bar', 5);
        expect(inst.lastKey).to.eq('bar:15');
      });
    });

    describe('Unbound', () => {
      class Class {
        constructor() {
          this.num = 2;
        }

        @Memoise(o => o.bar)
        static meth(obj) {
          return obj.bar;
        }
      }

      it('1st call should return 1', () => {
        expect(Class.meth({foo: 1, bar: 1}));
      });

      it('2nd call should return 1', () => {
        expect(Class.meth({foo: 1, bar: 2}));
      });

      it('3rd call should return 3', () => {
        expect(Class.meth({foo: 2, bar: 3}));
      });
    });
  });

  describe('Cross-instance', () => {
    class MyClass {
      static gets = 0;

      @Memoise()
      meth(v) {
        MyClass.gets++;

        return this;
      }
    }

    it('The memo cache should not persist cross-instance', () => {
      new MyClass().meth(1).meth(1);
      new MyClass().meth(1).meth(1);

      expect(MyClass.gets).to.eq(2);
    });
  });

  describe('Memoise.all', () => {
    class Clazz {
      static gets = 0;

      @Memoise.all()
      meth(a) {
        Clazz.gets++;

        return a;
      }
    }

    const inst = new Clazz();

    it('First call should increment gets, return foo', () => {
      expect(inst.meth('foo')).to.eq('foo', 'return');
      expect(Clazz.gets).to.eq(1, 'gets');
    });

    it('Second call should not increment gets, should return foo', () => {
      expect(inst.meth('bar')).to.eq('foo', 'return');
      expect(Clazz.gets).to.eq(1, 'gets');
    });
  });

  describe('Errors', () => {
    it('Should throw on non-method decoration', () => {
      expect(() => {
        class C {
          @Memoise()
          prop;
        }
      }).to.throw(/^(@Memoise can only decorate methods|Unable to resolve property descriptor for @Memoise)$/);
    });
  });

  it('Should not be called twice if no arguments are provided', () => {
    class Clazz {
      static gets = 0;

      @Memoise()
      meth() {
        Clazz.gets++;

        return 1;
      }
    }

    const inst = new Clazz();
    inst.meth();
    inst.meth();
    expect(Clazz.gets).to.eq(1);
  })
});
