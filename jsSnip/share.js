// NOOP 
better: const Noop = () => {} // 便于压缩
bad: function() {}

// tips: splice 非常耗费性能

// hasOwn 是不是自己本身拥有的属性
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);

// 判断数组
const isArray = Array.isArray()

// 判断是否是map对象
const isMap = (val) => toTypeString(val) === '[object Map]'

// 判断是不是Date对象
const isDate = (val) => val instanceof Date

// isFunction
const isFunction = (val) => typeof val === 'function'

// isString 判断是不是字符串
const isString = (val) => typeof val === 'string';

// isObject
// 判断不为 null 的原因是 typeof null 其实 是 object
const isObject = (val) => val != null && typeof val === 'object';

// isPromise
const isPromise = (val) => {
    return isObject(val) && isFunction(val.then) && isFunction(val.catch)
}

// objectTostring
const objectToString = Object.prototype.toString;

const toTypeString = (value) => objectToString.call(value);

const toRawType = (value) => {
    // extract "RawType" from strings like "[object RawType]"
    return toTypeString(value).slice(8, -1);
};

// 截取到
toRawType('');  'String'


// toNumber
const toNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
}

Number.isNaN('a')


// def 定义对象属性
const def = (obj, key, value) {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumrable: false,
    value
  })
}

// hasChanged 判断是否有变化
const hasChanged = (value, oldValue) => value != oldValue && (value === value || oldValue === oldValue);

// 认为 NaN 是不变的
hasChanged(NaN, NaN); // false


// invokeArrayFns 执行数组里的函数


//cacheStringFunction 缓存
const cacheStringFunction = (fn) => {
    const cache = Object.create(null);
    return ((str) => {
        const hit = cache[str];
        return hit || (cache[str] = fn(str));
    });
};


// makeMap && isReservedProp


// isIntegerKey 判断是不是数字型的字符串key值




https://juejin.cn/post/6994976281053888519
