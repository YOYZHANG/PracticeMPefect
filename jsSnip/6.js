// b.js
// export default 42;

// a.js
// import b from './b.js';
// console.log(b);


// 这个runtime是固定的
function runtime(modules) {
  const module_cache = {};
  function wrequire(id) {
    if (module_cache[id]) {
      return module_cache[id].exports;
    }
    
    // 缓存没有命中时就生成一个新的module
    const module = module_cache[id] = {
      exports: {}
    };
    
    // 它传入的参数中，
    modules[id](module, module.exports, wrequire);
    
    return module.exports;
  }

  return wrequire(1);
}

function b(mod, exports, requires) {
  exports['default'] = 42;
}
function a(mod, exports, requires) {
  const exportss = requires(0);
  console.log(exportss['default']);
}

runtime([b,a]);
