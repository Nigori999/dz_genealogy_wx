// 加入族谱页面
const app = getApp();
const api = require('../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: false,
    inviteCode: '',
    errorMsg: '',
    successMsg: '',
    isJoining: false,
    animationStatus: {
      formReady: false,
      tipsReady: false,
      helpReady: false
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 页面加载时初始化动画状态
    this.initAnimation();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 页面显示时触发动画
    this.triggerAnimation();
  },

  /**
   * 初始化动画
   */
  initAnimation: function() {
    // 延迟显示各个元素
    setTimeout(() => {
      this.setData({
        'animationStatus.formReady': true
      });
    }, 100);

    setTimeout(() => {
      this.setData({
        'animationStatus.tipsReady': true
      });
    }, 300);

    setTimeout(() => {
      this.setData({
        'animationStatus.helpReady': true
      });
    }, 500);
  },

  /**
   * 触发动画
   */
  triggerAnimation: function() {
    // 如果已经触发过动画，则直接返回
    if (this.data.animationStatus.formReady) return;
    this.initAnimation();
  },

  /**
   * 监听输入变化
   */
  onInputChange: function (e) {
    this.setData({
      inviteCode: e.detail.value,
      errorMsg: ''
    });
  },

  /**
   * 清除输入内容
   */
  clearInput: function () {
    this.setData({
      inviteCode: '',
      errorMsg: ''
    });
  },

  /**
   * 加入族谱
   */
  joinGenealogy: function () {
    const { inviteCode } = this.data;
    
    // 验证邀请码
    if (!inviteCode || inviteCode.trim() === '') {
      this.setData({
        errorMsg: '请输入邀请码'
      });
      return;
    }

    // 邀请码格式验证（可选，根据实际格式调整）
    if (inviteCode.trim().length < 6) {
      this.setData({
        errorMsg: '邀请码格式不正确，请检查后重试'
      });
      return;
    }
    
    this.setData({ 
      isLoading: true,
      isJoining: true,
      errorMsg: '',
      successMsg: '' 
    });
    
    api.genealogyAPI.joinGenealogyByCode(inviteCode.trim())
      .then(genealogy => {
        if (!genealogy) {
          throw new Error('加入族谱失败');
        }
        
        // 加入成功
        this.setData({
          successMsg: `成功加入「${genealogy.name}」族谱`,
          isLoading: false,
          isJoining: false
        });
        
        // 设置为当前族谱
        app.setCurrentGenealogy(genealogy);
        
        // 显示成功提示
        wx.showToast({
          title: '加入成功',
          icon: 'success',
          duration: 1500
        });
        
        // 2秒后返回首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 2000);
      })
      .catch(error => {
        console.error('Join genealogy failed:', error);
        
        // 根据错误类型设置不同的错误提示
        let errorMessage = '加入族谱失败，请检查邀请码是否正确';
        
        if (error.message) {
          if (error.message.includes('过期')) {
            errorMessage = '邀请码已过期，请联系族谱管理员获取新的邀请码';
          } else if (error.message.includes('使用上限')) {
            errorMessage = '邀请码已达到使用上限，请联系族谱管理员获取新的邀请码';
          } else if (error.message.includes('已加入')) {
            errorMessage = '您已经加入过该族谱，请前往我的族谱查看';
          } else {
            errorMessage = error.message;
          }
        }
        
        this.setData({
          errorMsg: errorMessage,
          isLoading: false,
          isJoining: false
        });
        
        // 震动反馈
        wx.vibrateShort();
      });
  },

  /**
   * 获取帮助
   */
  getHelp: function () {
    wx.showModal({
      title: '获取帮助',
      content: '如需帮助，请通过以下方式联系我们：\n\n1. 微信公众号：yunzupu666\n2. 电子邮箱：contact@yunzupu.com\n\n工作时间：周一至周五 9:00-18:00',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  /**
   * 用户下拉刷新
   */
  onPullDownRefresh: function () {
    this.setData({
      errorMsg: '',
      successMsg: '',
      inviteCode: ''
    });
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500);
  },

  /**
   * 分享页面
   */
  onShareAppMessage: function() {
    return {
      title: '邀请您加入家族族谱',
      path: '/pages/join-genealogy/join-genealogy',
      imageUrl: '/assets/images/share_genealogy.png'
    }
  }
});