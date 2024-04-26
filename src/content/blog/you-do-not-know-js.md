---
title: You don't know React
publishDate: 2023/03/21
excerpt: React 更新了新的官方文档，其中可能包含你之前一直忽略的一些细节。
tags:
  - react
author: You
---

## Rendering vs Painting

react 中，关于 Rendering 的含义是指决定**渲染哪些组件和如何渲染这些组件**的过程，Rendering 的分类有两种，一种是首次渲染，一种是更新渲染。<br />针对首次渲染，它的步骤可以用下图来描述：<br />![首次渲染图示](/images/you-do-not-know-js/img1.png)<br />针对更新渲染的过程，可以用下图来描述：![更新渲染图示](/images/you-do-not-know-js/img2.png)<br />值得注意的是，无论是初始化渲染，还是更新渲染，Rendering 均发生在 react 内部，这意味着它和浏览器没有任何关系。<br />而 Painting，则更多地指浏览器绘制视图的过程，这个过程发生在上图的第三个阶段（Commit）之后。

关于 Rendering 的三个步骤更详细的描述，大概是这样的：

- Trigger：触发渲染
  - 首次渲染，会在调用`createRoot`返回对象的`render`方法时触发
  - 更新渲染，会在组件状态发生变更时触发，如调用了`useState`返回的`setter`
- Render: 渲染组件
  - 首次渲染时，会递归的将从根组件开始创建组件
  - 更新渲染时，只会重新渲染那些需要被更新的组件
- Commit: 将变更应用于 DOM
  - 首次渲染时，直接使用`appendChild`来生成 DOM
  - 更新渲染时，根据组件变更的种类，使用最小的必要动作来更新 DOM

## effect 是什么

> _Effects_ let you specify side effects that are caused by rendering itself, rather than by a particular event.

effect 在语义上和 side-effect 是一致的，即**副作用**，更多地，在 react 中这些副作用是指哪些组件在渲染过程中，需要依赖的外部因素。<br />这里之所以用因素，而非状态，是因为副作用确实不一定是某个状态，也可以是某个事件，或者其他什么，但不管是哪种情况，它们均存在于组件之外，组件是无法控制它们的，它们对于组件来说，具有未知性。<br />正是因为这种未知性，组件渲染时，如果想要得到符合预期的结果，需要一种机制来与这些副作用进行同步，effect 正是用来抽象这种机制的概念，而 `useEffect`则是声明 effect 的方式。<br />`useEffect` 在实际开发中，会以各种反模式被滥用，有些情况是错误的，有些情况则属于 workaround，不管怎样，这些使用方式都违背了`useEffect`存在的初衷。在最新官方文档的 [Escape Hatches](https://react.dev/learn/escape-hatches) 章节中，基本所有的文章均和 `useEffect` 有直接或间接上的关联，可见它在实践中，有多少“坑”需要开发者来了解。

## `useEffect`和组件的生命周期

> Instead, always focus on a single start/stop cycle at a time. All you need to do is to describe how to start synchronization and how to stop it.

在编写代码和分析问题时，我们不应当将 effect 的运行时机与组件的生命周期放在一起讨论，虽然 effect 确实是在组件的这些生命周期中运行的。<br />之所以这样做的原因在于，如果从生命周期的角度出发，很容易陷入这样的误区，即将**组件渲染的过程和 effect 内部执行的逻辑**，耦合在一起看待很多问题：

- 编码时，会在业务逻辑上，将 `useEffect` 与生命周期划等号
- 抽象时，会将 hook 按照组件生命周期的方式来命名和分类
- 分析问题时，会先从组件的渲染时机开始分析问题，如：
  - 组件何时重新渲染的
  - 为什么组件被重新渲染
  - 等等...

实际上，`useEffect` 的执行时机，恰恰是在组件渲染之后**异步**执行的（虽然它内部有可能再次更新视图状态）。因此，使用`useEffect`所实现的 `useDidMount`或者 `useDidUnmount`均属于 workaround 的范畴。<br />相反，我们应当把 effect 当做一个的魔法盒子，当打开它时，会执行逻辑 A，关闭它时，则会执行逻辑 B，重新打开时，又会执行逻辑 A，无论我们执行多少次，逻辑 A 和逻辑 B 始终会执行，虽然我们从盒子里的看到的东西可能每次都会不一样（这和 side-effect 的语义完全一致，因为是副作用，所以它并不是每次都一致）。

## 你可能不需要`useEffect`

> If there is no external system involved (for example, if you want to update a component’s state when some props or state change), you shouldn’t need an Effect.

针对该话题，官方文档已经有一篇文章专门讨论它了，[详见](https://react.dev/learn/you-might-not-need-an-effect)。<br />我认为几个比较重要场景：

- 当 prop 状态变更时，重置组件内的局部 state（尤其是利用`key`prop 这个方案，值得学习和实践），[详见](https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes)
- 基于 prop 或 state 来二次更新 state，[详见](https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
- 初始化逻辑，[详见](https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application)
- 订阅外部 store（状态管理对象），[详见](https://react.dev/learn/you-might-not-need-an-effect#subscribing-to-an-external-store)

## `useEffect`的单一职责原则

> Each Effect in your code should represent a separate and independent synchronization process.

在声明 effect 时，应当遵循单一职责原则（SRP），这是因为`useEffect`的执行时机不是由开发这掌控的，因此，如果同一个 `useEffect`包含了太多处理不同副作用的代码，代码中的某段逻辑，很可能会意外地重复执行，如：

```jsx
function ChatRoom({ roomId }) {
  // 省略状态声明的代码...

  useEffect(() => {
    logVisit(roomId);

    const connection = createConnection(serverUrl, roomId);

    connection.connect();

    return () => {
      connection.disconnect();
    };
  }, [roomId, serverUrl]);
}
```

这里，更新`serverUrl`同样会执行`logVisit`方法，但语义上，`logVisit`只和 `roomId`这个状态耦合，它不应当在 `serverUrl`变化的时候重新执行，因此，更好的方式，是按照单一职责原则将它们拆开。

## Reactivity in React

> All values inside the component (including props, state, and variables in your component’s body) are reactive.

和 vue 不同，react 也是一个秉持 reactivity 的视图层框架，虽然它的很多 API 表面看起来非常的命令式。<br />对于 `useEffect`来说，reactivity 就体现在它的第二个参数（依赖数组）中，依赖数组用来声明决定 effect 何时重新执行的那些状态，react 在组件重新渲染时，会尝试对这些状态的新旧值进行比较，当发现变化时，就会重新执行 effect 内部的代码。这在代码的行为上和语义上，均与 reactivity 完全一致。<br />从组件层面来说，组件内部的所有变量都是具有 reactivity 的，只要它被包含在了`useEffect`的依赖数组中，如同官方所说：

> In other words, Effects“react”to all values from the component body.

值得一提的是，依赖数组有些时候可以为 `[]`，这种情况下的语义又是什么呢？如果我们站在 effect 本身的角度出发（不要从生命周期出发），它表示该 effect 完全不会对使用它的组件做出任何“react”。

## 小心使用`useLayoutEffect`

> `useLayoutEffect` is a version of `useEffect` that fires before the browser repaints the screen.

`useEffect`有一个和它很像的 hook，就是 `useLayoutEffect`，它们除了在运行方式上有一些微妙的区别之外，基本上是一样的。<br />`useLayoutEffect`的执行时机是在组件完成视图渲染之前，且是**同步**的，而 `useEffect`是在视图渲染之后，且是**异步**的，这意味着，在执行顺序上，`useLayoutEffect`会更快。<br />但相反的，由于它内部的代码在执行时是同步的，如果使用不当，对于组件的渲染性能影响会非常大，最佳实践是，不要在其中进行密集型运算，并且尽可能地少使用它。
