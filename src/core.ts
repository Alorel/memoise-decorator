import {ArgedCtx, ArglessCtx} from './cache';
import type {Cache} from './cache';

/**
 * Cache associated with this function/method if it's been processed with one of:
 *
 * - {@link Memoise}
 * - {@link MemoiseAll}
 * - {@link memoiseFunction}
 * - {@link memoiseArglessFunction}
 */
export const MEMOISE_CACHE: unique symbol = Symbol('Memoise cache');

/**
 * A serialisation function for computing cache keys. The returned key can be anything that's
 * uniquely identifiable inside {@link Map}s. Called with the class instance (or the class itself for static methods)
 * as the thisArg and forwards the method call arguments.
 */
export type SerialiserFn<T, A extends any[], K = any> = (this: T, ...args: A) => K;

type Fn<T, A extends any[], R> = (this: T, ...args: A) => R;
export type Decorator<T, A extends any[], R> = (
  target: any,
  ctx: ClassMethodDecoratorContext<T, Fn<T, A, R>>
) => undefined | Fn<T, A, R>;

/** The default cache key {@link SerialiserFn serialiser}. */
export function defaultSerialiser(...args: any[]): string {
  return JSON.stringify(args);
}

interface Memoised<T, A extends any[], R> extends Fn<T, A, R> {
  [MEMOISE_CACHE]: Cache;
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
function applyRename<F extends Function>(origFn: F, label: string, newFn: F): F {
  return namedFn(`${label}(${origFn.name})`, newFn);
}

function setCache(fn: Function, cache: Cache): void {
  Object.defineProperty(fn, MEMOISE_CACHE, {
    configurable: true,
    value: cache
  });
}

/**
 * Memoise the function's return value based on call arguments
 * @param fn The function to memoise
 * @param serialiser Serialiser to use for generating the cache key. Defaults to {@link defaultSerialiser}.
 */
export function memoiseFunction<T, A extends [any, ...any[]], R>(
  fn: Fn<T, A, R>,
  serialiser: SerialiserFn<T, A> = defaultSerialiser
): Memoised<T, A, R> {
  const ctx = new ArgedCtx(fn, serialiser);

  const memoisedFunction: Fn<T, A, R> = applyRename(fn, 'Memoised', function (this: T): R {
    return ctx.autoGet(this, arguments);
  });

  setCache(memoisedFunction, ctx);

  return memoisedFunction as Memoised<T, A, R>;
}

/**
 * Memoise the function's return value disregarding call arguments,
 * effectively turning it into a lazily-evaluated value
 * @param fn The function to memoise
 */
export function memoiseArglessFunction<T, R>(fn: Fn<T, [], R>): Memoised<T, [], R> {
  const ctx = new ArglessCtx(fn);

  const memoisedFunction: Fn<T, [], R> = applyRename(fn, 'MemoisedArgless', function (this: T): R {
    return ctx.autoGet(this);
  });

  setCache(memoisedFunction, ctx);

  return memoisedFunction as Fn<T, [], R> as Memoised<T, [], R>;
}

/** @internal */
export function applyDecorator<T, R>(hasArgs: false): Decorator<T, [], R>;

/** @internal */
export function applyDecorator<T, A extends [any, ...any[]], R, K = any>(
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
    const ctxFactory: () => Ctx = hasArgs
      ? (() => new ArgedCtx<T, A, R, K>(origFn, serialiser!))
      : (() => new ArglessCtx<T, R>(origFn));

    if (isStatic) { // private/public static
      const ctx = ctxFactory();

      const outFn = applyRename(origFn, 'Memoised', function (this: T): R {
        return ctx.autoGet(this, arguments);
      });
      setCache(outFn, ctx);

      return outFn;
    }
    const marker: unique symbol = Symbol(`Memoised value (${sName})`);
      type Contextual = T & { [marker]: Ctx };

      addInitializer(applyRename(origFn, `MemoiseInit(${sName})`, function (this: T) {
        const ctx = ctxFactory();
        Object.defineProperty(this, marker, {value: ctx});
        setCache(get(this), ctx);
      }));

      return applyRename(origFn, 'Memoised', function (this: T): R {
        return (this as Contextual)[marker].autoGet(this, arguments);
      });

  };
}
