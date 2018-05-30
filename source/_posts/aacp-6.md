---
title: 高级 Angular 组件模式 (6)
tags:
  - js
  - angular
categories:
  - 翻译
date: 2018-05-30 11:06:00
---


## 06 Use <ng-template>

> 原文: [Use <ng-template>](https://blog.angularindepth.com/use-ng-template-c72852c37fba)

``[Render Props](https://reactjs.org/docs/render-props.html)``最近在``React``社区中引起了轰动，但是与之类似的模式在Angular中似乎并没有得到太多关注。我在之前写的文章提及过，``TemplateRefs``就是``Angular``中的``Render Props``，同时我会在这篇文章中列举一个简单易用的例子。

> Note: ``TemplateRef``是一个类名而``<ng-template>``是一个``html``标签，它们本质上是相同的。不过你可能会在项目中更频繁地使用``<ng-template>``，但是在网上你可以很容易的搜索到关于``TemplateRef``的知识，因为``<ng-template>``会给你提供很多``html5``中的``<template>``标签的信息。

我们已有的实现中，使用自定义内容指令(content directives)。当组件作者提前了解使用该``toggle``组件的父组件所需要的状态时，那么它将会正常的运作。但是如果父组件所需要的状态并不在我们的设想之内，我们该怎么办？

### 目标
将``toggle``组件的状态直接提供给父组件，同时允许父组件提供相应的渲染视图(``view``)。

### 实现
``<ng-template>``组件可以完美地解决问题。

#### 1. ``Toggle`` 组件
``<toggle>``组件能够通过``ContentChild``装饰器得到关于``<ng-template>``的引用，之后会赋予模板在渲染时所需要的状态，代码如下：

```
<ng-container
  *ngTemplateOutlet="layoutTemplate; context: { on: this.on, toggle: this.toggle, fns: { toggle: this.toggle } }">
</ng-container>
```

这里``<ng-container>``被当做一个占位符来使用，之后你可以使用``*ngTemplateOutlet``指令来填充它，``layoutTemplate``变量指代的是需要被渲染的模板，``context``对象包含的键值对会作为组件状态注入``layoutTemplate``中。

#### 2. 父组件
从``toggle``组件中传入的状态是通过``let``关键字在父组件的``<ng-template>``标签上显示声明的。

``let``关键字的使用方式类是这样的：``let-templatevar="inputvar"``，``templatevar``指代在``<ng-template>``标签中，关联组件状态值的变量名，而``inputvar``指代使用``<toggle>``组件的模板作用域中的变量名。

这种语法会有效地避免命名冲突，比如在父组件作用域中已经有一个``inputvar``变量了。

### 成果
[stackblitz演示地址](https://stackblitz.com/edit/adv-ng-patterns-06-use-template-refs)

## 译者注
这种组件设计模式按我个人的理解，其实是依赖倒置原则在视图渲染层的一种延伸，为什么这么说呢？是因为通常情况下子组件视图的渲染逻辑取决于传入的``props``状态和自身提供的模板，这在大多数情况下不会造成任何困扰，但是当我们无法在提前得知我们需要渲染什么的时候，这个问题就会变得十分棘手。

一种解决方法，我们可以使用条件渲染指令，根据传入的状态来判定组件渲染的状态，这种解决方法在情况比较少的情况下是可以解决问题的，但是当情况数量十分庞大的情况下，增加过多的条件判定会致使子组件的模板代码量剧增，同时降低性能，因为每次渲染都会进行若干次条件逻辑判断。

除了上面的解决方法，就是使用正文中所提及的模式了，这种模式将子组件视图的渲染逻辑倒置为子组件仅仅声明模板中所会使用的状态变量，对于这些变量和模板的注入工作，全权赋予父组件，因此会使子组件的复用性和可测试性大大提高。

正文中仅列举了一个简单的例子中，我这里在简单提及一个实际工作可能会用到的例子，就是表单校验的错误提示组件，一般前端组件设计但凡涉及表单，都会是十分复杂的，更不用说校验这种灵活性很高的功能了。

为了适应表单校验的灵活性，我们使用这种模式会事半功倍，提供校验信息的组件仅仅声明渲染表单错误提示信息需要设计的状态变量即可，比如``dirty``、``touched``等等，对于错误信息的文案及样式，统统交由错误提示组件的使用者完成。
