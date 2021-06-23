function container() {

    var apiContainer = {
        // add({
        //     name: 'zxqApi',
        //     invoke: ['ArgCheck', 'CallPrompt']
        //     args: [{name: 'url', value: 'string'}]
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
            for (processor of invoke) {
                let processor = getProcessors(invoke);
                args = processor(args);
            }

        },
        normalize: function(description, handler) {
            // 暂时不需要处理参数
            // 但一般提供给开发者更多的参数语法糖是可以在这里处理的
        }
    };

    return apiContainer;
}