---
title: 你不知道的 JSON.stringfy
tags:
  - js
categories:   
  - 翻译
---
> http://thecodebarbarian.com/the-80-20-guide-to-json-stringify-in-javascript.html

`JSON.stringfy()`是将一个 JavaScript 对象转化为 [JSON](https://www.json.org/) 格式字符串的[标准方式](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)。许多 JavaScript 框架在其内部，都会使用 `JSON.stringify()`：[Express](http://expressjs.com/en/4x/api.html#res.json)的 `res.json()`、[Axios](https://github.com/axios/axios#example)的 `post`，以及[webpack stats](https://webpack.js.org/configuration/stats/)，它们都调用了 `JSON.stringify()` 方法，并包含错误案例。

## 简单入门
所有的现代 JavaScript 运行时都支持 `JSON.stringify()`，甚至 [IE8](https://blogs.msdn.microsoft.com/ie/2008/09/10/native-json-in-ie8/) 都支持它。下面是一个将简单对象转化为 `JSON` 的例子：
```
const obj = { answer: 42 };

const str = JSON.stringify(obj);
str; // '{"answer":42}'
typeof str; // 'string'
```

你可能经常看到 `JSON.stringify()` 和 `JSON.parse()` 一起配合使用的场景，就像下面的代码一样，这种模式是实现[深拷贝](https://flaviocopes.com/how-to-clone-javascript-object/#json-serialization)的方式之一：
```
const obj = { answer: 42 };
const clone = JSON.parse(JSON.stringify(obj));

clone.answer; // 42
clone === obj; // false
```

## 错误以及边界用例
`JSON.stringify()` 在转化对象存在循环引用时，会抛出[错误](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Exceptions)。更简单地说，就是如果一个对象有一个属性指向它本身，`JSON.stringify()` 会抛出错误，比如：
```
const obj = {};
// 存在循环引用的对象，它指向它本身
obj.prop = obj;

// 会抛出 "TypeError: TypeError: Converting circular structure to JSON" 异常
JSON.stringify(obj);
```

这是 `JSON.stringify()` 会抛出异常的唯一情况，除非你通过声明自定义的 `toJSON()` 方法或者 `replacer` 函数。尽管如此，你仍然应该将 `JSON.stringify()` 包含在 `try/catch` 语句中，因为循环引用在实践中十分常见。

同时，一些边界用例下，`JSON.stringify()` 并不会抛出错误，但是你可能却期望它抛出错误。比如说，`JSON.stringify()` 会将 `NaN` 和 `Infinity` 转化为 `null`:
```
const obj = { nan: parseInt('not a number'), inf: Number.POSITIVE_INFINITY };

JSON.stringify(obj); // '{"nan":null,"inf":null}'
```

`JSON.stringify()` 也会直接省略那些值为 `functions` 和 `undefined` 的属性，如下：
```
const obj = { fn: function() {}, undef: undefined };

// 它会返回空对象
JSON.stringify(obj); // '{}'
```

### 格式化
`JSON.stringify()` 的第一个参数是被序列化为 `JSON` 的对象。`JSON.stringify()` 实际上可以接受 3 个参数，同时第三个参数被称作 `spaces`。`spaces` 参数被用于采用一种可以提高可读性的方式来格式化 `JSON` 字符串。

你可以传递类型为 `string` 或者 `number` 的 `spaces` 参数。如果 `spaces` 为 `undefined`，那么 `JSON.stringify()` 会将每个键值放到单独的一行，同时为其增加正确的缩进空格，比如：
```
const obj = { a: 1, b: 2, c: 3, d: { e: 4 } };

// '{"a":1,"b":2,"c":3,"d":{"e":4}}'
JSON.stringify(obj);

// {
//   "a": 1,
//   "b": 2,
//   "c": 3,
//   "d": {
//     "e": 4
//   }
// }
JSON.stringify(obj, null, '  ');

// 数字 2 会达到和上面一样的效果，它代表空格的个数
JSON.stringify(obj, null, 2);
```

`spaces` 字符串不一定非要是空格，虽然通常我们会使用空格，比如它也可以是下划线：
```
// {
// __"a": 1,
// __"b": 2,
// __"c": 3,
// __"d": {
// ____"e": 4
// __}
// }
JSON.stringify(obj, null, '__');
```

### Replacers
`JSON.stringify()` 的第二个参数是 `replacer` 函数。在上文的例子中，它等于 `null`。JavaScript 会对对象中的每一个键值对调用 `replacer` 函数，然后会使用其返回值，作为格式化后的值，比如：
```
const obj = { a: 1, b: 2, c: 3, d: { e: 4 } };

// 使每个属性的值递增 1
// '{"a":2,"b":3,"c":4,"d":{"e":5}}'
JSON.stringify(obj, function replacer(key, value) {
  if (typeof value === 'number') {
    return value + 1;
  }
  return value;
});
```

`replacer` 函数在省略敏感数据时，十分有用。假设你想要省略所有包含 `password` 的属性：
```
const obj = {
  name: 'Jean-Luc Picard',
  password: 'stargazer',
  nested: {
    hashedPassword: 'c3RhcmdhemVy'
  }
};

// '{"name":"Jean-Luc Picard","nested":{}}'
JSON.stringify(obj, function replacer(key, value) {
  // 这个函数会被调用 5 次，这里的 key 依次为：
  // '', 'name', 'password', 'nested', 'hashedPassword'
  if (key.match(/password/i)) {
    return undefined;
  }
  return value;
});
```

## `toJSON` 方法
`JSON.stringify()` 方法在遍历对象的同时，也会关注那些拥有 `toJSON()` 方法的属性。如果它发现 `toJSON()` 方法，`JSON.stringify()` 会调用它，然后将它的返回值替换格式化后的值，比如：
```
const obj = {
  name: 'Jean-Luc Picard',
  nested: {
    test: 'not in output',
    toJSON: () => 'test'
  }
};

// '{"name":"Jean-Luc Picard","nested":"test"}'
JSON.stringify(obj);
```

`toJSON()` 方法可以返回任意的值，包括对象、基础类型，或者 `undefined`。如果 `toJSON()` 返回 `undefined`，`JSON.stringify()` 将会忽略这个属性。

很多 JavaScript 模块使用 `toJSON()` 来确保序列化复杂对象的正确性，比如 [`Mongoose documents`](https://mongoosejs.com/docs/api.html#document_Document-toJSON) 和 [`Moment` 对象](https://momentjs.com/docs/#/displaying/as-json/)。

## 最后
`JSON.stringify()` 是 JavaScript 中较核心的基础方法。许多库和框架在其内部都使用它，因此，深入的理解它，可以帮助你更好地使用你喜欢的 `npm` 模块。比如，你可以在 Express REST API 中利用 `toJSON` 方法来格式化原生 `Date` 类型，或者在 Axios 中，能够正确地通过 HTTP 请求发送包含循环引用的对象。