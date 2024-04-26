---
title: 如何在 JS 中使用 WASM 模块
publishDate: 2022/01/02
excerpt: WASM 存在的意义不在于它要颠覆 Javascript 生态，而在于更容易复用 C++/C 语言开发的那些模块。
tags: 
  - web
author: You
---

## 编程范式

WebAssembly 进行交互的编程范式基本都使用 `Promise`，其原因大概是因为不论是初始化，还是与其实例进行交互，都存在异步的过程。比如 `WebAssembly.instantiate` 的主要重载签名格式是：

```ts
Promise < ResultObject > WebAssembly.instantiate(bufferSource, importObject);
```

详见[这里](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/instantiate#%E4%B8%BB%E9%87%8D%E8%BD%BD%E6%96%B9%E5%BC%8F_%E2%80%94_%E4%BD%BF%E7%94%A8wasm%E4%BA%8C%E8%BF%9B%E5%88%B6%E4%BB%A3%E7%A0%81)。

## 如何初始化 wasm 模块

有两种方式，一种直接通过请求加载 `wasm` 模块，然后通过 `WebAssembly.instantiate` 方法来初始化， 它的 resolve 回调中的值得类型是 `WebAssembly.Module`，比如：

```javascript
fetch('foo.wasm')
  .then((response) => response.arrayBuffer())
  .then((bytes) => WebAssembly.instantiate(bytes))
  // module 的类型是 WebAssembly.Module
  .then(({ module }) => console.log(module));
```

另外一种是可以直接通过 `WebAssembly.compile` 对 `wasm` 模块的二进制源码进行编译，如下：

```javascript
fetch('foo.wasm')
  .then((response) => response.arrayBuffer())
  .then((bytes) => WebAssembly.compile(bytes))
  // module 的类型是 WebAssembly.Module
  .then((module) => console.log(module));
```

值得注意的是，`WebAssembly.instantiate` 的返回值包含 `WebAssembly.Module` 和它的第一个实例，因此它的类型是一个包含 `module` 字段和 `instance` 字段的对象，而 `WebAssembly.compile` 的返回值的类型本身就是 `WebAssembly.Module`。

## wasm 模块实例的构成

这里可以类比 es module 中的模块单元，一个 module 中通常包含使用 `import` 和 `export` 关键字来声明它的**引用**和**接口**。

wasm 也是类似的，它的 `import` 部分是通过 `WebAssembly.instantiate` 的第二个参数声明的，如下：

```javascript
const importObject = {
  imports: {
    imported_func: function (arg) {
      console.log(arg);
    }
  }
};

// 通过某种方式已经获取到了 bytes
WebAssembly.instantiate(bytes, importObject);
```

它的 `export` 部分则体现在模块实例的属性上，即 `WebAssembly.Instance.prototype.exports`，通常它的类型是一个对象，包含 `wasm` 模块中暴露出来的接口方法，比如 demo 中里例子，它的本质是调用 wasm 模块中暴露出来的 `greet` 方法。

## 使用开发者工具进行调试

chrome devtool 已经支持了对于 `wasm` 模块的调试，它的调试方法和 javascript 是类似的，这里就不赘述了。

值得注意的是，chrome devtool 并不是直接调试 `wasm` 模块，而是先把它反编译为一种叫做 `wat` 格式的文本，所以其中的代码都是 WebAssembly 中的各类指令，十分晦涩，同时作为胶水层，应当尽量避免直接调试 `wasm` 模块。

## 前端工程化

### 通过 wrapper es module

当前各类 bundler 对 wasm 模块均有良好的支持，这是因为在浏览器层面，它已经被原生支持，同时现在浏览器基本都实现了 `import()` 以及 `Fetch` 等特性，对于 bundler 来说，wasm 模块可以通过 `WebAssembly` 中的方法封装为一个独立的 wrapper es module，对于 bundler 来说，直接使用这个 wrapper es module 即可。

wrapper es module 通常是自动生成的，比如 demo 中 wrapper es module 是由 `wasm-pack` 库生成的。

### 通过 wasm 模块

不过像 `vite` 以及 `webpack` 本身，也可以直接通过特定的 `loader` 直接打包 wasm 模块，其原理是类似的，即在 bundle 中加入一个 runtime 脚本，这个脚本通过 `WebAssembly` 中的方法获取并初始化 wasm 模块。

在 `vite` 中，直接引入 wasm 模块的解析值是一个函数，这个函数本质上就是 runtime 脚本的入口，[详见](https://vitejs.dev/guide/features.html#webassembly)。
