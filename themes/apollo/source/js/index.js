var base = 0, // 图片初始位置
  speed = 0.1, // 速度
  isFF = navigator.userAgent.indexOf('Firefox') != -1,
  head = isFF ? document.documentElement.scrollTop : document.body.scrollTop, // 窗口y轴滚动高度
  container = document.body

var scrollFunc = function () {
  container.style['background-position'] = '0 ' + (head * speed - 260) + 'px'

  head = isFF ? document.documentElement.scrollTop : document.body.scrollTop
}

var loaded = function () {
  container.style['background-image'] = 'url(../img/stars.jpg)'
  container.style['background-position'] = '0 ' + (head * speed - 260) + 'px'
}

document.onscroll = scrollFunc
document.onreadystatechange = function () {
  if (document.readyState === 'complete') {
    loaded()
  }
}
