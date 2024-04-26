---
title: How to reset style in CSS
publishDate: 2023/03/24
excerpt: 对比 initial, unset, revert 以及 revert-layer 在重置样式时的异同。
tags:
  - css
author: You
---

## initial

> The **initial** CSS keyword applies the [initial (or default) value](https://developer.mozilla.org/en-US/docs/Web/CSS/initial_value) of a property to an element.

故名思意，就是把一个属性的值重置为**默认值**，这里要强调一下，默认值并不是指元素在浏览器中渲染的原始样式的值，而是 CSS 规范中的那个值，比如：

```css
// 将 ul 元素的样式重置为浏览器样式
ul {
  padding: initial;
  list-style-type: initial;
}

// 等价于
ul {
  padding: 0;
  list-style-type: disc;
}

// 但浏览器中，ul 的默认样式是
ul {
  padding: 0 0 0 40px;
  list-style-type: decimal;
}
```

[padding 属性的 initial value 参照](https://developer.mozilla.org/en-US/docs/Web/CSS/padding#formal_definition)<br />[list-style-type 属性的 initial value 参照](https://developer.mozilla.org/en-US/docs/Web/CSS/list-style-type#formal_definition)<br />Chrome 111 中，针对`ul`元素的样式定义如下：<br />![the-default-style-of-ul-in-chrome](/images/how-to-reset-style-in-css/img1.png)<br />这里使用了`paddng-inline-start`这个逻辑属性，其效果等价于 `padding: 0 0 0 40px`。

### 实用 snippets

```css
div {
  // super complex rules...
  all: initial;
}
```

```css
div {
  // super complex rules
  all: initial;
  // custom rules that we want to re-implement
  padding: 40px;
}
```

## unset

> The **unset** CSS keyword resets a property to its inherited value if the property **naturally** inherits from its parent, and to its [initial value](https://developer.mozilla.org/en-US/docs/Web/CSS/initial_value) if not.

unset 是 initial 关键字的延伸，它会根据该属性是否是继承属性，来重置它的值，如果是，则重置为该值，反之，则重置为初始值（和 initial 一样）。<br />理论上，这个值和 all 配合，才会有使用场景，因为无论针对继承样式的场景，还是重置初始样式的场景，我们直接使用 inherit 和 initial 即可。

### 实用 snippets

```css
dialog {
  // super complex rules
  all: unset;
  // custom rules that we want to re-implement
  padding: 40px;
}
```

## revert

> The **revert** CSS keyword reverts the cascaded value of the property from its current value to the value the property would have had if no changes had been made by the current [style origin](https://developer.mozilla.org/en-US/docs/Glossary/Style_origin) to the current element.

revert 的描述虽然有些复杂，但你可以按照 git revert 的角度来以及它，就是如果以浏览器的默认样式为基准，将之后所有其他样式重置掉，因此它才是用于将元素样式重置为浏览器默认样式的全局关键字。

### 实用 snippets

```css
// 将 ul 元素的样式重置为浏览器样式
ul {
  padding: revert;
  list-style-type: revert;
}
```

## revert-layer

> The **revert-layer** CSS keyword rolls back the value of a property in a [cascade layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) to the value of the property in a CSS rule matching the element in a previous cascade layer.

revert-layer 相对于上面的几个关键字，比较新，是基于最近 @layer 指令的扩展。它的语义也比较简单，就是在 @layer 指令声明的 layers 中，将某个属性重置为比它所在 layer 优先级低的上一层 layer，比如：

```css
@layer base, components, variations;

@layer base {
  div {
    padding: 40px;
  }
}

@layer components {
  div {
    padding: 30px;
  }
}

@layer variations {
	div {
    padding: 20px;
  }

  div.revert {
    // 和 padding: 30px 等价
    padding: revert-layer;
  }
}
```

上面的代码示例上，layers 的优先级排序为（从低到高）`variations`>`components`>`base`，因此如果在 `variations`layer 中，将某个属性设置为 revert-layer，则它的值在当前的例子中，是`componens`layer 中的值。

### 实用 snippets

```css
@layer base, components, variations;

@import url(antd.css) layer(components);

@layer variations {
	.ant-btn {
    border-radius: 8px;
  }

  .ant-btn.revert {
    // 重置为 components 中的样式
    border-radius: revert-layer;
  }
}
```
