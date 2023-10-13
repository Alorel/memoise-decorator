/** @internal */
function namedFn<F extends Function>(name: string, fn: F): F {
  Object.defineProperty(fn, 'name', {
    configurable: true,
    enumerable: true,
    value: name,
    writable: true
  });

  return fn;
}

/** @internal */
function applyRename<F extends Function>(origFn: F, label: string, newFn: F): F {
  return namedFn(`${label}(${origFn.name})`, newFn);
}

/**
 * Direct access to a memoised method's cache. Only appears after the method's been called at least once.
 */
export const MEMOISE_CACHE: unique symbol = Symbol('Memoise cache');

/**
 * A serialisation function for computing cache keys. The returned key can be anything that's
 * uniquely identifiable inside {@link Map}s. Called with the class instance (or the class itself for static methods)
 * as the thisArg and forwards the method call arguments.
 */
export type SerialiserFn<T, A extends any[]> = (this: T, ...args: A) => any;

type Fn<T, A extends any[], R> = (this: T, ...args: A) => R;
export type Decorator<T, A extends any[], R> = (
  target: any,
  ctx: ClassMethodDecoratorContext<T, Fn<T, A, R>>
) => undefined | Fn<T, A, R>;

export interface Cache {
  clear(): void;

  delete(key: any): boolean;

  has(key: any): boolean;
}

/** The default serialiser */
export function defaultSerialiser(...args: any[]): string {
  return JSON.stringify(args);
}

export function memoiseFunction<T, A extends [any, ...any[]], R>(
  fn: Fn<T, A, R>,
  serialiser: SerialiserFn<T, A> = defaultSerialiser
): Fn<T, A, R> {
  const cache = new Map<any, R>();

  const memoisedFunction = applyRename(fn, 'Memoised', function (this: T, ...args: A): R {
    const cacheKey = serialiser.apply(this, args);
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    const returnValue = fn.apply(this, args);
    cache.set(cacheKey, returnValue);

    return returnValue;
  });

  Object.defineProperty(memoisedFunction, MEMOISE_CACHE, {value: cache});

  return memoisedFunction;
}

export function memoiseArglessFunction<T, R>(fn: Fn<T, [], R>): Fn<T, [], R> {
  let firstCall = true;
  let returnValue: R;

  const memoisedFunction = applyRename(fn, 'MemoisedArgless', function (this: T): R {
    if (firstCall) {
      returnValue = fn.call(this);
      firstCall = false;
    }

    return returnValue;
  });

  function clear(): void {
    firstCall = true;
  }

  Object.defineProperty(memoisedFunction, MEMOISE_CACHE, {
    value: {
      clear,
      delete() {
        const wasFirstCall = firstCall;
        clear();

        return wasFirstCall !== firstCall;
      },
      has: () => !firstCall
    } satisfies Cache
  });

  return memoisedFunction as Fn<T, [], R>;
}

const MARKER: unique symbol = Symbol('Memoised');

/** @internal */
function applyDecorator<T, A extends any[], R>(
  decoratorFactory: (fn: Fn<T, A, R>, serialiser: SerialiserFn<T, A>) => Fn<T, A, R>,
  serialiser?: SerialiserFn<T, A>
): Decorator<T, A, R>;

/** @internal */
function applyDecorator<T, R>(decoratorFactory: (fn: Fn<T, [], R>) => Fn<T, [], R>): Decorator<T, [], R>;

/** @internal */
function applyDecorator<T, A extends any[], R>(
  decoratorFactory: (fn: Fn<T, A, R>, ...args: any[]) => Fn<T, A, R>,
  serialiser?: SerialiserFn<T, A>
): Decorator<T, A, R> {
  return function decorate(origFn, {name, static: isStatic, private: isPrivate, addInitializer}) {
    if (isStatic) {
      return decoratorFactory(origFn, serialiser);
    } else if (isPrivate) {
      throw new Error('Can\'t memoise private instance methods');
    }

    Object.defineProperty(origFn, MARKER, {configurable: true, value: true});

    addInitializer(namedFn(`MemoiseInit(${String(name)})`, function () {
      if (this[name as keyof T] !== origFn && !(this[name as keyof T] as any)?.[MARKER]) {
        throw new Error(`The \`${String(name)}\` method is decorated with @Memoise or @MemoiseAll in the superclass; decorated instance methods cannot use inheritance unless the subclass method is decorated with @Memoise or @MemoiseAll as well.`);
      }

      const value = decoratorFactory(origFn, serialiser);
      Object.defineProperty(value, MARKER, {configurable: true, value: true});

      Object.defineProperty(this, name, {
        configurable: true,
        enumerable: true,
        value,
        writable: true
      });
    }));
  };
}

/** @internal */
export {applyDecorator};
