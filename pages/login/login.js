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
    redirectUrl: '', // 登录成功后重定向的URL
    // 添加模拟登录字段
    username: '13800138000',  // 默认模拟账号
    password: '123456',        // 默认模拟密码
    // 输入框焦点控制
    usernameFocus: false,
    passwordFocus: false
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
    
    // 监听键盘高度变化
    wx.onKeyboardHeightChange(res => {
      const height = res.height;
      // 可以在这里调整页面布局，适应键盘弹出状态
    });
  },

  /**
   * 处理用户名输入框获取焦点
   */
  onUsernameFocus: function() {
    this.setData({
      usernameFocus: true
    });
  },
  
  /**
   * 处理用户名输入框失去焦点
   */
  onUsernameBlur: function() {
    this.setData({
      usernameFocus: false
    });
  },
  
  /**
   * 处理密码输入框获取焦点
   */
  onPasswordFocus: function() {
    this.setData({
      passwordFocus: true
    });
  },
  
  /**
   * 处理密码输入框失去焦点
   */
  onPasswordBlur: function() {
    this.setData({
      passwordFocus: false
    });
  },

  /**
   * 处理用户名输入
   */
  onUsernameInput: function (e) {
    this.setData({
      username: e.detail.value
    });
  },

  /**
   * 处理密码输入
   */
  onPasswordInput: function (e) {
    this.setData({
      password: e.detail.value
    });
  },
  
  /**
   * 处理表单提交事件
   */
  onFormSubmit: function(e) {
    this.directLogin();
  },

  /**
   * 直接登录（使用输入的用户名和密码）
   */
  directLogin: function () {
    const { username, password } = this.data;
    
    if (!username || !password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isLoading: true });
    
    // 关闭键盘
    wx.hideKeyboard();
    
    // 添加轻微延迟，优化体验
    setTimeout(() => {
      // 调用登录接口
      api.userAPI.login({ username, password })
        .then(result => {
          // 存储token
          wx.setStorageSync('token', result.token);
          
          // 更新全局数据
          app.globalData.userInfo = result.user;
          app.globalData.isLogin = true;
          
          // 加载族谱数据
          app.loadMyGenealogies();
          
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
        .catch(error => {
          console.error('Login failed:', error);
          this.setData({ isLoading: false });
          
          wx.showToast({
            title: error.message || '登录失败，请重试',
            icon: 'none',
            duration: 2000
          });
        });
    }, 200);
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
          title: '授权失败，请重试或尝试账号登录',
          icon: 'none',
          duration: 2000
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
        
        // 加载族谱数据
        app.loadMyGenealogies();
        
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