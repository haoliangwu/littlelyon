---
title: vscode typings配置
date: 2016-09-21 15:33:31
tags: [js]
categories: [前端]
---
vscode发布至今已经到1.5.2了，我是从1.1开始用的，经历了几个改动比较大的版本。总体给我的感觉还是很好的，作为一个rich editor，能够提供像webstorm之类ide的代码提示功能非常赞，但是对于这块的配置还真没折腾过，只知道它的提示是基于ts的compiler提供的，虽然是ts提供的，但是js作为ts的编译对象，同样可以享受这个compiler提供的便利。

<!--more-->

大体步骤分为：
* [配置typings](#进行vscode的js项目配置) 
* [安装typings的依赖资源](#安装typings的依赖资源)
* [进行vscode的js项目配置](#进行vscode的js项目配置)

## 配置typings

首先你需要安装nodejs环境，这里不赘述了。之后

> npm i typings -g

这样全局都可以调用typings这个命令了，然后只需要在你需要提供智能提示的project的根目录执行

> typings init

这样会生成一个typings.json文件，这个文件的功能和package.json类似。

## 安装typings的依赖资源

安装依赖就容易多了，比如你需要angular的资源，只需要执行

> typings i dt~angular --save --global

这里的dt~是指资源的registry，这个可以在typings的帮助信息中查看。

如果你不确定某个资源的registry，比如你想要react的资源，你可以执行

> typings search react

之后console会列出已知的所有资源的registry。

## 进行vscode的js项目配置

最后一步，需要为vscode指定js项目配置，这个配置文件叫做jsconfig.json，如果你只需要提供智能提示的功能话，这个文件可以为空。

这个文件的位置表示以当前位置为项目根目录。

并行的项目可以提供多个jsconfig在不同的项目中，以此来表示它们是彼此区分的。

对于嵌套的项目，配置多个jsconfig并不会区分父子关系，不是很建议这么做，因为这个智能提示功能是基于vscode extension的language server实现的，如果一个项目文件过多，可能导致解析超时而导致无法提供正确的提示信息（我遇过n次这种情况，开始还以为是vscode的bug），最好还是采用并行的方式。

## 效果

上图一张

{% img /img/vscode_typings_angular.png 566 312 
%}