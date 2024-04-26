---
title: rx.js 实践之 RPC Client
publishDate: 2021/12/16
excerpt: 使用 rx.js 来实现复杂事件模型下的通用模块。
tags: 
  - css
author: You
---

## 为什么是 rxjs

因为 rxjs 是面向异步编程的解决方案，而 rpc client 的设计，需考虑如多播、重试等问题，它们有一个共同点，均符合**当在某种情况发生时，需做哪些处理的逻辑**，因此非常适合 `rxjs`。

## 为什么不是 Promise

Promise 是也可以解决异步编程的问题，但由于 rpc client 会提供类似 subscription 的功能，这意味着数据源会存在推送行为，因此 Promise 只能单次 resolve 或 reject 的特征则无法满足这种需求。

## 数据源的设计与封装

使用 rxjs 来实现 rpc client 的过程，实际上是各种数据源进行抽象并将其合理封装为 Observable（或 Subject）的过程。在合理抽象的前提下，通过 operator 来进行对 Observable 进行各类操作以符合业务需求。

rpc client 最核心的两个功能即为**发送消息**和**接受消息，**因此可作出以下抽象：

- 发送消息（`input$`）：
  - 由于发送消息是**主动的**，在 rxjs 中可以通过 Subject 来抽象它
  - 如果所发送的消息需要支持**快照**，则可以使用 BehaviorSubject
- 接受消息（`message$`）：
  - 接受消息是被动的，因此我们可以直接通过 Observable 来抽象它
  - 虽然可以通过 fromEvent 操作符来直接将通过 port.onMessage 事件转换为 Observable，但由于为了模拟**请求/响应**的模式，我们需要在其中桥接发送消息的逻辑，所以我们应当使用 Observable **构造函数**的方式来创建它

当有了这两个抽象之后，可以进一步抽象出 send 方法，send 是指按照请求/响应模式来与 rpc middleware 进行交互，发送单条消息，同时接受它的响应消息，核心代码如下：

```ts
  protected send<P extends Array<any>, R>(
    method: string,
    params?: P
  ): Observable<R> {
    const id = this.id++;

    const message = {
      jsonrpc: '2.0',
      id,
      method,
      params: params ?? [],
    };

		// 通过 input$ 发送消息
    this.input$.next(message);

    return this.message$.pipe(
      // 只订阅 success（没有 error） 状态的 response message
      filter<Message<P, R>, SuccessMessage<R>>(isSuccessMessage),
      // 只订阅和 request message 的 id 一致的 response message
      filter(m => m.id === id),
      // 模拟请求/响应模式，收到 reponse 即退订
      take(1),
      // 映射逻辑
      map(m => m.result)
    );
  }
```

有了 `send` 方法，很自然地就可以进一步使用它来抽象出若干较基础的方法来满足简单业务需求，如 `connect`、`disconnect`、`multicast` 等等，这里以 `multicast` 为例，代码如下：

```ts
  multicast(topic: string, payload?: any) {
    return this.send<MulticastParams, boolean>('multicast', [topic, payload]);
  }
```

对于复杂的业务需求，也是水到渠成，比如，在 `skoluda` 中调用 `connect` 方法时，实际上其中包含非常复杂的业务流程，大体如下：

- 发送 `connect` 请求消息至 rpc middleware 以唤起 ext mock window
- 如果 `connect` 响应消息直接返回 account 则流程结束，否则多播 `WalletEvents.Connecting` 事件
- 等待 ext mock window 完成连接操作的结果并作出响应
  - 成功时获取 wallet 当前的 account
  - 失败时进行错误提示，可能的错误如：ext mock window 唤起失败、ext mock window 被强制关闭、用户主动 reject 等等

虽然用文字进行描述看起来非常复杂，但通过 `rxjs` 进行抽象非常简单，且语义化良好，代码如下：

```ts
  connect(id: string, metadata: DappMetadata) {
    return this.send<[id: string, metadata: DappMetadata], boolean>('connect', [
      id,
      metadata,
    ]).pipe(
      // 当 ext mock window 唤起失败时或 request message 发送失败时
      throwFalsy('the popup window popups failed'),
      switchMap(result => {
        return isAccount(result)
          // 如果之前已连接过，则 connect response message 直接返回 account
          ? of<Account>(result)
          // 反之属于未链接的情况，多播 WalletEvents.Connecting 事件
          : this.multicast(WalletEvents.Connecting).pipe(
              // 当多播消息失败时
              throwFalsy('connect to wallet failed'),
              switchMap(() =>
                merge(
                  // 订阅 WalletEvents.Connected 事件（该事件会在 ext popup 中被 emit）
                  // 代表连接成功，用户在 ext mock window 点击 confirm 按钮后
                  this.channel<Account>(WalletEvents.Connected),
                  // 订阅 MockPopupEvents.Aborted 事件（该事件会在 rpc middleware 中被 emit）
                  // 代表所有导致 ext mock window 关闭的场景
                	this.channel<any>(MockPopupEvents.Aborted).pipe(
                    switchMap(() =>
                      throwError(() => new Error('connect to wallet aborted'))
                    )
                  )
                )
              )
            );
      }),
      take(1)
    );
  }
```

到这里，可以发现，`rxjx` 解决问题的思路是从简入繁，从浅入深，层层递进的，复杂的 Observable 是由简单的 Observable 构成。

## 如何实现重连

这种基于 socket 建立链接进行通信的场景，重连是一个必须要考虑的问题。`rxjs` 中本身提供了 `retry` 和 `retryWhen` 操作符，它们可以在 Observable 发生异常时，**重新订阅**上游 Observable。

这里我们没有直接使用这两个操作符来完成需求，而是使用 `backoff-rxjs` 这个库，它采用一种叫做 `backoff` 的重试机制来进行重试，即**退避，**关于它含义以及和超时、重试的区别，可以参考[《重试、超时和退避》](https://nettee.github.io/posts/2019/Retries-Timeouts-and-Backoff/)。

它的使用方法十分简单，如下：

```ts
retryBackoff({
  initialInterval: RETRY_BACKOFF.INITIAL_INTERVAL,
  maxInterval: RETRY_BACKOFF.MAX_INTERVAL,
  shouldRetry: (error: Error) => {
    // todos: should provide a way to let user decide retry timing
    console.error(`retry to establish port due to:`);
    console.error(error);
    return true;
  }
});
```

我们可以简单看下它的源码，[核心代码](https://github.com/alex-okrushko/backoff-rxjs/blob/2e98471e445d338662a218c6aa065e1dd9a18d6c/src/operators/retryBackoff.ts#L43)如下：

```ts
retryWhen<T>((errors) =>
  errors.pipe(
    concatMap((error) => {
      const attempt = index++;
      return iif(() => attempt < maxRetries && shouldRetry(error), timer(getDelay(backoffDelay(attempt, initialInterval), maxInterval)), throwError(error));
    })
  )
);
```

可以发现，它的实现细节，本质上也是基于 `retryWhen` 的二次封装，由于 `retryWhen` 的返回值决定了是否需要进行重试以及如何重试的方式，我们在它内部编写符合 `backoff` 策略的重试逻辑即可。

## 最佳实践

最后再分享一些 `rxjs` 中必知必会的操作符和最佳实践。

### 简单而万能的 `of` 和 `from`

`of` 和 `from` 是 `rxjs` 最简单的一个操作符，但它俩略有不同：

- `of`：会直接将参数包装为一个 Observable，如 `of([1, 2, 3]) => [1, 2, 3]`
- `from`：会尝试将 collection 数据类型的参数扁平化，再转变成 Observable，如 `of([1, 2, 3]) => 1 => 2 => 3`

`of` 和 `from` 经常会和 `switchMap` 配合使用，具体模板如下：

```javascript
switchMap((rawData) => {
  // 在某些条件下，映射为别的 Observable

  return of(rawData);
});
```

它在这里的作用是重新将 `rawData` 和下游的 Observable 桥接起来。

### Observable 的映射 `switchMap`

`rxjs` 中对数据进行二次处理的操作符有很多，如 `map`、`filter` 等，但它们仅仅负责解决 `data => data` 的映射逻辑，如何解决 `Observable => Observable` 呢？答案是使用 `switchMap`。

除了 `switchMap` 之外，还有 `concatMap` 和 `mergeMap`，它们的区别如下：

- `switchMap`：
  - 新的事件被 emit 时，会立马退订上一个 Observable，哪怕它的下游处于 pending 状态
  - 事件源具有排它性质时，适合使用它，如发送请求时，在多条请求下，我们可能只在乎最新的那条请求所对应的响应
- `concatMap`：
  - 只有在上一个 Observable 的下游 Observable 退订时，才会允许新的事件被 emit
  - 事件源具与时间维度的先后顺序有强耦合关系时，如工作流的抽象，每一个步骤都依赖上一个步骤的完成
- `mergeMap`：
  - 新的事件被 emit 时，直接订阅新的 Observable，同时也不会退订上一个 Observable
  - 和 `switchMap` 相反，当事件源不具备排它性质时，则应该使用它，比如将鼠标点击事件映射为一个计数状态，每次点击事件都应该被计数

### 通过 `take` 隐式退订

`rxjs` 本身是发布订阅模式而实现的，Observable 对象在调用 subscribe 方法后，未了避免内存泄漏，往往需要显式的调用 `unsubscribe` 方法来退订，如：

```ts
React.useEffect(() => {
  const sub = of(1).subscribe();

  return () => sub.unsubscribe();
}, []);
```

这样做虽然没有错，但在 Observable 的运作中实际上是多次依据，原因在于 `of` 本身是一个 cold Observable，即它在 emit 完全部事件之后，就会 complete，订阅者在接受到 complete 事件后则会自动退订（不会存在内存泄漏问题），因此这里实际上可以简写为：

```ts
React.useEffect(() => {
  of(1).subscribe();
}, []);
```

在 rpc client 中，由于大部分的方法，都在模拟请求/响应模式，但 `message$` 本身是一个 hot Observable，所以我们可以通过 `take(1)` 来强制将它转化为一个与 cold Observable 行为**类似**的 Observable。类似的操作符，还有 `takeUntil`、`takeLast`、`takeWhile`，它们的行为类似，只是触发条件不同而已。

### hot vs cold Observable

可以直接阅读[《Hot vs Cold Observables》](https://benlesh.medium.com/hot-vs-cold-observables-f8094ed53339)这篇文章进行了解，简单区分办法是，事件源的订阅逻辑在 Observable 外部则为 hot，内部则为 cold。
