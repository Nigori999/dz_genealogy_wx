// 登录页面
const app = getApp();
const api = require('../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: false,
    userInfo: null,
    canIUseGetUserProfile: false, // 判断是否支持新版用户信息获取方式
    redirectUrl: '' // 登录成功后重定向的URL
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查是否支持getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }

    // 获取重定向URL
    if (options.redirect) {
      this.setData({
        redirectUrl: decodeURIComponent(options.redirect)
      });
    }

    // 检查是否已登录
    if (app.globalData.isLogin) {
      this._redirectAfterLogin();
    }
  },

  /**
   * 获取用户信息（新版API）
   */
  getUserProfile: function () {
    if (!this.data.canIUseGetUserProfile) {
      this.getUserInfo();
      return;
    }

    this.setData({ isLoading: true });

    wx.getUserProfile({
      desc: '用于完善个人信息',
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({
          userInfo: userInfo
        });
        
        this._login(userInfo);
      },
      fail: (error) => {
        console.error('Get user profile failed:', error);
        wx.showToast({
          title: '授权失败，请重试',
          icon: 'none'
        });
        this.setData({ isLoading: false });
      }
    });
  },

  /**
   * 获取用户信息（旧版API，已逐渐废弃）
   */
  getUserInfo: function (e) {
    this.setData({ isLoading: true });

    wx.getUserInfo({
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({
          userInfo: userInfo
        });
        
        this._login(userInfo);
      },
      fail: (error) => {
        console.error('Get user info failed:', error);
        wx.showToast({
          title: '授权失败，请重试',
          icon: 'none'
        });
        this.setData({ isLoading: false });
      }
    });
  },

  /**
   * 登录处理
   * @param {Object} userInfo - 用户信息
   */
  _login: function (userInfo) {
    app.login(userInfo)
      .then((user) => {
        this.setData({ isLoading: false });
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        // 延迟跳转
        setTimeout(() => {
          this._redirectAfterLogin();
        }, 1000);
      })
      .catch((error) => {
        console.error('Login failed:', error);
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 登录后重定向
   */
  _redirectAfterLogin: function () {
    const { redirectUrl } = this.data;
    
    if (redirectUrl) {
      // 如果是tabBar页面，使用switchTab
      const tabBarPages = ['/pages/index/index', '/pages/family-tree/family-tree', '/pages/events/events', '/pages/mine/mine'];
      
      if (tabBarPages.includes(redirectUrl)) {
        wx.switchTab({
          url: redirectUrl
        });
      } else {
        wx.redirectTo({
          url: redirectUrl
        });
      }
    } else {
      // 默认跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
});