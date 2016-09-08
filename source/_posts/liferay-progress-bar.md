---
title: liferay-progress-bar
date: 2016-07-22 16:44:55
tags: [liferay,css]
---
上次山寨了一个smile face，最近因为一直都在测70，然后就又对70的progress bar起了兴趣。

大体上portal的progress bar就两种，一种是线性的，一种是环形的。

<!--more-->

先来线性的:

{%iframe http://jsbin.com/xumove/edit?output 680 200
%}

线性没有什么困难，值得注意的是，可以使用``float``属性来模拟一下先向右延伸之后又收缩的效果。

再来环状的:

{%iframe http://jsbin.com/zavabaw/edit?output 680 200
%}

环状的比线性的复杂一点，在模拟旋转效果的时候，为了使动画效果不存在偏差（虽然这种偏差十分小，正常情况下是不会被肉眼发现的），在设置``transform-origin``的时候需要将旋转颗粒的半径也考虑进去，因此旋转中心会变成:
```
transform-origin: $r/2 50px;
```

就这样，完了有时间再模拟一些portal其他的动画效果。


