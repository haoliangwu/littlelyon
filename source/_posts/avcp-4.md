---
title: 高级 Vue 组件模式 (4)
tags:
  - js
  - vue
categories:
  - 原创
date: 2018-11-20 15:04:55
---

## 04 使用 slot 替换 mixin

### 目标
在第三篇文章中，我们使用 mixin 来抽离了注入 `toggle` 依赖项的公共逻辑。在 react 中，类似的需求是通过 HOC 的方式来解决的，但是仔细想想的话，react 在早些的版本也是支持 mixin 特性的，只不过后来将它标注为了 deprecated。

mixin 虽然作为分发可复用功能的常用手段，但是它是一把双刃剑，除了它所带来的便利性之外，它还有以下缺点：
* 混入的 mixin 可能包含隐式的依赖项，这在某些情况下可能不是调用者所期望的
* 多个 mixin 可能会造成命名冲突问题，且混入结果取决于混入顺序
* 使用不当容易使项目的复杂度呈现滚雪球式的增长

所以是否有除了 mixin 以外的替代方案呢？答案当时也是有的，那就是使用 vue 中提供的作用域插槽特性。

### 实现
这里关于作用域插槽的知识同样不赘述了，不熟悉的读者可以去官方文档了解。我们可以在 `toggle` 组件模板中的 `slot` 标签上将所有与其上下文相关的方法及属性传递给它，如下：
```
<div class="toggle">
  <slot :status="status" :toggle="toggle"></slot>
</div>
```

这样，我们可以通过 slot-scope 特性将这些方法和属性取出来，如下：
```
<template slot-scope="{status, toggle}">
  <custom-button :on="status.on" :toggle="toggle"></custom-button>
  <custom-status-indicator :on="status.on"></custom-status-indicator>
</template>
```

当然，相比上一篇文章，我们需要对 `custom-button` 和 `custom-status-indicator` 组件做一些简单的更改，只需要将混入 mixin 的逻辑去掉，并分别声明相应的 props 属性即可。

### 成果
通过作用域插槽，我们有效地避免了第三方组件由于混入 toggleMixin 而可能造成的命名冲突以及隐式依赖等问题。

你可以通过下面的链接来看看这个组件的实现代码以及演示：
* sandbox: [在线演示](https://codesandbox.io/s/4379n8v96w)
* github: [part-4](https://github.com/haoliangwu/advanced-vue-component-patterns/tree/part-4)

## 总结
mixin 虽好，但是一定不要滥用，作为组件开发者，可以享受它带来的便利性，但是它对于组件调用者来说，可能会造成一些不可预料的问题，通过作用域插槽，我们可以将这种问题发生的程度降到最小，同时解决 mixin 需要解决的问题。