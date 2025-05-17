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
    totalAuthCount: 5,
    // 隐私设置
    privacySettings: {
      showAge: true,        // 显示年龄
      showResidence: true,  // 显示居住地
      showOccupation: true  // 显示职业
    },
    // 省市区选择器相关
    region: ['广东省', '广州市', '天河区'],
    // 性别映射
    genderMap: {
      0: '未知',
      1: '男',
      2: '女'
    },
    // 账户信息卡片是否展开
    isUserInfoExpanded: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this._loadUserData();
    this._checkAuthSettings();
    this._loadPrivacySettings();
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
    
    // 获取存储的region信息
    const region = userInfo.region || ['广东省', '广州市', '天河区'];
    
    // 处理性别文本显示
    if (userInfo.gender !== undefined) {
      userInfo.genderText = this.data.genderMap[userInfo.gender] || '未知';
    }
    
    this.setData({
      userInfo: userInfo,
      phoneNumber: phoneNumber,
      phoneNumberHidden: phoneNumberHidden,
      hasBoundPhone: hasBoundPhone,
      region: region,
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
   * 加载隐私设置
   */
  _loadPrivacySettings: function() {
    // 从本地存储或API获取隐私设置
    const storedSettings = wx.getStorageSync('privacySettings');
    
    if (storedSettings) {
      this.setData({
        privacySettings: {
          ...this.data.privacySettings,
          ...storedSettings
        }
      });
    }
  },

  /**
   * 切换隐私设置
   */
  togglePrivacySetting: function(e) {
    const { type } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    // 更新设置
    this.setData({
      [`privacySettings.${type}`]: value
    });
    
    // 保存到本地存储
    wx.setStorageSync('privacySettings', this.data.privacySettings);
    
    // 提示用户
    wx.showToast({
      title: value ? '已开启显示相关信息' : '已隐藏相关信息',
      icon: 'success'
    });
  },

  /**
   * 验证真实姓名
   */
  verifyRealName: function() {
    // 如果已验证，显示用户信息
    if (this.data.userInfo.realName) {
      wx.showModal({
        title: '验证用户信息',
        content: `您已完成实名验证，姓名：${this.data.userInfo.realName}`,
        showCancel: false
      });
      return;
    }
    
    // 模拟实名验证流程
    wx.showModal({
      title: '模拟实名验证',
      content: '需要使用微信提供的实名信息来完成验证，是否继续？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '验证中...'
          });
          
          // 模拟实名验证流程
          setTimeout(() => {
            const realName = '张三'; // 模拟数据
            
            // 更新状态
            const userInfo = { ...this.data.userInfo, realName };
            this.setData({ userInfo });
            
            // 更新全局用户信息
            if (app.globalData.userInfo) {
              app.globalData.userInfo.realName = realName;
            }
            
            // 保存到本地存储
            wx.setStorageSync('userInfo', userInfo);
            
            wx.hideLoading();
            
            wx.showToast({
              title: '实名验证成功',
              icon: 'success'
            });
          }, 1500);
        }
      }
    });
  },

  /**
   * 地区选择器变更
   */
  bindRegionChange: function(e) {
    const region = e.detail.value;
    this.setData({
      region: region
    });
    
    // 保存选择的地区
    this._saveResidence(region);
  },

  /**
   * 保存居住地信息
   */
  _saveResidence: function(region) {
    if (!region || !Array.isArray(region) || region.length !== 3) {
      wx.showToast({
        title: '居住地信息不完整',
        icon: 'none'
      });
      return;
    }
    
    // 格式化居住地显示
    const residence = region.join(' ');
    
    // 更新状态
    const userInfo = { ...this.data.userInfo, residence, region };
    this.setData({ userInfo });
    
    // 更新全局用户信息
    if (app.globalData.userInfo) {
      app.globalData.userInfo.residence = residence;
      app.globalData.userInfo.region = region;
    }
    
    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);
    
    wx.showToast({
      title: '居住地已更新',
      icon: 'success'
    });
  },

  /**
   * 绑定手机号
   */
  bindPhoneNumber: function(e) {
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
  getPhoneNumber: function() {
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
  unbindPhoneNumber: function() {
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
  copyUserId: function() {
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
  openAuthSetting: function() {
    wx.openSetting({
      success: (res) => {
        this._checkAuthSettings();
      }
    });
  },

  /**
   * 数据导出
   */
  exportData: function() {
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
  clearCache: function() {
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
  deleteAccount: function() {
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
  },

  /**
   * 编辑昵称
   */
  editNickname: function() {
    wx.showActionSheet({
      itemList: ['手动输入', '使用微信昵称'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 手动输入昵称
          this._inputNickname();
        } else if (res.tapIndex === 1) {
          // 使用微信昵称
          this._getWechatNickname();
        }
      }
    });
  },

  /**
   * 手动输入昵称
   */
  _inputNickname: function() {
    const currentNickname = this.data.userInfo.nickname || '';
    
    wx.showModal({
      title: '编辑昵称',
      content: '',
      editable: true,
      placeholderText: '请输入您的昵称',
      value: currentNickname,
      success: (res) => {
        if (res.confirm) {
          const nickname = res.content.trim();
          if (nickname) {
            this._saveNickname(nickname);
          } else {
            wx.showToast({
              title: '昵称不能为空',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  /**
   * 获取微信昵称
   */
  _getWechatNickname: function() {
    wx.showLoading({
      title: '获取中...'
    });
    
    // 使用wx.getUserProfile获取用户信息，包括昵称
    wx.getUserProfile({
      desc: '用于完善昵称信息',
      success: (res) => {
        const wechatUserInfo = res.userInfo;
        const nickname = wechatUserInfo.nickName;
        
        wx.hideLoading();
        
        if (nickname) {
          this._saveNickname(nickname);
        } else {
          wx.showToast({
            title: '获取微信昵称失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        
        wx.showToast({
          title: '获取微信昵称失败',
          icon: 'none'
        });
        
        console.error('获取微信昵称失败', err);
      }
    });
  },

  /**
   * 保存昵称
   */
  _saveNickname: function(nickname) {
    wx.showLoading({
      title: '保存中...'
    });
    
    // 更新状态
    const userInfo = { ...this.data.userInfo, nickname };
    this.setData({ userInfo });
    
    // 更新全局用户信息
    if (app.globalData.userInfo) {
      app.globalData.userInfo.nickname = nickname;
    }
    
    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);
    
    // 模拟API调用延迟
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showToast({
        title: '昵称已更新',
        icon: 'success'
      });
    }, 500);
  },

  /**
   * 编辑性别
   */
  editGender: function() {
    wx.showActionSheet({
      itemList: ['手动选择', '使用微信资料'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 手动选择性别
          this._selectGender();
        } else if (res.tapIndex === 1) {
          // 使用微信性别
          this._getWechatGender();
        }
      }
    });
  },

  /**
   * 手动选择性别
   */
  _selectGender: function() {
    wx.showActionSheet({
      itemList: ['男', '女', '不设置'],
      success: (res) => {
        let gender;
        if (res.tapIndex === 0) {
          gender = 1; // 男
        } else if (res.tapIndex === 1) {
          gender = 2; // 女
        } else if (res.tapIndex === 2) {
          gender = 0; // 未知/不设置
        }
        
        if (gender !== undefined) {
          this._saveGender(gender);
        }
      }
    });
  },

  /**
   * 获取微信性别
   */
  _getWechatGender: function() {
    wx.showLoading({
      title: '获取中...'
    });
    
    // 使用wx.getUserProfile获取用户信息，包括性别
    wx.getUserProfile({
      desc: '用于完善个人资料',
      success: (res) => {
        const wechatUserInfo = res.userInfo;
        
        // 微信性别: 0未知，1男，2女
        const gender = wechatUserInfo.gender || 0;
        
        wx.hideLoading();
        
        this._saveGender(gender);
      },
      fail: (err) => {
        wx.hideLoading();
        
        wx.showToast({
          title: '获取微信资料失败',
          icon: 'none'
        });
        
        console.error('获取微信资料失败', err);
      }
    });
  },

  /**
   * 保存性别
   */
  _saveGender: function(gender) {
    wx.showLoading({
      title: '保存中...'
    });
    
    // 获取性别文本
    const genderText = this.data.genderMap[gender] || '未知';
    
    // 更新状态
    const userInfo = { 
      ...this.data.userInfo, 
      gender: gender,
      genderText: genderText 
    };
    
    this.setData({ userInfo });
    
    // 更新全局用户信息
    if (app.globalData.userInfo) {
      app.globalData.userInfo.gender = gender;
      app.globalData.userInfo.genderText = genderText;
    }
    
    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);
    
    // 模拟API调用延迟
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showToast({
        title: '性别已更新',
        icon: 'success'
      });
    }, 500);
  },

  /**
   * 切换账户信息卡片展开/收缩
   */
  toggleUserInfoCard: function() {
    this.setData({
      isUserInfoExpanded: !this.data.isUserInfoExpanded
    });
  }
}); 