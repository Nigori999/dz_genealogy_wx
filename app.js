/**
 * 小程序入口文件
 */

// 获取应用实例
const mockUtils = require('./utils/mock');  // 引入模拟数据工具

App({
  /**
   * 全局数据
   */
  globalData: {
    userInfo: null,
    currentGenealogy: null,
    isLogin: false,
    systemInfo: null,
    unreadNotificationCount: 0,
    isAdmin: false  // 设置全局管理员标志
  },

  /**
   * 当小程序初始化完成时触发
   */
  onLaunch: function () {
    // 初始化模拟数据
    mockUtils.initAllMockData();

    // 获取系统信息
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
      }
    });

    // 加载用户的族谱列表并设置默认族谱
    this.loadMyGenealogies();
    // 加载未读通知数量
    this.loadUnreadNotificationCount();
  },



  /**
   * 检查用户登录状态
   * @returns {Promise} 登录状态Promise
   */
  checkLoginStatus: function () {
    return new Promise((resolve, reject) => {
      // 从本地存储获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
        this.globalData.isLogin = true;
        
        // 设置全局管理员标志
        if (userInfo.isAdmin) {
          this.globalData.isAdmin = true;
        }
        
        resolve(userInfo);
      } else {
        // 初始化一个默认的管理员用户
        const users = mockUtils.initMockUsers();
        const defaultUser = users[0]; // 默认第一个用户 (超级管理员)
        
        this.globalData.userInfo = defaultUser;
        this.globalData.isLogin = true;
        
        // 设置全局管理员标志
        if (defaultUser.isAdmin) {
          this.globalData.isAdmin = true;
        }
        
        resolve(defaultUser);
      }
    });
  },

  /**
   * 登录方法
   * @param {string} userType - 用户类型: 'admin', 'owner', 'member'
   * @returns {Object} 用户信息
   */
  login: function (userType = 'admin') {
    // 切换用户
    const user = mockUtils.switchUser(userType);
    
    if (!user) {
      console.error('切换用户失败');
      return null;
    }
    
    // 更新全局数据
    this.globalData.userInfo = user;
    this.globalData.isLogin = true;
    
    // 设置全局管理员标志
    this.globalData.isAdmin = user.isAdmin || false;
    
    // 保存到本地存储
    wx.setStorageSync('userInfo', user);
    
    // 加载未读通知数量
    this.loadUnreadNotificationCount();
    
    return user;
  },

  /**
   * 退出登录
   */
  logout: function () {
    // 清除本地存储
    wx.removeStorageSync('token');
    
    // 重置全局数据
    this.globalData.userInfo = null;
    this.globalData.isLogin = false;
    this.globalData.currentGenealogy = null;
    this.globalData.isAdmin = false;
    
    // 跳转到登录页面
    wx.reLaunch({
      url: '/pages/login/login'
    });
  },

  /**
   * 设置当前族谱
   * @param {Object} genealogy - 族谱信息
   */
  setCurrentGenealogy: function (genealogy) {
    this.globalData.currentGenealogy = genealogy;
    // 存储到本地，方便下次启动时恢复
    wx.setStorageSync('currentGenealogy', genealogy);
  },

  /**
   * 获取当前族谱
   * @returns {Object} 当前族谱信息
   */
  getCurrentGenealogy: function () {
    if (!this.globalData.currentGenealogy) {
      // 尝试从本地存储获取
      const genealogy = wx.getStorageSync('currentGenealogy');
      if (genealogy) {
        this.globalData.currentGenealogy = genealogy;
      }
    }
    return this.globalData.currentGenealogy;
  },

  /**
   * 检查用户是否已登录，未登录则跳转到登录页
   * @param {Boolean} showToast - 是否显示提示信息
   * @param {string} userType - 如果需要自动登录，指定登录用户类型
   * @returns {Boolean} 是否已登录
   */
  checkLogin: function(showToast = true, userType = 'admin') {
    if (!this.globalData.isLogin) {
      // 初始化一个默认的管理员用户
      this.login(userType);
      return true;
    }
    return true;
  },

  /**
   * 加载用户的族谱列表并设置默认族谱
   */
  loadMyGenealogies: function() {
    const api = require('./services/api');
    
    // 首先，确保模拟数据正确重置（仅在使用模拟数据时）
    try {
      const mockService = require('./services/mock');
      if (typeof mockService._resetMockData === 'function') {
        mockService._resetMockData();
        console.log('重置模拟数据成功');
      }
    } catch (error) {
      console.error('重置模拟数据失败:', error);
    }
    
    // 加载用户的族谱列表
    api.genealogyAPI.getMyGenealogies()
      .then(genealogies => {
        if (genealogies && genealogies.length > 0) {
          console.log('获取到族谱列表:', genealogies.length);
          
          // 检查是否已有存储的当前族谱
          const currentGenealogyId = wx.getStorageSync('currentGenealogy')?.id;
          
          // 如果有存储的族谱ID且在列表中存在，选择该族谱；否则选择第一个
          let genealogyToSet = genealogies[0];
          if (currentGenealogyId) {
            const storedGenealogy = genealogies.find(g => g.id === currentGenealogyId);
            if (storedGenealogy) {
              genealogyToSet = storedGenealogy;
            }
          }
          
          // 设置当前族谱
          this.setCurrentGenealogy(genealogyToSet);
          console.log('Auto set current genealogy:', genealogyToSet.name);
        } else {
          console.warn('未获取到族谱列表数据');
        }
      })
      .catch(error => {
        console.error('Failed to load genealogies:', error);
      });
  },

  /**
   * 加载未读通知数量
   */
  loadUnreadNotificationCount: function() {
    const notificationService = require('./services/notification');
    notificationService.getUnreadCount()
      .then(res => {
        if (res.success) {
          this.globalData.unreadNotificationCount = res.data.count || 0;
        }
      })
      .catch(err => {
        console.error('Failed to load unread notification count:', err);
      });
  },
  
  /**
   * 更新未读通知数量
   * @param {Number} count - 新的未读数量
   */
  updateUnreadNotificationCount: function(count) {
    this.globalData.unreadNotificationCount = count || 0;
  }
});