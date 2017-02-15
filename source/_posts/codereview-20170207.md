---
title: codereview-20170207
date: 2017-02-07 10:02:05
tags: [学习]
---
### 当元素间存在父子关系时，留意事件冒泡机制所引发的连锁反应
```
                            <tr style="cursor: pointer;" ng-repeat="row in $ctrl.efficiencyTable.bodyData" ng-click="$ctrl.stepView(row)">
                                ...
                                <td class="text-left">
                                    <a ng-click="$ctrl.efficiencyView(row)" class="hover-link">查看流程</a>
                                </td>
                            </tr>
```
> a元素的点击事件会``efficiencyView``方法，但因为事件冒泡机制，也会间接的调用``stepView``方法

### 解决方法
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

### z-index 常见问题
关于``z-index``本身用法我是了解的，但是最近在做下拉框组件和datepicker时，踩了一些坑，如下：

* 只有设置了``position``属性的元素的``z-index``才会生效
* 当父容器的``z-index``小于元素A时，其子容器的``z-index``无论多大都无法覆盖元素A

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