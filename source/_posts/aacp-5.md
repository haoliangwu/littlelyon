---
title: 高级 Angular 组件模式 (5)
tags:
  - js
  - angular
categories: [翻译, 设计模式, 前端]
date: 2018-02-17 19:07:14
---


## 05 Handle Template Reference Variables with Directives

> 原文: [Handle Template Reference Variables with Directives](https://blog.angularindepth.com/handle-template-reference-variables-with-directives-223081bc70c2)

在之前的例子中，已经出现多次使用``template reference variable（模板引用变量）``的场景，现在让我们来深入研究如何通过使用模板引用变量来关联某个具体指令。

## 目标
在视图模板内，获取一个指令的引用。

## 实现
模板引用变量是获取某个元素、组件或者指令引用的一种方式，这个引用可以在当前的视图模板中的任何地方使用。它们通常是以``#baseToggle``或者``#myToggle="toggle"``的语法声明的。一旦声明，在视图模板的任何地方就可以使用它。

Note: 请注意作用域的问题，如果你使用``<ng-template>``或者是一个结构性指令，比如``*ngIf``或者``*ngFor``，它会在这个模板上创建一个新的作用域，之后在其内部声明的模板引用变量无法在该模板作用域以外使用。

模板引用变量的解析顺序通常为：
1. 一个指令或者组件通过它自身的``exportAs``属性，比如``#myToggle="toggle"``
2. 声明于以自定义标签存在的组件，比如``<toggle-on #toggleOn></toggle-on>``
3. 原生html元素，并且没有任何组件绑定与它，比如``<div #someDiv></div>``

之后我们来分别看3个例子。

### 指令与``exportAs``
指令可以在它的元数据中声明``exportAs``属性，这个属性表示它被这个模板引用变量所标识，如下：
```
// toggle.directive.ts
@Directive({
  selector: '[toggle]',
  exportAs: 'toggle',
})
export class ToggleDirective { ... }
```

之后我们可以在视图模板中直接使用``toggle``来获取指令的引用，如下：
```
// app.component.html
<div toggle #myTemplateRefVar="toggle"></div>
// myTemplateRefVar is the ToggleDirective
```

### 组件
对于每一个``html``元素，只会有一个组件与之对应。当一个组件绑定于一个元素时，那么声明的模板引用变量将会被解析为当前元素上所绑定的组件，比如：
```
// app.component.html
<toggle-on #toggleOn></toggle-on>
// toggleOn is the ToggleOnComponent
```

### HTML元素
如果没有组件与元素绑定，模板引用变量会指向当前这个``html``元素。
```
// app.component.html
<div #someDiv></div>
// someDiv is an HTMLDivElement
```

### 成果
Note: 在``stackblitz``中，我通过打印模板引用变量所指向的类的名字（constructor.name）来演示它所代表的引用。

https://stackblitz.com/edit/adv-ng-patterns-05-template-ref-variables

## 译者注
这篇文章作者关于模板引用变量，仅仅介绍了关于如何声明和在视图模板中如何使用，我在这里再补充一些，如何在组件或者指令类的内部使用。

在类内部获取模板引用变量所指向的引用是通过使用``ViewChild``装饰器完成的，比如上述文章中的第二个例子:
```
@Component({
  selector: 'my-app',
  template: `
    <div #myDiv></div>
  `,
})
export class AppComponent {
  @ViewChild('myDiv')
  myDiv: ElementRef;

  ngAfterViewInit() {
    console.log(this.myDiv);
  }
}
```
这里的``myDiv``即指向当前模板引用变量所指向的html元素。

Note: 在类中获取模板引用变量所指向的引用时，请格外注意你期望获取的引用类型，在例子中，我们期望获取html元素，因此这里的引用类型是``ElementRef``，如果是指令或者组件，则分别要对应其类型的``Type``。
