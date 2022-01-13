import type {
  ProposalDescriptor,
  SerialiseFactory} from './common';
import {
  constantMemoiseFactory,
  createMemoisedMethod,
  dynamicMemoiseFactory,
  jsonStringifySerialiser,
  MEMOISE_ALL,
  MEMOISE_CACHE,
  SerialiserFn,
  Strings
} from './common';

function decorateLegacy(
  serialiser: SerialiserFn,
  methodName: PropertyKey,
  descriptor: PropertyDescriptor | null,
  factory: SerialiseFactory
): PropertyDescriptor {
  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new Error(Strings.MethodError);
  }

  const {configurable, enumerable, value: method} = descriptor;

  return {
    configurable,
    enumerable,
    value: function memoiseHandler(this: any): any {
      const memoisedMethod = createMemoisedMethod(serialiser, method as any, factory);
      Object.defineProperty(this, methodName, {configurable, enumerable, value: memoisedMethod});

      return memoisedMethod.apply(this, arguments as any);
    }
  };
}

function decorateNew(
  serialiser: SerialiserFn,
  desc: ProposalDescriptor,
  factory: SerialiseFactory
): ProposalDescriptor {
  if (desc.kind !== 'method') {
    throw new Error(Strings.MethodError);
  }

  const method: SerialiserFn = (desc.method as any || (desc.descriptor || desc).value);

  if (typeof method !== 'function') {
    throw new Error(Strings.MethodError);
  }

  const {configurable, enumerable} = desc.descriptor || desc;
  const methodName = desc.key;

  function instancedMemoiseHandler(this: any): any {
    const memoisedMethod = createMemoisedMethod(serialiser, method as any, factory);
    Object.defineProperty(this, methodName, {configurable, enumerable, value: memoisedMethod});

    return memoisedMethod.apply(this, arguments as any);
  }

  return {
    configurable,
    descriptor: {
      configurable,
      enumerable,
      value: instancedMemoiseHandler
    },
    enumerable,
    key: methodName,
    kind: 'method',
    method: instancedMemoiseHandler,
    placement: desc.placement,
    value: instancedMemoiseHandler
  };
}

/**
 * Memoise the method, caching its response. Once decorated and called for the first time, the decorated method will
 * get a {@link MEMOISE_CACHE} property.
 *
 * <strong><u>WARNING</u>: When decorating instance methods, only call those methods with "this" set to a class instance,
 * i.e. don't do <code>MyClass.prototype.decoratedMethod()</code>, otherwise every class instance after that call will
 * end up sharing a cache</strong>
 * @param serialiser See {@link SerialiserFn}. Defaults to a serialiser that JSON.stringifies the arguments.
 * @throws {Error} When decorating non-methods
 */
function Memoise(serialiser: SerialiserFn = jsonStringifySerialiser): MethodDecorator {
  const factory: SerialiseFactory = serialiser === MEMOISE_ALL ? constantMemoiseFactory : dynamicMemoiseFactory;

  return function MemoiseDecorator(targetOrDesc: any, method: PropertyKey, desc: PropertyDescriptor): any {
    return method ? decorateLegacy(serialiser, method, desc, factory) : decorateNew(serialiser, targetOrDesc, factory);
  };
}

Memoise.all = function all(): MethodDecorator {
  return Memoise(MEMOISE_ALL);
};

export {SerialiserFn, MEMOISE_CACHE, Memoise};
