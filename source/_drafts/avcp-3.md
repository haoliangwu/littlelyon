---
title: 高级 Vue 组件模式 (3)
tags:
  - js
  - vue
categories:
  - 原创
---
## 03 使用 mixin 来增强 Vue 组件

### 目标
之前一篇文章中，我们虽然将 `toggle` 组件划分为了 `toggle-button`、`toggle-on` 和 `toggle-off` 三个子组件，且一切运行良好，但是这里面其实是存在一些问题的：
* `toggle` 组件的内部状态和方法只能和这三个子组件共享，我们期望第三方的组件也可以共享这些状态和方法
* inject 的注入逻辑我们重复编写了三次，如果可以的话，我们更希望只声明一次（DRY原则）
* inject 的注入逻辑当前为硬编码，某些情况下，我们可能期望进行动态地配置

如果熟悉 react 的读者这里可能马上就会想到 HOC（高阶组件） 的概念，而且这也是 react 中一个很常见的模式，该模式能够提高 react 组件的复用程度和灵活性。在 vue 中，我们是否也有一些手段或特性来提高组件的复用程度和灵活性呢？答案当然是有的，那就是 mixin。

### 实现
关于 mixin 本身的知识，这里就不做过多赘述了，不熟悉的读者可以去官方文档了解。我们通过声明一个叫作 toggleMixin 的 mixin 来抽离公共的注入逻辑，如下：
```
export const withToggleMixin = {
  inject: {
    toggleComp: "toggleComp"
  }
};
```

之后，每当需要注入 `toggle` 组件提供的依赖项时，就混入当前 mixin，如下:
```
mixins: [withToggleMixin]
```

如果关于注入的逻辑，我们增加一些灵活性，比如期望自由地声明注入依赖项的 key 时，我们可以借由 HOC 的概念，声明一个高阶 mixin（可以简称 HOM ?? 皮一下，很开心），如下：
```
export function withToggle(parentCompName = "toggleComp") {
  return {
    inject: {
      [parentCompName]: "toggleComp"
    }
  };
}
```

这个 HOC mixin 可以按如下的方式使用：
```
mixins: [withToggle("toggle")]
```

这样在当前的组件中，调用 toggle 组件相关状态和方法时，就不再是 `this.toggleComp`，而是 `this.toggle`。

### 成果
通过实现 toggleMixin，我们成功将注入的逻辑抽离了出来，这样每次需要共享 `toggle` 组件的状态和方法时，混入该 mixin 即可。这样就解决了第三方组件无法共享其状态和方法的问题，在在线实例代码中，我实现了两个第三方组件，分别是 `custom-button` 和 `custom-status-indicator`，前者是自定义开关，使用 withToggleMixin 来混入注入逻辑，后者是自定义的状态指示器，使用 withToggle 高阶函数来混入注入逻辑。

你可以通过下面的链接来看看这个组件的实现代码以及演示：
* sandbox: [在线演示](https://codesandbox.io/s/myvynok37x)
* github: [part-3](https://github.com/haoliangwu/advanced-vue-component-patterns/tree/part-3)

### 总结
mixin 作为一种分发 Vue 组件中可复用功能的非常灵活的方式，可以在很多场景下大展身手，尤其在一些处理公共逻辑的组件，比如通知、表单错误提示等，使用这种模式尤其有用。