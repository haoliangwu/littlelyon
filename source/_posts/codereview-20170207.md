---
title: codereview-20170207
date: 2017-02-07 10:02:05
tags: [学习]
---
# 当元素间存在父子关系时，留意事件冒泡机制所引发的连锁反应
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
之后再``efficiencyView``方法中
```
efficiencyView (workflow, $event) {
    ...
    $event.stopPropagation()
  }
```

### 扩展
* [EventTarget.addEventListener 方法及其参数的含义](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener)
* [解析Javascript事件冒泡机制](http://blog.csdn.net/luanlouis/article/details/23927347)