// 通知设置页面
const app = getApp();
const api = require('../../services/api');
const notificationService = require('../../services/notification');

// 订阅消息模板ID（实际应用中需要在微信公众平台申请）
const TEMPLATE_IDS = {
  // 族谱更新通知
  GENEALOGY_UPDATE: 'JUW-xt1HEmqBxxxxxxxxxxxxxxxxxxxxxxxxx',
  // 成员变动通知
  MEMBER_CHANGE: 'WNI-Yj2VBhqAyyyyyyyyyyyyyyyyyyyyy',
  // 活动邀请通知
  EVENT_INVITE: 'KIO-pP3LCnmBzzzzzzzzzzzzzzzzzzzzz',
  // 纪念日提醒
  ANNIVERSARY_REMINDER: 'PLK-jH4DTfnCaaaaaaaaaaaaaaaaaaaaa',
  // 系统公告
  SYSTEM_ANNOUNCEMENT: 'QWE-rT5YUioBbbbbbbbbbbbbbbbbbbbb'
};

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    // 订阅消息设置
    subscriptionSettings: [
      {
        id: 'GENEALOGY_UPDATE',
        name: '族谱更新通知',
        desc: '族谱信息有更新时通知您',
        status: false,
        templateId: TEMPLATE_IDS.GENEALOGY_UPDATE
      },
      {
        id: 'MEMBER_CHANGE',
        name: '成员变动通知',
        desc: '有成员加入或退出时通知您',
        status: false,
        templateId: TEMPLATE_IDS.MEMBER_CHANGE
      },
      {
        id: 'EVENT_INVITE',
        name: '活动邀请通知',
        desc: '有新的家族活动邀请时通知您',
        status: false,
        templateId: TEMPLATE_IDS.EVENT_INVITE
      },
      {
        id: 'ANNIVERSARY_REMINDER',
        name: '纪念日提醒',
        desc: '提前提醒您家族成员的生日、忌日等纪念日',
        status: false,
        templateId: TEMPLATE_IDS.ANNIVERSARY_REMINDER
      },
      {
        id: 'SYSTEM_ANNOUNCEMENT',
        name: '系统公告',
        desc: '接收系统更新、新功能发布等公告',
        status: false,
        templateId: TEMPLATE_IDS.SYSTEM_ANNOUNCEMENT
      }
    ],
    // 应用内通知设置
    appNotificationSettings: {
      sound: true,       // 声音
      vibrate: true,     // 震动
      badge: true,       // 角标
      nightMode: false   // 夜间免打扰
    },
    notificationMainSwitch: true,  // 通知总开关
    mainSwitchAnimating: false,     // 主开关动画状态
    // 通知历史记录
    notificationHistory: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this._loadNotificationSettings();
    this._loadNotificationHistory();
  },

  /**
   * 加载通知设置
   */
  _loadNotificationSettings: function () {
    this.setData({ isLoading: true });
    
    // 使用通知服务获取设置
    notificationService.getNotificationSettings()
      .then(res => {
        if (res.success) {
          const { mainSwitch, subscriptionSettings, appNotificationSettings } = res.data;
          
          // 更新订阅状态
          const updatedSubscriptionSettings = this.data.subscriptionSettings.map(item => {
            return {
              ...item,
              status: subscriptionSettings[item.id] === undefined ? false : subscriptionSettings[item.id]
            };
          });
          
          // 更新应用内通知设置
          const updatedAppSettings = {
            ...this.data.appNotificationSettings,
            ...appNotificationSettings
          };
          
          this.setData({
            subscriptionSettings: updatedSubscriptionSettings,
            appNotificationSettings: updatedAppSettings,
            notificationMainSwitch: mainSwitch,
            isLoading: false
          });
        } else {
          // 设置获取失败，使用默认值
          this.setData({ isLoading: false });
          wx.showToast({
            title: '设置加载失败，请重试',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('Load notification settings failed:', err);
        this.setData({ isLoading: false });
        wx.showToast({
          title: '设置加载失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 加载通知历史记录
   */
  _loadNotificationHistory: function() {
    // 使用通知服务获取历史记录
    notificationService.getNotifications({ page: 1, pageSize: 3 })
      .then(res => {
        if (res.success) {
          this.setData({
            notificationHistory: res.data.list || []
          });
        }
      })
      .catch(err => {
        console.error('Load notification history failed:', err);
      });
  },

  /**
   * 切换主开关
   */
  toggleMainSwitch: function (e) {
    const value = e.detail.value;
    
    // 避免动画中重复触发
    if (this.data.mainSwitchAnimating) {
      return;
    }
    
    this.setData({
      mainSwitchAnimating: true,
      notificationMainSwitch: value
    });
    
    // 使用通知服务更新设置
    notificationService.updateNotificationSettings({ mainSwitch: value })
      .then(res => {
        this.setData({ mainSwitchAnimating: false });
        
        if (res.success) {
          if (!value) {
            wx.showToast({
              title: '已关闭所有通知',
              icon: 'none'
            });
          } else {
            wx.showToast({
              title: '已开启通知',
              icon: 'success'
            });
          }
        } else {
          // 更新设置失败，回滚状态
          this.setData({ notificationMainSwitch: !value });
          wx.showToast({
            title: '设置失败，请重试',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('Update main switch failed:', err);
        // 更新设置失败，回滚状态
        this.setData({
          mainSwitchAnimating: false,
          notificationMainSwitch: !value
        });
        wx.showToast({
          title: '设置失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 切换应用内通知设置
   */
  toggleAppNotification: function (e) {
    const { type } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    // 更新设置
    this.setData({
      [`appNotificationSettings.${type}`]: value
    });
    
    // 使用通知服务更新设置
    notificationService.updateNotificationSettings({
      appNotificationSettings: this.data.appNotificationSettings
    })
      .then(res => {
        if (!res.success) {
          // 更新设置失败，回滚状态
          this.setData({
            [`appNotificationSettings.${type}`]: !value
          });
          wx.showToast({
            title: '设置失败，请重试',
            icon: 'none'
          });
        } else if (type === 'nightMode') {
          // 显示夜间模式提示
          wx.showToast({
            title: value ? '已开启夜间免打扰' : '已关闭夜间免打扰',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('Update app notification settings failed:', err);
        // 更新设置失败，回滚状态
        this.setData({
          [`appNotificationSettings.${type}`]: !value
        });
        wx.showToast({
          title: '设置失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 申请订阅消息
   */
  requestSubscription: function (e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.subscriptionSettings[index];
    
    if (!item) return;
    
    if (!this.data.notificationMainSwitch) {
      wx.showToast({
        title: '请先开启通知总开关',
        icon: 'none'
      });
      return;
    }
    
    // 申请订阅消息权限
    wx.requestSubscribeMessage({
      tmplIds: [item.templateId],
      success: (res) => {
        if (res[item.templateId] === 'accept') {
          // 用户同意订阅
          this._updateSubscriptionStatus(index, true);
          
          wx.showToast({
            title: '订阅成功',
            icon: 'success'
          });
        } else {
          // 用户拒绝或未处理
          this._updateSubscriptionStatus(index, false);
          
          wx.showToast({
            title: '您拒绝了订阅',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('Subscribe message failed:', err);
        
        // 订阅失败
        wx.showToast({
          title: '订阅失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 更新订阅状态
   */
  _updateSubscriptionStatus: function (index, status) {
    // 更新状态
    const subscriptionSettings = [...this.data.subscriptionSettings];
    subscriptionSettings[index].status = status;
    
    this.setData({ subscriptionSettings });
    
    // 构建订阅设置对象
    const savedSettings = {};
    subscriptionSettings.forEach(item => {
      savedSettings[item.id] = item.status;
    });
    
    // 使用通知服务更新设置
    notificationService.updateNotificationSettings({
      subscriptionSettings: savedSettings
    }).then(res => {
      if (!res.success) {
        console.error('Update subscription status failed');
      }
    }).catch(err => {
      console.error('Update subscription status error:', err);
    });
  },

  /**
   * 查看通知详情
   */
  viewNotificationDetail: function(e) {
    const { id } = e.currentTarget.dataset;
    
    // 标记为已读
    notificationService.markAsRead(id)
      .then(res => {
        if (res.success) {
          // 重新加载通知历史记录
          this._loadNotificationHistory();
          
          // 展示通知详情
          const notification = this.data.notificationHistory.find(item => item.id === id);
          if (notification) {
            wx.showModal({
              title: notification.title,
              content: notification.content,
              showCancel: false,
              confirmText: '知道了'
            });
          }
        }
      })
      .catch(err => {
        console.error('Mark notification as read failed:', err);
      });
  },

  /**
   * 查看全部通知
   */
  viewAllNotifications: function() {
    // 跳转到通知中心页面
    wx.navigateTo({
      url: '/pages/notification-center/notification-center'
    });
  },

  /**
   * 清空通知记录
   */
  clearAllNotifications: function() {
    wx.showModal({
      title: '提示',
      content: '确定要清空所有通知记录吗？',
      success: (res) => {
        if (res.confirm) {
          notificationService.clearAllNotifications()
            .then(res => {
              if (res.success) {
                this.setData({ notificationHistory: [] });
                
                wx.showToast({
                  title: '已清空通知记录',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: '操作失败，请重试',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              console.error('Clear notifications failed:', err);
              wx.showToast({
                title: '操作失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  /**
   * 打开授权设置页面
   */
  openSettingPage: function () {
    wx.openSetting({
      success: (res) => {
        console.log('打开设置页面成功');
      },
      fail: (err) => {
        console.error('打开设置页面失败:', err);
      }
    });
  }
}); 