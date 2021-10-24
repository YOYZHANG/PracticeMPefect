class Store {
        constructor(options) {
            this._modules = new ModuleCollection(options);

            // init root module.
            // this also recursively registers all sub-modules
            // and collects all module getters inside this._wrappedGetters
            installModule(this, state, [], this._modules.root)

            // initialize the store state, which is responsible for the reactivity
            // (also registers _wrappedGetters as computed properties)
            resetStoreState(this, state)

        }

        install() {}
        get state() {
            return this._state.data
        }
        set state(v) {

        }

        // commit('pushProductToCart', { id: product.id })
        commit(_type, _payload, _options) {
            const {
                type,
                payload,
                options
            } = unifyObjectStyle(_type, _payload, _options)

            const entry = this._mutations[type];
            this._withCommit(() => {
                entry.forEach(function commitIterator (handler) {
                  handler(payload)
                })
            })

        }
        // store.dispatch('cart/addProductToCart', product)
        dispatch(_type, _payload) {
            const {
                type,
                payload
            } = unifyObjectStyle(_type, _payload)

            const action = {type, payload}
            const entry = this._actions[type]

            try {

            } catch (e) {

            }

            const result = entry.length > 1
                ? Promise.all(entry.map(handler => handler(payload)))
                : entry[0](payload)
            
            return new Promise((resolve, reject) => {
                result.then(res => {
                    resolve(res)
                })
            })

        }
        // ???
        _withCommit(fn) {
            const committing = this._committing;
            this._committing = true;
            fn();
            this._committing = committing;
        }
        subscribe(fn, options) {
            return genericSubscribe(fn, this._subscribes, options)
        }
        subscribeAction() {}
        registerModule(path, rawModule, options) {}
        unregisterModule(path) {}
        _withCommit(fn) {}
}

// modules: {
//   cart,
//   products
// },
// strict: debug,
// plugins: debug ? [createLogger()] : []
class ModuleCollection {
    constructor(rawRootModule) {
        this.register([], rawRootModule, false)
    }

    get (path) {
        return path.reduce((module, key) => {
            return module.getChild(key)
        }, this.root);
    }

    register(path, rawModule, runtime = true) {
        const newModule = new Module(rawModule, runtime);

        // 赋值 root
        if (path.length === 0) {
            this.root = newModule
        }
        else {
            const parent = this.get(path.slice(0, -1))
            parent.addChild(path[path.length - 1], newModule);
        }

        if (rawModule.modules) {
            Object.keys(rawModule.modules).forEach((key,item) => {
                this.register(path.concat(key), item, runtime);
            });
        }
    }
}

class Module {
    constructor(rawModule, runtime) {
        this._children = Object.create(null);
        this._rawModule = rawModule;
        const rawState = rawModule.state;
    }

    addChild(key, module) {
        this._children[key] = module;
    }

    forEachMutation(fn) {
        if (this._rawModule.mutations) {
            Object.keys(this._rawModule.mutations).forEach((key, item) => fn(item, key));
        }
    }
}

function installModule(store, rootState, path, module) {
    const local = module.context = makeLocalContext(store, namespace, path)

    module.forEachMutation((mutation, key) => {
        const namespacedType = namespace + key
        registerMutation(store, namespacedType, mutation, local)
    })

    module.forEachChild((child, key) => {
        installModule(store, rootState, path.concat(key), child, hot)
    })
}

function makeLocalContext(store, namespace, path) {
    const noNamespace = namespace === ''

    const local = {
        dispatch: store.dispatch,
        commit: store.commit
    };
    // getters and state object must be gotten lazily
    // because they will be changed by state update
    Object.defineProperties(local, {
        getters: {
            get: noNamespace
                ? () => store.getters
                : () => makeLocalGetters(store, namespace)
        },
        state: {
            get: () => getNestedState(store.state, path)
        }
    })

    return local;
}

function registerMutation(store, type, handler, local) {
    const entry = store._mutations[type]|| (store._mutations[type] = [])
    entry.push(function wrappedMutationHandler(payload) {
        handler.call(store, local.state, payload);
    })
}

function resetStoreState(store, state, hot) {
    const oldState = store._state

    store._state = reactive({
        data: state
    })
}

function genericSubscribe(fn, subs, options) {  
    if (subs.indexOf(fn) < 0) {
        subs.push(fn);
    }

    return () => {
        const i = subs.indexOf(fn);
        if (i > -1) {
            subs.splice(i, 1);
        }
    }
}


// 1. getter 实现？
// 2. 为什么this._subscribers需要 .slice 一下(done)
// shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
// 3. _withCommit 的作用