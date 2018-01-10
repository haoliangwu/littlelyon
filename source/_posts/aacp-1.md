---
title: 高级 Angular 组件模式 (1)
tags:
  - 翻译
  - js
  - ngx
  - 设计模式
date: 2018-01-10 17:21:19
---

## 01 Build a Toggle Component

> 原文: [Build a Toggle Component](https://blog.angularindepth.com/build-a-toggle-component-6e8f44889c2c)

如[Kent C. Dodds Advanced React Component Patterns](https://egghead.io/lessons/react-introducing-advanced-react-component-patterns)那样，我们将使用一个相对简单的``<toggle>``组件来说明这些模式。``<toggole>``组件的职责是仅仅是管理一个简单的布尔值状态属性: ``on``。使用如此简单的组件进行说明的目的，是因为我们可以将更多的注意力投入到相对组件本身而言较复杂的模式中。

经过这一系列文章，我将提供包含完整功能的、可运行的演示代码链接。你仅仅需要将注意力集中到``app``文件夹和``toggle``文件夹。``toggle``文件夹包含一些可复用的库（一系列组件），当然这个库会随着文章的深入而改变。``app``文件夹并且特别是``app.component.html``，将针对库在不同的情形下的使用做出相应的改变。

我们将从最原始的``toggle``组件版本开始。它仅仅有一个使用了``@Input()``装饰器的``on``属性，这个属性所控制的状态代表组件本身的开关状态，同时它还有一个是使用了``@Output()``装饰器的``toggle``事件发射器，这个事件发射器会在组件开关状态改变的情况下，通知父组件。

在我们开始下一个话题[02 Write Compound Components](http://littlelyon.com/2018/01/10/aacp-2/)之前，可以在[在线代码仓库](https://stackblitz.com/edit/adv-ng-patterns-01-build-toggle-component)看看这个组件的实现以及演示。

{% iframe https://stackblitz.com/edit/adv-ng-patterns-01-build-toggle-component
800 600  %}

## 译者注
``toggle``组件的实现是一个很典型的利用单向数据流作为数据源的简单组件：
* ``on``是单向数据源，同时代表组件内部的开关状态
* ``toggle`是事件发射器`，以回调的方式将``on``状态的变化传递给父组件
