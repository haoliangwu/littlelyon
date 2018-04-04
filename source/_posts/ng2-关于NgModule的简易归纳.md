---
title: 从ng1看ng2 关于NgModule的简易归纳
date: 2017-07-21 15:16:35
tags: [js]
categories: 
  - 前端

---
## 写在前面
最近开始折腾[ng2](https://angular.io/)，其实说是ng2，到目前为止，它已经发布了4.3版，就是这么的高产，高产似**，我连2都还木有完整的看完它竟然发布了4.*的版本（鄙视脸）。

不过话说回来，之前工作不忙的时候，想看看ng2的东西，我的天，又是ts，又是observable的，吓的我硬是没有上来就直接去看它的入门文档，而是买了本typescript的入门开始看，后来书看了一半，工作又忙了，就想着可否重构历史代码加顺带学习rxjs的姿势去做需求，后来我也是这么做的，庆幸的是，这么做效果是挺好的，不仅实际开发效率高了不少，同时也入门了rxjs。

最近工作又闲了下来，就想着赶紧带着半吊子的ts和rxjs水平看看ng2的文档吧，虽然ng2在国内似乎热度不如react和vue流行，但是在全世界还是劲头还是比较强劲的，毕竟有谷歌爸爸和微软爸爸做东，强强联合。

而且我是个遵守规则的人，一向喜欢大而全的东西，ng这种框架我觉的真的是很对我的胃口。不过这ng2的文档不看不要紧，一看真的是有些蛋疼，随便看个啥，连码代码加理解，估计一下午也就能看一个简单的概念，就比如今天想归纳的``NgModule``这部分东西，前后大概有30几页的东西，所以我觉的如果不写点东西总结一下，必然是看了就忘，忘了再看的节奏。

## ng1中的module回顾
其实熟悉ng1的话，对于这ng2中的module的理解是很有帮助的。从ng1开始，就一直再提倡一个module的概念，比如
```
angular.module('baz', [])
angular.module('bar', [])
angular.module('foo', ['bar', 'baz'])
       .factory('fooFactory', function(){ ... })
       .service('fooService', function(){ ... })
       .component('fooComponent1', { ... })
       .directive('fooDirective', function(){ ... })
```
这么的我就分别声明了``foo``、``bar``和``baz``的module，同时``foo``依赖于``baz``和``bar``，然后就没有然后了，之后你就可以在这个这些module中做一切你想做的任何事情。通过这种module的划分，我们可以在各个维度中，抽象我们的代码，比如从业务上、从代码类别上等等。

## ng2中的module简述
ng2将这种概念更推进了一步，虽然我们可以使用module的方法来改变我们编程的思维，但是代码本身并不具有module的含义，这么说可能有点难理解，举个例子，就上面的例子，对于``bar``和``baz``模块，我们很难简单的从代码层面来区分它们分别的职能是什么。因此ng2改用了以[Decorator](https://medium.com/google-developers/exploring-es7-decorators-76ecb65fb841#.x5c2ndtx0)的方式来使代码具有语意性，如下
```
@NgModule({
  imports:      [ ... ],
  declarations: [ ... ],
  providers:    [ ... ],
  exports:      [ ... ]
})
export class FooModule { }
```
通过``NgModule``这个装饰器来对一个class进行描述。如果直接和ng1对比的话，装饰器的参数对象中的几个属性分别对应ng1中的：
* ``imports``: 对应ng1声明中的模块依赖数组``['bar', 'baz']``，进行一些依赖模块的声明
* ``declarations``: 对应ng1中的``.component('fooComponent1', { ... })``和``.directive('fooDirective', function(){ ... })``，进行一些声明式类的声明
* ``providers``: 对应ng1中的``.service('fooService', function(){ ... })``和``.factory('fooFactory', function(){ ... })``，进行一些服务类的声明
* ``exports``: ng1中没有独立的exports语法，因此不做对比，在ng1中只有依赖模块中提供的服务、模块，加载模块均可使用。

## ng2中module分类
ng2对不同的module提供了不同的语意性描述方式，可以通过装饰器属性来描述它们。

### root-module（根模块）
所谓根模块，即一个应用的最上层的模块，即应用的入口模块，有时候也会称作app-module（这也是文档中指出的最佳实践）。这个概念在ng1中同样有，但是和上面指出的问题一样，就是没有代码层面的语意性描述，为了更好的描述它，ng2中的root-module会提供额外的装饰器属性来修饰它
```
@NgModule({
  ...,
  bootstrap:      [ ... ]
})
export class AppModule { }
```
这个``bootstrap``代表这个模块会在应用初始化阶段被引导和加载，一般来讲，ng2都会有一个独立的``main.ts``文件来引导加载根模块，这个过程对于根模块是透明的，因为它并不知道它如何被加载，有可能是在浏览器加载，有可能是在移动端加载等等，有可能使用JIT做动态加载，有可能提前编译好做静态加载，这些都是未知的，它仅仅需要表达的是，这个模块是可被引导加载的。通常情况下，一个应用只有一个root-module（这不是废话吗），但是在一些大型的应用中，可能会存在多个独立的子项目，那么就有可能存在多个root-module。

### sub-module（子模块）
所谓子模块，即一个应用从属于根模块的模块，即应用按各个维度划分形成的颗粒，比如从功能划分、代码架构划分等等，有时候也会称作feature-module（这也是文档中指出的最佳实践），ng1同样无法在代码层面进行语意性描述。

一般来讲，只要符合**ng2中的module简述**中的模块声明方式声明的模块，就是一个feature-module，它具有什么样的feature，完全取决于它提供什么样的声明式组件和服务。对于不同的feature，如服务、指令和组件会以其他的装饰器进行修饰和声明，这不是本篇文章的内容，我们只需要知道，一个feature-module负责声明和管理它提供的服务和声明式组件。值得一提的是，和ng1不同，ng2中的feature-module可以声明一些私有的组件和服务，这一点在ng1中时做不到的。

### core-module（核心模块）
核心模块其实本质上讲，即是feature-module，只不过它提供的声明式组件和服务，是基于app本身构建的。言外之意，就是它必须是单例的，比如像登录验证这种服务，就是一种全局性的、app级别的服务，再入导航、顶部条等组件，也是app级别的组件，这些东西应该归并到core-module中，并在app-module中加载它，而坚决不要在feature-module中加载它。

### share-module（共享模块）
共享模块也是feature-module，只不过它提供的声明式组件和服务，是从各个feature-module中提取出的公共组件和服务，在官方的例子中，高亮这个指令，就是一个公用的指令，并不依赖于任何独立的业务逻辑。这些东西应该归并到share-module中，并在各个feature-module中加载它，从而使得我们的代码尽可能的保持简洁。

### lazy-load-module（懒加载模块）
对于SPA来讲，路由是必不可少的东西。那么对于一些未使用页面所加载的模块，我们没有必要从一开始就加载它们，很自然的，它们就成为了懒加载模块，这些模块本质上讲均是feature-module，因为core-module和share-module从职能来讲，在整个的应用生命周期，尤其初始化必不可少，因此它们很少成为懒加载模块。
