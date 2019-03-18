type SerFn = Memoise.ArgSerialiserFn;

interface ProposalDescriptor extends PropertyDescriptor {
  descriptor: ProposalDescriptor; // Babel impl

  extras: Partial<ProposalDescriptor>[];

  key: string;

  kind: string;

  method: Function;

  placement: string;

  initialize(): any;

  initializer(): any;
}

const ERR_NOT_A_METHOD = '@Memoise can only decorate methods';

const ROOT: unique symbol = Symbol('@Memoise cache');

const stdSerialiser: SerFn = function (): string {
  return JSON.stringify(arguments);
};

function resolveCache(instance: any, methodSym: symbol): any {
  if (!instance[ROOT]) {
    Object.defineProperty(instance, ROOT, {value: {}});
  }

  return instance[ROOT][methodSym] || (instance[ROOT][methodSym] = {});
}

function createMemoisableFn(serialiser: SerFn, origFn: Function): Function {
  const sym: unique symbol = Symbol(origFn.name || '');

  return function (this: any): any {
    const cache: any = resolveCache(this, sym);

    const serialisedArgs = serialiser.apply(this, <any>arguments);
    if (!cache[serialisedArgs]) {
      cache[serialisedArgs] = origFn.apply(this, <any>arguments);
    }

    return cache[serialisedArgs];
  };
}

function decorateLegacy(serialiser: SerFn,
                        target: any,
                        prop: PropertyKey,
                        desc: PropertyDescriptor): PropertyDescriptor {
  if (!desc) {
    desc = <any>Object.getOwnPropertyDescriptor(target, prop);
    if (!desc) {
      throw new Error('Unable to resolve property descriptor for @Memoise');
    }
  }

  if (typeof desc.value !== 'function') {
    throw new Error(ERR_NOT_A_METHOD);
  }

  return Object.assign({}, desc, {value: createMemoisableFn(serialiser, desc.value)});
}

function decorateNew(serialiser: SerFn, desc: ProposalDescriptor): ProposalDescriptor {
  if (desc.kind !== 'method') {
    throw new Error(ERR_NOT_A_METHOD);
  }

  desc = Object.assign({}, desc);
  if (desc.descriptor) {
    desc.descriptor = Object.assign({}, desc.descriptor);
  }
  const orig: Function = desc.method || (desc.descriptor || desc).value;

  if (!orig) {
    throw new Error('Unable to resolve method');
  }

  const newFn = createMemoisableFn(serialiser, orig);

  if (desc.descriptor) {
    desc.descriptor.value = newFn;
  } else if (desc.method) {
    desc.method = newFn;
  } else {
    desc.value = newFn;
  }

  return desc;
}

/**
 * Memoise the method, caching its response
 * @param [serialiser] Serialiser function for computing cache keys. This accepts the method arguments.
 * and should return a string, number or symbol.
 */
export function Memoise(serialiser: Memoise.ArgSerialiserFn = stdSerialiser): MethodDecorator {
  return (targetOrDesc: any, method: PropertyKey, desc: PropertyDescriptor): any => {
    return method ? decorateLegacy(serialiser, targetOrDesc, method, desc)
      : decorateNew(serialiser, targetOrDesc);
  };
}

export module Memoise {
  export type ArgSerialiserFn = (...args: any[]) => PropertyKey;
}
