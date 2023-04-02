---
title: How to create modern FE library
date: 2021/06/14
description: 随着 es module 逐渐成为 js library 分发的下一代标准，我们要尝试构建符合 es module 的 library。
tag: js
author: You
---

主要分享一些创建一个库项目时，需要考虑的注意事项与最佳实践。

## 找一个优秀的 project starter 或 bundler

如果想要创建项目，不太推荐从零做起，如果是为了学习，从零做起是一个非常好的过程，但通常情况下，效率是需要优先考虑的因素。

因此，可以通过以下两种方式来创建项目：

- 找一个比较稳定的 **boilerplate **或者 **seed **项目，比如：[typescript-starter](https://github.com/bitjson/typescript-starter)
- 找一个专门用于打包 library 的 bundler，比如：[microbundle](https://github.com/developit/microbundle) 或 [rollup](https://rollupjs.org/guide/en/)

值得注意的是，如果项目是和某个框架相关的** plugin** 或者 **extension**，则可以优先使用该框架提供的 starter。

## 维护一份清晰的 README.md

`README.md` 是项目 repo 的入口，一般会包含如下关键信息：

- Documentation：文档入口，里面主要包含详细的 API 或 Options 的文档
- Description：描述，可以简单描述下项目的职能、所用技术栈、设计理念和架构等等
- Usage：使用方式，如安装、启动等指令
- Q & A：常见问题解答，通常是非 Bug 类型的问题
- Issues：Bugs 提交页面入口，可以是内置的，如 gitlab 或者 github 的 Issues 页面，也可以是 JIRA
- Contributors：贡献者列表，一方面是鼓励大家对开源做贡献，同时能够起到通讯录的功能

## 规范的 package.json

`package.json` 是 npm package 的入口，现代前端项目需包含以下几个字段：

- type：指定源码中，所使用的模块规范，`module` 为 es module，不指定则为 cjs module
- source：源码入口
- types(typings)：typescript 加载 `.d.ts` 文件的入口，用于提供类型信息
- exports：当使用 `import "package"` 或 `import "package/sub/path"` 语法时，导入的文件入口
- main：使用 cjs module 导入时，导入的文件入口
- module：使用 es module 导入时，导入的文件入口
- unpkg：unpkg 是一个 NPM 的 CDN 服务，它会默认使用 unpkg 声明的文件入口，如果找不到，则会使用 main
- files: 用于声明使用时必要的目录或文件的通配字符串数组，未被声明的目录和文件在npm install时不会被下载（部分文件永远会被下载，具体规则见文档：[https://docs.npmjs.com/cli/v7/configuring-npm/package-json#files](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#files)）

## 正确声明 dependencies, devDependencies 和 peerDependencies

可以参考文章：[https://code-trotter.com/web/dependencies-vs-devdependencies-vs-peerdependencies/](https://code-trotter.com/web/dependencies-vs-devdependencies-vs-peerdependencies/)

## 文档生成器

由于 library 通常都是服务于业务项目的，毕竟酒香也怕巷子深，再好的项目，如果没有详尽的文档，最终也无法被人广泛使用。

通常文档所需要包含的关键信息如下：

- 常见 API  
- 类型
- 示例

如果是人工来维护文档的话，非常耗费时间。因此现在主流的解决方案是，在源码中，以注释的形式，对代码进行一些标注，这些标注有特殊的规范和格式，比如 [tsdoc](https://tsdoc.org/) 规范。

根据这些注释，我们可以通过第三方工具来解析它们，统一生成文档，比如 [API Extractor](https://api-extractor.com/pages/tsdoc/doc_comment_syntax/)。

类似的规范和文档生成器还有很多，可按需选择。

## 单元测试

越是底层的项目，越要注重 unit test。

因为 unit test 除了它能够减少 regression 发生概率之外，同时也能够帮助开发者更好的理解 library 各个 api 的运作方式，使用方式和期待效果。

前端当前主流使用 `jest`，编写 unit test 非常方便和快捷。

## CI/CD

CI 是持续集成的缩写，通常要解决的问题，是一些机械化的，可重复的工作，如运行单元测试，打包，部署文档等。

这些工作虽然可以靠人工来完成，但由于重复性很高，且需要在各种不同的时机执行，非常耗费时间，所以应该及早交给 CI 来完成。

## 使用规范的目录结构

常见的 library 结构如下：

- config: 用于存放配置文件，一般与源码无关
- dist(lib): 编译产出物目录
- docs: 文档目录
- src: 源码目录
- test: 单元测试目录

规范的意义在于贯彻**约定大于配置**的理念，这样在团队协作和沟通上，可以提高效率。

## 使用语义化版本号

关于 sem version 的详细信息，可以参考： [https://docs.npmjs.com/about-semantic-versioning](https://docs.npmjs.com/about-semantic-versioning)

总结起来如下：

- major 版本号：变动代表 library 包含大量 breaking changes 或有重大功能更新
- minor 版本号：变动代表 library 包含少量 breaking changes 或有少量功能更新
- patch 版本号：变动代表 library 不包含 breaking changes，但有 bugs 修复，优化或非代码相关的修改，如文档

合理使用 sem version，可以提高 library 使用者对于 breaking changes 的关注程度。
