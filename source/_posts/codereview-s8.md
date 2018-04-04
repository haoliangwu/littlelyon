---
title: codereview-s8
date: 2017-02-07 10:02:05
tags: [js]

---
## 当元素间存在父子关系时，留意事件冒泡机制所引发的连锁反应
```
                            <tr style="cursor: pointer;" ng-repeat="row in $ctrl.efficiencyTable.bodyData" ng-click="$ctrl.stepView(row)">
                                ...
                                <td class="text-left">
                                    <a ng-click="$ctrl.efficiencyView(row)" class="hover-link">查看流程</a>
                                </td>
                            </tr>
```
> a元素的点击事件会``efficiencyView``方法，但因为事件冒泡机制，也会间接的调用``stepView``方法

### 最佳实践
> angular中可以使用内置的 $event 对象来解决相应问题

首先声明使用``$event``对象并传参
```
<a ng-click="$ctrl.efficiencyView(row, $event)" class="hover-link">查看流程</a>
```
之后再``efficiencyView``方法中调用``stopPropagation``方法阻止事件冒泡
```
efficiencyView (workflow, $event) {
    ...
    $event.stopPropagation()
  }
```
也可以对比``$event``对象中的``target``和``currentTarget``属性是否相同，因为这两个属性分别代表触发事件的dom节点与响应事件的当前节点
```
if($event.target === $event.currentTarget) ...
```

### 扩展
* [EventTarget.addEventListener 方法及其参数的含义](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener)
* [解析Javascript事件冒泡机制](http://blog.csdn.net/luanlouis/article/details/23927347)

## z-index 常见问题
关于``z-index``本身用法我是了解的，但是最近在做下拉框组件和datepicker时，踩了一些坑，如下：

* 只有设置了``position``属性的元素的``z-index``才会生效
* 当父容器的``z-index``小于元素A时，其子容器的``z-index``无论多大都无法覆盖元素A

### 最佳实践
实现具有下拉菜单展开特效的组件时，一般会套用一下结构
```
<div class="dropdown-wrapper">
    <div class="dropdown-toggle">
        ...
    </div>
    <div class="dropdown-list">
        ...
    </div>
</div>
```
当两个下拉菜单处于垂直布局时，如果没有设置``z-index``属性，因为``dropdown-toggle``比``dropdown-list``先出现，因此默认的图层顺序是前者高于后者，所以当上面的下拉菜单出现的时候，并不会覆盖下面的``toggle``,为了解决这个问题，必须做如下处理
```
.dropdown-list{
    ...
    z-index: 1000;
    ...
}
```
最后附上[DEMO](https://jsbin.com/suyojovino/edit?html,css,output)

### 扩展
* [z-index](https://css-tricks.com/almanac/properties/z/z-index/)

## 对表格中的单元格增加一个hover高亮效果
对于表格中``td``增加``hover``高亮时可能会遇到一个问题，就是当你使用常规的``border``属性对边框进行设置时，可能会发现，每个单元格的上边框和左边框都没有达到理想的效果，但是下边框和右边框却是正常的。
这种问题会出现在对``table``增加``border-collapse: collapse``属性或是引用一些第三方的css库，比如bootstrap，具体现象参考[DEMO](https://jsbin.com/hivukumosu/edit?html,css,output)。

### 最佳实践
解决方法其实很简单，就是将``td``边框的样式从``solid``改为``double``，如下：
```
table tr td {
    border-style: double;
}
```
原因如下：
> Since double is "more distinct" then solid, its colour takes precedence over cells around it, and looks identical to solid anyway ;)

### 扩展
* [border-style各属性值及赋值语法](https://developer.mozilla.org/zh-CN/docs/Web/CSS/border-style)

## angular中遭遇的一个奇葩[问题](https://github.com/angular/angular.js/issues/4558)
这个问题是我在本期开发排班器组件时遇到的一个很奇葩的问题，大体描述就是如上面github链接中描述的一样，就是当父组件的一个数据采用双向绑定时，并且需要已事件回调的方法更新其内部的某个属性值，然后使用签名为``onChange``的``scope``属性传给子组件，比如:
```
scope:{
    ...
    onChange: '&
    ...
}
```
那么这个``onChange``的调用在父组件进行更新某条以双向绑定方式进行绑定的属性时，会先于子组件的更新前自动调用，这么说有点抽象，大体的问题我简单描述下。

本来``onChange``的调用时机应当是自下而上的，也就是当子组件发生更新时，调用父组件通过``onChange``属性传递的事件回调方法，这个方法会更具子组件的当前状态来对父组件进行更新，这就是理想中的单向数据流子组件通知父组件进行更新的机制。但是在angular中遇到的奇葩现象现象就是，在父组件进行更新时，不知道是因为签名的缘故还是双向绑定的缘故，这个``onChange``都会先于子组件运行一次，那么问题来了，这个方法本来的调用时机是子组件更新后需要通知父组件进行相应更新时调用的，然而现在子组件还未更新则先调用了该方法，那么回调函数中的参数必为空，除非``onChange``中加入了空校验代码，不然就会报错，其实加了空校验也没有什么意义，因为这个方法都会调用的，但是却不会进行任何的改变，相当于浪费了一部分性能。

### 最佳实践
解决方法在[这里](http://plnkr.co/edit/fs7S6yX1a5aeo1Ese522?p=preview)，这种解决方法算是一种``workaround``，即在组件中使用另一个对象来储存父组件需要更新的那个值，算是做了一种类似中间件的处理，之后因为双向绑定自动更新机制对于对象的更新时更具``reference``来进行的，那么在父组件或子组件中对于这一个数据的引用均是相同的，而不会像基本数据类型存在一个新旧值的差异，不过这终究是一个``workaround``。

## 限制上传文件的类型
现在通过``type``为文件类型的``input``上传文件已经很普遍了，并且对于表单的校验，通常我们会在提交时进行，文件类型的表单也不例外，一般校验的内容有文件大小、文件类型（扩展名）等等。今天遇到一个需求很有意思，大体意思是想在用户进行文件上传时，就有偏向性的屏蔽掉一些不支持的文件格式，比如上传图片，那么在文件选择对话框就不要出现文本类型的文件。

这个问题我一开始是不知道怎么解决的，因为浏览器对于操作系统是一个沙盒，因此对于文件显示的控制应当没有权限控制，去网上google了下，答案也是这样的，没有方式可以实现百分之百屏蔽某种文件类型的方式。但是却发现了另一个很有意思的属性，也可以达到类型的效果。

这个属性就是``input``标签的``accept``属性：
> If the value of the type attribute is file, then this attribute will indicate the types of files that the server accepts, otherwise it will be ignored. The value must be a comma-separated list of unique content type specifiers:

它可以接受的值的描述：
* A file extension starting with the STOP character (U+002E). (e.g. .jpg, .png, .doc).
* A valid MIME type with no extensions.
* audio/* representing sound files. HTML5
* video/* representing video files. HTML5
* image/* representing image files. HTML5

### 最佳实践
比如我们想要限制上传文件类型为excel文件类型，只需要创建如下标签:
```
<input type="file" accept=".xls,.xlsx"/>
```
这样这个文件表单对话框被激活时，默认会选取以.xls和.xlsx结尾的文件。

虽然这个属性可以达到类似的效果，但是是无法完全替代对于文件扩展名的校验的。因为只要用户想要上传别的类型的文件，通过切换文件对话框中的选取文件类型选项（比如显示全部文件类型），就可以选取别的类型的文件了，因此在提交时，也别忘了添加校验逻辑，防止因为上传了一些不支持的类型造成服务器内部错误。

### 扩展
* [input](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/Input)