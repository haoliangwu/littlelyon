---
title: 基本原理及架构
date: 2016-07-01 11:10:15
---
# 模块化与OSGI
众所周知70版本的portal已经更换了整体架构，按OSGI标准实现了模块化，之所以这么做是因为Liferay的模块化开发有以下几个好处：
* 轻量级的框架系统，更快更安全。
* 框架系统采用OSGI标准，如果你对OSGI开发有经验（比如eclipse的开发），那么可以更好地利用已有知识开发liferay。
* 模块项目可以发布服务，同时也可以调用框架系统注册表中来自别的模块的服务，因此，服务之间是一种松耦合关系。
* 模块从包级别暴露代码给别的模块，因此可以使注册表系统自动管理依赖。
* 框架系统的容器动态管理模块的生命周期，包括安装、启动、更新、停止、卸载，同时这些过程均可以在Portal运行时进行。
* 模块式开发对其他模块隐藏内部实现，因此开发者对于内部实现可以按需更改。
* 同时模块采用语义版本号进行版本控制，这样做的好处是，可以允许两个应用程序依赖于两个不同版本的同一个库时，仅仅依赖于这个库的版本号，而不是库本身。
* 可以使用你熟悉的任何开发工具来进行liferay模块开发。

# 语义版本号
在上部分也提到了，liferay的模块版本控制采用语义版本号标准，大体是遵循**MAJOR.MINOR.PATCH**格式的数字命名规范。

使用这种命名规范可以有效减少“依赖地狱”的发生，比如说：
* 当你的应用依赖一个2.2版本的库是，这个库发布了2.3版本，相对2.2做了很大改动，因此你无法升级到库2.3，除非你更新你应用中依赖2.2的代码。
* 当你的应用可以依赖2.3版本时，但同时你依赖的另一个库却依赖2.2。

当使用语义版本号进行版本控制时，应用程序的依赖对象从库本身迁移到版本号本身，当应用初始化时，除非它的依赖库的版本都存在于当前系统中它才会启动。

因此，在Liferay 70的OSGI容器中，所有的代码，都被封装成了若干具有语义版本号的模块，同时这些模块之前也有复杂的依赖关系，但它们都会被OSGI容器统一管理。在Liferay module项目中，你可以通过声明一个**bnd.bnd**文件来创建版本控制信息，假如我有一个hello-world的模块项目，

```
Bundle-SymbolicName: hello.world.demo
Bundle-Version: 1.0.0
```
这样就为这个模块定义了一个唯一的标示名，它的标识名是**hello.world.demo**，版本是**1.0.0**，当加载到容器时，它的名字就会变成**hello.world.demo-1.0.0**，这也是使用gradle打包后jar包的名字。

# 模块类型
Liferay 70中的应用程序模块可以被划分为4类：
* API module
* Service(Provider) module
* Web(Consumer) module
* Test module

### API module
API类型模块是定义provider实现服务接口的模块。因为在面向对象的编程中，鼓励面向借口编程，而不是面向具体实现编程。它的作用是定义一系列接口供provider实现，之后consumer使用API模块提供的服务，但并不需要在意provider是怎样的实现的。

详细项目结构参考[这里](https://dev.liferay.com/develop/tutorials/-/knowledge_base/7-0/osgi-and-modularity#api)。

### Service(Provider) module
Service模块，也叫作Provider模块，这种模块负责实现API模块的，因为API模块虽然定义了服务，但是想要使用这些服务，必须首先实现它们。对于API接口的实现，可以保存在模块内部而不暴露给任何模块，同时还可以在其中使用其他模块暴露的服务。

详细项目结构参考[这里](https://dev.liferay.com/develop/tutorials/-/knowledge_base/7-0/osgi-and-modularity#provider)。

### Web(Consumer) module
Web模块，也叫作Consumer模块，这种模块通过使用服务来实现逻辑业务，在Liferay中，Portlets基本是Consumer类型的模块。

详细项目结构参考[这里](https://dev.liferay.com/develop/tutorials/-/knowledge_base/7-0/osgi-and-modularity#consumer)。

### Test module
测试模块，当然是负责测试工作的，这部分模块仅仅在开发环境才有意义，它们不会被加载到生产环境中，仅仅会在开发环境中确保其他3种类型模块的质量。

# 开发一个hello-world项目
