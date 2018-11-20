---
title: 高级 Vue 组件模式 (6)
tags:
  - js
  - vue
categories:
  - 原创
date: 2018-11-20 15:05:11
---

## 06 通过 Directive 增强组件内容

### 目标
之前的五篇文章中，`switch` 组件一直是被视为内部组件存在的，细心的读者应该会发现，这个组件除了帮我们提供开关的交互以外，还会根据当前 `toggle` 的开关状态，为 `button` 元素增加 `aria-expanded` 属性，以 `aira` 开头的属性叫作内容增强属性，它用于描述当前元素的某种特殊状态，帮助残障人士更好地浏览网站内容。

但是，作为组件调用者，未必会对使用这种相关属性对网站内容进行增强，那么如何更好地解决这个问题呢？答案就是使用 directive。

我们期望能够显示地声明当前的元素是一个 `toggler` 职能的组件或者元素，这个组件或者元素，可以根据当前 `toggle` 组件的开关状态，动态地更新它本身的 `aria-expanded` 属性，以便针对无障碍访问提供适配。

### 实现
#### 简单实现
首先创建一个 toggler 指令函数，如下：
```
export default function(el, binding, vnode) {
  const on = binding.value

  if (on) {
    el.setAttribute(`aria-expanded`, true);
  } else {
    el.removeAttribute(`aria-expanded`, false);
  }
}
```
这个指令函数很简单，就是通过传入指令的表达式的值来判定，是否在当前元素上增加一个 `aria-expanded` 属性。之后再 `app` 引入该指令，如下：
```
directives: {
  toggler
}
```
之后就可以在 `app` 组件的模板中使用该指令了，比如：
```
<custom-button v-toggler="status.on" ref="customButton" :on="status.on" :toggle="toggle"></custom-button>
```
一切都将按预期中运行，当 `toggle` 组件的状态为开时，`custom-button` 组件的根元素会增加一个 `aria-expanded="true"` 的内容增强属性。

Note: 这里关于指令的引入，使用的函数简写的方式，会在指令的 bind 和 update 钩子函数中触发相同的逻辑，vue 中的指令包含 5 个不同的钩子函数，这里就不赘述了，不熟悉的读者可以通过阅读官方文档来了解。

#### 注入当前组件实例
上文中的指令会通过 `binding.value` 来获取 `toggle` 组件的开关状态，这样虽然可行，但在使用该指令时，`custom-button` 本身的 prop 属性 `on` 已经代表了当前的开关状态，能否直接在指令中获取当前所绑定的组件实例呢？答案是可以的。指令函数的第三个参数即为当前所绑定组件的虚拟 dom 节点实例，其 componentInstance 属性指向当前组件实例，所以可以将之前的指令改版如下：
```
export default function(el, binding, vnode) {
  const comp = vnode.componentInstance;
  const on = binding.value || comp.on;

  if (on) {
    el.setAttribute(`aria-expanded`, true);
  } else {
    el.removeAttribute(`aria-expanded`, false);
  }
}
```
这样，即使不向指令传入表达式，它也可以自动去注入当前修饰组件所拥有的 prop 属性 on 的值，如下:
```
<custom-button v-toggler ref="customButton" :on="status.on" :toggle="toggle"></custom-button>
```

#### 提供更多灵活性
指令函数的第二个参数除了可以获取传入指令内部的表达式的值以外，还有其他若干属性，比如 name、arg、modifiers等，详细说明可以去参考官方文档。

为了尽可能地使指令保证灵活性，我们期望可以自定义无障碍属性 aria 的后缀名称，比如叫做 `aria-on`，这里我们可以通过 arg 这个参数轻松实现，改版如下：
```
export default function(el, binding, vnode) {
  const comp = vnode.componentInstance;
  const suffix = binding.arg || "expanded";
  const on = binding.value || comp.on;

  if (on) {
    el.setAttribute(`aria-${suffix}`, true);
  } else {
    el.removeAttribute(`aria-${suffix}`, false);
  }
}
```
可以发现，这里通过 `binding.arg` 来获取无障碍属性的后缀名称，并当没有传递该参数时，降级至 `expanded`。这里仅仅是为了演示，读者有兴趣的话，还可以利用 binding 对象的其他属性提供更多的灵活性。

### 成果
你可以通过下面的链接来看看这个组件的实现代码以及演示：
* sandbox: [在线演示](https://codesandbox.io/s/x3yj248w8w)
* github: [part-6](https://github.com/haoliangwu/advanced-vue-component-patterns/tree/part-6)

## 总结
关于指令的概念，我自身还是在 angularjs 中第一次见到，当时其实不兴组件化开发这个概念，指令本身的设计理念也是基于**增强**这个概念的，即增强某个 html 标签。到后来兴起了组件化开发的开发思想，指令似乎是随着 angularjs 的没落而消失了踪影。

但仔细想想的话，web 开发流程中，并不是所有的场景都可以拿组件来抽象和描述的，比如说，你想提供一个类似高亮边框的公用功能，到底如何来按组件化的思想抽象它呢？这时候使用指令往往是一个很好的切入点。

因此，当你面临解决的问题，颗粒度小于组件化抽象的粒度，同时又具备复用性，那就大胆的使用指令来解决它吧。