---
title: 30 分钟理解 CORB 是什么
tags:
  - http
  - web
categories:
  - 原创
date: 2018-08-23 17:40:32
---

## 写在前面
前些日子在调试 bug 的时候，偶然发现这么一个警告：
> Cross-Origin Read Blocking (CORB) blocked cross-origin response https://www.chromium.org/ with MIME type text/html. See https://www.chromestatus.com/feature/5629709824032768 for more details.

我当前的 chrome 版本是 v68，如果是 v66 或更低版本可能提示的警告信息略有不同。印象中只对 CORS 比较熟悉，CORB 是个什么鬼？好奇心迫使我想要了解一下它到底是什么，于是暂时把手头工作放下查了一些资料并花时间汇总了一下，就有了这篇文章。

再介绍 CORB 是什么以及有什么用之前，需要先了解一些背景知识以做铺垫，下面进入正文。

## 旁路攻击（side-channel attacks）
首先需要了解的是旁路攻击这个术语，关于术语本身的解释，可以去维基百科搜索。简单讲的话，就是从软件系统的物理实现层获取信息进行攻击的手段，软件系统在正常运行时，产生了一些边缘特征，这些特征可以体现一些隐私信息。

这么说可能略显抽象，就拿后文视频链接中列举的例子说明一下，假设小 A 的账户密码是 `gyease`，小 B 想破解小 A 的密码，他可以这么做：
* 首先他可以先输入 `aaaaaa`，之后记录一下从点击登录按钮到错误提示的间隔时间（虽然很短，假设有工具可以记录）
* 之后再输入 `baaaaa`，同样记录时间
* 重复以上过程直到 `gaaaaa`，会发现从点击登录按钮到错误提示的间隔时间稍微变长了一些
* 之后小 B 即知道小 A 的密码第一位是 `g`，之后重复以上步骤即可破解小 A 的密码。

当然这里的例子很蠢，而且也过于理想化，但足够说明问题。反应快的读者可能马上就会知道为什么在观察 'gaaaaa' 的测量结果后小 B 就会知道小 A 首位密码，这是因为执行校验密码是否正确的代码是需要时间的，因此在理想条件下，首位错误和首位正确第二位错误的反馈结果必然是后者时间略长。

这就是一个比较典型的旁路攻击类型，专业的名称叫做计时攻击（timing attack），有兴趣的可以上网搜索了解详情。

## 预执行（speculation execution）
之后再来了解预执行这个概念，电脑之所以可以执行我们所编写的代码，其背后是由若干硬件协同工作的结果。其中两个比较重要的，一个是内存，一个是CPU。众所周知，CPU执行计算的速度肯定是远大于它读取内存的速度的，这样的结果就是，CPU在对内存读取某些数据的时候，会闲置，这样变造成了浪费。为了提高性能，现代基本大部分硬件制造商都引入了预执行这个机制来压榨CPU的性能。大概的意思如下，比如你写了一段代码：
```
if(somethingTrueOrFalse) {
  // TODO ...
}
```

逻辑上，这个 if 语句内部的代码是否执行，取决于 somethingTrueOrFalse 变量，但是注意，这是逻辑上的，CPU在运行这段代码的时候，可不是这样子的。它可能会直接跳过判定 somethingTrueOrFalse 是真是假的逻辑，直接执行 if 语句内部的代码，之后反过来再根据 somethingTrueOrFalse 的取值情况作出反应，如果为真，则保留执行结果，如果为假，则撤销执行结果。

这里对于预执行的描述是极度简化的，不过足够说明概念了。如果有兴趣可以上网搜索相关文章，尤其是预执行策略方面的，我看了一些，没看完，感觉和AI有的一拼（题外话）。

## 幽灵和熔断漏洞（Spectre & Meltdown）
这个漏洞是在今年 1 月份被报道出来的，是硬件系统层面的漏洞。关于这个漏洞本身，网上已经有专业的论文对其进行了详尽的介绍，有兴趣可以自行搜索阅读，这里就不展开说了。简单讲，就是结合上文提及的两个概念的两种实际攻击方法。

这里还需要再说一下 CPU 读取数据的方式，CPU 除了利用预执行来提供性能，它本身在从内存读取数据的时候，还会涉及一个缓存的概念。从缓存读取数据的速度是大于内存的，当 CPU 发现将要读取的一个数据在缓存中存在时，它会直接从缓存中读取，这样同样可以提高性能，但是缓存很小同时也很昂贵，所以缓存的大小无法与内存相比。同时，每个程序运行时，CPU 为了防止进程间互相保持独立，它们都拥有属于自己的某块内存区域，假设程序 A 存在一条想要直接越界访问程序 B 内存的指令，这在 CPU 是属于非法的，它不会执行这条指令，而会选择抛出异常并终止程序，然后将其相应的内存数据清零。

之后问题就出现了，假设我们有以下代码：
```
if (x < arr1.length) {
  y = arr2[arr1[x]]
}
```

这个例子在参考链接的文章中你可能会多次见到，这里大概解释一下：

* arr1 假设是一个比较小的数组，x 是一个我们定义的索引值变量
* 正常情况下，如果 x 超过 arr1 的长度，程序是要崩溃的，因为它越界了，但是在预执行的前提下，CPU 可能会忽略越界的问题而执行 if 语句内部的代码
* arr2 是我们提前声明的一个用来储存数据的数组，它储存于内存的另一个区域，它是连续的，而且我们强制它没有拷贝至缓存，只保存于内存（这点在视频中有提及，我这里强调一下）
* 之后我们假设 arr1 中的位于 x 索引出的值是 k，那么在预执行的前提下，`y = arr2[arr1[x]]`等价于`y = arr2[k]`
* 然后由于我们会把 arr2[k] 这个值付给另一个变量 y，这里其实算是一个访问值的操作，CPU 后将 arr2[k] 位于内存地址的值转入缓存中，而其余元素保留在内存中（因为并未访问）
  
之后，只需要遍历 arr2 这个数组，当发现某个索引上的值的访问速度远快于其他索引的访问速度时，这个索引既是我们从越界内存中“偷”到的值。至此，一次攻击就完成了，理论上，利用这个漏洞，可以获取缓存区所有地址的值，其中很有可能包含敏感信息，比如密码什么的。

## CORB（Cross-Origin Read Blocking）
说了这么多，终于可以引入正题了。它是什么呢？引入 chromium 文档中关于它的定义：
> an algorithm by which dubious cross-origin resource loads may be identified and blocked by web browsers before they reach the web page.
>
> 浏览器在加载可以跨域资源时，在资源载入页面之前，对其进行识别和拦截的算法。

这里可能有人会问，这和上面说的一堆又有什么关系呢？是这样的，Chrome浏览器在处理不同 tab 和不同页面时，会将为它们划分不同的进程，而且受制于同源策略的影响，这些页面之间本应该互不干扰。但是我们知道，同源策略虽然牛逼，但浏览器中仍然存在一些不受制于它约束的 api、标签，比如常见的 img、iframe 和 script等等。诸如以下代码，不知道看文章的诸位有没有写过，反正我是写过，或者说遇见过：
```
<img src="https://foo/bar/baz/">
```

有人可能会问，一个 img 标签你 src 属性不填图片的 uri，你是不是傻。其实不是这样的，有时候对网站做一些跟踪和分析时，确实会这么写，因为浏览器会往`https://foo/bar/baz/`这个地址发送一个 GET 资源的请求，在服务端我们可以利用这个请求做一些追踪的逻辑，同理 script 也可以完成需求。但是这么做的后果就是，虽然 img 帮我们发送了这个请求，但是它却没有得到所期望格式的资源，所以这里实际可以算作一种错误或者异常。而一些攻击者可以利用这一点，比如，在页面嵌入下面的代码：
```
<img src="https://example.com/secret.json">
```
来加载跨域私密文件，因为 img 不受同源策略的制约，这个请求是可以发出去的，服务器响应返回后，显然 secret.json 不是一个图片格式的资源，img 不会显示它，但是并不代表负责渲染当前页面的进程的内存中没有保留关于 secret.json 的数据。因此攻击者可以利用上文中提及的漏洞，编写一些代码来“偷”这些数据，从而造成安全隐患。

而 CORB 的作用就是当浏览器尝试以上面代码的方式加载跨域资源时，在资源未被加载之前进行拦截，从而提升攻击者进行幽灵攻击的成本，这里之所以是说提升成本还非彻底解决是因为这个漏洞是基于硬件层面的，所以软件层面只能做有限的修复，有的人可能马上会说，那 CPU 直接去掉或者用户放弃使用预处理功能不就好了吗？理论上是这样的，但是这将导致预处理带来的性能红利瞬间消失，而且 CPU 的架构设计也不是一天两天就能改的，而且就算改了也没办法一下普及。

## 哪些内容类型受 CORB 保护
当前有三种内容类型受保护，分别是 json、html 和 xml。关于如何针对每种内容类型 CORB 如何对其进行保护，[文档](1)中有详细的章节进行介绍，这里就不多说了。我浏览了一遍，大体的规则均是对内容格式进行一些有针对性的校验，以确认它确实是某个内容类型。这个校验结果最终影响 CORB 的运作方式。

## CORB 如何运作
这里我引用[文档](1)部分章节并做翻译，关于其中的备注可以直接浏览原文档进行查看。

CORB 会根据如下步骤来确定是否对 response 进行保护（如果响应的内容格式是 json、html 或者 xml）:
* 如果 response 包含 X-Content-Type-Options: nosniff 响应头部，那么如果 Content-Type 是以下几种的话， response 将受 CORB 保护：
  * html mime type
  * xml mime type（除了 image/svg+xml）
  * json mime type
  * text/plain
* 如果 response 的状态是 206，那么如果 Content-Type 是以下几种的话， response 将受 CORB 保护：
  * html mime type
  * xml mime type（除了 image/svg+xml）
  * json mime type
* 否则，CORB 将尝试探测 response 的 body：
  * html mime type，并且探测结果是 html 内容格式，response 受 CORB 保护
  * xml mime type（除了 image/svg+xml）, 并且探测结果是 xml 内容格式，response 受 CORB 保护
  * json mime type，并且探测结果是 json 内容格式，response 受 CORB 保护
  * text/plain，并且探测结果是 json、html 或者 xml 内容格式，response 受 CORB 保护
  * 任何以 JSON security prefix 开头的 response（除了 text/css）受 CORB 保护

这里值得一提的是，对于探测是必须的，以防拦截了那些依赖被错误标记的跨源响应的页面（比如，图片资源但是格式却被标记为 text/html）。如果不进行格式探测，那么会有16倍以上的 response 被拦截。

## CORB 如何拦截一个响应
当一个 response 被 CORB 保护时，它的 body 会被覆盖为空，同时 headers 也会被移除（当前 Chrome 仍然会保留 Access-Control-* 相关的 headers）。关于 CORB 的工作方式，一定要和 CORS 做区分，因为它要防止这些被拦截的数据进入渲染当前页面进程的内存中，所以它一定不会被加载并读取。这不同于 CORS，因为后者会做一些过滤操作，数据虽然不可被加载，但是可能仍然保留在渲染进程的内存中。

## 对于其他 web 平台特性的影响
这里仍然是翻译部分文档中的内容，因为本身写的就很细致了。

CORB 不会影响以下技术场景：
* XHR and fetch()
  * CORB 并不会产生显而易见的影响，因为 XHR 和 fetch() 在响应中已经应用了同源策略（比如：CORB 应该仅会拦截那些因缺少 CORS 而发生跨域 XHR 错误的 response）

* Prefetch
  * CORB 会拦截那些到达跨源渲染进程的 response body，但是不会阻止那些被浏览器进程缓存的 response body（然后传递到另一个同源渲染进程）。

* Tracking and reporting
  * 当前存在各种各样的技术，尝试对记录用户访问的服务器发送 web 请求，以检查用户是否已访问某些内容。该请求经常使用隐藏的 img 标签进行发送（我前文提及了），然后服务器以 204 状态码或者 html 文档进行响应。除了 img，还可以使用类似 script、style 和别的可用标签。
  * CORB 不会对这些技术场景造成影响，因为它们不会依赖于服务器返回响应的内容。这一点同样使用与其他类似的技术场景和 web 特性，只要它们不关心响应即可，比如：beacons，ping，CSP违规报告 等。

* Service workers
  * Service workers 可以拦截跨源 requests 并在其内部人为地构建 response（没有跨源和安全边界），CORB 不会拦截它们。
  * 当 Service workers 确实缓存了一些跨源的 responses 时，由于这些 responses 对于调用者来讲是透明的，因此 CORB 会拦截它们，但是这并不需要对 Service Worker 作出任何改变。

* Blob and File API
  * 即使没有 CORB 的话，获取跨源的 blob URLs 当前也会被拦截。

* Content scripts and plugins
  * 它们所属的范围并不含在 CORB 的职责内 —— CORB 假设已经有某种合适的安全策略或安全机制存在于这些 content scripts 和 plugins 中（比如 Adobe Flash 已经实现了类似 CORB 的机制，通过 crossdomain.xml）。

## 总结
大概就这么多，读到这里，应该对 CORB 能够有一个初步的认识和把握了，以及它所需要解决的问题。最后我列举了我写这篇文章之前阅读的文章或者视频，有些需要自备梯子，有些不要。尤其推荐那个 B 站的视频，算是讲的最生动形象的了。另外 Chrome 的文档也很详细，只是有些长，需要耐心慢慢读完。

以上，如有错误，还望指出，大神轻喷。

## 参考链接
* [Cross-Origin Read Blocking (CORB)](1)（需翻墙）
* [15分钟理解幽灵熔断漏洞](2)
* [Cross-Origin Read Blocking for Web Developers](3)（需翻墙）
* [Lessons from Spectre and Meltdown, and how the whole web is getting safer (Google I/O '18)](4)（需翻墙）
* [给程序员解释Spectre和Meltdown漏洞](5)

[1]: https://chromium.googlesource.com/chromium/src/+/master/services/network/cross_origin_read_blocking_explainer.md
[2]: https://www.bilibili.com/video/av18144159/
[3]: https://www.chromium.org/Home/chromium-security/corb-for-developers
[4]: https://www.youtube.com/watch?v=dBuykrdhK-A
[5]: https://zhuanlan.zhihu.com/p/32784852