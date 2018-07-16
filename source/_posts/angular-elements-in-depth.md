---
title: Angular Elements 及其工作原理
tags:
  - js
  - angular
categories: 
  - 翻译
---

> 原文:  [Angular Elements: how does this magic work under the hood?](https://blog.angularindepth.com/angular-elements-how-does-this-magic-work-under-the-hood-3684a0b2be95)

现在，Angular Elements 这个项目已经在社区引起一定程度的讨论。这是显而易见的，因为 Angular Elements 提供了很多开箱即用的、十分强大的功能：

* 通过使用原生的 HTML 语法来使用 Angular Elements —— 这意味着不再需要了解 Angular 的相关知识
* 它是自启动的，并且一切都可以按预期那样运作
* 它符合 Web Components 规范，这意味着它可以在任何地方使用
* 虽然你没有使用 Angular 开发整个网站，但你仍然可以从 Angular Framework 这个庞大的体系中收益

`@angular/elements`这个包提供可将 Angular 组件转化为原生 Web Components 的功能，它基于浏览器的 Custom Elements API 实现。Angular Elements 提供一种更简洁、对开发者更友善、更快乐地开发动态组件的方式 —— 在幕后它基于同样的机制（指创建动态组件），但隐藏了许多样板代码。

关于如何通过 `@angular/elements` 创建一个 Custom Element，已经有大量的文章进行阐述，所以在这篇文章将深入一点，对它在 Angular 中的具体工作原理进行剖析。这也是我们开始研究 Angular Elements 的一系列文章的原因，我们将在其中详细解释 Angular 如何在 Angular Elements 的帮助下实现 Custom Elements API。

## Custom Elements（自定义元素）
要了解更多关于 Custom Elements 的知识，可以通过 [developers.google](https://developers.google.com/web/fundamentals/web-components/customelements) 中的这篇文章进行学习，文章详细介绍了与 Custom Elements API 相关的内容。

这里针对 Custom Elements，我们使用一句话来概括：
> 使用 Custom Elements，web 开发者可以创建一个新的 HTML 标签、增加已有的 HTML 标签以及继承其他开发者所开发的组件。

### 原生 Custom Elements
让我们来看看下面的例子，我们想要创建一个拥有 `name` 属性的 `app-hello` HTML 标签。可以通过 Custom Elements API 来完成这件事。在文章的后续章节，我们将演示如何使用 Angular 组件的 `@Input` 装饰器与 这个 `name` 属性保持同步。但是现在，我们不需要使用 Angular Elements 或者 ShadowDom 或者使用任何关于 Angular 的东西来创建一个 Custom Element，我们仅使用原生的 Custom Components API。

首先，这是我们的 HTML 标记：
```
<hello-elem name="Custom Elements"></hello-elem>
```

要实现一个 Custom Element，我们需要分别实现如下在标准中定义的 hooks：
| callback                 | summary                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| constructor              | 如果需要的话，可在其中初始化 state 或者 shadowRoot，在这篇文章中，我们不需要                |
| connectedCallback        | 在元素被添加到 DOM 中时会被调用，我们将在这个 hook 中初始化我们的 DOM 结构和事件监听器      |
| disconnectedCallback     | 在元素从 DOM 中被移除时被调用，我们将在这个 hook 中清除我们的 DOM 结构和事件监听器          |
| attributeChangedCallback | 在元素属性变化时被调用，我们将在这个 hook 中更新我们内部的 dom 元素或者基于属性改变后的状态 |

如下是我们关于 `Hello` Custom Element 的实现代码：

```
class AppHello extends HTMLElement {
  constructor() {
    super();
  }
  // 这里定义了那些需要被观察的属性，当这些属性改变时，attributeChangedCallback 这个 hook 会被触发
  static get observedAttributes() {return ['name']; }

  // getter to do a attribute -> property reflection
  get name() {
    return this.getAttribute('name');
  }

  // setter to do a property -> attribute reflection
  // 通过 setter 来完成类属性到元素属性的映射操作
  set name(val) {
    this.setAttribute('name', val);
  }

  connectedCallback() {
    this.div = document.createElement('div');
    this.text = document.createTextNode(this.name || '');
    this.div.appendChild(this.text);
    this.appendChild(this.div);
  }

  disconnectedCallback() {
    this.removeChild(this.div);
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    if (attrName === 'name' && this.text) {
      this.text.textContent = newVal;
    }
  }
}

customElements.define('hello-elem', AppHello);
```

这里是可运行实例的[链接](https://codepen.io/JiaLiPassion/pen/bKMxZp)。这样我们就实现了第一版的 Custom Element，回顾一下，这个 `app-hellp` 标签包含一个文本节点，并且这个节点将会渲染通过 `app-hello` 标签 `name` 属性传递进来的任何内容，这一切仅仅基于原生 javascript。

## 将 Angular 组件导出为 Custom Element

既然我们已经了解了关于实现一个 HTML Custom Element 所涉及的内容，让我们来使用 Angular实现一个相同功能的组件，之后再使它成为一个可用的 Custom Element。

首先，让我们从一个简单的 Angular 组件开始：
```
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hello',
  template: `<div>{{name}}</div>`
})
export class HelloComponent  {
  @Input() name: string;
}
```

正如你所见，它和上面的例子在功能上一模一样。

现在，要将这个组件包装为一个 Custom Element，我们需要创建一个 wrapper class 并实现所有 Custom Elements 中定义的 hooks：
```
class HelloComponentClass extends HTMLElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
  }

  connectedCallback() {
  }

  disconnectedCallback() {
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
  }
}
```

下一步，我们要做的是桥接 `HelloComponent` 和 `HelloComponentClass`。它们之间的桥会将 Angular Component 和 Custom Element 连接起来，如图所示：

{% img /img/1_spGvrz-BjL1QJ9n_x-kEFA.jpeg 
%}

要完成这座桥，让我们来依次实现 Custom Elements API 中所要求的每个方法，并在这个方法中编写关于绑定 Angular 的代码：
| callback                 | summary                | angular part     |
| ------------------------ | ---------------------- | ----------------- |
| constructor              | 初始化内部状态         | 进行一些准备工作  |
| connectedCallback        | 初始化视图、事件监听器 | 加载 Angular 组件 |
| disconnectedCallback     | 清除视图、事件监听器   | 注销 Angular 组件 |
| attributeChangedCallback | 处理属性变化           | 处理 @Input 变化  |

### 1. constructor()

我们需要在 `connectedCallback()` 方法中初始化 HelloComponent，但是在这之前，我们需要在 constructor 方法中进行一些准备工作。

顺便，关于如何动态构造 Angular 组件可以通过阅读[Dynamic Components in Angular](https://blog.angularindepth.com/here-is-what-you-need-to-know-about-dynamic-components-in-angular-ac1e96167f9e)这篇文章进行了解。它其中阐述的运作机制和我们这里使用的一模一样。

所以，要让我们的 Angular 动态组件能够正常工作（需要 `componentFactory` 能够被编译），我们需要将 `HelloComponent` 添加到 `NgModule` 的 `entryComponents` 属性（它是一个列表）中去：

```
@NgModule({
  imports: [
    BrowserModule
  ],
  declarations: [HelloComponent],
  entryComponents: [HelloComponent]
})
export class CustomElementsModule {
  ngDoBootstrap() {}
}
```

基本上，调用 `prepare()` 方法会完成两件事：
* 它会基于组件的定义初始化一个 factoryComponent 工厂方法
* 它会基于 Angular 组件的 `inputs` 初始化 `observedAttributes`，以便我们在 `attributeChangedCallback()` 中完成我们需要做的事

```
class AngularCustomElementBridge {
  prepare(injector, component) {
    this.componentFactory = injector.get(ComponentFactoryResolver).resolveComponentFactory(component);

    // 我们使用 templateName 来处理 @Input('aliasName') 这种情形
    this.observedAttributes = componentFactory.inputs.map(input => input.templateName); 
  }
}
```

### 2. connectedCallback()

在这个回调函数中，我们将看到：
* 初始化我们的 Angular 组件（就如创建动态组件那样）
* 设置组件的初始 input 值
* 在渲染组件时，触发脏检查机制
* 最后，将 HostView 增加到 ApplicationRef

如下是实战代码：
```
class AngularCustomElementBridge {
  initComponent(element: HTMLElement) {
    // 首先我们需要 componentInjector 来初始化组件
    // 这里的 injector 是 Custom Element 外部的注入器实例，调用者可以在这个实例中注册
    // 他们自己的 providers
    const componentInjector = Injector.create([], this.injector);
  
    this.componentRef = this.componentFactory.create(componentInjector, null, element);

    // 然后我们要检查是否需要初始化组件的 input 的值
    // 在本例中，在 Angular Element 被加载之前，user 可能已经设置了元素的属性
    // 这些值被保存在 initialInputValues 这个 map 结构中
    this.componentFactory.inputs.forEach(prop => this.componentRef.instance[prop.propName] = this.initialInputValues[prop.propName]);

    // 之后我们会触发脏检查，这样组件在事件循环的下一个周期会被渲染
    this.changeDetectorRef.detectChanges();
    this.applicationRef = this.injector.get(ApplicationRef);

    // 最后，我们使用 attachView 方法将组件的 HostView 添加到 applicationRef 中
    this.applicationRef.attachView(this.componentRef.hostView);
  }
}
```

### 3. disconnectedCallback()
这个十分容易，我们仅需要在其中注销 `componentRef` 即可：
```
class AngularCustomElementBridge {
  destroy() {
    this.componentRef.destroy();
  }
}
```

### 4. attributeChangedCallback()
当元素属性发生改变时，我们需要相应地更新 Angular 组件并触发脏检查：
```
class AngularCustomElementBridge {
  setInputValue(propName, value) {
    if (!this.componentRef) {
      this.initialInputValues[propName] = value;
      return;
    }
    if (this.componentRef[propName] === value) {
      return;
    }
    this.componentRef[propName] = value;
    this.changeDetectorRef.detectChanges();
  }
}
```

### 5. Finally, we register the Custom Element
```
customElements.define('hello-elem', HelloComponentClass);
```

这是一个可运行的例子[链接](https://github.com/JiaLiPassion/custom-element)。

## 总结
这就是根本思想。通过在 Angular 中使用动态组件，我们简单实现了 Angular Elements 所提供的基础功能，重要的是，没有使用 @angular/element 这个库。

当然，不要误解 —— Angular Elements 的功能十分强大。文章中所涉及的所有实现逻辑在 Angular Elements 都已被抽象化，使用这个库可以使我们的代码更优雅，可读性和维护性也更好，同时也更易于扩展。

以下是关于 Angular Elements 中一些模块的概要以及它们与这篇文章的关联性：
* [create-custom-element.ts](https://github.com/angular/angular/blob/master/packages/elements/src/create-custom-element.ts)：这个模块实现了我们在这篇文章中讨论的关于 Custom Element 的几个回调函数，同时它还会初始化一个 NgElementStrategy 策略类，这个类会作为连接 Angular Component 和 Custom Elements 的桥梁。当前，我们仅有一个策略 —— `component-factory-strategy.ts` —— 它的运作机制与本文例子中演示的大同小异。在将来，我们可能会有其他策略，并且我们还可以实现自定义策略。
* [component-factory-strategy.ts](https://github.com/angular/angular/blob/master/packages/elements/src/component-factory-strategy.ts)：这个模块使用一个 component 工厂函数来创建和销毁组件引用。同时它还会在 input 改变时触发脏检查。这个运作过程在上文的例子中也有被提及。

下次我们将阐述 Angular Elements 通过 Custom Events 输出事件。