---
title: javascript原型链-review
tags:
  - js
date: 2018-02-08 17:28:48
---
## 写在前面

虽然现在es8都已经在预发布阶段了，但是无论发布到es几，其本身的运作原理都是一样的。

首先祭上一张图, 这张图主要描述了以下的关系，如果觉的这里的说明过于复杂可以直接看[最后一段](#总结)。
{% img /img/e83bca5f1d1e6bf359d1f75727968c11_hd.jpg 
%}

## 简单说明

关于``function(class)A``和它的原型之间的关系
>``A.prototype.constructor``与``A``等价

关于``function(class)A``的实例``a``与它的原型之间的关系
>``a.__proto__``与``A.prototype``等价

在上面两个等价条件的基础上，就可以很容易得到
>``a.__proto__.prototype.constructor``与``A``等价

这是一般的类和对象实例之间的原型继承关系。

在此基础上，对于``Object``和``Function``还有一些特殊的关系。

关于``function(class)A``和``Function``之间的关系
>``A.__proto__``与``Function.prototype``等价

关于``function(class)A``的原型和``Object``之间的关系
>``A.prototype.__proto__``与``Object.prototype``等价

关于``Function``的原型和``Object``之间的关系
>``Function.prototype.__proto__``与``Object.prototype``等价

所以也可以很容易知道
>``A.__proto__.__proto__``与``Object.prototype``等价

``Object``对象比较特殊，因为它是所有对象的根，所以约定它的原型所指向的原型对象为空
>``Object.prototype.__proto__``与``null``等价

同时javascript中一切皆为对象，但``Object``本身是一个构造函数，因此它本身的原型对象指向``Function.prototype``
>``Object.__proto__``与``Function.prototype``

## 总结
所以无论是es5风格的继承还是es6风格的继承语法，原型链的形成是都是通过``__proto__``和``prototype``描述的，举个例子，这里使用``es6``, 即:

如果有:
```
class B extends A {}
const a = new B()
```
 
则有：
  * ``a.__proto__ === B.prototype``
  * ``B.prototype.constructor.__proto__ === B.__proto__``
  * ``B.__proto__ === A``
  * ``A.prototype.constructor.__proto === A.__proto__``
  * ``A.__proto__ === Function.prototype``
  * ``Function.prototype.__proto__ === Object.prototype``
  * ``Object.prototype.__proto__ === null``

其他的以此类推。
