---
title: 高级 Angular 组件模式 (7)
tags:
  - js
  - angular
categories:
  - 翻译
date: 2018-10-08 14:50:53
---


## 07 使用 Content Directives

> 原文: [Use Content Directives](https://blog.angularindepth.com/modify-user-provided-ui-with-content-directives-a3fc0c88058e)

因为父组件会提供所有相关的 UI 元素（比如这里的 button），所以 toggle 组件的开发者可能无法满足组件使用者的一些附加需求，比如，在一个自定义的开关控制元素上增加 aria 属性。

如果 toggle 组件能够提供一些 hooks 方法或指令给组件使用者，这些 hooks 方法或指令能够在自定义的开关元素上设置一些合理的默认值，那将是极好的。

### 目标
提供一些 hooks 方法或指令给组件使用者，使其可以与所提供的 UI 元素交互并修改它们。

### 实现
我们通过实现一个 `[toggler]` 指令来负责向组件使用者提供的自定义元素增加 `role="switch"` 和 `aria-pressed` 属性。这个 `[toggler]` 指令拥有一个 `[on]` input 属性（并与 `<switch>` 组件共享），该属性将决定 `aria-pressed` 属性的值是 `true` 还是 `false`。

### 成果
[stackblitz演示地址](https://stackblitz.com/edit/adv-ng-patterns-07-use-content-directives-5kzghj)

## 译者注
到这里已经是第七篇了，也许你已经发现，Angular 中很多开发模式或者理念，都和 Directive 脱不了干系。

Angular 中其本身推崇组件化开发，即把一切 UI 概念当做 Component 来看待，但仔细思考的话，这其实是有前提的，即这个 UI 概念一般是由一个或多个 html 元素组成的，比如一个按钮、一个表格等。但是在前端开发中，小于元素这个颗粒度的概念也是存在的，比如上文提及的 aira 属性便是其中之一，如果也为将这些 UI 概念抽象化为一个组件，就未免杀鸡用牛刀了，因此这里使用 Directive 才是最佳实践，其官方文章本身也有描述，Directive 即为没有模板的 Component。

从组件开发者的角度来看的话，Directive 也会作为一种相对 Component 更加轻量的解决方案，因为与其提供封装良好、配置灵活、功能完备（这三点其实很难同时满足）的 Component，不如提供功能简单的 Directive，而将部分其他工作交付组件使用者来完成。比如文章中所提及的，作为组件开发者，无法预先得知组件使用者会怎样管理开关元素以及它的样式，因此提供一些 hooks 是很有必要的，而 hooks 这个概念，一般情况下，都会是相对简单的，比如生命周期 hook、调用过程 hook、自定义属性 hook 等，在这里，我们通过 Directive 为自定义开关元素增加 aria 属性来达到提供自定义属性 hook 的目标。