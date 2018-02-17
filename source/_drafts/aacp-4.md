---
title: 高级 Angular 组件模式 (4)
tags: [翻译, js, ngx, 设计模式]
---

## 04 Avoid Namespace Clashes with Directives

> 原文: [Avoid Namespace Clashes with Directives](https://blog.angularindepth.com/avoid-namespace-clashes-with-directives-1f00d62de445)

## 提示
在同一个``html``元素上绑定多个指令可能会造成命名冲突。

命名冲突不仅存在于指令的选择器之间，同时也会存在于指令的``Inputs``和``Outputs``属性，当这些属性名一样时，Angular并不会进行提示，它会按原本的逻辑正常工作。这种情况有时候是我们希望看到的，有些时候却不是。

## 目标
避免存在于绑定在相同元素上的多个指令上的命名冲突。

## 实现
因为``toggle``和``withToggle``指令都绑定于``<toggle>``元素，我们将通过为它们增加一个``label``属性来说明问题。

首先我们设置一个``label``属性，比如：
```
<toggle label="some label">
```
这个``label``属性的值会同时绑定在每个指令上，如果想要为其中的某个指令单独绑定，只能通过使用``prefix(前缀)``来实现。

Angular官方提供的规范指南也警示了这一点，当你在使用``prefix``修饰指令的名称时，也需要注意使用``prefix``来修饰``Input``和``Output``属性的名称。

Note: 当使用``Output``属性重写原生``DOM``元素的事件和使用``Input``属性重写原生元素的属性时，请额外注意，没有任何方式可以获知别人在他们编写的应用或者库中使用的命名，但是你可以很轻易的知道的具体命名的大体规则是什么，并且不要重写它们，除非你有意为之。

增加``prefix``的一种方式是在每个指令的``label``属性的装饰器内增加一个字符串参数，如下：
```
// In withToggle.directive.ts
@Input('withToggleLabel') label;

// In toggle.directive.ts
@Input('toggleLabel') label;
```

但是这种解决方案的前提时，你至少能够更改存在命名冲突中的一个或多个指令的源码。如果在两个第三方库中存在命名冲突，这种情况是最棘手的，我们不在这里讨论它们。

## 成果
{% iframe https://stackblitz.com/edit/adv-ng-patterns-04-namespace-clashes
800 600  %}

## 译者注
原文中关于最后一段提出的关于在多个第三方库中存在的命名冲突的场景，作者提供做出具体的解决方案，我在这里简单分享一下自己对于这种情况的解决方案：

通常这种情况比较少见，但是万一存在这种情况，我们可以通过创建一个新的``wrapper``指令来封装第三方指令，``wrapper``指令提供与第三方指令一样的接口属性，但是因为我们对于``wrapper``指令有绝对的控制权，我们可以提供统一的``prefix``来修饰这些接口属性，从而达到解决冲突的效果。
