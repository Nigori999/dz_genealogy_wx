// 个人中心页面
const app = getApp();
const api = require('../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    userInfo: null,
    currentGenealogy: null,
    genealogies: [],
    subscriptionPlan: {
      name: '免费版',
      genealogyLimit: 1,
      memberLimit: 10,
      storageLimit: 100 // MB
    },
    hasReachedGenealogyLimit: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 检查登录状态
    this._checkLoginStatus();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 更新当前族谱显示
    this.setData({
      currentGenealogy: app.getCurrentGenealogy()
    });
    
    // 如果有更新，重新加载数据
    if (this.needRefresh) {
      this._loadUserData();
      this.needRefresh = false;
    }
  },

  /**
   * 检查登录状态
   */
  _checkLoginStatus: function () {
    const isLogin = app.globalData.isLogin;
    
    if (!isLogin) {
      app.checkLoginStatus()
        .then(userInfo => {
          this.setData({
            userInfo: userInfo
          });
          
          this._loadUserData();
        })
        .catch(() => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        });
    } else {
      this.setData({
        userInfo: app.globalData.userInfo
      });
      
      this._loadUserData();
    }
  },

  /**
   * 加载用户数据
   */
  _loadUserData: function () {
    this.setData({ isLoading: true });
    
    // 加载族谱列表
    api.genealogyAPI.getMyGenealogies()
      .then(genealogies => {
        this.setData({
          genealogies: genealogies || [],
          isLoading: false
        });
        
        // 检查是否达到族谱数量上限
        this._checkGenealogyLimit();
      })
      .catch(error => {
        console.error('Load genealogies failed:', error);
        this.setData({ isLoading: false });
      });
    
    // 加载订阅信息
    this._loadSubscriptionInfo();
  },

  /**
   * 加载订阅信息
   */
  _loadSubscriptionInfo: function () {
    api.paymentAPI.getCurrentSubscription()
      .then(subscription => {
        if (subscription) {
          this.setData({
            subscriptionPlan: subscription
          });
          
          // 检查是否达到族谱数量上限
          this._checkGenealogyLimit();
        }
      })
      .catch(error => {
        console.error('Load subscription info failed:', error);
      });
  },

  /**
   * 检查是否达到族谱数量上限
   */
  _checkGenealogyLimit: function () {
    const { genealogies, subscriptionPlan } = this.data;
    
    if (genealogies && subscriptionPlan) {
      // 检查自己创建的族谱数量是否达到上限
      const ownGenealogies = genealogies.filter(g => g.isOwner);
      const hasReachedLimit = ownGenealogies.length >= subscriptionPlan.genealogyLimit;
      
      this.setData({
        hasReachedGenealogyLimit: hasReachedLimit
      });
    }
  },

  /**
   * 格式化存储空间
   */
  formatStorage: function (size) {
    if (!size) return '0 MB';
    
    if (size < 1024) {
      return size + ' MB';
    } else {
      return (size / 1024).toFixed(1) + ' GB';
    }
  },

  /**
   * 上传头像
   */
  uploadAvatar: function () {
    const that = this;
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        const tempFilePath = res.tempFilePaths[0];
        
        // 显示上传中
        wx.showLoading({
          title: '上传中...',
          mask: true
        });
        
        // 上传头像
        api.userAPI.uploadAvatar(tempFilePath)
          .then(result => {
            wx.hideLoading();
            
            if (result && result.url) {
              // 更新本地用户信息
              that.setData({
                'userInfo.avatar': result.url
              });
              
              // 更新全局用户信息
              if (app.globalData.userInfo) {
                app.globalData.userInfo.avatar = result.url;
              }
              
              wx.showToast({
                title: '头像更新成功',
                icon: 'success'
              });
            }
          })
          .catch(error => {
            wx.hideLoading();
            console.error('Upload avatar failed:', error);
            
            wx.showToast({
              title: '上传失败，请重试',
              icon: 'none'
            });
          });
      }
    });
  },

  /**
   * 选择族谱
   */
  onGenealogySelect: function (e) {
    const { genealogy } = e.detail;
    
    if (!genealogy) return;
    
    // 设置为当前族谱
    app.setCurrentGenealogy(genealogy);
    
    // 更新显示
    this.setData({
      currentGenealogy: genealogy
    });
    
    // 返回首页
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  /**
   * 导航到创建族谱页面
   */
  navigateToCreateGenealogy: function () {
    wx.navigateTo({
      url: '/pages/create-genealogy/create-genealogy'
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 导航到加入族谱页面
   */
  navigateToJoinGenealogy: function () {
    wx.navigateTo({
      url: '/pages/join-genealogy/join-genealogy'
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 导航到切换族谱页面
   */
  navigateToSwitchGenealogy: function () {
    wx.navigateTo({
      url: '/pages/switch-genealogy/switch-genealogy'
    });
  },

  /**
   * 导航到订阅页面
   */
  navigateToSubscription: function () {
    wx.navigateTo({
      url: '/pages/subscription/subscription'
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 导航到族谱管理页面
   */
  navigateToFamilyManager: function () {
    if (!this.data.currentGenealogy) {
      wx.showToast({
        title: '请先选择一个族谱',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/family-manager/family-manager?genealogyId=${this.data.currentGenealogy.id}`
    });
  },

  /**
   * 导航到邀请管理页面
   */
  navigateToInviteManager: function () {
    if (!this.data.currentGenealogy) {
      wx.showToast({
        title: '请先选择一个族谱',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/invite-manager/invite-manager?genealogyId=${this.data.currentGenealogy.id}`
    });
  },

  /**
   * 导航到数据导出页面
   */
  navigateToDataExport: function () {
    if (!this.data.currentGenealogy) {
      wx.showToast({
        title: '请先选择一个族谱',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/data-export/data-export?genealogyId=${this.data.currentGenealogy.id}`
    });
  },

  /**
   * 导航到账户设置页面
   */
  navigateToAccountSetting: function () {
    wx.navigateTo({
      url: '/pages/account-setting/account-setting'
    });
  },

  /**
   * 导航到通知设置页面
   */
  navigateToNotificationSetting: function () {
    wx.navigateTo({
      url: '/pages/notification-setting/notification-setting'
    });
  },

  /**
   * 导航到帮助中心页面
   */
  navigateToHelp: function () {
    wx.navigateTo({
      url: '/pages/help/help'
    });
  },

  /**
   * 导航到关于我们页面
   */
  navigateToAbout: function () {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  /**
   * 导航到意见反馈页面
   */
  navigateToFeedback: function () {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  /**
   * 退出登录
   */
  logout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
        }
      }
    });
  },

  /**
   * 用户下拉刷新
   */
  onPullDownRefresh: function () {
    this._loadUserData();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});