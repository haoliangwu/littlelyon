---
title: HTML is about meaning
date: 2016-08-10 13:05:39
tags: [翻译, html]
---

> 原文地址: http://marksheet.io/html-semantics.html

HTML标签本身的意义是为了传递对于一个document元素的含义，所以再考虑使用正确的标签表达内容之前，考虑你的网页看起来怎么样为时过早，请将注意力集中到每一个你使用的HTML标签上。

你需要根据你书写的内容及本文本身的含义，来选择与之匹配的HTML标签。

<!--more-->

## Structure elements: 组织页面

你可以使用**结构**元素来组织页面的主要部分，这些部分通常包含其他的HTML元素。

下面是一个典型的网页需要包含的**主要部分**:

* ``<header>``作为页面的第一个元素，包含logo和tagline。
* ``<nav>``作为跳转到其他不同的页面的超链接集合。
* ``<h1>``作为页面的标题。
* ``<article>``作为页面的内容模块，比如blog的一个post。
* ``<footer>``作为页面的最后一个元素，位于最底部。

## Text elements: 定义内容

在结构元素中，通常需要寻找一些**文本**元素来达到定义内容的目的。

你将主要使用如下标签:

* ``<p>``作为段落
* ``<ul>``作为无序列表
* ``<ol>``作为有序列表
* ``<li>``作为列表单元
* ``<blockquote>``作为引用

## Inline elements: 区分文本

因为文本标签通常会很长，并且会有不同的内容，**行内**元素使你可以将一些关键部分从文本中区分出来。

有很多的行内元素可以使用，但是你会经常用到以下几个:

* ``<strong>``作为关键字
* ``<em>``作为强调字
* ``<a>``作为超链接
* ``<small>``作为次要字
* ``<abbr>``作为缩写

尝试阅读下面的HTML代码，你就可以很容易的理解每一个元素的用途。

{% codeblock %}
<article>
  <h1>Main title of the page</h1>
  <h2>A subtitle</h2>
  <p>
    Something something an other stuff and some <em>emphasis</em> and even <strong>important</strong> words.
  </p>
  <p>
    Another paragraph.
  </p>
  <ul>
    <li>One</li>
    <li>Two</li>
    <li>Three</li>
  </ul>
  <blockquote>
    Once said
  </blockquote>
</article>
<aside>
  <h3>My latest posts</h3>
  <ul>
    <li><a href="#">One</a></li>
    <li><a href="#">One</a></li>
    <li><a href="#">One</a></li>
  </ul>
</aside>
{% endcodeblock %}

## Generic elements 演变标签

当没有显而易见的具有语义的标签来匹配相关内容，但你仍然要插入一些标签来达到格式化和分组化的目的，你可以使用一到两个下面的具有演变性的标签:

> 我理解的演变的意思是这些标签可以通过css样式来变成不同职能的其他标签

* ``<div>``作为块级元素组
* ``<span>``作为行内元素组

尽管这些标签没有任何的实际意义，但它们与css配合使用将十分有用。

## Don’t overthink semantics 不要想太多

大约有100多种语义标签供你使用。如果可以选择合适的元素来使用，那将是十分不错的选择。

但是不要花费太多的事情太考虑这件事，仅仅从现在开始，有选择地使用上面所提供的标签，你的网页将会变得更好。

