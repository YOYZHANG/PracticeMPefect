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
