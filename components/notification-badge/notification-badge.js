// 通知提醒组件
const app = getApp();
const notificationService = require('../../services/notification');

Component({
  /**
   * 组件属性
   */
  properties: {
    position: {
      type: String,
      value: 'fixed' // fixed: 固定位置, relative: 相对位置
    },
    showBackground: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件初始数据
   */
  data: {
    unreadCount: 0,
    showBadge: false
  },

  lifetimes: {
    attached: function() {
      // 在组件实例进入页面节点树时执行
      this.loadUnreadCount();
    }
  },

  pageLifetimes: {
    show: function() {
      // 页面被展示时更新未读数量
      this.loadUnreadCount();
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 加载未读通知数量
     */
    loadUnreadCount: function() {
      notificationService.getUnreadCount()
        .then(res => {
          if (res.success) {
            const count = res.data.count || 0;
            this.setData({
              unreadCount: count,
              showBadge: count > 0
            });
          }
        })
        .catch(err => {
          console.error('加载未读通知数量失败:', err);
        });
    },

    /**
     * 导航到通知中心
     */
    navigateToNotificationCenter: function() {
      wx.navigateTo({
        url: '/pages/notification-center/notification-center?filter=unread'
      });
    }
  }
}) 