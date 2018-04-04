---
title: 高级 Angular 组件模式 (3a)
tags:
  - 翻译
  - js
  - ngx
  - 设计模式
date: 2018-01-10 22:02:45
---

## 03-a Communicate Between Components Using Dependency Injection

> 原文: [Communicate Between Components Using Dependency Injection](https://blog.angularindepth.com/communicate-between-components-using-dependency-injection-d7280567faa7)

当前的``<toggle>``组件仍然存在其他的问题，比如：
* 我们无法在其中方式多个``<toggle-on>``或者是``<toggle-button>``在同一个``<toggle>``中
* 如果一个``<toggle-on>``作为另外一个自定义组件的内容的话，我们无法是使用``@ContentChild``装饰器获取它

## 目标
我们需要将这两个问题作为新的目标：
* 我们可以增加多个相同类型的子组件(``<toggle-on>``、``<toggle-off>``、``<toggle-button>``)
* 并且可以使这些子组件放置在任意的自定义容器的视图模板(``views``)中

## 实现
针对第一个问题，我们使用``@ContentChildren``装饰器（因为它获取所有的子组件引用），但是它无法解决第二个问题。

为了同时解决这两个问题，我们可以使用Angular提供的DI机制(``dependency injection mechanism``)。你可以将一个组件的祖先组件通过DI机制注入到子组件的构造方法中，这样你就可以通过祖先组件的引用来访问它们的方法和属性。

所以，``<toggle-on>``、``<toggle-off>``、``<toggle-button>``都可以通过DI机制来获得最相近的``<toggle>``组件的引用，从而共享它的开关状态。

> Note: 
这里也可以使用``service``来共享状态，也许还会更便捷，但是我们可以通过DI来达到目的，我们可以在之后的章节（第十二章）来阐述``service``相关的内容，这部分内容会与``React Context Provider``的内容对应。

## 成果
你可以在在线代码仓库看到，有两个``<toggle-off>``组件如我们预期的那样被渲染，并且有一个``<other-component>``组件，其中有``<toggle-off>``和``<toggle-on>``两个组件。

这些子组件都会监听同一个``<toggle>``组件的开关状态。

## 译者注
依赖注入是Angular中提供的很强大的功能，在``angularjs``中就表现出色并作为卖点。

如果仔细思考的话，我们可以发现，在这一版的实现中，对于``<toggle>``组件的引用获取方式，从命令式转变为了声明式，因为我们不再关心获取``<toggle>``引用的细节（比如具体使用``@ContentChild``还是``@ContentChildren``）。

同时，依赖注入机制是依附于组件本身存在的，并不依附于模板的层级关系，因此不会面临问题二的困扰。

对于木偶组件本身，往往作为消费者存在，这种情况下使用DI机制可能会达到更好的效果。
