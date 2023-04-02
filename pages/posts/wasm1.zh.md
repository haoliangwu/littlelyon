---
title: WebAssembly 预备知识
date: 2021/12/30
description: 关于学习 WASM 之前，需要掌握的一些基本概念。
tag: web-development
author: You
---

## 介绍
> WebAssembly 是一种新的编码方式，可以在现代的网络浏览器中运行 － 它是一种低级的类汇编语言，具有紧凑的二进制格式，可以接近原生的性能运行，并为诸如 C / C ++ 等语言提供一个编译目标，以便它们可以在Web上运行。它也被设计为可以与 JavaScript 共存，允许两者一起工作。


![what-is-wasm](/images/wasm/img1.png)

## 栈（stack）
栈是经典的数据结构，它经常被用于抽象固定长度、线性的内存模型，它的特点是**先进后出**（First In, Last Out, aka FILO）。对于出栈入栈的操作，通常我们使用 **push **和 **pop **两个术语来描述，如下图：

![what-is-stack](/images/wasm/img2.png)<br />同样的，为了方便衡量当前入栈的元素有多少，还有一个叫做 **top **的概念，它代表栈的深度（或高度），在如上图中：

- 依次 push 3 个元素的话，stack 的 top 会变为 3
- 再 pop 1 个元素之后，stack 的 top 变为 2

## S 表达式（S-exp）
S 表达式是一种表达嵌套数据格式的语法，举个例子，当我们想表达 5 乘以 3 和 7 的和时，数学表达式如下：
> 5 * ( 3 + 7 )


而使用 S 表达式则为：
> (* 5 ( + 7 3))


可以发现，S expression 倒置了计算操作符和数字的顺序，同时增加了额外的括号，这使它的可读性相比数学表达式下降了不少，但与栈配合起来，它可以非常便捷地来描述运算过程而忽略运算的顺序，如下：

- * 5 + **7 3**
- * **5 10**
- 50

这种表达方法，也被称作**波兰表示法**，或者**前缀表示法**。

## ArrayBuffer vs TypedArray
> [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays)


从语言的角度讲，ArrayBuffer 存在的意义在于增强 JS 对于字节流数据（即二进制数据）的处理能力。

二进制数据实际上可以理解为是内存中的一大片数据，但是内存中的数据是不能直接使用的，JS 在和内存数据打交道时，会通过 TypedArray 来维护这些数据，比如 `Uint32Array`，`Int16Array` 等等。这些 TypedArray 好比一个 view，通过这个 view，JS 就可以来维护内存中的数据。

![what-is-ArrayBuffer](/images/wasm/img3.png)

由于这些 view 共享的内存都是 ArrayBuffer 中声明的那个内存，因此使用不同的 view 来看某一块数据会有些不同，比如下面的代码：
```javascript
const buffer = new ArrayBuffer(8);
const a = new Int8Array(buffer);
const b = new Int16Array(buffer);

b[2] = 256

console.log(b) // [0, 0, 256, 0]
console.log(a) // [0, 0, 0, 0, 0, 1, 0, 0]
```
可以发现，`a` 由于是 `Int8Array` 的实例，其元素的值的范围是 -128 ~ 127，因此在解析 256 时会发生越界，128 会解析为 -128，129 会解析为 -127，以此类推，256 正好等于 127 + 128 + 1，因此 `a[5]` 的值为 1。

反过来如果通过 `Int16Array` 来解析 `Int8Array` 的值得话，比如：
```javascript
a[0] = 1
a[1] = 1

console.log(b) // [257, 0, 0, 0]
```
虽然这样做不会发生越界问题，但由于 `a[0]` 所表示的数据，在 `Int16Array` 中，相当于 `b[0]` 中数据的第 9 位，所以 `b[1]` 的值为 257。

257 的按 16 位的二进制数表示为 `00000001 00000001`，转换为十进制数的过程是:
> 2 ** 8 + 1 = 256 + 1 = 257


值得一提的是，`TypedArray` 虽然名字中包含 `Array`，但调用 `Array.isArray` 的返回值确实 `false`，同时一些 `Array` 的常见原型方法也没有，比如 `pop` 和 `push`。


