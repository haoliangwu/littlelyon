---
title: 高级 Vue 组件模式 (9)
tags:
  - js
  - vue
categories:
  - 原创
---
## 09 使用 Functional 组件

### 目标
到此为止，我们的 `toggle` 组件已经足够强大以及好用了，因此这篇文章不会再为它增加新的特性。如果你是从第一篇文章一直读到这里的读者，你一定会发现，整篇文章中，我几乎没有对 `toggle-on` 和 `toggle-off` 做出任何更改和重构，因此这篇文章着重来重构一下它们。

之前一直没有对它们进行任何更改，一个很重要的原因是因为它们足够简单，组件内部没有任何 data 状态，仅靠外部传入的 prop 属性 on 来决定内部渲染逻辑。这听起来似乎有些耳熟啊，没错，它们就是在上一篇文章中所提及的木偶组件（Dump Component）。在 Vue 中，这种类型的组件也可以叫做函数式组件（Functional Component）。

仔细观察 app 组件的模板代码，会发现存在一定的冗余性的，比如：
```
<toggle-on :on="status.on">{{firstTimes}}</toggle-on>
<toggle-off :on="status.on">{{firstTimes}}</toggle-off>
```

这里两行代码的逻辑几乎一模一样，但我们却要写两次。同时你还会发现一个问题，由于其内部的渲染逻辑是通过 `v-if` 来描述的，实际上在 Vue 渲染完成后，会渲染两个 `dom` 节点，在切换时的状态从 devtool 中观察的效果大概是这样子的：

{% img /img/with_v_if.gif
%}

未显示的节点是一个注释节点，而显示的节点是一个 div 节点。

这篇文章将着重解决这两个问题：
* 将 `toggle-on` 和 `toggle-off` 合二为一，减少代码冗余性
* 重构以 `v-if` 实现的渲染逻辑，改为更好的动态渲染逻辑（仅使用一个 dom 节点）

### 实现
#### 转化为函数式组件
首先，先将已经存在的 `toggle-on` 和 `toggle-off` 组件转化为函数式组件，很简单，只需保留 template 代码块即可，同时在左边的标签上声明 `functional` 属性，或者在 script 代码块中声明 `functional: true` 也是可以的。唯一要注意的是，由于函数式组件没有 data 也没有 `this`，因此所有模板中用到的与 prop 相关的渲染逻辑，都要作出相应更改，比如原先的 `on` 要改为 `props.on`的形式，由于这里我们要移除 `v-if` 的渲染逻辑，因此直接移除即可，详细代码如下：
```
// ToggleOn.vue
<template functional>
  <div class="toggle-on"><slot></slot></div>
</template>

<style>
.toggle-on {
  color: #86d993;
}
</style>

// ToggleOff.vue
<template functional>
  <div class="toggle-off"><slot></slot></div>
</template>

<style>
.toggle-off {
  color: red;
}
</style>
```
除此之外，还可以发现，我为两个组件增加不同的颜色样式以便于区分当前的开关状态。

#### 实现 ToggleStatus 组件
接下来实现今天的主角，`ToggleStatus` 组件，由于我们的目标是将原先的二个函数式组件合二为一，因此这个组件本身应当也是一个函数式组件，不过我们需要使用另外一种写法，如下：
```
<script>
import ToggleOn from './ToggleOn'
import ToggleOff from './ToggleOff'

export default {
  functional: true,
  render(createElement, {props, data, children}) {
    let Comp = ToggleOff
    
    if(props.on) Comp = ToggleOn

    return createElement(Comp, data, children)
  }
}
</script>
```

关于这种写法中，`render` 和 `createElement` 方法的参数就不赘述了，不熟悉的读者请参考官方文档。可以发现，这里将 `toggle-on` 和 `toggle-off` 以模块的形式导入，之后由 `props.on` 的值进行判定，从而决定哪一个被作为 `createElement` 方法的第一个参数进行渲染。

诸如 `data` 和 `children` 参数我们原封不动的传入 `createElement` 即可，因为这里对于 `toggle-status` 组件的定位是一个代理组件，对于其他参数以及子元素应当原封不动的传递给被代理的组件中。

之后在 app 组件中更改响应的渲染逻辑即可，如下：
```
// controlled toggle
<toggle-status :on="status.on">{{firstTimes}}</toggle-status>

// uncontrolled toggle
<toggle-status :on="status.on">{{secondTimes}}</toggle-status>
```

### 成果
一切如原先一样，只不过这次我们可以少写一行冗余的代码了。同时打开 devtool 可以发现，两种状态的组件会复用同一个 dom 节点，如下：

{% img /img/without_v_if.gif
%}

你可以通过下面的链接来看看这个组件的实现代码以及演示：
* sandbox: [在线演示](https://codesandbox.io/s/nr040rvzjm)
* github: [part-9](https://github.com/haoliangwu/advanced-vue-component-patterns/tree/part-9)

## 总结
关于函数式组件，我是在 React 中第一次接触，其形式和它的名字一样，就是一个函数。这种组件和普通组件相比的优势主要在于，它是无状态的，这意味着它的可测试性和可读性更好，同时一些情况下，渲染开销也更小。

我们在日常工作中，可能会经常遇到动态渲染的需求，一般情况下，我们均会通过 `v-if` 来解决，在比较简单的情况下，`v-if` 确实一种很简单且高效的方式，但是随着组件复杂度的上升，很可能会出现面条式的代码，可读性和可测试性都大打折扣，这是不妨换一个角度从渲染机制本身将组件重构为更小的颗粒，并用一个函数式组件动态的代理它们，可能会得到更好的效果，举一个比较常见的例子，比如表单系统中的表单项，一般都具有多种渲染状态，如编辑状态、浏览状态、禁用状态等等，这时利用该模式来抽离不同状态的渲染逻辑就非常不错。