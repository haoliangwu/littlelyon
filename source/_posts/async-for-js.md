---
title: async-for-js
date: 2016-11-28 09:16:51
tags: [学习, js]
---
介绍关于js开发中所涉及的主流异步编程解决方案
> repo: [async-for-js](https://github.com/haoliangwu/todoMVCs/tree/master/async-for-js)

```
import { Observable } from 'rxjs'
import $ from 'jquery'

document.write('<link rel="stylesheet" href="https://npmcdn.com/hack@0.5.2" />')

const projectName = 'async-for-js'

document.body.className = 'hack'

const div = document.createElement('div')
div.id = 'app'
div.className = 'container'
div.innerHTML = `
  <h1>${projectName}</h1>
  <div class="main">
    <p>
      Hi there, you've made a perfect start using tooling!
    </p>
    <p>
      Check out <strong>README.md</strong> or head to <a href="https://github.com/egoist/tooling">tooling</a> to get more instructions.
    </p>
  </div>
`
document.body.appendChild(div)

const div1 = document.createElement('div')
div1.className = 'container div1'

div1.innerHTML = `<h1>I am one</h1>`

const div2 = document.createElement('div')
div2.className = 'container div2'

div2.innerHTML = `<h1>I am two</h1>`

const div3 = document.createElement('div')
div3.className = 'container div3'

div3.innerHTML = `<h1>I am three</h1>`

// async
function _async() {
  document.body.appendChild(div1)

  setTimeout(function () {
    document.body.appendChild(div2)
  }, 2000)

  document.body.appendChild(div3)
}

// _async()

// use plain callback to sync
function _callback(cb) {
  document.body.appendChild(div1)

  setTimeout(function () {
    document.body.appendChild(div2)
    cb('done')
  }, 2000)

  return 'done'
}

// _callback(function () {
//   document.body.appendChild(div3)
// })

// use rxjs and callback to sync
const _callbackObservable = Observable.bindCallback(_callback)
const result = _callbackObservable()

// result.subscribe(x => {
//   document.body.appendChild(div3)
//   console.log(x)
// })

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

// _promise().then(data => {
//   console.log(data)
//   document.body.appendChild(div3)
// })

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

// run(_generate)

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

// _await()
import { Observable } from 'rxjs'
import $ from 'jquery'

document.write('<link rel="stylesheet" href="https://npmcdn.com/hack@0.5.2" />')

const projectName = 'async-for-js'

document.body.className = 'hack'

const div = document.createElement('div')
div.id = 'app'
div.className = 'container'
div.innerHTML = `
  <h1>${projectName}</h1>
  <div class="main">
    <p>
      Hi there, you've made a perfect start using tooling!
    </p>
    <p>
      Check out <strong>README.md</strong> or head to <a href="https://github.com/egoist/tooling">tooling</a> to get more instructions.
    </p>
  </div>
`
document.body.appendChild(div)

const div1 = document.createElement('div')
div1.className = 'container div1'

div1.innerHTML = `<h1>I am one</h1>`

const div2 = document.createElement('div')
div2.className = 'container div2'

div2.innerHTML = `<h1>I am two</h1>`

const div3 = document.createElement('div')
div3.className = 'container div3'

div3.innerHTML = `<h1>I am three</h1>`

// async
function _async() {
  document.body.appendChild(div1)

  setTimeout(function () {
    document.body.appendChild(div2)
  }, 2000)

  document.body.appendChild(div3)
}

// _async()

// use plain callback to sync
function _callback(cb) {
  document.body.appendChild(div1)

  setTimeout(function () {
    document.body.appendChild(div2)
    cb('done')
  }, 2000)

  return 'done'
}

// _callback(function () {
//   document.body.appendChild(div3)
// })

// use rxjs and callback to sync
const _callbackObservable = Observable.bindCallback(_callback)
const result = _callbackObservable()

// result.subscribe(x => {
//   document.body.appendChild(div3)
//   console.log(x)
// })

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

// _promise().then(data => {
//   console.log(data)
//   document.body.appendChild(div3)
// })

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

// run(_generate)

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

// _await()

```