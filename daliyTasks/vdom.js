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

// vnode => diff => patch(根据 diff 对比，把结果反馈到真实 dom)

// diff 对比 新旧 vnode

// 对比包含 tagName、attributes、props、events

// ├── dev.scss             # 开发阶段所用样式
// ├── dev.ts               # 开发阶段打包入口
// ├── index.ts             # 生产环境打包入口
// ├── lib
// │   ├── VNode.ts         # VNode 模块
// │   ├── h.ts             # VNode 的工厂方法
// │   ├── hooks.ts         # 为 vdom 提供生命周期的 hook
// │   ├── modules          # plugins 目录，VNode 所拥有的各项能力
// │   │   ├── attrs.ts
// │   │   ├── events.ts
// │   │   └── props.ts
// │   └── patch.ts         # 把 VNode 挂载到真实 dom
// └── utils                # 工具包
//     └── index.ts

// vnode 的设计
// vnode 类
class VNode {
    // 唯一标识
    key: string;
    // tagName
    type: string;
    // 节点属性、节点状态、事件
    data: IVNodeData;
    // 子节点数组
    children?: VNode[];
    // textcontent
    text?: string;
    // 真实 dom 元素
    elm?: Element;

    constructor(type: string, data?: IVNodeData, children?: VNode[], text?: string, elm?: Element);
    /**
     * 是否是 VNode
     *
     * @static
     * @param {*} node 要判断的对象
     * @returns {boolean}
     * @memberof VNode
     */
    static isVNode(node: any): boolean;
    /**
     * 是否是可复用的 VNode 对象
     * 判断依据是 key 跟 tagname 是否相同，既 对于相同类型dom元素尽可能复用
     *
     * @static
     * @param {VNode} oldVnode
     * @param {VNode} vnode
     * @returns {boolean}
     * @memberof VNode
     */
    static isSameVNode(oldVnode: VNode, vnode: VNode): boolean;
}
  
export interface IVNodeData {
    key?: string;

    props?: IProps;

    attrs?: IAttrs;

    on?: IListener;
    // ？？？
    hook?: IVnodeHook;
    // ？？？
    ns?: string;
}

// diff 和 patch
// 第一次 patch，是 VNode 跟空的根 dom 进行对比，所有的 dom 都是新增。

// 之后的 patch 属于 update，是新旧 VNode 对比，对于不可复用的删除，可复用的更新，新增的部分插入。

// ----------------------------------------------------
//     # 1. 前后没有差异，直接返回

// ----------------------------------------------------
//     # 2. 两者都是文本节点，则更新 `textContent`

//           XX                            XX
//          X  X        +------->         X  X
//         X    X                        X    X
//        X+----+X      +------->       X+----+X
//       X        X                    X        X
//      X          X                  X          X

// ----------------------------------------------------
//     # 3. 新旧节点都有 children，属于容器节点，则去对比他们 children，执行 `updateChildren`

//     +----------+                  +----------+
//     |          |     +------->    |          |
//     |          |                  |          |
//     |          |     +------->    |          |
//     |          |                  |          |
//     +----------+                  +----------+

// ----------------------------------------------------
//     # 新节点是容器节点，旧的是文本节点。删除文本，添加新节点。

//          XX                        +----------+
//         X  X        +------->      |          |
//        X    X                      |          |
//       X+----+X      +------->      |          |
//      X        X                    |          |
//     X          X                   +----------+

// ----------------------------------------------------
//     # 新节点是文本节点，旧的是容器节点。删除容器节点，添加文本节点。

//     +----------+                        XX
//     |          |     +------->         X  X
//     |          |                      X    X
//     |          |     +------->       X+----+X
//     |          |                    X        X
//     +----------+                   X          X

// ----------------------------------------------------

// diff 算法
// 上面说的是更新某一个节点，更新节点的直接子节点使用的是 updateChildren ，
// 一般说的 diff算法 就指的是这块。一个好的 diff算法 可以在很大程度上决定一个 vdom 库的优劣。

// 1.循环目标 children，找到能复用的节点，就移动到当前位置。
// 2.没找到能复用的节点，就自己生成一个。
// 3.循环完毕后，把多余的节点删除，这些是不能复用的部分。

// todo