---
title: async-for-js
date: 2016-11-28 09:16:51
tags: [学习, js]
---
介绍关于js开发中所涉及的主流异步编程解决方案
> repo: [async-for-js](https://github.com/haoliangwu/todoMVCs/tree/master/async-for-js)

## 例子
插入3个div元素，其中第二个div元素使用``setTimeout``模拟异步操作，理想的插入顺序为div1 div2 div3，但这里的代码的插入顺序为div1 div3 div2。
```
// async way
function _async() {
  document.body.appendChild(div1)

  setTimeout(function () {
    document.body.appendChild(div2)
  }, 2000)

  document.body.appendChild(div3)
}

_async()
```

## Callback
最常用的方法是利用``callback``(回调函数)的方式，因为js中函数也是作为对象存在的，因此可以被当做参数传入另一个函数中，只需要在异步操作执行代码后调用回调函数即可。

但是使用回调函数有很明显的局限性，一方面体现在需要自己对异步操作进行控制，另一方面还很容易陷入"回调地狱"。
```
// use plain callback to sync
function _callback(cb) {
  document.body.appendChild(div1)

  setTimeout(function () {
    document.body.appendChild(div2)
    cb('done')
  }, 2000)

  return 'done'
}

_callback(function () {
  document.body.appendChild(div3)
})
```

## promise
因为回调地狱的问题，后来聪明的人使用将回调延迟执行的思想，从而发明了promise库，调用者可以根据异步流程随心所欲的resolve或reject某个值给之后的操作，从而解决了毁掉地狱的问题。

不过使用promise仍然有问题，就是当代码逻辑很长的时候，总需要带着大片大片的``then``方法，可读性仍然不够清晰。
```
// use promise to sync
function _promise() {
  document.body.appendChild(div1)

  return new Promise(res => {
    setTimeout(function () {
      document.body.appendChild(div2)
      res('done')
    }, 2000)
  })
}

_promise().then(data => {
  console.log(data)
  document.body.appendChild(div3)
})
```

## Generate
后来promise加入了es6标准，同时推出了新的异步解决方案，叫做generate函数，大体讲是提供了一个具有状态机功能的函数，每次执行会停止在实现者声明的某个状态，下次调用会继续从这个状态开始执行。

generate的出现，使必须依靠``callback``实现异步操作的代码风格，可以使用同步代码风格实现，是一颗非常甜的语法糖。

但是它仍有有一些缺点，就是它作为状态机，无法自执行，必须借助实现一个run函数或使用第三方库(如``co``)。

```
// use generate to sync
function* _generate() {
  document.body.appendChild(div1)

  yield function (cb) {
    setTimeout(function () {
      document.body.appendChild(div2)
      cb()
    }, 2000)
  }

  document.body.appendChild(div3)

  return 'done'
}

function run(fn) {
  var gen = fn()

  function next(data) {
    var result = gen.next(data)

    console.log(result.value)

    if (result.done) return

    result.value(next)
  }

  next()
}

run(_generate)
```

## Async/await
为了解决generate的缺点，es7很快发布了继generate更强大的一个东西，叫做async函数。简单说，它并没有什么新特性，把它看做是可以自执行的generate函数即可，其中的await的操作符可以看做是yield操作符的翻版。

```
// use async/await and promise to sync
const fn = function () {
  return new Promise(res => {
    setTimeout(function () {
      res(document.body.appendChild(div2))
    }, 2000)
  })
}

async function _await () {
  document.body.appendChild(div1)
  const f = await fn()
  console.log(f)
  document.body.appendChild(div3)
}

_await()
```

## Observable
最近很火的rxjs也快成用来解决这个问题，详细的介绍可以去它的[官网](http://reactivex.io/rxjs/manual/overview.html)了解。

```
// use rxjs and callback to sync
const _callbackObservable = Observable.bindCallback(_callback)
const result = _callbackObservable()

// result.subscribe(x => {
//   document.body.appendChild(div3)
//   console.log(x)
// })
```