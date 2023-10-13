import type {Cache, Decorator, SerialiserFn} from './core';
import {applyDecorator, defaultSerialiser, MEMOISE_CACHE, memoiseArglessFunction, memoiseFunction} from './core';

function Memoise<T, A extends [any, ...any[]], R>(serialiser?: SerialiserFn<T, A>): Decorator<T, A, R> {
  return applyDecorator<T, A, R>(memoiseFunction, serialiser);
}

function MemoiseAll<T, R>(): Decorator<T, [], R> {
  return applyDecorator<T, R>(memoiseArglessFunction);
}

export {Memoise, MemoiseAll, MEMOISE_CACHE, defaultSerialiser, memoiseArglessFunction, memoiseFunction};
export type {SerialiserFn};

declare global {
  interface Function {
    [MEMOISE_CACHE]?: Cache;
  }
}
