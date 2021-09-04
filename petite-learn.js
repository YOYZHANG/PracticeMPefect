// 重点
// 1. 深度遍历
// 2. 响应式更新节点的方法

// 可以学习的代码片段
// 1. queue
// 2. 继承
// 3. 解析{{}}


// 在下一个时间片统一触发queue
const queue = [];
const queued = false;
const p = Promise.resolve();

function nextTick(fn) {
    p.then(fn);
}

function queue(fn) {
    if (!queue.includes(fn)) {
        queue.push(fn);
    }

    if (!queued) {
        queued = true;
        nextTick(flush);
    }
}

function flush() {
    queue.forEach(item => {
        item();
    })

    queue.length = 0;
    queued = false;
}


// 继承

let originproto = {};
let mergedproto = Object.create(originproto);
let prop = {a: 1};
Object.defineProperties(mergedproto, Object.getOwnPropertyDescriptor(prop));


// 解析 {{}}
let data = "{{count}}"
let interPolationRE = /\{\{(^\})+?\}\}/g
let match
let segment;
let index;
let lastIndex = 0;

// JavaScript RegExp 对象是有状态的。
// 他们会将上次成功匹配后的位置记录在 lastIndex 属性中。
// 使用此特性，exec() 可用来对单个字符串中的多次匹配结果进行逐条的遍历（包括捕获到的匹配）
while(match = interPolationRE.exec(data)) {
    let leading = data.slice(index, match.index);
    if (leading) {
        segment.push(leading);
    }
    segments.push(match[1]);
    lastIndex = index + match[0].length;
}

if (lastIndex < data.length) {
    segment.push(JSON.stringify(data.slice(lastIndex)));
}
