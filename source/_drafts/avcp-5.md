---
title: 高级 Vue 组件模式 (5)
tags:
  - js
  - vue
categories:
  - 原创
---
## 05 使用 $refs 访问子组件引用

### 目标
在之前的文章中，详细阐述了子组件获取父组件所提供属性及方法的一些解决方案，如果我们想在父组件之中访问子组件的一些方法和属性怎么办呢？设想以下一个场景：

* 当前的 custom-button 组件中，有一个 input 元素
* 我们期望当 toggle 的开关状态为**开**时，显示 input 元素并自动获得焦点

这里要想完成目标，需要获取某个组件或者每个元素的引用，在不同的 mvvm 框架中，都提供了相关特性来完成这一点：
* angularjs: 可以使用依赖注入的 $element 服务
* Angular: 可以使用 ViewChild、ContentChild 或者 template ref 来获取引用
* react: 使用 `ref` 属性声明获取引用的逻辑

在 vue 中，获取引用的方法与 react 类似，通过声明 `ref` 属性来完成。

### 实现
首先，在 `custom-button` 组件中增加一个 input 元素，如下：
```
<input v-if="on" ref="input" type="text" placeholder="addtional messages">
```
注意这里的 `ref="input"`，这样在组件内部，可以通过 `this.$refs.input` 获得该元素的引用，为了实现目标中提及的需求，再添加一个新的方法 `focus` 来使 input 元素获取焦点，如下：
```
focus() {
  this.$nextTick(function() {
    this.$refs.input.focus();
  });
},
```
注意这里的 `this.$nextTick`，正常情况下，直接调用 input 的 `focus` 方法是没有问题的，然而却不行。因为 input 的渲染逻辑取决于 prop 属性 on 的状态，如果直接调用 `focus` 方法，这时 input 元素的渲染工作很可能还未结束，这时 `this.$refs.input` 所指向的引用值为 `undefined`，继续调用方法则会抛出异常，因此我们利用 `this.$nextTick` 方法，将调用的逻辑延迟至下次 DOM 更新循环之后执行。

同理，在 `app` 组件中，为 `custom-button` 添加一个 `ref` 属性，如下:
```
<custom-button ref="customButton" :on="status.on" :toggle="toggle"></custom-button>
```
之后修改 `onToggle` 方法中的逻辑以满足目标中的需求，当 `toggle` 组件状态为开时，调用 `custom-button` 组件的 `focus` 方法，如下：
```
onToggle(on) {
  if (on) this.$refs.customButton.focus();
  console.log("toggle", on);
}
```

### 成果
点击按钮会发现，每当开关为开时，input 元素都会显示，并会自动获得焦点。

你可以通过下面的链接来看看这个组件的实现代码以及演示：
* sandbox: [在线演示](https://codesandbox.io/s/vmww2rk1m7)
* github: [part-5](https://github.com/haoliangwu/advanced-vue-component-patterns/tree/part-5)

## 总结
文章中所举例子的交互，在实际场景中很常见，比如：
* 当通过一个 icon 触发搜索框时，期望自动获得焦点
* 当表单校验失败时，期望自动获得发生错误的表单项的焦点
* 当复杂列表的筛选器展开时，期望第一个筛选单元获得焦点

这几种情况下，都可以使用该模式来高效地解决问题，而不是通过使用 DOM 中的 api 或者引入 jquery 获取相关元素再进行操作。