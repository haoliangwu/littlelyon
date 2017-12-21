---
title: codewar-series-1
tags: [kata, js]
---

# [Find the missing term in an Arithmetic Progression](https://www.codewars.com/kata/find-the-missing-term-in-an-arithmetic-progression/javascript)

[自己的解法](https://www.codewars.com/kata/reviews/52de553ebb55d1fca3000374/groups/5a3b298fb10016bf94000891)

[更好的解法](https://www.codewars.com/kata/reviews/52de553ebb55d1fca3000374/groups/53fca6444470cbf2bd000bc8)

### 总结
应当多利用题目中已知的信息得到更多有用的信息。

* 根据题中描述，数组开头和结尾元素永远不可能是丢失数字所在位置，因此可以通过求出当前这组数字的``步长(step)``
* 因此每个数都应当满足``first + step * index``，否则当前``index``为所丢失数的索引
* 根据索引求出丢失的数


