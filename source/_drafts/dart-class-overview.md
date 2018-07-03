---
title: dart class overview
tags: [dart]
categories: 
  - 原创
---
## 写在前面
最近在折腾 flutter 相关的东西，所以当然要撸一下 dart 了。编程语言这个东西，接触得多了学习起来速度会提升不少，但是不同的语言具有不同的特色，我们需要花一些时间去关注它们的卖点，而且对于大部分面向对象语言，也需要格外注意**类**的概念，因此专门花了一些时间结合官方文档整理学习 dart 中关于类的内容。

dart 是一门面向对象的语言，既然是面向对象就不会缺少类（class）这个概念。dart 中的 classes 包含的内容繁多，但是如果你同时拥有使用静态语言和动态语言的经验则会容易不少。

### 声明、实例化及访问属性
这一部分是最基本的内容，和大部分编程语言的语法差不多。比如想要声明一个 Point 类：
```
class Point {
  num x, y = 1;

  Point(num x, num y) {
    this.x = x;
    this.y = y;
  }

  Point.fromJson(Map<String, num> json){
    this.x = json['x'];
    this.y = json['y'];
  }
  /* 类似 typescript 可以使用如下的语法糖
  Point(this.x, this.y);
  */
}
```

### 实例化：
```
Point p = Point(1, 1) // 或者 new Point(1, 1)
```
### 访问属性：
```
print('${p.x} ${p.y}'); // 类的方法同理
```
还可以使用 ?. 来避免当访问实例为空时抛出异常：
```
print('${p?.x}');
```
### 属性可见范围
dart 中不存在类似 java 和 typescript 中的 private、protected、public 修饰符，它使用约定来对类属性的可见范围进行控制。约定如下：
如果一个标识符以下划线（_）开头，则它为一个私有标识符。

### 构造函数
dart 类的构造函数存在两种形式，一种为 ClassName() ，另一种是 ClassName.ConstructorName() ，举例说明：
```
var p1 = new Point(2, 2);
var p2 = new Point.fromJson({'x': 1, 'y': 2}); 
```
这里的 fromJson 是一个自定义的构造器方法，在 dart 中它叫做 [Named constructors](https://www.dartlang.org/guides/language/language-tour#named-constructors)，所以上面的 Point 类也可以这么声明：
```
class Point {
  num x, y = 1;

  Point(num x, num y) {
    this.x = x;
    this.y = y;
  }

  Point.fromJson(Map<String, num> json){
    this.x = json['x'];
    this.y = json['y'];
  }
}
```
在 dart 的构造器中还涉及一个东西，叫作 initializer list。大体的语法如下：
```
class Point {
  ...(略)

  Point.fromJson(Map<String, num> json): x = json['x'],y = json['y'];
}
```
这种写法和上面的代码是等价的。关于 initializer list 语法可以参考[这里](https://www.dartlang.org/guides/language/language-tour#initializer-list)。

除了基本的构造器以外，dart 还可以声明其他类型的构造器，当前有三种：
* [Redirecting constructors](https://www.dartlang.org/guides/language/language-tour#redirecting-constructors)
* [Constant constructors](https://www.dartlang.org/guides/language/language-tour#constant-constructors)
* [Factory constructors](https://www.dartlang.org/guides/language/language-tour#factory-constructors)

关于具体的语法可以参考链接所指向的官方文档，我觉的比较有用的应当是工厂构造器。因为在面向对象编程中，一个基本的设计模式即是工厂模式，dart 提供的工厂构造器可以说是在语法层面原生提供工厂模式的实现方式。

最后关于构造器还有一点值得一说，就是当存在继承关系并在默认情况下，构造器的调用顺序如下：
initializer list -> 父类默认无参构造器 -> 主类默认无参构造器

如果父类不存在默认无参构造器，那么主类必须显式地调用父类的其他构造器（Named constructors 或者 有参构造器），调用的代码可以包含在 initializer list 中，如下：
```
class Employee extends Person {
  Employee(Map data) : super(data);
}
```
### 方法
类的方法可以划分为以下几类：
* [实例方法](https://www.dartlang.org/guides/language/language-tour#instance-methods)
* [getter/setter](https://www.dartlang.org/guides/language/language-tour#getters-and-setters)
* [抽象方法](https://www.dartlang.org/guides/language/language-tour#abstract-methods)（必须在抽象类中）

### 接口
不像 java，dart 中每一个类都会隐式的声明一个包含当前类及它所实现所有接口的成员属性的接口。现在我们想实现一个可以 run 和 jump 的 Person 类，代码如下：
```
class Run {
  void run() {}
}

class Jump {
  void jump() {}
}

class Person implements Run, Jump {
  void run() {
    print('I can run');
  }
  
  void jump() {
    print('I can jump');
  }
}
```
### 继承
和其他面向对象编程语言中的继承差不多，可以参考[这里](https://www.dartlang.org/guides/language/language-tour#extending-a-class)。

### 枚举
dart 中也可以像 typescript 一样，使用 enum 声明枚举对象，如下：
```
enum Color { red, green, blue }
```
枚举相比类有如下限制：
无法继承或者使用 mixin，同时也无法被当做接口
无法显示实例化

### mixins
熟悉 python 的话会很熟悉这个特性，dart 中使用 with 关键字来在一个类中混入 mixins，比如：
```
class Musician extends Performer with Musical {
  // ···
}
```
声明一个 mixin 的语法很简单，首先创造一个抽象类，同时不要声明构造器，如下：
```
abstract class Musical {
  bool canPlayPiano = false;
  bool canCompose = false;
  bool canConduct = false;

  void entertainMe() {
    ...（做一些事）
  }
}
```
### 静态属性及方法
和其他编程语言类似，只需要在属性或者方法前加 static 关键字即可。

### 抽象类
和其他编程语言类似，通过 abstract 关键字声明，比如：
```
abstract class AbstractContainer {
  void updateChildren(); // Abstract method.
}
```
抽象类无法实例化，除非它被实现。

### Callable 
类可以提供一个 call() 方法以使当前类成为 Callable class，提供该方法以后类实例可以被当做函数来调用，比如：
```
class Point {
  ...(略)

  call() => '${this.x} ${this.y}';
}
```
直接调用类实例来输出坐标：
```
var p1 = new Point(1, 2);
p1(); // 1 2
```
