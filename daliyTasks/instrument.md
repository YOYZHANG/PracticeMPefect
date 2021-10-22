# 函数插桩
istanbul 在每一个 statement, 每一个 function 和每一个 branch 都做了计数，挂载在全局变量上。

## 基于 AST 进行插桩
通过 esprima 把代码 parse 成 AST，然后对 AST 进行插桩。

插桩代码分为两部分，一部分是初始化全局对象的代码，一部分是每个分支，语句，函数的计数代码。

part 1:
istanbul 初始化了全局的 coverState 对象用于统计
最后把 coverState 变成字符串加入到代码里

part 2:
分支、语句、函数的插桩:
遍历 AST，在不同的位置插入计数代码的 AST

## require hook 实现透明函数插桩
nodejs 的模版加载分为：load、extension['.js']、compile

通过修改了 extension['.js'] 方法，在这里面做了函数插桩，之后执行的代码就是转换过后的了，开发者根本感知不到

jest 和 karma 都基于 istanbul 实现了覆盖率检测。覆盖率统计的原理就是函数插桩，基于 AST 在代码的 statement、function、branch 处插入计数代码，同时通过 require hook 实现了透明的转换。这样代码一执行就能拿到统计数据，自然就可以算出覆盖率了。