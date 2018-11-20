---
title: 高级 Vue 组件模式 (7)
tags:
  - js
  - vue
categories:
  - 原创
date: 2018-11-20 15:05:14
---

## 07 使用 State Initializers

### 目标
到目前为止，仅从 `toggle` 组件自身的角度来看，它已经可以满足大多数的业务场景了。但我们会发现一个问题，就是当前 `toggle` 组件的状态对于调用者来说，完全是黑盒状态，即调用者无法初始化，也无法更改组件的开关状态，这在一些场景无法满足需求。

对于无法初始化开关状态的问题，倒是很好解决，我们可以在 `toggle` 组件声明一个 prop 属性 `on` 来代表组件的默认开关状态，同时在 `mounted` 生命周期函数中将这个默认值同步到组件 data 相应的属性中去。

对于无法更改开关状态的问题，似乎无法简单通过声明一个 `prop` 属性的方式来解决，并且如果我们期望的更改逻辑是异步的话，同样无法满足。

因此这篇文章着重来解决这两个问题：
* `toggle` 组件能够支持开关状态的初始化功能
* `toggle` 组件能够提供一个 `reset` 方法以供重置开关状态
* 重置开关状态可以以异步的方式进行

### 实现
#### 初始化开关状态
为了使 `toggle` 组件能够支持默认状态的传入，我们采用声明 prop 属性的方式，如下：
```
on: {
  type: Boolean,
  default: false
}
```
之后在其 `mounted` 生命周期对开关状态进行同步，如下：
```
mounted() {
    this.status.on = this.on;
  }
```
这样当我们期望 `toggle` 以**开**的状态进行渲染时，可以这样调用组件：
```
<toggle :on="true" @toggle="onToggle">
  ...
</toggle>
```

#### 重置开关状态
为了能够从外部更改 `toggle` 组件的开关状态，我们可以在组件内部声明一个观测 `on` prop 属性的监听器，比如：
```
watch: {
  on(val){
    // do something...
  }
}
```
但如果这么做，会存在一个问题，即目标中关于开关状态的更改逻辑的编写者是**组件调用者**，而 watch 函数的编写者是**组件实现者**，由于实现者无法预知调用者更改状态的逻辑，所以使用 watch 是无法满足条件的。

让我们换一个角度来思考问题，既然实现者无法预知调用者的逻辑，何不把重置开关状态的逻辑全部交由调用者来实现？别忘了 Vue 组件也是可以传入 Function 类型的 `prop` 属性的，如下：
```
onReset: {
  type: Function,
  default: () => this.on
},
```
这样就将提供重置状态的逻辑暴露给了组件调用者，当然，如果调用者没有提供相关重置逻辑，组件内部会自动降级为使用 `on` 属性来作为重置的状态值。

组件内部额外声明一个 reset 方法，在其内部重置当前的开关状态，如下：
```
reset(){
  this.status.on = this.onReset(this.status.on)
  this.$emit("reset", this.status.on)
}
```
这里会首先以当前开关状态为参数，调用 `onReset` 方法，再将返回值赋值给当前状态，并触发一个 `reset` 事件以供父组件订阅。

之后在 app 组件中，可以按如下方式传入 `onReset` 函数，并编写具体的重置逻辑：
```
// template
<toggle :on="false" @toggle="onToggle" :on-reset="resetToTrue">
...
</toggle>

// script
...
resetToTrue(on) {
  return true;
},
...
```
运行效果如下：
{% img /img/avcp_reset_to_true.gif
%}

#### 支持异步重置
在实现同步重置的基础上，实现异步重置十分简单，通常情况下，处理异步较好的方式是使用 Promise，使用 callback 也可以，使用 Observable 也是不错的选择，这里我们选择 Promise。

由于要同时处理同步和异步两种情况，只需把同步情况视为异步情况即可，比如以下两种情况在效果上是等价的：
```
// sync
this.status.on = this.onReset(this.status.on)

// async
Promise.resolve(this.onReset(this.status.on))
    .then(on => {
      this.status.on = on
    })
```

而 `onReset` 函数如果返回的是一个 `Promise` 实例的话，`Promise.resolve` 也会正确解析到当它为 `fullfill` 状态的值，这样关于 `reset` 方法我们改版如下：
```
reset(){
  Promise.resolve(this.onReset(this.status.on))
    .then(on => {
      this.status.on = on
      this.$emit("reset", this.status.on)
    })
}
```

在 app 组件中，可以传入一个异步的重置逻辑，这里就不贴代码了，直接上一个运行截图，组件会在点击重置按钮后 1 秒后，重置为**开**状态：

{% img /img/avcp_async_reset_to_true.gif
%}

### 成果
你可以通过下面的链接来看看这个组件的实现代码以及演示：
* sandbox: [在线演示](https://codesandbox.io/s/03vjr18zwv)
* github: [part-7](https://github.com/haoliangwu/advanced-vue-component-patterns/tree/part-7)

## 总结
Function 类型的 prop 属性在一些情况下非常有用，比如文章中提及的状态初始化，这其实是工厂模式的一种体现，在其他的框架中也有体现，比如 React 中，HOC 中提及的 render props 就是一种比较具体的应用，Angular 在声明具有循环依赖的 Module 时，可以通过 `() => Module` 的方式进行声明等等。

