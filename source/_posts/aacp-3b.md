---
title: 高级 Angular 组件模式 (3b)
tags:
  - 翻译
  - js
  - ngx
  - 设计模式
date: 2018-01-10 22:02:45
---


## 03-b Enhance Components with Directives

> 原文: [Enhance Components with Directives](https://blog.angularindepth.com/enhance-components-with-directives-58f16c4ca1f)

Kent C. Dodds的第四篇文章中的一个重要元素在上一篇文章中没有涉及，使用``withToggle``高阶组件(HoC, react中的常用模式)可以将``<toggle-on>``、``<toggle-off>``、``<toggle-button>``组件中的公用逻辑分离出来。

虽然上一篇文章中上面提及的三个组件并没有太多的公用逻辑，可以万一它们有公用逻辑呢？如果我们想要提供更加声明式的功能，比如能够显式的声明它们使用的``<toggle>``组件实例而非最邻近的父实例。

同时，因为``<toggle>``组件的模板并不存在任何的变动，我们可以将它转化为一个**指令**，这样我们可以以更加灵活的方式来使用它。

## 目标
* 允许我们的``<toggle>``组件能够以``tag``的形式或者``attribute``的形式使用，如``<toggle>``或者``<div toggle></div>``
* 允许通过`withToggle```指令显式地设置``<toggle>``组件

## 实现
### 1）将``<toggle>``作为一个指令
将``<toggle>``组件改变为指令十分简单，因为它本身的模板仅仅是``<ng-content></ng-content>``，在组件渲染时，``<ng-content>``会被替换为我们当前组件标签内包含的内容，所以我们可以直接移除它，并使用``@Directive``装饰器来描述``<toggle>``组件，如下：
```
@Directive({
  exportAs: 'toggle',
  selector: 'toggle, [toggle]',
})
export class ToggleDirective {}
```
你可能注意到了，指令的选择器允许``toggle``指令可以以**标签名**和**属性名**的形式来使用。对于``exportAs``关键字是必须要提供的，因为这是当我们需要在别的指令或者组件能够获取``toggle``指令引用的名字，会在这个系列文章的第5章详细删除``exportAs``（Handle Template Reference Variables with Directives）。

### 2）``withToggle``指令
在这个新的指令中，我们将会封装关于如何选取需要绑定某个``toggle``指令实例的逻辑。

首先，我们的设想是这样的，每一个组件注入``withToggle``指令，而不是直接注入最邻近的父``toggle``指令。同时每个使用``withToggle``指令的组件通过使用``withToggle.toggle``来访问它所绑定的``toggle``指令的实例，如下：
```
@Component({
  selector: 'toggle-off',
  template: `<ng-content *ngIf="!withToggle.toggle?.on"></ng-content>`,
})
export class ToggleOffComponent {
  constructor(public withToggle: WithToggleDirective) {}
}
```

其次，``withToggle``指令将它自身与``toggle``指令的选择器绑定（就是两个指令的选择器是相同的），同时增加一个额外的选择器``[withToggle]``，如下：
```
@Directive({
  exportAs: 'withToggle',
  selector: 'toggle, [toggle], [withToggle]',
})
export class WithToggleDirective //...
```

现在``withToggle``指令为它的子组件们提供所绑定的``toggle``指令实例，无论这个实例是显示绑定的，还是默认的父``toggle``指令。关于其中实现的具体细节，可以参考文章最后的[附录部分](#附录)。

## 成果
我们的``app.component.html``现在可以通过三种不同的使用方式来展现内容。

### 1）基本
```
<div toggle #firstToggle="toggle">
  ...
  <toggle #secondToggle="toggle">
    ...
  </toggle>
</div>
```
注意``#firstToggle``和``#secondToggle``视图变量是如何使用``toggle``组件的，前者使用属性声明的方式，后者使用标签名声明方式，无论怎样，它们都按理想中那样运行。

而且，``#secondToggle``是嵌套在``#firstToggle``中的，所以它的子组件使用的是它本身的开关状态，而非``#firstToggle``中的，这符合我们的预期。

### 2）显式引用
```
<p [withToggle]="firstToggle">
  First:
  <toggle-on>On</toggle-on>
  <toggle-off>Off</toggle-off>
  <toggle-button></toggle-button>
</p>
```
这里没有任何``toggle``指令是当前``p``标签的子组件的祖先，但是通过``withToggle``指令，我们可以让所有的子组件使用``#firstToggle``的``toggle``指令实例。

### 3）自定义组件
```
<div [withToggle]="firstToggle">
  <labelled-state toggleName="First"></labelled-state>
  <labelled-button toggleName="First"></labelled-button>
</div>
<labelled-state toggleName="Second" [withToggle]="secondToggle"> </labelled-state>
<labelled-button toggleName="Second" [withToggle]="secondToggle"> </labelled-button>
```
``withToggle``指令甚至可以通过DI机制注入到内部的任何自定义组件中，如``<labelled-state>``组件和``<labelled-button>``都没有任何关于``withToggle``或者``toggle``的引用声明。它们无需关心这个开关状态的来源，它们仅仅需要知道的是，根据这个开关状态，如何与它们的子组件进行交互。

## 附录
``withToggle``的实现，是一个标准的指令声明方式，除了它的构造方法，如下：
```
constructor(
  @Host() @Optional() private toggleDirective: ToggleDirective,
) {}
```
值得注意的有两点：
* ``@Host()``：这个装饰器的作用是，可以限制从属于当前指令的DI注入器，仅注入**绑定到某个满足特定条件指定或者组件上的**``toggle``指令实例，而不是从它的祖先组件们中注入。（这里选择器为空，则为宿主对象）
* ``@Optional()``：这个装饰器会告诉编译器，当注入器没有找到任何可注入的``toggle``指令时，不要抛出错误（如果我们手动的指定某个引用），这样在它无法被注入时，使它保持``undefined``即可。

现在我们可以很容易的理解在``ngOnChanges``生命周期钩子函数中的代码的作用，
```
this.toggle = this.withToggle || this.toggleDirective;
```

* 如果我们的``@Input()``被指定，那么使用它的值
* 如果没有，则尝试去使用在当前宿主对象上注入的``toggle``指令实例
* 如果没有，则使用``undefined``

当前的``this``指定``withToggle``本身，所以拥有它引用的子组件都可以访问它。

https://stackblitz.com/edit/adv-ng-patterns-03b-enhance-with-directives

## 译者注
在这一节中，主要进行了以下几方面的改进：
* 简化``toggle``本身，因为它一直是作为一个容器组件使用的，所以完全可以以指令（可以理解为没有模板的组件）的形式存在
* 依赖注入（DI）的机制虽然很强大，但是受限于它的运作原理（关于具体的运作原理可以参考[官方文档](https://angular.cn/guide/dependency-injection)）。这里原作者使用一个额外的``withToggle``指令作为中间件，来作为``toggle``指令的托管容器。这部分理解起来可能需要先了解一下视图变量和``exportAs``的相关的知识
* 对于``toggle``指令实例的获取逻辑，采用平稳退化的策略，就好比人在实际生活中思考问题的方式一样。

这种开发模式，在实际工作中，我有一次在重构公司项目中一个关于表单组件的过程中曾使用过，之所以使用这种方式，是因为在表单组件中，会存在一些关于联动校验或者分组的需求，如果将这部门逻辑封装为``service``或者直接写在``controller``内部，越到后面会发现逻辑复杂度越高，从而越来越难维护。

使用这种模式，将复杂的逻辑划分成小的颗粒，再封装为独立的指令，在需要用到这些逻辑的组件中注入这些指令即可，指令的特点就是一般都会比较简洁，只会做一些简单的事情，相比之下，维护一个十分复杂的service和维护若干简单的指令，我更倾向于后者。
