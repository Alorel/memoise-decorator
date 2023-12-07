import type {Cache} from './cache';
import type {Decorator, SerialiserFn} from './core';
import {applyDecorator, defaultSerialiser, MEMOISE_CACHE, memoiseArglessFunction, memoiseFunction} from './core';

/**
 * Memoise the method's return value based on call arguments
 * @param serialiser Serialiser to use for generating the cache key. Defaults to {@link defaultSerialiser}.
 */
function Memoise<T, A extends [any, ...any[]], R>(serialiser?: SerialiserFn<T, A>): Decorator<T, A, R> {
  return applyDecorator(true, serialiser ?? defaultSerialiser);
}

/** Memoise the method's return value disregarding call arguments */
function MemoiseAll<T, R>(): Decorator<T, [], R> {
  return applyDecorator(false);
}

export {Memoise, MemoiseAll, MEMOISE_CACHE, defaultSerialiser, memoiseArglessFunction, memoiseFunction};
export type {SerialiserFn, Cache};

declare global {
  interface Function {

    /** Always defined on decorated methods and explicitly memoised functions */
    [MEMOISE_CACHE]?: Cache;
  }
}
