/**
 * 小程序入口文件
 */

// 获取应用实例
App({
  /**
   * 全局数据
   */
  globalData: {
    userInfo: null,
    currentGenealogy: null,
    isLogin: false,
    systemInfo: null
  },

  /**
   * 当小程序初始化完成时触发
   */
  onLaunch: function () {
    // 获取系统信息
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
      }
    });

    // 检查用户登录状态
    this.checkLoginStatus()
      .then(userInfo => {
        if (userInfo) {
          // 尝试加载族谱数据
          this.loadMyGenealogies();
        }
      })
      .catch(error => {
        console.error('Login status check failed:', error);
      });
  },

  /**
   * 检查用户登录状态
   * @returns {Promise} 登录状态Promise
   */
  checkLoginStatus: function () {
    return new Promise((resolve, reject) => {
      // 获取本地存储的token
      const token = wx.getStorageSync('token');
      
      if (token) {
        // 验证token有效性
        const api = require('./services/api');
        api.userAPI.getUserInfo()
          .then(userInfo => {
            this.globalData.userInfo = userInfo;
            this.globalData.isLogin = true;
            resolve(userInfo);
          })
          .catch(error => {
            console.log('Token invalid:', error);
            this.globalData.isLogin = false;
            wx.removeStorageSync('token');
            reject(error);
          });
      } else {
        this.globalData.isLogin = false;
        resolve(null);
      }
    });
  },

  /**
   * 登录方法
   * @param {Object} userInfo - 用户信息
   * @returns {Promise} 登录结果Promise
   */
  login: function (userInfo) {
    return new Promise((resolve, reject) => {
      const api = require('./services/api');
      
      // 获取微信登录凭证
      wx.login({
        success: (res) => {
          if (res.code) {
            // 发送登录请求
            api.userAPI.login({
              code: res.code,
              userInfo: userInfo
            })
              .then(result => {
                // 存储token
                wx.setStorageSync('token', result.token);
                
                // 更新全局数据
                this.globalData.userInfo = result.user;
                this.globalData.isLogin = true;
                
                resolve(result.user);
              })
              .catch(error => {
                console.error('Login failed:', error);
                reject(error);
              });
          } else {
            console.error('WeChat login failed:', res);
            reject(new Error('微信登录失败'));
          }
        },
        fail: (error) => {
          console.error('WeChat login failed:', error);
          reject(error);
        }
      });
    });
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
   * @returns {Boolean} 是否已登录
   */
  checkLogin: function(showToast = true) {
    if (!this.globalData.isLogin) {
      if (showToast) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 1500
        });
      }
      
      // 延迟跳转，让用户看到提示
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1000);
      
      return false;
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
  }
});