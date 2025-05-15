// 账户与安全设置页面
const app = getApp();
const api = require('../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    userInfo: null,
    phoneNumber: '',
    phoneNumberHidden: '',
    hasBoundPhone: false,
    // 账号授权状态
    authSettings: {
      userInfo: false,      // 用户信息
      userLocation: false,  // 地理位置
      address: false,       // 通讯地址
      album: false,         // 相册
      camera: false         // 摄像头
    },
    // 添加授权统计变量
    authCount: 0,
    totalAuthCount: 5
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this._loadUserData();
    this._checkAuthSettings();
  },

  /**
   * 加载用户数据
   */
  _loadUserData: function () {
    this.setData({ isLoading: true });
    
    // 获取用户信息
    const userInfo = app.globalData.userInfo || {};
    
    // 处理手机号显示
    let phoneNumber = userInfo.phoneNumber || '';
    let phoneNumberHidden = '';
    let hasBoundPhone = false;
    
    if (phoneNumber) {
      hasBoundPhone = true;
      phoneNumberHidden = phoneNumber.substring(0, 3) + '****' + phoneNumber.substring(7);
    }
    
    this.setData({
      userInfo: userInfo,
      phoneNumber: phoneNumber,
      phoneNumberHidden: phoneNumberHidden,
      hasBoundPhone: hasBoundPhone,
      isLoading: false
    });
  },

  /**
   * 检查授权设置
   */
  _checkAuthSettings: function () {
    wx.getSetting({
      success: (res) => {
        const authSetting = res.authSetting;
        
        // 更新授权状态
        const authSettings = {
          userInfo: !!authSetting['scope.userInfo'],
          userLocation: !!authSetting['scope.userLocation'],
          address: !!authSetting['scope.address'],
          album: !!authSetting['scope.writePhotosAlbum'],
          camera: !!authSetting['scope.camera']
        };
        
        // 计算已授权数量
        const authCount = Object.values(authSettings).filter(v => v).length;
        
        this.setData({
          authSettings: authSettings,
          authCount: authCount,
          totalAuthCount: Object.keys(authSettings).length
        });
      }
    });
  },

  /**
   * 绑定手机号
   */
  bindPhoneNumber: function (e) {
    if (this.data.hasBoundPhone) {
      // 已绑定手机号，询问是否更换
      wx.showActionSheet({
        itemList: ['更换手机号', '解除绑定'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 更换手机号
            this.getPhoneNumber();
          } else if (res.tapIndex === 1) {
            // 解除绑定
            this.unbindPhoneNumber();
          }
        }
      });
    } else {
      // 未绑定手机号，直接使用微信获取手机号
      this.getPhoneNumber();
    }
  },

  /**
   * 使用微信获取手机号
   */
  getPhoneNumber: function () {
    wx.showModal({
      title: '微信授权',
      content: '请点击"授权获取"按钮，使用微信提供的手机号快捷绑定',
      confirmText: '授权获取',
      success: (res) => {
        if (res.confirm) {
          // 在真实环境中，这里应该使用button的open-type="getPhoneNumber"
          // 模拟获取成功
          setTimeout(() => {
            const phoneNumber = '13812345678'; // 模拟数据
            
            // 更新状态
            this.setData({
              phoneNumber: phoneNumber,
              phoneNumberHidden: phoneNumber.substring(0, 3) + '****' + phoneNumber.substring(7),
              hasBoundPhone: true
            });
            
            // 更新全局用户信息
            if (app.globalData.userInfo) {
              app.globalData.userInfo.phoneNumber = phoneNumber;
            }
            
            wx.showToast({
              title: '手机号绑定成功',
              icon: 'success'
            });
          }, 1500);
        }
      }
    });
  },

  /**
   * 解除手机号绑定
   */
  unbindPhoneNumber: function () {
    wx.showModal({
      title: '解除绑定',
      content: '确定要解除手机号绑定吗？解除后部分功能可能受限。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...'
          });
          
          // 模拟API调用
          setTimeout(() => {
            // 更新状态
            this.setData({
              phoneNumber: '',
              phoneNumberHidden: '',
              hasBoundPhone: false
            });
            
            // 更新全局用户信息
            if (app.globalData.userInfo) {
              app.globalData.userInfo.phoneNumber = '';
            }
            
            wx.hideLoading();
            
            wx.showToast({
              title: '已解除绑定',
              icon: 'success'
            });
          }, 1500);
        }
      }
    });
  },

  /**
   * 复制用户ID
   */
  copyUserId: function () {
    const userId = this.data.userInfo.uid || '';
    
    if (!userId) {
      wx.showToast({
        title: '用户ID为空',
        icon: 'none'
      });
      return;
    }
    
    wx.setClipboardData({
      data: userId,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 打开授权设置页面
   */
  openAuthSetting: function () {
    wx.openSetting({
      success: (res) => {
        this._checkAuthSettings();
      }
    });
  },

  /**
   * 数据导出
   */
  exportData: function () {
    wx.showLoading({
      title: '准备导出...'
    });
    
    // 模拟数据导出过程
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showModal({
        title: '导出成功',
        content: '您的数据已成功导出，可在"我的文件"中查看。',
        showCancel: false
      });
    }, 2000);
  },

  /**
   * 清除缓存
   */
  clearCache: function () {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除应用缓存吗？清除后需要重新加载数据。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '正在清除...'
          });
          
          // 模拟清除缓存过程
          setTimeout(() => {
            try {
              wx.clearStorageSync();
              
              wx.hideLoading();
              
              wx.showToast({
                title: '缓存已清除',
                icon: 'success'
              });
              
              // 重新加载数据
              this._loadUserData();
              this._checkAuthSettings();
            } catch (e) {
              wx.hideLoading();
              
              wx.showToast({
                title: '清除失败，请重试',
                icon: 'none'
              });
            }
          }, 1500);
        }
      }
    });
  },

  /**
   * 注销账号
   */
  deleteAccount: function () {
    wx.showModal({
      title: '账号注销',
      content: '您确定要注销账号吗？注销后，账号关联的所有数据将被永久删除且无法恢复。',
      confirmText: '确认注销',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          // 二次确认
          wx.showModal({
            title: '重要提示',
            content: '请再次确认：注销后无法恢复账号数据，包括您的族谱信息、家族成员资料等。',
            confirmText: '确认注销',
            confirmColor: '#E53935',
            success: (res) => {
              if (res.confirm) {
                // 处理注销逻辑
                wx.showLoading({
                  title: '处理中...',
                  mask: true
                });
                
                // 模拟API调用
                setTimeout(() => {
                  wx.hideLoading();
                  
                  // 注销成功后，清除本地数据并返回登录页
                  app.logout();
                  
                  wx.showToast({
                    title: '账号已注销',
                    icon: 'success'
                  });
                }, 2000);
              }
            }
          });
        }
      }
    });
  }
}); 