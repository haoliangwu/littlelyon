---
title: 高级 Angular 组件模式 (2)
tags:
  - 翻译
  - js
  - ngx
  - 设计模式
date: 2018-01-10 21:05:59
---


## 02 Write Compound Components

> 原文: [Write Compound Components](https://blog.angularindepth.com/write-compound-components-1001449c67f0)

### 目标
我们需要实现的需求是能够使使用者通过``<toggle>``组件动态的改变包含在它内部的内容。

### 实现
我们可以把toggle抽象为一个复合组件，由三个新的组件``<toggle-button>``、``<toggle-on>``、``<toggle-off>``构成。

每一个组件的职能与它们的父组件保持一致，它们各自的职能如下：
* ``toggle-button``: 代表开关，用来渲染父组件的开关状态
* ``toggle-on``: 根据父组件的开关状态，渲染当状态为**开**时的内容
* ``toggle-off``: 根据父组件的开关状态，渲染当状态为**关**时的内容

``<toggle>``组件可以实现``@ContentChild``装饰器获取这三个子组件的引用，从而可以根据开关状态的变化调整它们之间的关联逻辑。

## 成果
经过这样的调整，我们可以使用户通过使用``<toggle>``组件去自定义包含在它其中内容的显示逻辑，内容中会有一个按钮负责切换开关的状态。可以尝试在在线代码库中调整子组件的顺序，你可以在它们中间嵌套任何的``html``字符串，只要这三个组件是作为``<toggle>``的子组件存在的，一切都将正常的运行。

## 相关话题
* ``@ContentChild``装饰器将会返回在组件标签包含的内容中，第一个符合选择器的子组件或者子指令的引用，比如``<toggle> This is the content </toggle>``。如果想获取所有的子组件或者子指令，使用``@ContentChildren``。

* ``@ViewChild``或者``@ViewChildren``装饰器是用来获取在组件内部模板中使用的单个或者多个组件的。比如``template: 'This is the view'``或者``templateUrl: './my.component.html'``

{% iframe https://stackblitz.com/edit/adv-ng-patterns-02-compound-components
800 600  %}

## 译者注
这里组件架构方式是标准的``Smart Component（智能组件）``和``Dump Component（木偶组件）``组件架构方式。

以上的需求完全是可以在``<toggle>``内部实现的，但是这样会使它的内部充满逻辑代码，反之我们可以将一些职能划分为成更小的碎片，并委托到它的子组件中，本身作为容器组件存在，负责协作子组件从而达到目的。

对于``@ContentChild``和``@ViewChild``的使用场景，我认为通过看装饰器前缀的寓意是最后的方式。
* ``Content``代表内容，这些内容在组件渲染时已经存在于组件声明标签的内部，通常在组件内部以``<ng-content>``为占位符
* ``View``代表视图，视图代表组件本身的模板，代表组件本身的渲染逻辑

``@ContentChildren``和``@ViewChildren``同理。
