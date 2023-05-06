---
title: Something you should know about color
date: 2023/04/24
description: 一些关于 color 属性的有用的额外知识点和调试技巧。
tag: css
author: You
---

## HSL 语法
> [https://zhuanlan.zhihu.com/p/140478770](https://zhuanlan.zhihu.com/p/140478770)
> 《CSS 新世界》3.9.4

H 是 Hue 的缩写，即**色相，**S 是 Saturation 的缩写，即**饱和度**，L 是 Lightness 的缩写，即**亮度**。<br />css 中，采用 hsl 函数来声明符合该规范的颜色，如下：
```css
hsl(hue, saturation, lightness)
hsl(hue, saturation, lightness, alpha)
```
hue 的声明类型是角度，它对应的色相如下图所示：<br />![hue in css hsl](/images/something-you-should-know-about-color/img1.png)<br />saturation 和 lightness 都是百分比，alpha 是百分比或者是浮点数（0 - 1 之间）。<br />只介绍语法的话，会感觉稍微有点无聊，作为开发者我们可能更希望了解 hsl 在实际业务场景中有哪些应用，但在这之前要稍微科普一下设计领域中关于饱和度和亮度的介绍，如下：
> 饱和度和亮度很大程度上决定了色彩呈现给用户的感受，饱和度、明度越高，视觉冲击力越强烈；饱和度、明度较低的时候，视觉上越温和。而在实际应用上，高饱和、高明度的页面视觉上过于鲜艳，容易给用造成视觉疲劳，导致用户极其容易放弃当前页面的操作。

简单说就是，越亮越饱满，颜色越显眼，越暗越不饱满，颜色越温和，在不同的场景下，它们有不同的用途，比如：

- 质感：前者看起来会更劣质，后者反之，前者会更轻浮，后者会更奢华
- 吸引力：前者更容易吸引注意力，后者反之
- 情绪：前者更热情，后者更冷淡
- 视觉影像：前者更容易造成视觉疲劳，后者反之
- 视觉边界：前者约束感更强，后者则更具有延伸感

在实际业务场景中，假如没有设计师的参与，仅仅通过调整饱和度和亮度，开发者就可以在既有色度上，完成一些看起来还比较不错的设计方案：

- 调高文本颜色的饱和度和亮度，从而提升文本的重要程度，如标题
- 降低亮度来实现 button 或 link 的 hover 效果（我认为原理是降低亮度可以模拟阴影和物体本身色度叠加的效果）
- 快速配色，如 material design(2014) 的配色方案，即通过选定一个色度，按某个固定频率增减饱和度和亮度来生成配色方案，非常适合需要生成多套主题的场景
- 互补色，将 hue 的数组增加（或减少） 180deg 即可，通常可以应用于适配 dark mode 时使用
## 关键字
### currentColor 
> 《CSS 新世界》3.9.3

它表示当前元素（或伪元素）所使用的 color 属性的计算值，通常我们可能会在 svg 中使用它，因为现在很多图标都是基于 svg 实现的，我们期望图标的颜色和字体颜色保持一致，对于大部分场景，只需要全局设置`fill`字段即可：
```css
body {
  fill: currentColor;
}
```
值得一提的是，css 中的很多属性的默认颜色本身就和 color 保持一致，因此无需在这些属性中使用 currentColor，比如 `border`, `outline`，`box-shadow`等。
### transparent
> 《CSS 新世界》3.9.2

transparent 关键字实际上是`rgba(0, 0, 0, 0)`的别名，其实现的效果完全等价，可在在各类颜色相关的 css 属性中使用。<br />值得注意的是，在渐变场景下，使用 transparent 关键字在某些场合下会产生意想不到的结果，如 svg 和 canvas。
## 语法糖
以下的语法都是合理的语法：
```css
/* 可以在 rgb 或 hsl 中设置透明度而非使用 rgba 和 hsla */
rgb(0, 0, 0, 1) 
hsl(0, 0%, 0%, 1)
/* 透明度也可以是百分比 */
rgb(0, 0, 0, 90%)
/* 可以省略逗号 */
rgb(0 0 0)
/* 在语义上，可以通过斜杠语法来区分透明度 */
rgb(0 0 0 / 90%)
```
## Chrome Devtool
> [https://developer.chrome.com/docs/devtools/css/color/#color-picker-elements](https://developer.chrome.com/docs/devtools/css/color/#color-picker-elements)

### color contrast
> [https://webdesign.tutsplus.com/articles/how-to-use-the-contrast-checker-in-chrome-devtools--cms-31504](https://webdesign.tutsplus.com/articles/how-to-use-the-contrast-checker-in-chrome-devtools--cms-31504)

颜色对比度的含义指当前元素字体颜色和容器元素背景色之间的差异程度，比例越高差异越大，反之则差异越小。<br />差异大小会影响文字的可识别度，尤其是对于残障人士，Chrome Devtool 中默认仅按照字体颜色和容器背景色来计算差值，也可以调整为使用 APCA（高级感知对比度算法），该算法除了会考虑以上两个变量之外，还会将字体大小、粗细、元素上下文等变量考虑进来。<br />![AA vs AAA](/images/something-you-should-know-about-color/img2.png)<br />图中的两个指标，AA 和 AAA 分别代表的含义是最小可接受对比度（3.0 - 4.5）和理想对比度（4.5+），它们分别对应上图中的那两条白色的曲线。<br />对比度在上方色调板中的高低关系取决于文字容器背景色，如下：<br />![color contrast under dark & light background](/images/something-you-should-know-about-color/img3.jpg)<br />如果背景色越深，则越靠顶部的颜色对比度越高，反之背景色越浅，则越靠底部的颜色对比度越高。
### color **palette **
点击面板底部右边的两个小箭头，可以激活 palette 显示的方案，如下：<br />![the color palette options](/images/something-you-should-know-about-color/img4.png)<br />我认为比较实用的应该是第二种和第三种，前者可以手动配置当前网站所使用的配色有哪些，后者则是根据代码层面使用 css variable 声明的配色。<br />对于第三种，当前 devtool 会将网站中所有的 css variable 都提取出来，这往往有点多余，不过它提取的顺序和变量声明的顺序保持一致，因此主题相关的配色变量，往往出现在前面，期望未来 Chrome 可以支持根据命名规则过滤变量的功能。
### 模拟视觉缺陷
关于颜色在可访问性上的优化，一般都是针对在视觉上有缺陷的残障人士进行的，因此我们需要一种手段来模拟网站在这些残障人士眼中，展示的效果到底是怎样的。<br />我们可以通过 devtool 中的 Rendering 进行模拟，如下：<br />![the emulation of vision deficiencies](/images/something-you-should-know-about-color/img5.png) <br />其中的选项包含一些常见的视觉缺陷模拟渲染方案，如红绿色盲、模糊视力等。
