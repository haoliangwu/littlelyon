---
title: 在 2021 再看 js 的模块化规范
publishDate: 2021/08/06
excerpt: es module 已经成为公认的 js 模块化标准，但在 browser 和 nodejs 运行时下略有不同。
tags: 
  - js
author: You
---

当下由于 es module 在浏览器环境下的普及程度越来越广，像 snowpack 或者 vite 这种卖点为下一代 dev server 的工具也在实际生产中投入了使用，因此是时候重新来审视一下关于模块化的东西了。

## es module in nodejs

前端工程化的发展离不开 nodejs，而 commonjs 是 nodejs 不可分割的一部分，虽然 commonjs 可以通过转换为 umd 模块化的方式，在浏览器中运行，但这种方式的本质实际上是一种 workaround，它与未来的模块化发展方向南辕北辙。

因此，nodejs 在 `v8.5.0` 开始对 es module 提供支持，到目前为止的 `v16` 版本，对于 es module 的支持已经稳定包含在 nodejs 的底层实现中。

### nodejs 如何决定所使用的模块化规范

默认情况下，nodejs 会认为所有的 js 文件所使用的模块化规范都是 commonjs，除非开发者显式地按如下规则声明：

- js 文件的结尾以 `.mjs` 结尾
- js 文件的结尾以 `.js` 结尾，但它**邻近**的 `package.json` 中的 `type` 字段是 `module`
- `node` 命令接受的 `--input-type` 参数的值是 `module`

同样地，对于 commonjs，除了在默认情况下，也有独立的声明规则：

- js 文件的结尾以 `.cjs` 结尾
- js 文件的结尾以 `.js` 结尾，但它**邻近**的 `package.json` 中的 `type` 字段是 `commonjs`
- `node` 命令接受的 `--input-type` 参数的值是 `commonjs`

详细规范可参考官网[文档](https://nodejs.org/api/packages.html#packages_determining_module_system)。

### package 的入口

nodejs 下的 `package` 是通过 `package.json` 来划分的，最早的模块入口是指 `main` 字段所指向的文件，引入 es module 之后，新增了 `exports` 来实现更复杂的模块入口声明。

> 这里不要因为 `exports` 是 es module 中的关键字而认为它只与 es module 有关，事实上，它同样在 commonjs 规范下使用和生效。

> 当前社区的最佳实践是，cjs 入口通过 main 导出，而 mjs 入口通过 module 导出，[详见](https://nodejs.org/api/packages.html#packages_dual_commonjs_es_module_packages)。

同时，`exports` 的优先级比 `main` 高，你可以认为它是 `main` 字段的 override，且模块会具有**封装性。**封装性指的是模块只会那些在 `exports` 字段中声明的入口，这和 `main` 的行为有很大的不同，比如：

```json
// package.json
{
  "main": "./main.js",
  "exports": "./main.js"
}

// app.js
require('pkg/subpath.js') // throws an ERR_PACKAGE_PATH_NOT_EXPORTED error.
```

通常情况下，声明了 `exports` 之后再声明 `main` 会变得没有意义，但考虑某些情况下，需要兼容**低**版本的 nodejs 环境，`main` 可以当做一种 fallback 字段来指明模块的入口。

详细内容可参考官网[文档](https://nodejs.org/api/packages.html#packages_package_entry_points)。

### package 的环境隔离

如果开发单独在 nodejs 或 browser 环境下使用的 package 不会面临环境隔离的问题，但对于一些与运行时环境无感的 package，比如 `lodash` 或者 `ramda` 这种工具函数库，环境隔离是必须要考虑的事情。

由于历史原因，我们通常会把 commonjs 和 nodejs 关联起来，而将 es module 和 browser 关联起来，因此对于环境隔离问题的解决，实际上等同于如何对这两种模块化规范进行隔离。因此 `exports` 字段提供一些关键字来进行条件化映射：

- `import`：使用 `import` 或 `import()` 引入模块时的入口文件
- `require`: 使用 `require` 引入模块时的入口文件
- `node`: 在 nodejs 环境下，引入模块时的入口文件
- `default`：以上条件均不匹配时，引入模块时的入口文件，是一个 fallback 策略

比如，我们可以这样声明 `package.json`:

```json
// package.json
{
  "main": "./main-require.cjs",
  "exports": {
    // root
    "import": "./main-module.js",
    "require": "./main-require.cjs",
    // subpath
    "./feature": {
      // nested
      "node": {
        "import": "./feature-node.mjs",
        "require": "./feature-node.cjs"
      },
      "default": "./feature.js"
    }
  },
  "type": "module"
}
```

值得注意的时，这些关键字同时可以被用于 subpath，且可以在关键字中再次嵌套使用，同时官方文档建议，要用于声明一个 `default` 字段来作为 fallback 的入口文件。

除了以上 4 个关键字，node 命令还可以通过 `--conditions` 参数来传递自定义的关键字，比如：

> node --conditions=development main.js

这时，main.js 中引入的模块，则会优先使用 `exports` 中 `development` 关键字所对应的文件入口。

详细规范可参考官网[文档](https://nodejs.org/api/packages.html#packages_conditional_exports)。

### dual package 陷阱

dual 的意思是双重的意思，dual package 即指同时兼容 commonjs 与 es module 的 package。官方文档指出，由于当前的 nodejs 环境支持同时混合导入 `.cjs` 和 `.mjs` 的模块（无论是通过 require 还是 import），因此在一些期望场景会产生混淆和问题，比如：

- `pkg.cjs` 和 `pkg.mjs` 同时导出一个等价类，它们的实例通过 `instanceOf` 判定时，彼此互相为 false
- `pkg.cjs` 和 `pkg.mjs` 同时导出一个引用类型，它们的状态不会共享，彼此独立

解决的方案大体是也可以概括为以下两种：

- 模块代码**仅**使用 commonjs 或 es module 规范，然后对另一种要兼容的规范，暴露一个 wrapper 模块（适配器模式）
- 模块代码分别使用相应的规范，但对于需要共享状态或者共通代码，**仅**使用 commonjs 或 es module 规范，然后再模块代码中引用它们

详细内容可参考官网[文档](https://nodejs.org/api/packages.html#packages_dual_package_hazard)。

## es module in browser

现代浏览器基本都已经支持 es module 规范，因此离我们在生产环境中使用他它又进了一步，同时已经有诸如 snowpack 以及 vite 这样的下一代 dev server 为开发者提供更好的开发体验，这都是基于 es module 才能实现的。

当前浏览器对于 es module 的支持程度：<br />![es-module-in-browser](/images/talk-about-module-in-js-again/img1.png)

### import 语法的细微区别

browser 中的原生支持的 es module 语法，和当前已经广泛使用的 es module 大体上是相同的，但有一个细微的区别值得一提，即导入文件的后缀。当前在开发时，我们可能会写出下面这样的代码：

```javascript
import foo from './foo';
```

这在 browser 中是非法的语法，它会直接去服务端请求 `foo` 文件而非 `foo.js`，之所以当前我们可以省略文件后缀，是因为 bundler 帮我们填补了这部分工作。因此，上面的代码需改成：

```javascript
import foo from './foo.js';
```

同时 browser 中，不会像 nodejs 环境中那样，按照 `.mjs` 来区分当前文件是否使用的是 es module，而是通过 script 标签上的 `type="module"` 属性，因此文件后缀使用 `.mjs` 或者 `.js` 都是可以的（但要确保返回它们的响应都包含 `text/javascript` 的 MIME-type）。

引入 module 的名称，可以是相对的，也可以是绝对的，同时它也可以是外部域名，只要该域名支持跨域请求即可，但对于 `import React from 'react'` 是不行的，因为 `react` 不是一个合法的路径，因此在 vite 中，会将它转换为下面这样：

```javascript
import __vite__cjsImport2_react from '/node_modules/.vite/react.js?v=4f10f1c9';
```

另外一种解决方案是，使用 [Import Maps](https://caniuse.com/?search=import%20maps)，会通过 script 标签来声明一个模块解析的映射关系，比如:

```html
<script type="importmap">
  {
    "imports": {
      "react": "/node_modules/.vite/react.js"
    }
  }
</script>
```

这样当我们在使用 `react`来引入模块时，浏览器会自动根据这个 importmap 来解析需要请求的路径是什么，但遗憾的是，这个特性的兼容性还不尽人意，无法直接在大部分浏览器中使用。

### 加载 es module 与加载普通 scripts 的区别

> [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#other_differences_between_modules_and_standard_scripts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#other_differences_between_modules_and_standard_scripts)

- 通过 `file://` 来加载 es module 会引起 CORS 错误
- es module 自动会使用 js 中的[严格模式](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
- `defer` 关键字会自动应用于加载 es module 的 script 标签
- es module 被多次引用，但只会加载一次
- es module 的作用域是模块本身而非全局，因此你无法在 console 中直接输出它们
- es module 中的 `this` 是 `undefined`，而 scripts 中是 `window`

### es module 中的循环依赖

> [https://codesandbox.io/s/es-module-cyclic-dep-hbcxe](https://codesandbox.io/s/es-module-cyclic-dep-hbcxe?file=/foo.js)

es module 中对于循环依赖的处理能力是天然的，这得益于 `import` 和 `export` 语法是静态的，因此浏览器可以分析它们，从而解决循环依赖问题。

### 应对加载性能的下降潜在方案

这个加载性能下降的问题在 vite 中可以明显感觉到，即首次加载需发送上上百条请求至服务端请求 module，虽然当前我们是在开发环境，但这不意味这这个问题不需要解决，毕竟迟早 es module 是要使用在生产环境中的，相比较开发环境低延迟的网络环境，该问题只会更加明显。

通常优化加载性能的方案基本就是缓存、并发或者预加载，因此潜在的方案如下：

- 通过 `ref` 为 `modulepreload` 的 link 来预加载 es module，而非在引用时才加载（这得益于 es module 引用多次但只会加载一次的特点）
- 使用 HTTP2（并发请求无上限，且服务端可多次返回资源）
- 使用缓存
- es module 天生具有 `defer` 的特性，但 defer 会根据依赖关于阻塞后续 es module 的加载，如果它们之间没有依赖关于，可以使用 `async`
- 引入的 es module 尽量原子化，尽可能的少得引入没有使用到的外部依赖

```javascript
// bad
<script type="module">
  import _ from 'https://unpkg.com/lodash-es'
</script>

// good
<script type="module">
  import cloneDeep from 'https://unpkg.com/lodash-es/cloneDeep'
</script>
```

### 兼容性方案及未支持特性

es module 当前的实现，即使是现代浏览器，也存在部分未实现的功能，比如 [Import Maps](https://caniuse.com/?search=import%20maps)，另外对于未实现 es module 的浏览器的兼容方案要怎么做呢？

答案非常简单，请使用 [SystemJS](https://github.com/systemjs/systemjs)，把它看作运行时的 webpack 即可。

## es module 的兼容性

> [https://zhuanlan.zhihu.com/p/40733281](https://zhuanlan.zhihu.com/p/40733281) > [https://zhuanlan.zhihu.com/p/97335917](https://zhuanlan.zhihu.com/p/97335917)

这里所说的兼容性指的是 es module 与 commonjs 在模块的引入和导出之间的兼容性问题。

在排除动态导入的前提下，es module 规范当前支持两种导入方式和三种导出方式，如下：

```javascript
// 导出
export default 'hello world'; // default export
export const a = 1; // named export

// 导入
import lib from './lib'; // default import
import * as lib from './lib'; //
import { method1, method2 } from './lib';
```

而 commonjs 规范只有一种导入和导出方式，如下：

```javascript
// 导出
module.exports = { a: 1 };
// or
exports.a = 1;

// 导入
const lib = require('./lib');
```

因此这些语法之间的等效性替代就显的非常重要。

### named export

命名导出的兼容性无论对于 es module 还是 commonjs 都是很好的，比如：

```javascript
// lib.js
export const a = 1; // es module

module.exports = { a: 1 }; // commonjs

// app.js
import { a } from './lib';

const { a } = require('./lib');
```

`lib.js` 的声明方式无论采用哪种规范，都不会影响它在 `app.js` 的使用方式。

### default export

默认导出的兼容性就差强人意了，如下：

```javascript
// lib.js
export default 'hello wolrd';

module.exports = 'hello world';

// app.js
import lib from './lib';

const lib = require('./lib'); // 当 lib 使用 es module 规范时为 undefined
```

对于 `require('./lib')`，需要改写为 `require('./lib').default` 才能使代码正常工作，这是因为一些 compiler 会尝试用 named export 的实现方式来兼容 default export。但这种改写反过来也会在 commonjs 规范下产生问题，因此 React 源码中才会有下面这段 hacky 的代码：<br />![the-hack-for-export-default](/images/talk-about-module-in-js-again/img2.png)

### 最佳实践

因此，为了最大化模块的兼容性，请尽可能的采纳以下建议：

- 非 dual package 请采用单一模块规范，同时使用相同规范的 lib package
- dual package 在 es module 下，暴露公共接口时不用 default export，或使用 `rollup` 的 `auto` 模式
  - 即使打包使用的是 `rollup`，也需要使用者配置 `esModuleInterop: true`，增加了配置门槛
- dual package 如果难以改写，可以使用类 React 中的兼容方案，实现一个 wrapper module
