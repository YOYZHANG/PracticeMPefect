https://hermesengine.dev/

## build and running
https://hermesengine.dev/docs/building-and-running

## Design OverView

### 字节码生成器
将高优先级的 IR 转换成字节码，以下仅介绍操作流的生成

字节码是基于寄存器的， 但是寄存器有限制，分配给调用指令的寄存器必须是连续的，并且大多数指令仅接受8位寄存器索引。

字节码生成
第一阶段是：lowering of some instructions to target-specific instructions
第二阶段：the register allocator allocates registers for each instruction in the lowered IR.

Performing register allocation prior to lowering is often done in JIT compilers where the lowering phase is trivial and close to a 1:1 translation between high-level IR and the low-level target IR.

当前的寄存器分配接口是简单的线性扫描，有4个步骤：
- First, we number the instructions in the functions, and traverse the basic blocks in the function in reverse-post-order scan.
- we calculate the liveness graph of the result of each instruction in the function

## 如何在 c 代码中调用引擎
https://zhuanlan.zhihu.com/p/104333176

将 js 引擎嵌入， 最简单的 c 程序就是 main 函数下，如果可以在 main 函数里调用引擎执行一段 js 代码，就算成功嵌入。

集成 js 引擎 可以等价于集成第三方库
- 将引擎源码编译为库文件，可以是.a格式的静态库，也可以是 .so 或 .dll 的动态库
- 在自己的 c 源码中 include 引擎的头文件，调用它提供的 api
- 编译自己的 c 源码，并链接上引擎的库文件，生成最终的可执行文件。

## 为 JS 引擎扩展原生能力
QuickJS 提供了标准化的 API，方便你用 C 来实现 JS 中的函数和类。
大致要做这么几件事：
- 把 C 函数包一层，处理它与 JS 引擎之间的类型转换。
- 将包好的函数挂载到 JS 模块下。
- 将整个原生模块对外提供出来。

eg:
```js
function fib(n) {
  if (n <= 0) return 0;
  else if (n === 1) return 1;
  else return fib(n - 1) + fib(n - 2);
}
```

```c++
int fib(int n) {
  if (n <= 0) return 0;
  else if (n == 1) return 1;
  else return fib(n - 1) + fib(n - 2);
}
```

```c++
#include <quickjs/quickjs.h>
#define countof(x) (sizeof(x) / sizeof((x)[0]))

// 原始的 C 函数
static int fib(int n) {
    if (n <= 0) return 0;
    else if (n == 1) return 1;
    else return fib(n - 1) + fib(n - 2);
}

// 包一层，处理类型转换
static JSValue js_fib(JSContext *ctx, JSValueConst this_val,
                      int argc, JSValueConst *argv) {
    int n, res;
    if (JS_ToInt32(ctx, &n, argv[0])) return JS_EXCEPTION;
    res = fib(n);
    return JS_NewInt32(ctx, res);
}

// 将包好的函数定义为 JS 模块下的 fib 方法
static const JSCFunctionListEntry js_fib_funcs[] = {
    JS_CFUNC_DEF("fib", 1, js_fib ),
};

// 模块初始化时的回调
static int js_fib_init(JSContext *ctx, JSModuleDef *m) {
    return JS_SetModuleExportList(ctx, m, js_fib_funcs, countof(js_fib_funcs));
}

// 最终对外的 JS 模块定义
JSModuleDef *js_init_module_fib(JSContext *ctx, const char *module_name) {
    JSModuleDef *m;
    m = JS_NewCModule(ctx, module_name, js_fib_init);
    if (!m) return NULL;
    JS_AddModuleExportList(ctx, m, js_fib_funcs, countof(js_fib_funcs));
    return m;
}


```