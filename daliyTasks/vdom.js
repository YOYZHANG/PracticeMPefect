// details see:https://nosaid.com/article/virtual-dom

// 在 snabbdom 中，把 vnode 各项能力抽象成一种插件
// 为业务层提供了更多的定制化能力

// 在设计的过程中，插件并不是跟 lib 强耦合，大家都遵循同一套接口（比如初始化方式、生命周期等）
// 然后打开的时候需要哪个再加哪个

export type TModuleHookFunc = (oldVNode: VNode, vnode:VNode);

export interface IModuleHook {
    create?: TModuleHookFunc;
  
    insert?: TModuleHookFunc;
  
    update?: TModuleHookFunc;
  
    destroy?: TModuleHookFunc;
  }
export function updateAttrs(oldVnode, vnode) {
    let oldAttrs = oldVnode.data.attrs;
    let attrs = vnode.data.attrs;
    const elm = vnode.elm;
    // ....
}

export const attrsModule: IModuleHook = {
    create: updateAttrs,
    update: updateAttrs
};


// 使用
const cbs: Record<keyof IModuleHook, TModuleHookFunc[]> = {
    create: [],
    insert: [],
    update: [],
    destroy: [],
    remove: []
};

// 把各个module的钩子注入进去
for (const item of modules) {
    hooks.forEach(hookKey => item[hookKey] && cbs[hookKey].push(item[hookKey]));
}

// ....
cbs.create.forEach(hook => hook(emptyVnode, vnode));