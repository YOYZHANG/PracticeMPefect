## context & isolates
isolate 是一个完整的 v8 实例，有着完整的堆栈和Heap
context 是一个上下文，所有的js代码都在某个v8 context中运行

一个Isolate是一份独立的V8 runtime, 包括但不限于一个heap管理器，垃圾回收器等。在一个时间段内，有且只有一个线程能使用此isolate。不过，多个线程可以同时使用多个isolate。

单独的Isolate是不足以运行脚本的，我们在此需要一个全局对象。Context就是提供此全局变量的工具。它在其所处的Isolate管理的heap中建立一个对象，并以此为全局变量构建出一个完成的执行环境供我们的脚本使用。

因此，对于一个给定的Isolate, 不仅其可以有多个Context，并且这些Context之间可以共享某些对象。

V8的官方文档告诉我们，我们可以随时在代码中步入任意一个Context:

## handle && handle scope
Handle，简单的说，是对一个特定JS对象的索引。
它指向此JS对象在V8所管理的Heap中的位置。需要注意的是，Handle不存于Heap中，而是存在于stack中。只有一个Handle被释放后，此Handle才会从stack中推出。这就带来一个问题，在执行特定操作时，我们可能需要声明很多Handle。如果要一个个手动释放，未免太麻烦。为此，我们使用Handle Scope来集中释放这些Handle。

Handle Scope，形象的说是一个可以包含很多Handle的工作区。当这个工作区Handle Scope被移出堆栈时，其所包含的所有Handle都会被移出堆栈，并且被垃圾管理器标注，从而在后续的垃圾回收过程快速的定位到这些可能需要被销毁的Handle。

Handle有几种类型:

Local Handle
Persistent Handle
UniquePersistent Handle
Eternal Handle

## Templates
Templates用于在C++中自定义一个JS函数。它有两种类型：

- Function Template: 用于生成 JS 函数的C++对象。
- Object Template: 每一个Function Template都有一个对应的Object Template。当一个Function Template对应的JS函数被当作构造器创建对象时，V8会实际使用Object Template来实例化此对象。

我们可以用一个具体的例子来理解Template。在V8源码的Samples中，我们可以找到process.cc以及count-host.js文件。因为count-host.js非常简短，那么直接摘抄如下:

```JS
function Initialize() { }

function Process(request) {
  if (options.verbose) {
    log("Processing " + request.host + request.path +
        " from " + request.referrer + "@" + request.userAgent);
  }
  if (!output[request.host]) {
    output[request.host] = 1;
  } else {
    output[request.host]++
  }
}

Initialize();
```

全局对象生成：事先用Template 在 c++ 中生成对应的 c++ 
对象或者函数，然后注入到此 js 作用域的全局对象中，同时，我们定义的这个Process函数同样可以在c++中被获取和使用

v8 是如何做到的呢？
Function Template
```c++

HandleScope handle_scope(GetIsolate());    

// Create a template for the global object where we set the
// built-in global functions.
Local<ObjectTemplate> global = ObjectTemplate::New(GetIsolate());

// 这是最重要的一行。LogCallback是一个原生的C++函数。
// 通过使用FunctionTemplate，V8可以将其绑定到JS环境下的log函数。
global->Set(String::NewFromUtf8(GetIsolate(), "log", 
          NewStringType::kNormal).ToLocalChecked(),
          FunctionTemplate::New(GetIsolate(), LogCallback)); 
```

### Object template

ObjectTemplate是一个JS对象在C++中的模版。

这个ObjectTemplate会有属性值，这些属性值可以是静态变量，也可以是动态变量。在V8中，这两种区别会使用不同的方法来设置一个ObjectTemplate的属性值。

我们依旧像上段代码一样，想要给JS上下文提供一个global作为全局对象。global本身是一个ObjectTemplate的实例。

** 静态变量 **
假设我们想要暴露一个静态变量x做为global的一个属性值。

我们可以使用SetAccessor方法来实现这一点。SetAccessor是给一个ObjectTemplate设置属性的一种方法，其细节在此不表，但它给JS提供了访问C++对象属性的能力。

```cpp
HandleScope handle_scope(GetIsolate());    
Local<ObjectTemplate> global_templ = ObjectTemplate::New(isolate);
global_templ->SetAccessor(String::NewFromUtf8(isolate, "x"), XGetter, XSetter); // x的值由XGetter提供，而XSetter则可以将JS中对x值的修改反映到C++中。
Persistent<Context> context = Context::New(isolate, NULL, global_templ);
```

** 动态变量 **
在设置动态变量时，我们需要一个媒介来让JS获取到我们的动态变量。这个媒介被称为External Value， 其是对一个动态变量的简单封装。我们可以在下面代码中看到其在process.cc的应用：

```cpp
// 我们可以看到，opts和output都是动态变量
bool JsHttpRequestProcessor::InstallMaps(map<string, string>* opts,
                                         map<string, string>* output) {
  HandleScope handle_scope(GetIsolate());

  // 因为opts是动态变量，我们需要将其封装起来。
  // 在源文件中，封装函数名为WrapMap。为了方便讲解，我直接提取其流程于下方。
  // 这是源码中的代码: Local<Object> opts_obj = WrapMap(opts)
  
  // 下面是提取WrapMap后的代码
  Local<ObjectTemplate> templ = ObjectTemplate::New(isolate);
  // 下面这一行非常关键
  // 它相当于提供了一个指针，至于指向什么，请继续向下看
  templ->SetInternalFieldCount(1); 
  templ->SetHandler(NamedPropertyHandlerConfiguration(MapGet, MapSet)); // 这一样类似SetAccessor

  // Create an empty map wrapper.
  Local<Object> result = templ->NewInstance(GetIsolate()->GetCurrentContext()).ToLocalChecked();

  // 在这里，我们的opts被封装进了map_ptr这个External Value中
  Local<External> map_ptr = External::New(GetIsolate(), opts);

  // 就这样，Internal Field的第一个位置指向了我们的动态变量opts所在的External Value
  result->SetInternalField(0, map_ptr);  
}
```