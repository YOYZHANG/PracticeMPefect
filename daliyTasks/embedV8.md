不能从声明了 handle scope 的函数中直接返回一个 local handle
否则在function return 前这个变量就会被删掉。合适的方法来返回一个
local handle 是 construct 一个 escapableHandleScope 来代替 handleScope, 并且在 handle scope 上调用 escape 方法，传递在你想要返回的
handle中。

你可以用 template 来包裹 c++ function 和 数据结构，从而他们可以被js 脚本操作。
例如， chrome 利用 templates 来包裹 c++ DOM 节点并将其安装到全局 namespace 中。你可以创建一系列的 templates, 但是你在指定的 context 中只能有一个 template 实例。

在 js 中，function 和 objects 有很强的关联，在 java或c++ 中创建一个类, 会定义一个新的 class. 在 js 中会创建一个函数，并且用 function作为构造函数创建实例。布局和js对象的函数特性，与function紧密的联系，这与 v8 template 的工作方式有很大联系，有两种类型的 templates：
- Function templates
对应一个单独的函数，可以创建函数或其回调
- Object templates
每个function template 有一个相关的 object template. 这用来设置用这个函数作为构造函数创建的对象，你可以用 object templates 联系两种类型的 c++ callbacks:

-- 访问器callbacks 被 invoke, 当具体的 object property 被 js access
-- 拦截器callbacks 被 invoke, 当 object 被 js access

以下代码提供了为全局对象创建模板并设置内置全局函数的示例

```c++
v8::Local<v8::ObjectTemplate> global = v8::ObjectTemplate::New(isolate);

global->Set(v8::String::NewFromUtf8(isolate, "log"),
            v8::FunctionTemplate::New(isolate, LogCallback));

// Each processor gets its own context so different processors
// do not affect each other.
v8::Persistent<v8::Context> context =
    v8::Context::New(isolate, nullptr, global);
```
Note that the object template in the code above is created at the same time as the context. The template could have been created in advance and then used for any number of contexts.


## accessors
accessor 是 c++ callback，calculates and returns a value when an object property is accessed by a JavaScript script.
accessor 在 object template 里被设置，使用 setAccessor 方法。
这个 method 使用 属性的名称

这个 accessor functions 把 c++ integer 转换成
js integer using Integer::NEW, 将 js integer 转换成 c++ integer using Int32Value

```c++
void XGetter(v8::Local<v8::String> property,
              const v8::PropertyCallbackInfo<Value>& info) {
  info.GetReturnValue().Set(x);
}

void XSetter(v8::Local<v8::String> property, v8::Local<v8::Value> value,
             const v8::PropertyCallbackInfo<void>& info) {
  x = value->Int32Value();
}

// YGetter/YSetter are so similar they are omitted for brevity

v8::Local<v8::ObjectTemplate> global_templ = v8::ObjectTemplate::New(isolate);
global_templ->SetAccessor(v8::String::NewFromUtf8(isolate, "x"),
                          XGetter, XSetter);
global_templ->SetAccessor(v8::String::NewFromUtf8(isolate, "y"),
                          YGetter, YSetter);
v8::Persistent<v8::Context> context =
    v8::Context::v8::New(isolate, nullptr, global_templ);
```

若要实现动态变量绑定
为了使任意数量的C++ point实例暴露给JavaScript，我们需要为每一个C++ point创建一个JavaScript对象，并且连接JavaScript对象和C++实例。例子中就是需要将外部值和内部对象域进行连接/ 首先为point包装对象创建一个对象模板

https://juejin.cn/post/6866015512192876557

c++ 要引用 v8 heap object ，要用 v8 api 提供的这些叫做 handle （句柄） 的东西引用。
一般就这两种 handle ：

v8::Local<T>
v8::Persistent<T>

v8::Persistent<T> 一般用来，一直存着 v8 heap object 的引用，比如放在 c++ 类的成员属性中，存着。

v8::Local<T> 一般是最大量的，临时的东西，

比如

js 实现
var a = 1;
var b = 2;
var xx = a + b;

如果改用 c++ 实现他们，
那么要用 c++ 在 v8 heap 里创建  
heap object a ，值为 1
heap object b ，值为   2、
heap object xx  值为   a + b

c++ 代码做这些事情时，大体好像都要用   v8::Local<T> 来指向 a 、b 、xx

int add() {
    int a = 1;
    int b = 3;
    int c = a + b;
    return c;
}

我们能知道， a 、 b 、c 这些变量，的生命期，都是依据 cpp stack 的
再 stack frame 上分配，add 函数退出则 a b c 销毁

但是假如我写，

v8::Local<v8:Value> add() {

    v8::Local<v8:Value> a = createNumberInV8(1);
    v8::Local<v8:Value> b = createNumberInV8(2);
    v8::Local<v8:Value> c = addInV8(a, b);

    return c;
}

a b c 实际存在在 v8 heap 里，不是在 cpp stack 上分配空间那种。
那么 a b c 的销毁，是听 v8 gc 的。

v8::Local<v8:Value> add(Isolate* isolate) {

    v8::HandleScope hahaha_scope(isolate);

    v8::Local<v8:Value> a = createNumberInV8(1);
    v8::Local<v8:Value> b = createNumberInV8(2);
    v8::Local<v8:Value> c = addInV8(a, b);

    return c;
}

isolate 上，维护了个像是 “ 栈 ” 的东西，手写出来的 “ 栈 ”，不是 cpp function 那种底层的栈。
然后，不管任何地方，莫名其妙的调用一句
    v8::HandleScope hahaha_scope(isolate);

就表示，在这个 isolate 上，那个 “ 栈 ” 多加出一个 stack frame （我们就叫他 hahaha_scope 吧，就上面代码里那个 hahaha_scope ），

然后，后续所有用 v8 api 创建的 heap object 的 “ v8::Local<> ” 这种 句柄

都被持有在这个hahaha_scope 上。

add(Isolate* isolate) {
    // ...
    v8::HandleScope hahaha_scope(isolate);
    // ...
}

这句v8::HandleScope hahaha_scope(isolate);
本质不是函数调用，而是，
在 add 的 cpp call stack 中创建一个变量，
变量名: hahaha_scope
变量类型: v8::HandleScope
变量的构造函数参数: isolate

变量创建的构造函中，会进行刚才说的 “ isolate 上维护的那个 “ 栈 ” 多加出一个 stack frame ”

而 hahaha_scope 这个变量本身生命周期，
是按照 cpp 规则，跟随 cpp call stack 走，
也就是，
如果 add 函数退出，则 hahaha_scope 这个变量，按照 cpp 规则会被析构，
从而，hahaha_scope 所代表的那个 “ isolate 上维护的那个 “ 栈 ” 的 stack frame ” ，
也会在 hahaha_scope 析构函数中，被释放。

从而，维护在那个 stack frame  上的所有 v8::Local<> 句柄，都被释放，
从而， c++ 不再对 a b c 这些 v8 heap object 引用
从而， v8 gc 能在他认为合适的时候，释放 a b c 他们

