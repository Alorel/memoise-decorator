import type {Cache} from './cache';
import {ArgedCtx, ArglessCtx} from './cache';

/**
 * @deprecated Use the typed version
 * @see MEMOISE_CACHE_TYPED
 */
export const MEMOISE_CACHE: unique symbol = Symbol('Memoise cache');

/**
 * Cache associated with this function/method if it's been processed with one of:
 *
 * - {@link Memoise}
 * - {@link MemoiseAll}
 * - {@link memoiseFunction}
 * - {@link memoiseArglessFunction}
 */
export const MEMOISE_CACHE_TYPED: unique symbol = Symbol('Memoise cache typed');

export type MemoiseCacheGetFn = <T, A extends any[], R>(this: Fn<T, A, R>) => Cache<T, A> | undefined;

/**
 * A serialisation function for computing cache keys. The returned key can be anything that's
 * uniquely identifiable inside {@link Map}s. Called with the class instance (or the class itself for static methods)
 * as the thisArg and forwards the method call arguments.
 */
export type SerialiserFn<T, A extends any[], K = any> = (this: T, ...args: A) => K;

type Fn<T, A extends any[], R> = (this: T, ...args: A) => R;
export type Decorator<T, A extends any[], R> = (
  target: Fn<T, A, R>,
  ctx: ClassMethodDecoratorContext<T, Fn<T, A, R>>
) => undefined | Fn<T, A, R>;

/** The default cache key {@link SerialiserFn serialiser}. */
export function defaultSerialiser(...args: any[]): string {
  return JSON.stringify(args);
}

/** @internal */
export function identitySerialiser<T>(value: T): T {
  return value;
}

interface Memoised<T, A extends any[], R> extends Fn<T, A, R> {
  [MEMOISE_CACHE]: Cache<T, A>;

  [MEMOISE_CACHE_TYPED](): Cache<T, A>;
}

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
function applyRename<F extends Function>(origFnName: PropertyKey, label: string, newFn: F): F {
  return namedFn(`${label}(${String(origFnName)})`, newFn);
}

function setCacheGetterFn(fn: Function, cache: () => Cache | undefined): void {
  Object.defineProperty(fn, MEMOISE_CACHE_TYPED, {
    configurable: true,
    value: cache
  });
}

function setCache(fn: Function, cache: Cache): void {
  Object.defineProperty(fn, MEMOISE_CACHE, {
    configurable: true,
    value: cache
  });
}

function memoiseFunction<T, A extends any[], R>(fn: Fn<T, A, R>): Memoised<T, A, R>;
function memoiseFunction<T, A extends any[], R, K>(
  fn: Fn<T, A, R>,
  serialiser: SerialiserFn<T, A, K>
): Memoised<T, A, R>;

/**
 * Memoise the function's return value based on call arguments
 * @param fn The function to memoise
 * @param serialiser Serialiser to use for generating the cache key. Defaults to {@link defaultSerialiser}.
 */
function memoiseFunction<T, A extends any[], R, K>(
  fn: Fn<T, A, R>,
  serialiser: SerialiserFn<T, A, K> = defaultSerialiser as SerialiserFn<T, A>
): Memoised<T, A, R> {
  const ctx = new ArgedCtx(fn as T, fn, serialiser);

  const memoisedFunction: Fn<T, A, R> = applyRename(fn.name, 'Memoised', function (this: T): R {
    return ctx.autoGet(arguments);
  });

  setCache(memoisedFunction, ctx);

  return memoisedFunction as Memoised<T, A, R>;
}

export {memoiseFunction};

/**
 * Memoise the function's return value disregarding call arguments,
 * effectively turning it into a lazily-evaluated value
 * @param fn The function to memoise
 */
export function memoiseArglessFunction<T, R>(fn: Fn<T, [], R>): Memoised<T, [], R> {
  const ctx = new ArglessCtx(fn as T, fn);

  const memoisedFunction: Fn<T, [], R> = applyRename(fn.name, 'MemoisedArgless', function (this: T): R {
    return ctx.autoGet();
  });

  setCache(memoisedFunction, ctx);

  return memoisedFunction as Fn<T, [], R> as Memoised<T, [], R>;
}

/** @internal */
export function applyDecorator<T, R>(hasArgs: false): Decorator<T, [], R>;

/** @internal */
export function applyDecorator<T, A extends any[], R, K = any>(
  hasArgs: true,
  serialiser: SerialiserFn<T, A, K>
): Decorator<T, A, R>;

/** @internal */
export function applyDecorator<T, A extends any[], R, K = any>(
  hasArgs: boolean,
  serialiser?: SerialiserFn<T, A, K>
): Decorator<T, A, R> {
  return function decorateWithMemoise(origFn, {
    addInitializer,
    name,
    static: isStatic,
    access: {get}
  }) {
    type CtxArged = ArgedCtx<T, A, R, K>;
    type CtxArgless = ArglessCtx<T, R>;
    type Ctx = CtxArged | CtxArgless;

    const sName = String(name);
    const ctxFactory: (ctx: T) => Ctx = hasArgs
      ? (ctx => new ArgedCtx<T, A, R, K>(ctx, origFn, serialiser!))
      : (ctx => new ArglessCtx<T, R>(ctx, origFn));

    if (isStatic) { // private/public static
      let ctx: Ctx;
      const outFn = applyRename(name, 'Memoised', function (): R {
        return ctx.autoGet(arguments);
      });
      addInitializer(applyRename(name, 'MemoiseInit', function (this: T) {
        ctx = ctxFactory(this);
      }));

      const getCache = (): Cache<K, A> => ctx;
      Object.defineProperty(outFn, MEMOISE_CACHE, {
        configurable: true,
        get: getCache
      });
      setCacheGetterFn(outFn, getCache);

      return outFn;
    }

    // Private/public instance
    const marker: unique symbol = Symbol(`Memoised value (${sName})`);
    type Contextual = T & {[marker]: Ctx};

    addInitializer(applyRename(name, 'MemoiseInit', function (this: T) {
      const ctx = ctxFactory(this);
      Object.defineProperty(this, marker, {value: ctx});

      const instanceFn = get(this);
      setCache(instanceFn, ctx);
      setCacheGetterFn(instanceFn, () => ctx);
    }));

    return applyRename(name, 'Memoised', function (this: T): R {
      return (this as Contextual)[marker].autoGet(arguments);
    });
  };
}

setCacheGetterFn(Function.prototype, function (this: Fn<any, any[], any>) {
  return this?.[MEMOISE_CACHE];
});
