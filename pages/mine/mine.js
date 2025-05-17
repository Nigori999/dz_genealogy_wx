// 个人中心页面
const app = getApp();
const api = require('../../services/api');
const notificationService = require('../../services/notification');
const mockUtils = require('../../utils/mock');  // 引入模拟数据工具

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    userInfo: null,
    currentGenealogy: null,
    genealogies: [],
    currentGenealogyIndex: 0, // 当前显示的族谱索引
    subscriptionPlan: {
      name: '免费版',
      genealogyLimit: 1,
      memberLimit: 10,
      storageLimit: 100 // MB
    },
    hasReachedGenealogyLimit: false,
    unreadCount: 0 // 未读通知数量
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 检查登录状态
    if (!app.globalData.isLogin) {
      app.checkLogin(false);
      return;
    }
    
    // 检查登录状态
    this._checkLoginStatus();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 检查登录状态
    if (!app.globalData.isLogin) {
      app.checkLogin(false);
      return;
    }
    
    // 更新当前族谱显示
    const currentGenealogy = app.getCurrentGenealogy();
    this.setData({
      currentGenealogy: currentGenealogy
    });
    
    // 如果有族谱列表，确保当前族谱在轮播中显示
    if (this.data.genealogies && this.data.genealogies.length > 0 && currentGenealogy) {
      const index = this.data.genealogies.findIndex(g => g.id === currentGenealogy.id);
      if (index !== -1 && index !== this.data.currentGenealogyIndex) {
        this.setData({
          currentGenealogyIndex: index
        });
      }
    }
    
    // 获取未读通知数量
    this._loadUnreadNotificationCount();
    
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
        // 确保genealogies是数组
        if (!Array.isArray(genealogies)) {
          console.warn('API返回的genealogies不是数组，已转换为空数组:', genealogies);
          genealogies = [];
        }
        
        const currentGenealogy = app.getCurrentGenealogy();
        let currentGenealogyIndex = 0;
        
        // 查找当前族谱在列表中的索引
        if (currentGenealogy) {
          const index = genealogies.findIndex(g => g.id === currentGenealogy.id);
          if (index !== -1) {
            currentGenealogyIndex = index;
          }
        }
        
        this.setData({
          genealogies: genealogies,
          currentGenealogyIndex: currentGenealogyIndex,
          isLoading: false
        });
        
        // 检查是否达到族谱数量上限
        this._checkGenealogyLimit();
      })
      .catch(error => {
        console.error('Load genealogies failed:', error);
        this.setData({ 
          isLoading: false,
          genealogies: [] 
        });
      });
    
    // 加载订阅信息
    this._loadSubscriptionInfo();
  },

  /**
   * 加载未读通知数量
   */
  _loadUnreadNotificationCount: function() {
    // 直接从全局数据获取未读通知数量
    this.setData({
      unreadCount: app.globalData.unreadNotificationCount || 0
    });
    
    // 也可以主动更新一次全局数据
    app.loadUnreadNotificationCount();
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
      // 确保genealogies是数组
      if (!Array.isArray(genealogies)) {
        console.warn('genealogies is not an array:', genealogies);
        this.setData({
          hasReachedGenealogyLimit: false
        });
        return;
      }
      
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
    let genealogy;
    
    // 处理来自折叠项的点击
    if (e.currentTarget && e.currentTarget.dataset) {
      const genealogyId = e.currentTarget.dataset.genealogyId;
      if (genealogyId) {
        genealogy = this.data.genealogies.find(g => g.id === genealogyId);
      }
    } 
    // 处理来自 family-card 组件的点击
    else if (e.detail) {
      genealogy = e.detail.genealogy;
    }
    
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
    
    wx.showModal({
      title: '族谱席位管理',
      content: '您可以在这里管理族谱的成员席位，包括添加、移除和设置成员权限。\n\n本功能开发中，敬请期待！',
      showCancel: false,
      confirmText: '我知道了'
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
    
    wx.showModal({
      title: '邀请管理',
      content: '您可以在这里查看和管理发出的邀请，包括生成新的邀请码、撤销邀请等操作。\n\n本功能开发中，敬请期待！',
      showCancel: false,
      confirmText: '我知道了'
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
    
    wx.showModal({
      title: '数据导出',
      content: '您可以将族谱数据导出为多种格式，包括Excel、PDF和GEDCOM格式，方便打印或与其他族谱软件共享。\n\n本功能开发中，敬请期待！',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  /**
   * 导航到账户与安全页面
   */
  navigateToAccountSetting: function () {
    wx.navigateTo({
      url: '/pages/account/account'
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
   * 导航到通知管理页面
   */
  navigateToNotificationAdmin: function () {
    wx.navigateTo({
      url: '/pages/notification-admin/notification-admin'
    });
  },

  /**
   * 导航到帮助中心页面
   */
  navigateToHelp: function () {
    wx.showModal({
      title: '帮助中心',
      content: '如需帮助，请通过以下方式联系我们：\n1. 微信公众号：yunzupu666\n2. 电子邮箱：contact@yunzupu.com\n3. 官方网站：https://www.yunzupu.com',
      showCancel: false,
      confirmText: '我知道了'
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
    wx.showModal({
      title: '意见反馈',
      content: '感谢您使用云族谱！我们非常重视您的体验和建议。\n\n请通过以下方式向我们提供反馈：\n- 微信公众号：yunzupu666\n- 电子邮箱：feedback@yunzupu.com',
      showCancel: false,
      confirmText: '我知道了'
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
    this._loadUnreadNotificationCount();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 打开邀请成员
   */
  openInvite: function() {
    const { currentGenealogy } = this.data;
    
    if (!currentGenealogy) {
      wx.showToast({
        title: '请先选择一个族谱',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/invite/invite?genealogyId=${currentGenealogy.id}`
    });
  },

  /**
   * 打开编辑历史
   */
  openEditHistory: function() {
    const { currentGenealogy } = this.data;
    
    if (!currentGenealogy) {
      wx.showToast({
        title: '请先选择一个族谱',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/edit-history/edit-history?genealogyId=${currentGenealogy.id}`
    });
  },

  /**
   * 折叠族谱项点击
   */
  onGenealogyItemTap: function (e) {
    const genealogyId = e.currentTarget.dataset.genealogyId;
    if (!genealogyId) return;
    
    const genealogy = this.data.genealogies.find(g => g.id === genealogyId);
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
   * Swiper切换事件
   */
  onSwiperChange: function(e) {
    const current = e.detail.current;
    
    // 判断是否是创建族谱卡片
    if (this.data.genealogies && current === this.data.genealogies.length) {
      // 不更新currentGenealogyIndex，保持当前选中状态
      return;
    }
    
    this.setData({
      currentGenealogyIndex: current
    });
  },

  /**
   * 选择当前族谱
   */
  selectCurrentGenealogy: function(e) {
    const index = e.currentTarget.dataset.index;
    const genealogy = this.data.genealogies[index];
    
    if (!genealogy) return;
    
    // 设置为当前族谱
    app.setCurrentGenealogy(genealogy);
    
    // 更新显示
    this.setData({
      currentGenealogy: genealogy
    });
    
    wx.showToast({
      title: '已切换到族谱：' + genealogy.name,
      icon: 'success'
    });
    
    // 刷新页面数据
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }, 1500);
  },

  /**
   * 打开权限设置
   */
  openPermissionSettings: function() {
    const { currentGenealogy } = this.data;
    
    if (!currentGenealogy) {
      wx.showToast({
        title: '请先选择一个族谱',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/permission-settings/permission-settings?genealogyId=${currentGenealogy.id}`
    });
  },
});