---
title: es6中的混合器模式
date: 2017-04-24 08:48:12
tags: [js,es6]
categories: 
    - 原创
---
这是有关设计模式相关的第一篇文章，谈及设计模式，一般情况下呢，很多人马上就会说出很多关于它的东西，比如单例模式、策略模式等等。对于各个技术栈的工程师们，各种设计模式应该再熟悉不过，这篇文章要分享的是关于前端中的混合器模式，也可以称作装饰器模式，并分享一些在实际开发中的应用。

在面向对象的开发中，实际业务的描述是通过``类(Class)``来进行描述的，如果想给一个已经存在的类扩展某些行为（如增加某个方法、某个属性等），可以通过``类的继承``来实现，即将可复用、可扩展的方法抽象为父类中的方法之后继承它。

但是思考一下，这种做法的弊端：
* 类的继承所扩展的方法或属性是静态的，既你无法为一个已有的类的实例扩展某些方法。
* 类的继承会继承父类中的所有可继承的方法和属性，但是你只想继承其中的某个或某几个方法。

在es6中，加入了``装饰器(Decorator)``语法，提供了对于装饰器模式的原生支持。这里对于语法不再进行详细的阐述，可以点击[这里](http://es6.ruanyifeng.com/#docs/decorator#类的修饰)进行了解或学习。

在这种模式下，我们可以动态的来为一个类增加某个方法或属性，你可能会问，这样听起来似乎和继承没什么不同？你错了，它的优势体现在``动态``二字，其含义即为可以动态的为类的实例增加某种行为，也许你又会说，在js中，它本身就是动态语言，这种动态性也失去了优势了吧。

是的，但是在js中想要实现继承绝非易事，因为它的继承机制是通过原型链进行描述的，对于js新手的话，理解起来其实是有点晦涩的，有些时候我们仅仅想通过更清晰的手段使用另一个类中的某些方法。

举个例子，在SPA开发中，经常会遇到处理分页数据的需求，对于分页逻辑的处理，很显然是一块需要抽象为公共方法的逻辑，但是如果你按继承的角度去考虑，就会发现，有些时候你继承了这些处理分页逻辑的方法反而是多余了，因为并不是每个页面都需要分页，这种情况下，使用混合器模式来实现则可以更好的解决问题。

我们先来实现一个分页逻辑的混合器，它其实是个函数，函数的参数是一个类，之后会动态的在这个类上增加一些方法，从而达到在**一个类中混入另一个类的某些方法的目的**。
```
export const PaginationMixin = (superClass) => class extends superClass {
  nextPage (url, callback) {
    this.handlePaginationResolve(url, callback)
  }

  previousPage (url, callback) {
    this.handlePaginationResolve(url, callback)
  }

  handlePaginationResolve (url, callback) {
    if (!url) return

    customAPIComposer(url, 'get').then(callback)
  }
}
```

之后，只需要按如下进行代码，对需要扩展的类进行扩展，
```
class AttendanceManageCtrl extends PaginationMixin(MixinBase)
```
扩展后就可以使用混合器中混入的方法了，如下
```
<oa-list-table list-data='$ctrl.listData' on-next='$ctrl.nextPage($ctrl.listData.next, $ctrl.render)' on-previous='$ctrl.previousPage($ctrl.listData.previous, $ctrl.render)'>
```

这样做似乎和继承没什么区别，但是不妨看看如下代码
```
class PeopleCtrl extends R.compose(PaginationMixin, StateManageMixin)(MixinBase)
```
没错，你可以对一个类同时使用多个混合器，但是你却无法使一个类同时继承与多个类，虽然你可以通过多重继承实现，但显然比前者繁琐很多。

尽情混入吧。