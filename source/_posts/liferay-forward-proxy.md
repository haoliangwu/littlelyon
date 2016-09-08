---
title: liferay和proxy server那点事
date: 2016-07-19 16:41:41
tags: [liferay]
---

> Set up a server to use as a proxy for requests from Liferay (such as Apache web server)

<!--more-->

# 环境
* Ubuntu 14.04
* httpd(apache2 for Ubuntu)
* liferay 7.0

# 知识背景

这里的proxy server应当是指正向代理(forward proxy)。正向代理大概的意思，就是一个位于客户端和原始服务器之间的服务器，当客户端为了从原始服务器拿一些内容的时候，不向原始服务器直接发送请求而是向代理服务器发送，代理服务器转发客户端请求给原始服务器并将获得内容返还给客户端。

正向代理的意思，大体就是一个跳板，对于你不方便去的地方或者不能去的地方，它可以带你去，比如一些vpn代理，其原理就是你访问代理服务器，代理服务器访问被墙的网站，之后把内容返还给你。

既然说了正向代理，就捎带说一下反向代理。反向代理和正向代理相反，对与访问者来说，你访问一个反向代理服务器后，它同样会从原始服务器拿数据，但是这里和正向代理的区别是，访问者不需要进行额外的设置，反向代理服务器判断请求如何转发给原始服务器，之后把内容返还给客户端。

反向代理的意思，大体就是一个服务柜台，对于你不方便去的地方或者不能去的地方，有人可以帮你去，比如一些设置了防火墙的原始服务器为了提供给外网用户访问，就会使用反向代理。

# 步骤

### 配置proxy server
以ubuntu为例(windows应该会更方便)，直接用apt-get安装

```
sudo apt-get install apache2
```

之后server的根目录是
```
/etc/apache2
```

进入这里，会发现有一个**apache2.conf**的配置文件，这个文件是apache2的主要配置文件，其中包含了若干子配置文件，分别配置不同模块的配置，看注释就可以大概知道每个模块是做什么的。

我们这里需要着重看的是**ports.conf**和**000-default.conf**。

前者主要设置一些关于server监听端口的配置，它的源码如下
```
Listen 80

<IfModule ssl_module>
	Listen 443
</IfModule>

<IfModule mod_gnutls.c>
	Listen 443
</IfModule>
```

大体的意思是
> 监听80端口，如果有ssl_module和mod_gnutls.c模块加载的话，同时也监听443端口。

如果你还想监听别端口，比如81，可以直接添加
```
Listen 81
```
后者主要设置一些关于虚拟主机的配置，**apache2.conf**中有一行代码
```
IncludeOptional sites-enabled/*.conf
```
意思是会在启动服务器的时候，把所有**./sites-enabled**目录下的配置文件都包含进来，所以我们可以自己新建一个.conf文件，也可以直接更改默认的文件，也就是**000-default.conf**。

## 配置VirtualHost
配置完proxy server的监听端口，该配置虚拟主机了，打开默认配置文件，添加如下代码

```
ProxyRequests On
ProxyVia On

<VirtualHost *:80>  
	ServerAdmin prograsliu@gmail.com
    ServerName www.test.com
    ServerAlias test.com
    ErrorLog "logs/test.com-error.log"
    CustomLog "logs/test.com-access.log" common    
    
    #正向代理设置
    ProxyRequests On
    ProxyVia On

    <Proxy *>
        Order deny,allow
        Deny from all
        Allow from 127.0.0.1
    </Proxy>
</VirtualHost> 
```

开启Apache正向代理
```
ProxyRequests On
```

之后设置控制位于代理服务器链中的代理请求的流向
```
ProxyVia On
```
每个请求和应答都会对应当前主机得到一个"Via:"头。

再设置对apache监听主机的请求的匹配规则
```
<VirtualHost *:80>
```
这个表示匹配所有80端口的请求，之后又由于这个标签中还有一些其他的设置，如下
```
ServerName www.test.com
ServerAlias test.com
ErrorLog "logs/test.com-error.log"
CustomLog "logs/test.com-access.log" common
```
因此，匹配规则会变为，匹配所有请求www.test.com:80这个主机的请求，同时呢，这个主机的小名是test.com，日志文件根据事件类型按不同路径保存。

## 测试一下
设置到这里，proxy server已经设置完成，因此也可以来简单测试一下，比如打开ＦＦ浏览器，之后在**Preference > Advanced > Connection**中，选择**manual proxy configuration**，然后把代理配置填进去，比如
```
HTTP proxy: www.test.com
Port: 80
```
注意下面有一个**No Proxy for**的选项，因此不要拿本地的请求作测试。

然后访问**www.163.com**，使用f12抓包，可以发现请求的相应头(response header)中，会增加一个字段
```
Via: "1.1 www.test.com"
```

大体意思就是，你打开的163的页面，并不是从网易的浏览器直接获得的，而是从你配置的叫做www.test.com的代理服务器获得的，真正访问网易服务器的是www.test.com。

## 配置liferay
接下来就很简单了，只需要让liferay来使用我们配置好的proxy server即可。

liferay中的system.properties有如下三个参数，
```
    # Set the location of the HTTP proxy that the portal will use to fetch
    # external content.
    #
    # Set http.nonProxyHosts for hosts that will not be proxied. This is useful
    # for proxied environments where you need direct access to internal servers.
    # This should follow the same semantics as the java.net package.
    #
    #http.proxyHost=192.168.0.200
    #http.proxyPort=4480
    #http.nonProxyHosts=192.168.0.250

```
最后一个不用管，只需要配置前两个，把它改成我们配置的proxy server对应的参数即可，如下
```
http.proxyHost=www.test.com
http.proxyPort=80
```

之后就大功告成了。当portal从外部的server，获取资源时，会使用代理，比如使用亚马逊的s3 store云储存服务时。

### 参考

[Apache配置正向代理与反向代理](http://www.cnblogs.com/zemliu/archive/2012/04/18/2454655.html)



