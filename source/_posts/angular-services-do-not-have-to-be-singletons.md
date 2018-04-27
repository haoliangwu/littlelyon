---
title: 小心 Angular 中的单例 Service
tags:
  - js
  - angular
categories:
  - 翻译
date: 2018-04-27 17:58:30
---


> 原文: [Angular Services do NOT have to be Singletons](https://netbasal.com/angular-services-do-not-have-to-be-singletons-ffa879e62082)

你可能知道，当我们通过``@NgModule()``装饰器来声明一个``service``时，它将符合[单例模式](https://en.wikipedia.org/wiki/Singleton_pattern)，同时还意味着它与整个应用的生命周期保持一致。比如：

```
export class AdminService {
  data = Array(10000).fill(dummy);
}
@NgModule({
  providers: [AdminService, AdminDataService]
})
```

我们在刚开始接触*Angular*的时候，总是不计后果的将所有``service``都使用``@NgModule()``来声明，这将会造成一个不易发现的问题：

> You are not releasing memory.

在上面的例子中，尽管你不再需要这些内存中储存的数据，但是让我们停下来仔细想一想，我们真的需要将一个``service``声明为单例的吗？

比如，在我们整个应用中，我们会有一个管理区域需要呈现大量的表格数据（同时这些数据只在这个管理区域展现），这些数据会储存在内存中。在这种情况下，我们没有必要将这个``service``声明为单例的，因为我们不需要缓冲层来缓存这些数据以供应用中的其他模块使用。

进一步讲，当前我们仅仅是想使这些表格数据在多个``component``之间共享，同时将数据与``service``中的多个``helper``方法耦合起来。所以我们完全可以直接使用``@Component()``装饰器来声明``service``，这样它就会成为一个**非单例**的``service``，如下：

```
@Component({
  selector: 'admin-tab',
  providers: [AdminService, AdminDataService]
})
```

这样做的好处是，当*Angular*注销组件实例时，*Angular*将同时注销与之绑定的``service``实例，y也会释放那些用来储存数据的内存。

### OnDestroy 钩子函数
许多开发者也许不知道**非单例**的``service``有``ngOnDestroy()``生命周期，所以你也可以在这个生命周期中进行一些销毁逻辑代码的编写，比如：
```
export class AdminService implements OnDestroy {
  ngOnDestroy() {
    // Clean subscriptions, intervals, etc
  }  
}
```

另外，如果我们调用``NgModuleRef.destroy()``或者``PlatformRef.destroy()``，单例``service``的``ngOnDestroy``钩子函数也会被[执行]。(https://github.com/angular/angular/blob/674c3def319e2c444823319ae43394d46f3973b7/packages/core/src/view/ng_module.ts#L199-L204)。

## 译者注
之所以翻译了这篇文章，是因为今天在整理项目代码的时候，偶然发现了这个问题，虽然我使用``Angular``也有一段时间了，但是依然将很多没有必要声明在``NgModule``中的服务以单例模式的方式声明了。文章中指出的问题确实是一个重要但又难以发现的问题。

大体总结一下``Angular``中声明``service``的不同方式和应用场景。

### 使用``@Component``
这时``service``与组件本身生命周期保持一致，非单例，适合声明一些需要*暂存*数据的工具类或者仅在某个或某几个组件中需要*缓存*数据的状态管理类``service``

### 使用``@NgModule``的``providers``
这时``service``与应用本身生命周期保持一致（非懒加载），单例，适合声明一些需要在全局*缓存*数据的状态管理类``service``。

但是有一个特例，懒加载模块中的``service``是会在模块加载时重新创建一个实例的，懒加载模块中均会注入后创建的``service``实例，因此懒加载模块与非懒加载模块间的``service``非单例。

### 使用``forRoot``
使用``forRoot``可以保证当前模块即使是懒加载模块，在加载时也不会重新创建一个新的``service``实例，因为懒加载模块在加载时，会临时创建一个从属于根``injector``的子``injector``，根据*Angular*中的依赖注入流程，当尝试通过一个子``injector``中注入不存在的实例对象时，会尝试向父级``injector``获取，因此最终可保证该``service``在应用任何地方被注入均是单例。

关于官方文档的介绍，可以参考[Providers](https://angular.io/guide/providers)和[Singleton Services](https://angular.io/guide/singleton-services)。