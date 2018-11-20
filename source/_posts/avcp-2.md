---
title: 高级 Vue 组件模式 (2)
tags:
  - js
  - vue
categories:
  - 原创
date: 2018-11-20 15:04:50
---

## 02 编写复合组件

### 目标
我们需要实现的需求是能够使使用者通过 `<toggle>` 组件动态地改变包含在它内部的内容。

熟悉 vue 的童鞋可能马上会想到不同的解决方案，比如使用 `slot` 并配合 `v-if`，我们这里采用另外一种方法，利用 vue 提供的 `provide/inject` 属性按照复合组件的思想来实现。

这里简单介绍下 `provide/inject` 的功能，它允许某个父组件向子组件注入一个依赖项（这里的父子关系可以跨域多个层级，也就是祖先与后代），如果我们在其他 mvvm 框架对比来看的话，你可以发现其他框架也具有相同的特性，比如：
* angularjs: directive 中的 `require` 属性来声明注入逻辑
* Angular: 依赖注入中组件级别的注入器
* React: context 上下文对象

想进一步了解的话，可以参考[官方文档](https://cn.vuejs.org/v2/api/#provide-inject)

### 实现
在 vue 中，这里我们会分别实现三个组件，依次为：
* `toggle-button`: 代表开关，用来渲染父组件的开关状态
* `toggle-on`: 根据父组件 toggle 的开关状态，渲染当状态为**开**时的内容
* `toggle-off`: 根据父组件 toggle 的开关状态，渲染当状态为**关**时的内容

在上一篇文章中，我们已经实现了 toggle 组件，这里我们要做一些更改。首先，需要使用 provide 属性增加一个提供依赖的逻辑，如下：
```
provide() {
    return {
      toggleComp: {
        status: this.status,
        toggle: this.toggle
      }
    }
}
```

这里的 status 是该组件 data 中的声明的一个可监听对象，这个对象包含一个 on 属性来代表组件的开关状态，而 toggle 则是 methods 中的一个组件方法。

关于为什么这里不直接使用 on 属性来代表开关状态，而使用一个可监听对象，是因为 `provide` 和 `inject` 绑定并不是可响应的，同时官方文档也指出，这是刻意而为，所以为了享受到 vue 响应性带来的便利性，我们这里传入 status 这个可监听对象。

对于其他三个组件，其内部实现逻辑十分简单，相信读者通过参考在线代码实例马上就能看懂，这里只提一下关于 `inject` 声明注入依赖的逻辑，如下：
```
inject: { toggleComp: "toggleComp" }
```

这里的 `"toggleComp"` 与之前的 provide 对象中声明的 key 值所对应，而 inject 对象的 key 值当前组件注入依赖项的变量名称，之后，子组件即可以通过 `this.toggleComp` 来访问父组件的属性与方法。

## 成果
通过复合组件的方式，我们将 `toggle` 组件划分为了三个更小的、职责更加单一的子组件。同时由于 `toggle-on` 和 `toggle-off` 都使用 slot 来动态地注入组件调用者在其内部包含的自定义渲染逻辑，其灵活性得到了进一步的提升，只要这三个组件是作为 `toggle` 组件的子组件来调用，一切都将正常运行。

你可以通过下面的链接来看看这个组件的实现代码以及演示：
* sandbox: [在线演示](https://codesandbox.io/s/n021zrjy6j)
* github: [part-2](https://github.com/haoliangwu/advanced-vue-component-patterns/tree/part-2)

## 总结
通常情况下，在设计和实现职能分明的组件时，可以使用这种模式，比如 tabs 与 tab 组件，tabs 只负责 tab 的滚动、导航等逻辑，而 tab 本身仅负责内容的渲染，就如同这里的 toggle 和 toggle-button、toggle-on、toggle-off 一样。