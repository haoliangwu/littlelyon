---
title: Conditional CSS
date: 2023/03/09
description: CSS 中关于条件控制逻辑的实现方式。
tag: css
author: You
---

条件控制语句在图灵完备的编程语言中是最基本的功能，但在 CSS 中，却没有诸如 `if..else`的语句，如果遇到类似**当满足某种条件就如何如何**的场景时，该怎么办呢？<br />虽然 CSS 不包含 `if..else`语句，但它却可以通过它自身的方式，在语义上和结果上，达到同样的效果。
## 指令
### 媒体查询（`@media`）
媒体查询最常见的用法，是用于识别不同设备的尺寸，这里不再赘述，如：
```css
.section {
  display: flex;
  flex-direction: column;
}

@media (min-width: 700px) {
  .section {
    flex-direction: row;
  }
}
```

除此之外，它还可以识别一些其他业务含义，如下：
```css
/* default hover effect */
a:hover {
  color: black;
  background: yellow;
}

@media (hover: hover) {
  /* when hover is supported */
  a:hover {
    color: white;
    background: black;
  }
}
```
[DEMO](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover#result)<br />代码中，`@media (hover: hover)`的语义表示，**当前媒体的输入设备是否支持 hover 动作**，比如，PC 端的鼠标是支持 hover 动作的，而 Mobile 端由于只支持手势，则不支持 hover 动作。
### 容器查询（`@container`）
相较于 `@media`，`@container`作用于某个容器元素，它最常用的方式也是针对容器元素的尺寸来动态声明样式，这里也不再赘述，如下：
```css
.card-wrapper {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: flex;
    align-items: center;
  }
}
```

除此之外，它还可以查询某个容器是否包含某个样式，如下：
```css
figure {
  container-name: figure;
  --featured: true;
}

/* Featured figure style. */
@container figure style(--featured: true) {
  img {
    /* Custom styling */
  }

  figcaption {
    /* Custom styling */
  }
}
```

它所表达的语义是，当 `figure`标签包含 `--featured`自定义变量时，根据它的值适配不同的样式，这个值往往会和具体的业务逻辑绑定。<br />![conditional-css-style-queries-figure.png](/images/conditional-css/conditional-css-style-queries-figure.png)

但是，该语法当前还**没有**任何浏览器支持，[详见](https://caniuse.com/css-container-queries-style)。<br />当然这并不影响我们提前学习它，[详见](https://ishadeed.com/article/css-container-style-queries/#introducing-style-queries)。
### 兼容性探测（`@supports`）
同样的，`@supports`本身也是用来检测某个 CSS 语法在当前浏览器是否支持的指令，这里也不再赘述关于这方面的方式，如下：
```css
@supports (aspect-ratio: 1) {
  .card-thumb {
    aspect-ratio: 1;
  }
}
```

但换另外一个角度，它还可以这样使用，众所周知，一些 CSS 属性只在某些浏览器，或者某个浏览器的某个版本才被支持，根据这点，我们可以利用它来探测当前浏览器的版本信息，如下：
```css
.supports-match {
  padding: 5px;
  border: 1px solid;
}

/* Edge 12 ~ Edge 15 */
@supports (display: flex) and (not (display: grid))  {
  .supports-match {
    background-color: #333;
    color: #fff;
  }
}
```
[DEMO](https://demo.cssworld.cn/new/2/5-3.php)<br />值得一提的是，`@supports`本身的语法支持 `and`, `not`以及 `or`，因此上面的代码所描述的语义，正好就可以匹配 Edge 12 至 Edge 15，因为这个版本范围的 Edge，支持 `flex`但不支持 `grid`。 
## 属性值的自身行为
### `flex-wrap`
`flex-wrap`本身的渲染机制，就是会在容器没有足够控件时，使子元素换行，这是一种隐式的条件判定逻辑（它被用于 [Defensive CSS](https://defensivecss.dev/)），如下：![](/images/conditional-css/conditional-css-flex-wrap-6.png)
### `flex-basis`
`flex-basis`是 `flex`属性中的第三个值的全称，它控制子元素的最小宽度，当设置了最小宽度后，该元素在小于或大于该宽度时，所表现的行为是不同的，配合 `flex-wrap`，可以实现如下布局：<br />![](/images/conditional-css/flex-wrap-basic.png)
### `fit-content`
`fit-content`本身是 `min-content`和 `max-content`的组合，且它会自动根据实际的容器空间大小，来决定当前元素以哪种尺寸进行渲染，如下图：<br />![](/images/conditional-css/conditional-css-fit-content.png)
## 属性值的语法差异
## 选择器
### `has:`
`has:`选择器本身的语义即表示某个元素是否包含另一个符合某个选择器语法的元素，它可能在语义上，是最接近 `if` 语句的语法。

它的常见使用方式有：

- 判定当前元素是否包含某个些**子**元素
- 判定当前元素是否**被**包含在某个**父**元素中
- 判定当前元素的布局方式

详细的使用方式及例子，可参考[这里](https://ishadeed.com/article/css-has-parent-selector/#section-header)。
### `not:`
`not:`选择器本身在语义上是**取反**的意思，虽然它本身的用途非常有限，但是它的作用常常会在与其他方法中配合使用时被放大。
## 函数
### `min()/max()/clamp()` 
函数 `min()`和 `max()` 虽然它们的语义本身是计算两个值中的最小值或最大值，但这种逻辑，在某些情况下，则可以表示条件判定的逻辑：
```css
.card {
  border-radius: max(
    0px,
    min(8px, calc((100vw - 4px - 100%) * 9999))
  );
}
```

如果换成 `if..else`的伪代码，上述逻辑可以读作：
```
let border-radius

if((100vw - 4px - 100%) * 9999 > 8px) {
  border-radius = 8px
} else {
  border-radius = 0px
}
```

`clamp()`本身是 `min()` 和 `max()` 的组合形式，因此上面的例子也可以写成：
```css
.card {
  border-radius: clamp(
    0px,
    calc((100vw - 4px - 100%) * 9999),
    8px
  );
}
```

上述代码所实现的效果是：![](/images/conditional-css/conditional-css-border-radius.jpeg)
## 规则
### 选择器
CSS 在解析样式选择器时的顺序是从左往右，当遇到不支持或者非法的选择器时，它会跳过当前选择器所声明的整个样式段落，我们利用这点，可以巧妙的检测浏览器的版本信息，如下：
```css
/* IE9+ */
_::before, .foo {}
```

这里的原理是，因为 `::before`伪类是 IE9 浏览器开始支持的，因此低于该版本的浏览器在解析 `_::before`时，会直接跳过该样式段落，所以 `.foo`就不会生效。
### 样式属性覆盖
除了选择器，在样式属性的语法上，同样适用上面的思想，由于 CSS 的样式覆盖规则是**后面声明的规则覆盖之前的**，但**之后声明的属性，其语法不支持，则声明的属性整体都不会生效**，因此也不会覆盖之前声明的属性。<br />我们可以利用这点来做渐进增强的处理：
```css
.icon-loading {
  background: url(./loading.gif);
  /* IE10+ will override the previous rule */
  background: url(./loading.png), linear-gradient(transparent, transparent);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}
```

在这里，第二个 `background`只会在 IE 10+ 的浏览器中生效，因为 `linear-gradient`是在 IE 10+ 才被支持的。
## 参考

- [https://ishadeed.com/article/conditional-css/](https://ishadeed.com/article/conditional-css/)
- 《CSS 新世界》

