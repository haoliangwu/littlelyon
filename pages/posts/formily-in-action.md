---
title: formily 实践总结
date: 2022/05/27
description: 基于响应式系统来设计和实现的表单库 formily 非常强大，这篇文章总结在经过 3 个项目的实践后的经验。
tag: js
author: You
---

## 响应式系统
> [https://reactive.formilyjs.org/api/observable](https://reactive.formilyjs.org/api/observable)

`formily` 中，它实现了独立的响应式系统，这也是它与 react 配合使用时，非常容易发生类似**如果没有按照正确的方式使用，经常会发生表单状态变化，但页面没有更新的问题**的根本原因。<br />虽然容易产生问题，但响应式带来的便利性，非常适合用来做表单，这是因为复杂的表单布局，往往有很深的嵌套，以及复杂的定制逻辑，但响应式可以很好的解决这些问题，同时使代码变得优雅和易于维护。<br />`formily` 的响应式系统据官方描述，它借鉴了 `mobx` 的实现，详细 api 可参考上放的引用链接，这里只举个简单的例子：
```javascript
import { observable, autorun } from '@formily/reactive'

const obs = observable({
  aa: {
    bb: 123,
  },
})

autorun(() => {
  console.log(obs.aa.bb)
})

obs.aa.bb = 321
```
这里的 `autorun`在例子中，可以等价换成任何与响应式系统中，符合观察者身份的实现逻辑，比如 `observer`、`reaction`等等，它们的使用方式不同，但完成的目的都是相同的，即**当某个 observable 状态发生变化时，要执行什么逻辑**。<br />在理解响应式系统的基础上，再来学习和使用 `formily`，门槛就会低很多。你会发现它的本质，其实就是基于该响应式系统，实现了 `field`和 `form` 两个基础的 observable 状态，无论与 `react`还是 `vue` 以及任何其他视图层框架集成，它们均是作为观察者存在的，因此要尽量避免以视图层框架的使用方式来使用 `formily`，<br />比如在 `react`中，非常容易显式地使用诸如 `form.setValues`配合 `React.useEffect`来实现同步表单状态的逻辑，虽然说凡事不绝对，但一般通过命令式的方式来使用 `formily`往往意味着设计上或者使用方式上，可能有更好的解决方案。
## 扩展方式
在实际项目中，根据不同的需求复杂度，对 `formily`进行扩展的程度和方式也不同，我归纳大体有如下几种：

- 使用简单的 `component`和`decorator`：扩展表单渲染组件的多样性
- 使用`effect hooks`：扩展表单联动逻辑
- 使用`schema`：动态表单
- 创建自定义`observable`状态：构建独立的响应式逻辑

当然，几种方式也可以穿插配合使用。
### 扩展表单渲染组件的多样性
#### 使用 connect 封装第三方组件
> [https://react.formilyjs.org/api/shared/connect](https://react.formilyjs.org/api/shared/connect)

`connect`方法是一种可以快速扩展渲染多样性的方式，由于它本身是一个 HOC，意味着我们可能需要配合 `mapPorps`、`mapReadPretty`来针对 `props` 做映射逻辑。<br />一般较成熟的组件库，都提供完成的表单控件，当需要将这些控件集成至 `formily`时，由于组件库一般是第三方维护的，我们无法直接修改其代码，因此使用`connect`是最方便的方式。
#### 使用 observer 订阅响应式状态变化
> [https://react.formilyjs.org/api/shared/observer](https://react.formilyjs.org/api/shared/observer)

`observer`方法是一种将自定义组件集成至 `formily` 的方式，因为 `formily`有自身的响应式系统，`observer`方法会对组件内部使用的响应式状态进行依赖收集，之后在这些状态变更时，重新渲染组件。
#### connect 和 observer 的区别
从行为上看，它俩十分相似，但从源码层面，有一些细微的区别：

- 在`connect`内部，并没有调用 `observer`将组件转换为可订阅响应式状态的 wrapper 组件，[详见](https://github.com/alibaba/formily/blob/9ade22cb3b41641e726c74e5d5d3c95e536e9b82/packages/react/src/shared/connect.ts#L70)
- 在`mapProps`和 `mapReadPretty`中，虽然调用了 `observer`方法包装了 wrapper 组件，但原组件内部使用 `observable`状态时，并不会重新触发渲染：
   - 它内部使用 `React.createElement`方法直接对组件进行复制操作，并不会运行原组件的渲染逻辑（没有出发依赖收集的过程）
   - 如果原组件的渲染逻辑中，使用了 `observable`状态，则必须被 `observer`包装，哪怕它已经被 `connect`
### 扩展表单联动逻辑
#### 通过 form effect hooks
formily/core 中提供了多种 effect hooks 供开发者使用，它们的名字描述了这些 hook 的触发时机，如 `onFieldChange`、`onFormValuesChange`等。<br />hooks 的使用方式和 react hooks 差不多，唯一的区别在于，它们可以被包含在 `if..else`中。
#### 通过 reactions
通常情况是通过 `reaction`来扩展，它有两种形式：

- prop 的形式，详见 [IFieldFactoryProps](https://core.formilyjs.org/api/models/form#ifieldfactoryprops) 中的 `reactions` 字段
- schema 的形式，详见 [Schema Attributes](https://react.formilyjs.org/api/shared/schema#attributes) 中的 `x-reactions` 字段

`reactions`要表达的业务含义是，当 field 状态变化时，要执行什么逻辑，因此非常适合用来实现表单的联动需求，比如回填、校验等。
#### 通过 @formily/reactive
另外一种方式则更加底层，由于 formily 本身是基于 `@formily/reactive`构建的，因此可以直接使用其内部的 `reaction`方法来实现联动逻辑，详见下文。
### 动态表单
动态表单的实现方式有很多，当前较主流的方式是通过 [json-schema](https://json-schema.org/) 来实现，json schema 本身并不一定用于动态表单，但反过来讲，由于表单中的常规业务逻辑非常易于标准化，比如校验、联动等，因此非常实用用来 schema 这种规范化的声明式语法来抽象。<br />在 `formily`中，实现动态表单的核心组件是 `SchemaField`，它接受一个 `schema`prop，它是符合 json schema 结构的对象，因此，我们可以通过以下两种策略来实现动态表单：

- 使 `schema`多态化：适合相对独立的动态表单
- 动态维护 `schema`对象：适合表单内局部的动态表单

在以上两种策略的基础上，还可以动态注入不同的渲染组件来扩展表单渲染多样性，使表单渲染更加动态、更加灵活。
### 构建独立的响应式逻辑
在更加复杂的业务场景，如果 `formily`提供的 `field`和 `form`两个响应式状态已无法满足实际需求时，则需要创建独立的响应式状态。
#### 通过 VoidField
`VoidField`在 `formily`中是一种特殊的 field，它本身没有 `value`属性，据官方文档描述，这个类型的 field 通常用来抽象表单中，和值无关的状态，比如隐藏/显示、自定义数据等。<br />由于 `formily`本身的设计和 mvvm 框架如出一辙，因此 `VoidField`可以被视为用来声明外部状态（不影响 form 本身的取值逻辑）的一种方式。
#### 通过 @formily/reactive
在复杂的场景下，简单通过 `VoidField`来声明响应式状态已无法满足需求，这时我们不妨直接使用 `@formily/reactive`来创建响应式对象，使用它创建的对象，在表单渲染组件中使用时，`formily`会自动对它们进行依赖收集。<br />分布表单就是一个较复杂的业务场景，在 `@formily/antd`的 `FormStep`实现中，其实就是创建了一套独立的响应式状态体系来抽象分布表单中的跳转逻辑，[详见](https://github.com/alibaba/formily/blob/18700a903837cb0bbbc412ab2deebfbf3b97b9a2/packages/antd/src/form-step/index.tsx#L102)。<br />关于其他复杂交互的实现，也可以参考 `@formily/antd`:

- [FormTab](https://github.com/alibaba/formily/blob/formily_next/packages/antd/src/form-tab/index.tsx)
- [FormDialog](https://github.com/alibaba/formily/blob/formily_next/packages/antd/src/form-dialog/index.tsx)
- [FormDrawer](https://github.com/alibaba/formily/tree/formily_next/packages/antd/src/form-drawer)
- [FormCollapse](https://github.com/alibaba/formily/tree/formily_next/packages/antd/src/form-collapse)

## 讨论
针对如下交互，使用哪种方式来实现算是 best practice 呢？<br />![the-discussion-of-modal-form-item](/images/formily/img1.png)
