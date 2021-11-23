## 如何在 c 代码中调用引擎
https://zhuanlan.zhihu.com/p/104333176

将 js 引擎嵌入， 最简单的 c 程序就是 main 函数下，如果可以在 main 函数里调用引擎执行一段 js 代码，就算成功嵌入。

集成 js 引擎 可以等价于集成第三方库
- 将引擎源码编译为库文件，可以是.a格式的静态库，也可以是 .so 或 .dll 的动态库
- 在自己的 c 源码中 include 引擎的头文件，调用它提供的 api
- 编译自己的 c 源码，并链接上引擎的库文件，生成最终的可执行文件。

## 为 JS 引擎扩展原生能力
QuickJS 提供了标准化的 API，方便你用 C 来实现 JS 中的函数和类。
例如： document.getElementById
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
<!-- 要想在 Quickjs 上使用上面的 C 函数，大致要做这么几件事：
- 把 C 函数包一层，处理它与 JS 引擎之间的类型转换。
- 将包好的函数挂载到 JS 模块下。
- 将整个原生模块对外提供出来。 -->

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

## 移植默认 Event Loop
最简单的应用： setTimeout
引擎编译时默认会内置 std 和 os 两个原生模块，可以这样
使用 setTimeout 来支持异步：
```js
import { setTimeout } from "os";
setTimeout(() => { /* ... */ }, 0);
```
这个 os 是通过标准化的 Quickjs api 挂载上去的原生模块。
这个原生的 setTimeout 实现见：

```js
static JSValue js_os_setTimeout(JSContext *ctx, JSValueConst this_val,
                                int argc, JSValueConst *argv)
{
    int64_t delay;
    JSValueConst func;
    JSOSTimer *th;
    JSValue obj;

    func = argv[0];
    if (!JS_IsFunction(ctx, func))
        return JS_ThrowTypeError(ctx, "not a function");
    if (JS_ToInt64(ctx, &delay, argv[1]))
        return JS_EXCEPTION;
    obj = JS_NewObjectClass(ctx, js_os_timer_class_id);
    if (JS_IsException(obj))
        return obj;
    th = js_mallocz(ctx, sizeof(*th));
    if (!th) {
        JS_FreeValue(ctx, obj);
        return JS_EXCEPTION;
    }
    th->has_object = TRUE;
    th->timeout = get_time_ms() + delay;
    th->func = JS_DupValue(ctx, func);
    list_add_tail(&th->link, &os_timers);
    // 插入队列
    JS_SetOpaque(obj, th);
    return obj;
}
```

```c++
int main(int argc, char **argv)
{
  // ...
  // eval JS 字节码
  js_std_eval_binary(ctx, qjsc_hello, qjsc_hello_size, 0);
  // 启动 Event Loop
  js_std_loop(ctx);
  // ...
}
```

```c++
void js_std_loop(JSContext *ctx)
{
    JSContext *ctx1;
    int err;

    for(;;) {
        /* execute the pending jobs */
        for(;;) {
            err = JS_ExecutePendingJob(JS_GetRuntime(ctx), &ctx1);
            if (err <= 0) {
                if (err < 0) {
                    js_std_dump_error(ctx1);
                }
                break;
            }
        }

        if (!os_poll_func || os_poll_func(ctx))
            break;
    }
}
```
而这里的 os_poll_func 封装的，就是原理类似的 poll 系统调用（准确地说，用的其实是 select），从而可以借助操作系统的能力，使得只在【定时器触发、文件描述符读写】等事件发生时，让进程回到前台执行一个 tick，把此时应该运行的 JS 回调跑一遍，而其余时间都在后台挂起。

poll 和 select 想实现的东西是一致的，只是原理不同，前者性能更好而后者更简单而已。

鉴于 os_poll_func 的代码较长，这里只概括下它与 timer 相关的工作：

- 如果上下文中存在 timer，将到期 timer 对应的回调都执行掉。
- 找到所有 timer 中最小的时延，用 select 系统调用将自己挂起这段时间。

这样，setTimeout 的流程就说得通了：先在 eval 阶段简单设置一个 timer 结构，然后在 Event Loop 里用这个 timer 的参数去调用操作系统的 poll，从而在被唤醒的下一个 tick 里把到期 timer 对应的 JS 回调执行掉就行。

libuv 是 Node.js 开发过程中衍生的异步 IO 库, 用 libuv 实现：
- 将 Event Loop 切换到基于 libuv 实现
- 支持宏任务与微任务

## 支持 libuv event loop
```c++
#include <stdio.h>
#include <uv.h> // 这里假定 libuv 已经全局安装好

static void onTimerTick(uv_timer_t *handle) {
  printf("timer tick\n");
}

int main(int argc, char **argv) {
    // 建立 loop 对象
    uv_loop_t *loop = uv_default_loop();

    // 把 handle 绑到 loop 上
    uv_timer_t timerHandle;
    uv_timer_init(loop, &timerHandle);

    // 把 callback 绑到 handle 上，并启动 timer
    uv_timer_start(&timerHandle, onTimerTick, 0, 1000);
    uv_run(loop, UV_RUN_DEFAULT);
    return 0;
}
```
libuv 基本概念
Callback - 事件发生时所触发的回调，例如这里的 onTimerTick 函数。别忘了 C 里也支持将函数作为参数传递噢。

Handle - 长时间存在，可以为其注册回调的对象，例如这里 uv_timer_t 类型的定时器。

Loop - 封装了下层异步 IO 差异，可以为其添加 Handle 的 Event Loop，例如这里 uv_loop_t 类型的 loop 变量。

所以简单说，libuv 的基本使用方式就相当于：把 Callback 绑到 Handle 上，把 Handle 绑到 Loop 上，最后启动 Loop。当然 libuv 里还有 Request 等重要概念，但这里暂时用不到，就不离题了。

只要我们能在上篇的代码中按同样的顺序依次调用 libuv，最后改为启动 libuv 的 Event Loop，那就能让 libuv 来接管运行时的下层实现了。

更具体地说，实际的实现方式是这样的：

- 在挂载原生模块前，初始化好 libuv 的 Loop 对象。
- 在初始的 JS 引擎 eval 过程中，每调用到一次 setTimeout，就初始化一个定时器的 Handle 并启动它。
- 待首次 eval 结束后，启动 libuv 的 Event Loop，让 libuv 在相应时机触发 C 回调，进而执行掉 JS 中的回调。

这里需要额外提供的就是定时器的 C 回调了，它负责在相应的时机把 JS 引擎上下文里到期的回调执行掉。在上篇的实现中，这是在 js_std_loop 中硬编码的逻辑，并不易于扩展。为此我们实现的新函数如下所示，其核心就是一行调用函数对象的 JS_Call。但在此之外，我们还需要配合 JS_FreeValue 来管理对象的引用计数，否则会出现内存泄漏：

```
static void timerCallback(uv_timer_t *handle) {
    // libuv 支持在 handle 上挂任意的 data
    MyTimerHandle *th = handle->data;
    // 从 handle 上拿到引擎 context
    JSContext *ctx = th->ctx;
    JSValue ret;

    // 调用回调，这里的 th->func 在 setTimeout 时已准备好
    ret = JS_Call(ctx, th->func, JS_UNDEFINED, th->argc, (JSValueConst *) th->argv);

    // 销毁掉回调函数及其返回值
    JS_FreeValue(ctx, ret);
    JS_FreeValue(ctx, th->func);
    th->func = JS_UNDEFINED;

    // 销毁掉函数参数
    for (int i = 0; i < th->argc; i++) {
        JS_FreeValue(ctx, th->argv[i]);
        th->argv[i] = JS_UNDEFINED;
    }
    th->argc = 0;

    // 销毁掉 setTimeout 返回的 timer
    JSValue obj = th->obj;
    th->obj = JS_UNDEFINED;
    JS_FreeValue(ctx, obj);
}
```

### promise
标准 Event Loop 里的每个 Tick，都只会执行一个形如 setTimeout 这样的 Task 任务.
但在 Task 的执行过程中，也可能遇到多个「既需要异步，但又不需要被挪到下一个 Tick 执行」的工作，其典型就是 Promise。这些工作被称为 Microtask 微任务，都应该在这个 Tick 中执行掉。相应地，每个 Tick 所对应的唯一 Task，也被叫做 Macrotask 宏任务，这也就是宏任务和微任务概念的由来了。

前有 Framebuffer 不是 Buffer，后有 Microtask 不是 Task，刺激不？

所以，Promise 的异步执行属于微任务，需要在某个 Tick 内 eval 了一段 JS 后立刻执行。但现在的实现中，我们并没有在 libuv 的单个 Tick 内调用 JS 引擎执行掉这些微任务，这也就是 Promise 回调消失的原因了。

明白原因后，我们不难找到问题的解法：只要我们能在每个 Tick 的收尾阶段执行一个固定的回调，那就能在此把微任务队列清空了。在 libuv 中，也确实可以在每次 Tick 的不同阶段注册不同的 Handle 来触发回调，如下所示


https://stackoverflow.com/questions/25915634/difference-between-microtask-and-macrotask-within-an-event-loop-context

https://github.com/doodlewind/minimal-js-runtime/blob/master/src/main.c
http://docs.libuv.org/en/v1.x/design.html
https://html.spec.whatwg.org/multipage/webappapis.html#task-queue



quickjs
JSRunTime:
JSRuntime表示与对象堆相对应的JavaScript运行时。几个运行时可以同时存在，但它们无法交换对象。在给定的运行时内，不支持多线程。

jscontext表示javascript上下文（或realm）。每个jscontext都有自己的全局对象和系统对象。每个jsruntime可以存在几个jscontexts，它们可以共享对象，类似于在Web浏览器中共享JavaScript对象的相同原点的帧。

JSValue:
jsvalue表示可以是原始类型或对象的JavaScript值。使用引用计数，因此重要的是要明确重复（js_dupvalue（），递增参考计数）或free（js_freevalue（），减少引用计数）JSvalues。

c function:
C功能可以使用js_newcfunction（）创建。js_setPropertyFunctionList（）是一个快捷方式，可轻松地添加功能，设置和将属性加入给定对象。

Unlike other embedded Javascript engines, there is no implicit stack, so C functions get their parameters as normal C parameters. As a general rule, C functions take constant JSValues as parameters (so they don’t need to free them) and return a newly allocated (=live) JSValue.

异常：
例外：大多数C函数可以返回JavaScript异常。必须由C代码明确测试和处理。特定的jsvalue js_exception表示发生异常。实际的异常对象存储在jscontext中，可以使用js_getexception（）检索。

Script evaluation
如果脚本或模块编译为具有QJSC的字节码，则可以通过调用js_std_eval_binary（）来评估它。优点是不需要编译，因此它更快且更小，因为如果不需要eval，则可以从可执行文件中删除编译器。

注意：字节码格式链接到给定的QuickJS版本。此外，在执行之前没有完成安全检查。因此，字节码不应从不受信任的来源加载。这就是为什么没有选项将字节码输出到QJSC中的二进制文件

JS Classes
C不透明数据可以附加到JavaScript对象。


https://ming1016.github.io/2021/02/21/deeply-analyse-quickjs/#QuickJS-%E6%9E%B6%E6%9E%84

JSRuntime 是 js 运行时，可以看做是 js 虚拟机环境，多个 JSRuntime 之间是隔离的，他们之间不能相互调用和通信。JSContext 是虚机里的上下文环境，一个 JSRuntime 里可以有多个 JSContext，每个上下文有自己的全局和系统对象，不同 JSContext 之间可以相互访问和共享对象。JS_Eval 和 JS_Parse 会把 js 文件编译为字节码。JS_Call 是用来解释执行字节码的。JS_OPCode 是用来标识执行指令对应的操作符。JSClass 包含标准的 js 的对象，是运行时创建的类，对象类型使用 JSClassID 来标记，使用 JS_NewClassID 和 JS_NewClass 函数注册，使用 JS_NewObjectClass 来创建对象。JSOpCode 是字节码的结构体，通过 quickjs-opcode.h 里的字节码的定义可以看到，QuickJS 对于每个字节码的大小都会精确控制，目的是不浪费内存使用，比如8位以下用不到1个字节和其他信息一起放在那1个字节里，8位用2个字节，整数在第2个字节里，16位用后2个字节。Unicode 是 QuickJS 自己做的库 libunicode.c，libunicode 有 Unicode 规范化和脚本通用类别查询，包含所有 Unicode 二进制属性，libunicode 还可以单独出来用在其他工程中。中间层还包含支持科学计算 BigInt 和 BigFloat 的 libbf 库，正则表达式引擎 libregexp。扩展模块 Std Module 和 OS Module，提供标准能力和系统能力，比如文件操作和时间操作等。

底层是基础，JS_RunGC 使用引用计数来管理对象的释放。JS_Exception 是会把 JSValue 返回的异常对象存在 JSContext 里，通过 JS_GetException 函数取出异常对象。内存管理控制 js 运行时全局内存分配上限使用的是 JS_SetMemoryLimit 函数，自定义分配内存用的是 JS_NewRuntime2 函数，堆栈的大小使用的是 JS_SetMaxStackSize 函数来设置。

```c++
JSRuntime *rt = JS_NewRuntime();
JSContext *ctx = JS_NewContext(rt);
js_std_add_helpers(ctx, 0, NULL);

const char *scripts = "console.log('hello quickjs')";
JS_Eval(ctx, scripts, strlen(scripts), "main", 0);
```

新建 Runtime
JS_NewRuntime 函数会新建一个 JSRuntime rt，Runtime的结构体 JSRuntime
包含了内存分配函数和状态，原子大小 atom_size 和原子结构数组指针 atom_array, 记录类的数组 class_array,用于 GC 的一些链表 head，栈头 stack_top，栈空间大小（bytes）stack_size，当前栈帧 current_stack_frame，避免重复出现内存超出错误的 in_out_of_memory 布尔值，中断处理 interrupt_handler，module 读取函数 module_loader_func，用于分配、释放和克隆 SharedArrayBuffers 的 sab_funcs，Shape 的哈希表 shape_hash，创建一般函数对象外，还有种避开繁琐字节码处理更快创建函数对象的方法，也就是 Shape，创建 Shape 的调用链是 JS_NewCFunctionData -> JS_NewObjectProtoClass -> js_new_shape。创建 shape 的函数是 js_new_shape2，创建对象调用的函数是 JS_NewObjectFromShape。

创建的对象是 JSObject 结构体，JSObject 是 js 的对象，JSObject 的字段会使用 union,结构体和 union 的区别是结构体的字段之间会有自己的内存，而 union 里的字段会使用相同的内存，union 内存就是里面占用最多内存字段的内存。

union 使用的内存覆盖方式，只能有一个字段的值，每次有新字段赋值都会覆盖先前的字段值。JSObject 里第一个 union 是用到引用计数的，__gc_ref_count 用来计数，__gc_mark 用来描述当前 GC 的信息，值为 JSGCObjectTypeEnum 枚举。extensible 是表示对象能否扩展.

is_exotic 记录对象是否是 exotic 对象，es 规范里定义只要不是普通的对象都是 exotic 对象，比如数组创建的实例就是 exotic 对象。fast_array 为 true 用于JS_CLASS_ARRAY、JS_CLASS_ARGUMENTS和类型化数组这样只会用到 get 和 put 基本操作的数组。如果对象是构造函数 is_constructor 为 true。当 is_uncatchable_error 字段为 true 时表示对象的错误不可捕获。class_id 对应的是 JS_CLASS 打头的枚举值，这些枚举值定义了类的类型。原型和属性的名字还有 flag 记在 shape 字段，存属性的数组记录在 prop 字段。

JS_ClASS 开头定义的类对象使用的是 union，因为一个实例对象只可能属于一种类型。其中 JS_CLASS_BOUND_FUNCTION 类型对应的结构体是 JSBoundFunction，JS_CLASS_BOUND_FUNCTION 类型是使用 bind() 方法创建的函数，创建的函数的 this 被指定是 bind() 的第一个参数，bind 的其他参数会给新创建的函数使用。JS_CLASS_C_FUNCTION_DATA 这种类型的对象是 QuickJS 的扩展函数，对应结构体是 JSCFunctionDataRecord。JS_CLASS_FOR_IN_ITERATOR 类型对象是 for…in 创建的迭代器函数，对应的结构体是 JSForInIterator。

JS_CLASS_ARRAY_BUFFER 表示当前对象是 ArrayBuffer 对象，ArrayBuffer 是用来访问二进制数据，比如加快数组操作，还有媒体和网络 Socket 的二进制数据，ArrayBuffer 对应 swift 里的 byte array，swift 的字符串类型是基于 Unicode scalar 值构建的，一个 Unicode scalar 是一个21位数字，用来代表一个字符或修饰符，比如 U+1F600 对应的修饰符是 😀，U+004D 对应的字符是 M。因此 Unicode scalar 是可以由 byte array 来构建的。byte array 和字符之间也可以相互转换，如下面的 swift 代码：

typed_array 也就是类型化数组，其结构体是 JSTypedArray。类型化数组把实现分为 ArrayBuffer 对象缓冲，使用视图读写缓冲对象中的内容，视图会将数据转换成有类型的数组。

map_state 字段的结构体是 JSMapState，用来存放以下对象类型的状态：

