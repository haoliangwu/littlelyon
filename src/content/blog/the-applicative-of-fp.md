---
title: The Applicative of FP
publishDate: 2023/07/19
excerpt: Applicative 是函数式编程中的一个概念，它提供了一种在上下文中将函数应用于参数的方式。它允许并行计算和组合具有依赖关系的计算。与 Monad 不同，Applicative 没有顺序执行或依赖跟踪的能力。
tags:
  - fp
author: You
---

Applicative 可翻译为**应用式函子**，这里的“应用”在语义上和 Apply 一致，因此，在介绍 Applicative 前，我们需要先了解 Apply 是什么，以及它要解决的问题。

## Functor 无法解决的问题

首先，我们回想一下 Functor，它实现一个`map`或`lift`方法，可以将某个纯函数提升至一个容器对象中，之后我们便可以对它们进行 compose 操作。<br />但这里有一个前提，每个被提升的函数，它都只能有一个参数（Unary），如果该函数有两个以上的参数，Functor 就无法正常工作了，因为 Functor 本身只能包含一个值，如下：

```typescript
const add = (a: number, b: number) => a + b;
const F = Functor<number>(1);

// 返回值类型是 Functor<number>，但内部的值是 NaN
F.map(add);
```

多参数的场景是十分常见的，虽然我们也可以将参数设定为 object 或 array 类型，但这显然不能从根本上解决这个问题。

## Currying come to rescue

如果你接触过任何和函数式编程相关的工具库，一定会知道柯里化的概念，它是一种可以将多参函数，转化为一系列单个参数函数的模式，如下：

```typescript
const add = (a: number, b: number) => a + b;
const curringAdd = (a: number) => (b: number) => a + b;

add(1 + 2) === add(1)(2); // 结果都是 3
```

上面的例子，我们通过 hard-code 方式，实现了`add`函数的柯里化版本，我们也可以实现一个工具函数来对任意参数个数的函数进行柯里化，如下：

```typescript
type Curry<Fn extends (...args: any[]) => any> = Fn extends (...args: infer Args) => infer Return
  ? Args extends []
    ? Return
    : Args extends [infer FirstArg, ...infer RestArgs]
      ? (arg: FirstArg) => Curry<(...args: RestArgs) => Return>
      : never
  : never;

function curry<Fn extends (...args: any[]) => any>(fn: Fn): Curry<Fn> {
  return function curried(...args: any[]) {
    if (args.length >= fn.length) {
      return fn(...args);
    } else {
      return function (arg: any) {
        return curried(...args, arg);
      };
    }
  } as Curry<Fn>;
}

const addMore = (a: number, b: number, c: number) => a + b + c;
const curringAddMore = curry(addMore);

// 以下执行结果均等价
addMore(1, 2, 3) === curringAdd(1)(2)(3);
addMore(1, 2, 3) === curringAdd(1, 2)(3);
addMore(1, 2, 3) === curringAdd(1)(2, 3);
```

实现该函数的原理，主要利用了 js 中关于闭包和高阶函数的概念，这里不再进行赘述，实际项目中，也不建议自行实现该方法，而使用类似`ramda`或`lodash`中提供的方法。

## 将高阶函数提升至 Functor

对于上文中提及的 Functor 的问题，我们可以将被提升的函数，先进行柯里化，再使用`map`或`lift`提升至 Functor 中，如下：

```typescript
const add = (a: number, b: number) => a + b;
const curryingAdd = curry(add);

const F = Functor<number>(1);

// 返回值类型是 Functor<(b: number) => number>
F.map(curryingAdd);
```

然后我们就卡主了，因为 Functor 似乎没有提供一个可以将内部的值进行调用的方法。

## Apply

到这里，我们介绍 Apply 这个 Type Class 的定义，如下：

```typescript
interface Apply<F> extends Functor<F> {
  ap: <C, D>(fcd: HKT<F, (c: C) => D>, fc: HKT<F, C>) => HKT<F, D>;
}
```

> HKT<F, (c: C) => D> 可以理解为泛型再次传递泛型，即 F<(c: C) => D>，[详见](https://ybogomolov.me/higher-kinded-data)

Apply 的语义是，一个参数个数为 unary 的函数，提升至 Functor 中，之后将该方法与其他 Functor 中的值进行调用，这么可能有点绕，换句话说，就是**它赋予了 Functor 能够“应用”于另一个 Functor 的能力**。<br />同时，Apply 可以支持任意参数个数的场景，这里引用`fp-ts`中的例子，如下：

```typescript
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

const f = (a: string) => (b: number) => (c: boolean) => a + String(b) + String(c);
const fa: O.Option<string> = O.some('s');
const fb: O.Option<number> = O.some(1);
const fc: O.Option<boolean> = O.some(true);

assert.deepStrictEqual(
  pipe(
    // lift a function
    O.some(f),
    // apply the first argument
    O.ap(fa),
    // apply the second argument
    O.ap(fb),
    // apply the third argument
    O.ap(fc)
  ),
  O.some('s1true')
);
```

## Applicative

掌握了 Apply，理解 Applicative 就更容易了，它的 Type Class 定义为：

```typescript
interface Applicative<F> extends Apply<F> {
  of: <A>(a: A) => HKT<F, A>;
}
```

`of`方法的语义是将类型为`A`的参数`a`，提升至`Apply`中，因此，对于上文中的例子，可以改写为：

```typescript
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';

const f = (a: string) => (b: number) => (c: boolean) => a + String(b) + String(c);

assert.deepStrictEqual(
  pipe(
    // lift a function
    O.some(f),
    // apply the first argument
    O.ap(O.of('s')),
    // apply the second argument
    O.ap(O.of(1)),
    // apply the third argument
    O.ap(O.of(true))
  ),
  O.some('s1true')
);
```

当然，对于`Option`来说，`of`和`some`构造函数其实完全等价，它在内部实现，本身也是调用`some`构造函数，这里直接复制`fp-ts`中的代码：

```typescript
import { Option, some, none, isNone } from 'fp-ts/Option';

const applicativeOption = {
  map: <A, B>(fa: Option<A>, f: (a: A) => B): Option<B> => (isNone(fa) ? none : some(f(fa.value))),
  of: <A>(a: A): Option<A> => some(a),
  ap: <A, B>(fab: Option<(a: A) => B>, fa: Option<A>): Option<B> => (isNone(fab) ? none : applicativeOption.map(fa, fab.value))
};
```

到这里，对于 Functor 的值是值类型，或函数类型的情况，我们都可以利用某些方法进行处理，但仍然有一种情况无法满足，即**如果一个 Functor 中的值，是另外一个 Functor 的话**，这种情况，又该如何处理呢？<br />欲知后事如何，且听下回分解，我们需要引入 Monad 的概念来解决这个问题。
