export function Memoise(serialiser: Memoise.ArgSerialiserFn = JSON.stringify): MethodDecorator {
  return (target: any, prop: PropertyKey, desc: PropertyDescriptor): PropertyDescriptor => {
    if (!desc) {
      desc = <any>Object.getOwnPropertyDescriptor(target, prop);
      if (!desc) {
        throw new Error('Unable to resolve property descriptor for @Memoise');
      }
    }

    if (typeof desc.value !== 'function') {
      throw new Error('@Memoise can only decorate methods');
    }

    desc = Object.assign({}, desc);
    const orig: Function = <Function>desc.value;
    const cache: any = {};

    desc.value = function (this: any): any {
      const serialisedArgs = serialiser(arguments);
      if (!cache[serialisedArgs]) {
        cache[serialisedArgs] = orig.apply(this, <any>arguments);
      }

      return cache[serialisedArgs];
    };

    return desc;
  };
}

export module Memoise {
  export type ArgSerialiserFn = (v: IArguments) => string;
}
