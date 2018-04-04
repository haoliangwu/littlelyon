---
title: 在 redux 中集成  angular di 机制
date: 2017-05-31 09:29:57
tags: [js, angular, redux]
categories:  
  - 原创
  - 前端
---
最近一直在折腾``redux``相关的东西，算然说官方鼓励的使用方式是将redux和react一起使用，但并不影响我们在其他的mvvm框架中使用它。

众所周知，angular是一个大而全的框架，想和redux一起使用，需要摒弃一些angular中常用的开发理念与模式，仅仅将它作为一个视图层框架使用，就和react一样，不在将类似``domain state``和``app state``的状态维护在controller或service中，而是全权交给redux维护。

我们可以通过使用[ng-redux](https://github.com/angular-redux/ng-redux)注入redux服务，从而在angular中使用它。

基本的使用项目文档介绍的已经很详细了，这里仅仅想分享在这段时间折腾redux和angular遇到的一个比较蛋疼的问题，以及是如何解决的。

在redux中，业务逻辑的抽象被描述在action中，因此除了一些同步action以外，必然存在类似向后端发送请求获取数据之类的异步action。那么问题来了，在angular中有一个大家很熟悉的机制，叫做依赖注入（简称``di``），因为这种机制的存在，在angular中，我们一般使用一个服务是不关心它的实例化过程的，我们所做的，仅仅是声明它，告诉模块，我们在运行时，需要注入相关依赖的实例，但是在redux中没有这种机制，对于想在action使用的服务，你必须先导入它，实例化，你才可以使用，这与angular本身的di机制相悖。

那么我们如何来解决这个问题呢？

一种简单粗暴的方法就是，完全摒弃angular的di机制，使用外部的模块来解决问题。比如发请求，难道我们非要使用``$http``服务吗？我们完全可以直接使用像``superagent``这样的第三方库来代替它。但是随之而来的问题就是，对于angular已经使用``$http``服务的代码，你必须考虑是否重构它们，如果不重构，你则会在代码中拥有两套发送请求的逻辑，代码冗余了，如果重构呢，工作量又会很大，没准折腾redux不成，又给全改回去，得不偿失，因此这种方法不是完美的解决方案。最完美的方法应当是，既不摒弃angular的di机制，又可以兼顾redux框架，可是redux没有di机制这怎么破呢？

这个问题费了我不少时间去搜索网上的资料，类似如何在action使用angular di机制，如果在action获取service实例等等，虽然能查到的资料都没有完美的给出解决方案，但是都把问题的解决方向，指向了同一处，即redux的中间件机制。

第二种方法则通过redux中间件的机制来实现
什么是中间件机制呢？这个可是个大概念，简单的理解的话，我只引用一个计算机常用的用来调侃的话解释。
> 计算机科学中，没有什么问题是不能通过增加一个中间件来解决的。

话虽然这么说，但是它是很有道理的，对于redux的中间件机制呢，它是对于action来设计的，即一个action，在最终转移到到处理它的reducer之前，会经过若干大大小小的中间件，这些中间件做的事情十分的简单，即输入一个action，按自己的处理逻辑加工它，再交到下一个中间件手中，直到没有下一个中间件为止。

明白了redux的中间件机制，那么上面的问题就好解决了，对于想在action中使用的通过angular di机制来实例化的服务，我们没有必要在action中实例化，我们完全可以仅仅在action中声明，之后呢，将实例化的过程交由中间件处理即可，那么可能你又会问，action没有办法集成di机制，中间件难道能集成吗，如果不能岂不是又回到了问题的原点？是的，但是中间件它的确可以集成di功能，为什么呢，因为中间件的实例化逻辑是通过ng-redux在angular内部进行的，而中间件本身呢，有仅仅是一个函数而已，那么我们完全可以把中间件的实现，声明成一个angular中的factory或者service，之后在其中使用angular的di机制，动态的实例化action中依赖服务的实例，关于这一点呢，在ng-redux的文档中有提及，但是没有说的特别的清楚。

talk is cheap, show me the code. 下面贴一下关于实现解决以上问题的中间件实现源码。

```
import angular from 'angular'
import R from 'ramda'

export default function thunkWithDepsMiddleware () {
  const injector = angular.element(document.body).injector()

  return ({dispatch, getState}) => next => action => {
    const isNotNil = R.complement(R.isNil)
    const isFSA = R.both(R.has('payload'), R.has('type'))
    const isLastItemIsFunction = R.compose(R.is(Function), R.last)
    const isAngularInlineArrayAnnotation = R.both(R.is(Array), isLastItemIsFunction)
    let annotation

    // FSA 处理逻辑
    if (isFSA(action)) annotation = R.prop('payload', action)
    // 普通 action 处理逻辑
    else annotation = action

    if (isAngularInlineArrayAnnotation(annotation)) {
      const locals = {dispatch: dispatch, getState: getState}
      const payload = injector.invoke(annotation, this, locals)
      if (isNotNil(payload)) return dispatch({...action, payload})
    } else if (R.is(Function, annotation)) {
      const payload = annotation(dispatch, getState)
      if (isNotNil(payload)) return dispatch({...action, payload})
    } else {
      return next(action)
    }
  }
}

```
大体逻辑呢，就是通过angular中$injector服务来解决问题，抽离出action中的关于di的声明逻辑，该中间间仅支持``inline array annotation``语法来声明依赖，对于符合``FSA(Flux Standard Action)``的action, 如果传入的action中的payload符合该语法，则通过injector.invoke来解析它，如果不是，则简单的按redux-thunk的处理逻辑进行处理，对于一般action同理，只不过是对于它本身进行处理。

实现之后呢，通过ng-redux的语法注册它，
```
$ngReduxProvider.createStoreWith(reducers, ['thunkWithDepsMiddleware', promiseMiddleware])
```
之后我们的action即可直接返回符合``inline array annotation``语法的数组声明依赖，如下：
```
export const fetchRoles = createAction(FETCH_ROLES, () => {
  return ['$q', 'dispatch', ($q, dispatch) => {
    // do something ...
})
```
