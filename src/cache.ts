import type {SerialiserFn} from './core';

type Fn<T, A extends any[], R> = (this: T, ...args: A) => R;

/** @see {MEMOISE_CACHE} */
export interface Cache<K = any> {

  /** Clear the cache */
  clear(): void;

  /**
   * Delete a specific cache entry.
   * @param key The result of passing the method call args through the associated {@link SerialiserFn serialiser fn}
   */
  delete(key: K): boolean;

  /**
   * Check if a specific cache entry exists.
   * @param key See {@link Cache#delete delete()}
   */
  has(key: K): boolean;
}

/** @internal */
export class ArglessCtx<T, R> implements Cache {
  public _f = true;

  public _r!: R;

  public constructor(private readonly _o: Fn<T, [], R>) { // eslint-disable-line no-empty-function
  }

  public autoGet(ctx: T): R {
    if (this._f) {
      this._r = this._o.call(ctx);
      this._f = false;
    }

    return this._r;
  }

  public clear(): void {
    this._f = true;
  }

  public delete(): boolean {
    const ret = this.has();
    this.clear();

    return ret;
  }

  public has(): boolean {
    return !this._f;
  }
}

/** @internal */
export class ArgedCtx<T, A extends any[], R, K> extends Map<K, R> implements Cache<K> {
  public constructor(
    private readonly _o: Fn<T, A, R>,
    private readonly _s: SerialiserFn<T, A, K>
  ) {
    super();
  }

  public autoGet(ctx: T, args: A | IArguments): R {
    const key = this._s.apply(ctx, args as A);
    if (this.has(key)) {
      return this.get(key)!;
    }

    const value = this._o.apply(ctx, args as A);
    this.set(key, value);

    return value;
  }
}
