/**
 * Toast提示工具
 * 提供统一的消息提示方法
 */

/**
 * 显示消息提示
 * @param {String} title - 提示内容
 * @param {String} icon - 图标类型，可选值: 'success', 'error', 'loading', 'none'
 * @param {Number} duration - 显示时长(ms)，默认1500ms
 */
function show(title, icon = 'none', duration = 1500) {
  wx.showToast({
    title: title,
    icon: icon,
    duration: duration
  });
}

/**
 * 隐藏消息提示
 */
function hide() {
  wx.hideToast();
}

/**
 * 显示加载提示
 * @param {String} title - 提示内容，默认为"加载中"
 * @param {Boolean} mask - 是否显示透明蒙层，防止触摸穿透
 */
function loading(title = '加载中', mask = true) {
  wx.showLoading({
    title: title,
    mask: mask
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

module.exports = {
  show,
  hide,
  loading,
  hideLoading
}; 