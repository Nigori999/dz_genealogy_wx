// pages/notification-create/notification-create.js
const app = getApp();
const notificationService = require('../../services/notification');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isSubmitting: false,
    notification: {
      title: '',
      content: '',
      type: ''
    },
    typeOptions: ['系统通知', '活动通知', '更新通知', '族谱通知', '提醒'],
    typeIndex: 0,
    formValid: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function() {
    // 检查用户是否是管理员
    if (!app.globalData.userInfo || !app.globalData.userInfo.isAdmin) {
      wx.showModal({
        title: '无权限',
        content: '您没有发布通知的权限',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }
    
    // 设置默认选项
    this.setData({
      'notification.type': this.data.typeOptions[0]
    });
    
    this._validateForm();
  },

  /**
   * 标题输入事件
   */
  onTitleInput: function(e) {
    this.setData({
      'notification.title': e.detail.value
    });
    
    this._validateForm();
  },

  /**
   * 内容输入事件
   */
  onContentInput: function(e) {
    this.setData({
      'notification.content': e.detail.value
    });
    
    this._validateForm();
  },

  /**
   * 类型选择事件
   */
  onTypeChange: function(e) {
    const typeIndex = parseInt(e.detail.value);
    
    this.setData({
      typeIndex: typeIndex,
      'notification.type': this.data.typeOptions[typeIndex]
    });
    
    this._validateForm();
  },

  /**
   * 验证表单
   */
  _validateForm: function() {
    const { title, content, type } = this.data.notification;
    
    // 简单验证：标题和内容不能为空
    const isValid = title.trim() !== '' && content.trim() !== '' && type !== '';
    
    this.setData({
      formValid: isValid
    });
  },

  /**
   * 提交通知
   */
  submitNotification: function() {
    // 再次验证表单
    if (!this.data.formValid) {
      wx.showToast({
        title: '请完善表单信息',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      isSubmitting: true
    });
    
    // 发送通知
    notificationService.sendTestNotification(this.data.notification)
      .then(res => {
        this.setData({
          isSubmitting: false
        });
        
        if (res.success) {
          wx.showToast({
            title: '通知发布成功',
            icon: 'success'
          });
          
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: '发布失败，请重试',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('发布通知失败:', err);
        this.setData({
          isSubmitting: false
        });
        
        wx.showToast({
          title: '发布失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})