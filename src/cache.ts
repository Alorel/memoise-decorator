import type {SerialiserFn} from './core';

type Fn<T, A extends any[], R> = (this: T, ...args: A) => R;

/** @see {MEMOISE_CACHE_TYPED} */
export interface Cache<K = any, A extends any[] = any[]> {

  /** Clear the cache */
  clear(): void;

  /**
   * Delete a specific cache entry.
   * @param key The result of passing the method call args through the associated {@link SerialiserFn serialiser fn}
   * @deprecated Use {@link Cache#deleteWithArgs deleteWithArgs()}
   */
  delete(key: K): boolean;

  /** Like {@link Cache#delete delete()}, but the key gets auto-computed */
  deleteWithArgs(...args: A): boolean;

  /**
   * Check if a specific cache entry exists.
   * @param key See {@link Cache#delete delete()}
   * @deprecated Use {@link Cache#hasWithArgs hasWithArgs()}
   */
  has(key: K): boolean;

  /** Like {@link Cache#has has()}, but the key gets auto-computed */
  hasWithArgs(...args: A): boolean;
}

/** @internal */
export class ArglessCtx<T, R> implements Cache<any, []> {
  private readonly _ctx: T;

  private _firstCall = true;

  private readonly _orig: Fn<T, [], R>;

  private _value?: R;

  public constructor(ctx: T, origFn: Fn<T, [], R>) {
    this._orig = origFn;
    this._ctx = ctx;
  }

  public autoGet(): R {
    if (this._firstCall) {
      this._value = this._orig.call(this._ctx);
      this._firstCall = false;
    }

    return this._value!;
  }

  public clear(): void {
    this._firstCall = true;
  }

  public delete(): boolean {
    const ret = this.has();
    this.clear();

    return ret;
  }

  public deleteWithArgs(): boolean {
    return this.delete();
  }

  public has(): boolean {
    return !this._firstCall;
  }

  public hasWithArgs(): boolean {
    return this.has();
  }
}

/** @internal */
export class ArgedCtx<T, A extends any[], R, K> extends Map<K, R> implements Cache<K, A> {
  private readonly _ctx: T;

  private readonly _orig: Fn<T, A, R>;

  private readonly _serialiser: SerialiserFn<T, A, K>;

  public constructor(ctx: T, origFn: Fn<T, A, R>, serialiser: SerialiserFn<T, A, K>) {
    super();
    this._ctx = ctx;
    this._orig = origFn;
    this._serialiser = serialiser;
  }

  public autoGet(args: A | IArguments): R {
    const key = this.keyFor(args);
    if (this.has(key)) {
      return this.get(key)!;
    }

    const value = this._orig.apply(this._ctx, args as A);
    this.set(key, value);

    return value;
  }

  public deleteWithArgs(...args: A): boolean {
    return this.delete(this.keyFor(args));
  }

  public hasWithArgs(...args: A): boolean {
    return this.has(this.keyFor(args));
  }

  private keyFor(args: A | IArguments): K {
    return this._serialiser.apply(this._ctx, args as A);
  }
}
