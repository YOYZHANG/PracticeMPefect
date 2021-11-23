/*
 * Copyright (C) 2021 Alibaba Inc. All rights reserved.
 * Author: Kraken Team.
 */

#ifndef KRAKENBRIDGE_TIMER_H
#define KRAKENBRIDGE_TIMER_H

// 它是if not define 的简写，是宏定义的一种
// 实际上确切的说，这应该是预处理功能三种（宏定义、文件包含、条件编译）中的一种----条件编译。
#include "bindings/qjs/js_context.h"

namespace kraken::binding::qjs {

struct TimerCallbackContext {
  JSValue callback;
  JSContext* context;
  list_head link;
};

// 如果使用普通指针来创建一个指向某个对象的指针，那么在使用完这个对象之后，我们需要自己删除它。
// 智能指针的出现就是为了可以方便的控制对象的生命期
// 在智能指针中，一个对象什么时候和在什么条件下要被析构或者删除是受智能指针本身决定的

// unique_ptr 不共享其指针。 它不能复制到另一个 ，按值传递给函数
// 也不能在需要创建副本的任何 C++ 标准库算法 unique_ptr 中使用。
// 只能移动 unique_ptr。 这意味着，内存资源所有权将转移到另一 unique_ptr，并且原始 unique_ptr 不再拥有此资源。 
// 


void bindTimer(std::unique_ptr<JSContext>& context);

}  // namespace kraken::binding::qjs

#endif  // KRAKENBRIDGE_TIMER_H