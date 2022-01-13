/**
 * A serialisation function for computing cache keys. The returned key can be anything that's
 * uniquely identifiable inside {@link Map}s. Called with the class instance (or the class itself for static methods)
 * as the thisArg and forwards the method call arguments.
 */
export type SerialiserFn = (this: any, ...args: any[]) => any;

/**
 * Direct access to a memoised method's cache. Only appears after the method's been called at least once.
 */
export const MEMOISE_CACHE: unique symbol = Symbol('Memoise cache');

/** @internal */
export type SerialiseFactory = (cache: Map<any, any>, method: SerialiserFn, serialiser: SerialiserFn) => SerialiserFn;

/** @internal */
export const enum Strings {
  MethodError = '@Memoise can only decorate methods'
}

/**
 * Flag that Memoise.all() was used
 * @internal
 */
export const MEMOISE_ALL: any = Symbol('Memoise cache');

/** @internal */
export interface ProposalDescriptor extends PropertyDescriptor {
  descriptor: PropertyDescriptor; // Babel impl

  extras?: Array<Partial<ProposalDescriptor>>;

  key: string;

  kind: string;

  method?: Function;

  placement: string;

  initialize?(): any;

  initializer?(): any;
}

/**
 * Memoise method factory for Memoise.all()
 * @internal
 */
export function constantMemoiseFactory(cache: Map<any, any>, origMethod: SerialiserFn): SerialiserFn {
  return function constantMemoisedMethod(this: any): any {
    if (cache.has(null)) {
      return cache.get(null);
    }

    const returnValue = origMethod.apply(this, arguments as any);
    cache.set(null, returnValue);

    return returnValue;
  };
}

/**
 * Memoise method factory for Memoise()
 * @internal
 */
export function dynamicMemoiseFactory(
  cache: Map<any, any>,
  origMethod: SerialiserFn,
  serialiser: SerialiserFn
): SerialiserFn {
  return function dynamicMemoisedMethod(this: any): any {
    const cacheKey = serialiser.apply(this, arguments as any);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const returnValue = origMethod.apply(this, arguments as any);
    cache.set(cacheKey, returnValue);

    return returnValue;
  };
}

/**
 * Memoise the method with the given serialisation function
 * @internal
 */
export function createMemoisedMethod(
  serialiser: SerialiserFn,
  origMethod: SerialiserFn,
  factory: SerialiseFactory
): SerialiserFn {
  const cache = new Map<any, any>();
  const memoisedMethod = factory(cache, origMethod, serialiser);

  Object.defineProperty(memoisedMethod, MEMOISE_CACHE, {
    configurable: true,
    value: cache,
    writable: true
  });

  return memoisedMethod;
}

/**
 * The default serialiser
 * @internal
 */
export function jsonStringifySerialiser(...args: any[]): string {
  return JSON.stringify(args);
}
