---
title: snowpack 架构解析
publishDate: 2021/06/02
excerpt: snowpack 作为下一代 dev server，旨在提供一套“无需”打包过程的 web 构建配套设施，其卖点就一个字，快。
tags:
  - js
author: You
---

## esm 模块规范

> [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)

模块内引入语法：<br />

```javascript
import defaultExport from "module-name";
import * as name from "module-name";
import { export1 } from "module-name";
import { export1 as alias1 } from "module-name";
import { export1 , export2 } from "module-name";
import { foo , bar } from "module-name/path/to/specific/un-exported/file";
import { export1 , export2 as alias2 , [...] } from "module-name";
import defaultExport, { export1 [ , [...] ] } from "module-name";
import defaultExport, * as name from "module-name";
import "module-name";
var promise = import("module-name");
```

外部引入语法

```html
// 对于非现代浏览器，会无视 type="module" 的 script 标签
<script type="module" src="main.js"></script>
// 对于现代浏览器，会无视 nomodule 的 script 标签
<script nomodule src="fallback.js"></script>
```

`import maps`

> [https://github.com/WICG/import-maps#the-basic-idea](https://github.com/WICG/import-maps#the-basic-idea)

## dev server 伺服结构

![the-dir-of-dev-server](/images/snowpack/img1.png)

- **snowpack**: snowpack 内置 module，比如 env.js 为提供环境变量的 module，hmr.js 为提供热更新功能的 module
- _dist_: 项目中的 module
- web_modules: 编译后的可以在 browser 中直接引入使用的第三方 module（基本上来源于 node_modules）

可以发现，snowpack 所构建的开发环境，完全依赖于 browser 提供的 module 环境中，同时由于该 module 环境遵守 es 中的规范，势必会在未来推广开来，不遵守规范的 module 会被逐渐淘汰，这也是 web_modules 目录存在的原因，当前由于模块规范混乱，node_modules 中的模块不一定统一遵守 es module 标准规范编写。

## HMR 

提出并使用 [esm-hmr](https://github.com/pikapkg/esm-hmr) 规范，其核心动机如下：

> Web bundlers like Webpack, Rollup, and Parcel all implemented different, bundler-specific HMR interfaces. This makes it hard to share HMR integrations across dev environments. As a result, many framework integrations like React Fast Refresh and Preact's Prefresh need to be rewritten for every bundler that they'd like to support.

翻译版本：

> Webpack、Rollup 以及 Parcel 这些 web 打包器对于 HMR 功能的实现各不相同，其主要体现在，实现方式不同，HMR 接口定义不同。这使得在多套开发环境中，集成 HMR 变得十分困难，正因如此，需要框架在集成 HMR 功能时，需要针对不同的打包器编写不同的适配逻辑。

规范本身并不复杂，主要涉及 HMR api 的通用 interface 结构以及一些示例，值得一提的是，vue 的作者也参与该规范的制定，并将该规范应用于 [vite](https://github.com/vitejs/vite) 这个项目（和 snowpack 做相同的事情，但为 vue 而存在）中。

## module 的编译方式

snowpack 的编译方式不像传统的 dev server，每次启动前，将所有需要打包的资源都编译好（除了显示通过动态加载语法声明的那些），而是仅编译页面可运行的最小单元。

由于 module 系统本身建立在 browser 之内，每个 module 的加载都是依赖于单挑请求和资源 url 的，这就给了snowpack 可以在 browser 请求资源的过程中，对资源请求进行拦截，针对其扩展名，进行编译，再返还给 browser 的机会。

在 snowpack 中，这个过程是通过在它的配置文件中声明 build scripts 的方式进行的，比如：

```json
{
  "scripts": {
    // Pipe every .css file through PostCSS CLI
    "build:css": "postcss",
    // Pipe single .js or .jsx file through Babel CLI
    "build:js,jsx": "babel --filename $FILE"
  }
}
```

除了 `build:*` 这种构建类型的 build scripts 之外，还有以下几种类型：

- `run:*` : 执行某个 bash 命令，比如 lint
- `mount:*` : 加载某个 folder 作为可加载的静态资源
- `proxy:*` : 代理功能，以解决 CORS 问题

除了通过 build scripts 的方式以外，还可以使用 build plugins 的方式，内容较多，且较独立，这里就暂且跳过了。但对于使用 build scripts 还是 build plugins，可以参考[这里](https://www.snowpack.dev/#plugin-vs-script%3F)。

## module 的加载方式

snowpack 内部会针对不同类型的 module 封装不同的 module proxy，大体如下图：<br />![the-module-proxy](/images/snowpack/img2.png)<br />其原理是这样的，就是通过脚本的方式，将其他类型的资源注入到上下文环境中。

比如 `css` 资源，module proxy 核心源码如下：

```javascript
const code =
  '.App {\n  text-align: center;\n}\n\n.App-logo {\n  height: 40vmin;\n  pointer-events: none;\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  .App-logo {\n    animation: App-logo-spin infinite 20s linear;\n  }\n}\n\n.App-header {\n  background-color: #282c34;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  font-size: calc(10px + 2vmin);\n  color: white;\n}\n\n.App-link {\n  color: #61dafb;\n}\n\n@keyframes App-logo-spin {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n}\n';

const styleEl = document.createElement('style');
const codeEl = document.createTextNode(code);
styleEl.type = 'text/css';

styleEl.appendChild(codeEl);
document.head.appendChild(styleEl);
```

逻辑十分简单，就是将 `css` 代码通过动态创建 `style` 标签的方式，拼接在 head 中。

再来看 `.svg` 图片的 module proxy 代码：

```javascript
export default '/_dist_/logo.svg';
```

简单不要太简单，因为图片在 browser 中，本身就是一个字面量，只需要赋值给 `src` 标签即可获取到指定的图片资源，编译后的 App.js 文件部分源码如下：

```javascript
import logo from './logo.svg.proxy.js';

React.createElement('img', {
  src: logo,
  className: 'App-logo',
  alt: 'logo'
});
```

## 生产环境打包

snowpack 本身并不是为了成为下一个 webpack，它只是为了解决 dev server 启动慢，开发体验不尽人意的问题，因此针对生产环境的打包工作，虽然它本身也可以完成，但考虑打包过程除了编译之外，还有很多其他工作需要考虑，比如：

- minify 代码
- 公共代码抽离
- tree-shaking

这些工作显然 webpack 或者 rollup 它们做得更好，所以 snowpack 以插件机制将打包过程适配到这些主流打包框架中，让它们来完成生产环境打包工作。
