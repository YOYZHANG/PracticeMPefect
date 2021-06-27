let root = window | global;
function container() {
    var processorCreator = {
        ArgCheck: function(description) {
            return function(arg) {
                return checkArgs(arg, description.args);
            }
        },
        CallMethod: function(description) {
            let methodName;
            let methodOwner;
            // 这里考虑做个缓存
            function findMethod() {
                // QA: 此处困惑
                if (methodOwner) {
                    return;
                }

                let segs = description.method.split('.');
                methodName = segs[segs.length - 1];
                methodOwner = root;
                
                for (let i = 0; i < segs.length - 1; i++) {
                    methodOwner = methodOwner[segs[i]];
                }

                return method;
            }
            return function(args) {
                findMethod();
                methodOwner[methodName].apply(methodOwner, args);
            }
        }
    },

    // args = ['https://', 'get']
    // declarations = [{name: 'url', value: string}]
    var checkArgs = function(args, declarations) {
        let errMsg;
        for(let index, declaration of declarations) {
            let result = checkValue(args[index], declaration.value);
            switch (result) {
                case '2': 
                    errMsg = `type error,${args[index]} should be ${declaration.value}`;
                    break;
            }
        }

        if (errorMsg) {
            throw new Error(errMsg);
        }
    },

    var checkValue = function(value, declaration) {
        switch (declaration) {
            case 'string':
            case 'boolean':
            case 'number':
            case 'function':
            case 'object':
                valid = typeof value === declaration;
                break;
            case 'Object':
                valid = typeof vaule === 'object';
                break;
            case 'Array':
                valid = value instanceof Array;
                break;
        }
        if (!valid) {
            return 2;
        }
    }, 

    var apiContainer = {
        // add({
        //     name: 'zxqApi',
        //     invoke: ['ArgCheck', 'ArgEncode', 'CallMethod']
        //     args: [{name: 'url', value: 'string'}]
        //     method: '_na.getAPIs'
        //})
        apiIndex: {},
        apis: {},
        index: 0,
        add: function(description) {
            // add 支持两种类型的传参
            if (description instanceof Array) {
                for (item of description) {
                    this.add(item);
                }
            }

            if (typeof description === 'object') {
                // todo: 处理已经添加了的情况

                var name = description.name;
                this.apiIndex[name] = index;
                this.apis[index++] = normalize(description, handler);
            }

        },
        // invoke('zxqApi', ['a url'])
        invoke: function(apiName, args) {
            const description = this.apis[this.apiIndex[apiName]];
            if (!description) {
                new Error('xxx');
                return;
            }

            let args = args | [];
            let invoke = description.invoke;
            for (item of invoke) {
                let processor = getProcessors(item);
                if (typeof processor === 'function') {
                    args = processor(args);
                }
            }

        },
        normalize: function(description, handler) {
            // 暂时不需要处理参数
            // 但一般提供给开发者更多的参数语法糖是可以在这里处理的
        },
        getProcessors(item) {
            return processorCreator[item];
        }
    };

    return apiContainer;
}