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
    
}