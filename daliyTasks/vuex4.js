// 入口文件
// const app = createApp(App)

// app.use(store)

// app.mount('#app')

// part1: app.use
function createAppAPI() {
    return function createApp(rootComponent, rootProps) {
        const installedPlugins = new Set();
        const app = (context.app = {
            use(plugin) {
                if (plugin && isFunction(plugin.install)) {
                    installedPlugins.add(plugin);

                    plugin.install(app);
                }

                // 支持链式调用
                return app;
            }


        });

    }
}

// store.install的实现

export class Store {
    install (app, injectKey) {
        // 为 composition API 使用
        app.provide(injectKey || 'store', this);
        // 为 option API 中使用
        app.config.globalProperties.$store = this
    }
}

// app.provide 的实现
provide(key, value) {
    context.provides[key] = value;
    return app;
}

// context 是由createAppContext生成
function createAppContext() {
    return {
        app:null,
        config: {

        },
        privides:Object.create(null);
    }
}


// inject 的实现
function inject() {
    const instance = currentInstance
    
    if (instance) {
        const provides = instance.parent == null
            ? instance.vnode.appContext && instance.vnode.appContext.privides
            : instance.parent.provides;
        
        if (provides && key in provides) {
            // TS doesn't allow symbol as index type
            return provides[key];
        }
    }
}

// vue.provide 实现
// provide 函数作用
// 1. 给当前组件实例上 provides 对象属性，添加键值对
// 2. 还有一个作用是当当前组件和父级组件 provides 相同时，在当前组件实例中的provides对象和父级，则建立链接

function provide(key, value) {
    if(!currentInstance) {
        warn();
    }
    else {
        let provides = currentInstance.provides;
        const parentProvides = curentInstance.parent && currentInstance.parent.provides;

        if (parentProvides === provides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
    }

    provides[key] = value;
}

// createComponentInstance 创建组件实例
const emptyAppContext = createAppContext();
let uid$1 = 0;
function createComponentInstance(vnode, parent, suspense) {
    const type = vnode.type;
    const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
    const instance = {
        uid: uid$1++,
        vnode,
        type,
        parent,
        appContext,
        root: null,
        next: null,
        subTree: null,
        // ...
        provides: parent ? parent.provides : Object.create(appContext.provides),
        // ...
    }
    instance.root = parent ? parent.root : instance;
    // ...
    return instance;
}



