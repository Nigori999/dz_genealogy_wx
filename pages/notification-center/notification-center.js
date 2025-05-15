// 通知中心页面
const app = getApp();
const notificationService = require('../../services/notification');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    notifications: [],
    currentFilter: 'all', // 当前过滤器：all, unread, system, genealogy
    filterMapping: {
      'all': '全部',
      'unread': '未读',
      'system': '系统',
      'genealogy': '族谱'
    },
    typeMapping: {
      'system': ['系统通知', '系统公告', '订阅提醒'],
      'genealogy': ['族谱更新', '成员变动', '活动邀请']
    },
    checkedIds: [],     // 选中的通知ID
    isAllChecked: false, // 是否全选
    currentPage: 1,      // 当前页码
    pageSize: 10,        // 每页条数
    hasMore: false       // 是否有更多数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查是否有指定过滤器
    if (options.filter && this.data.filterMapping[options.filter]) {
      this.setData({
        currentFilter: options.filter
      });
    }
    
    // 加载通知数据
    this._loadNotifications();
  },

  /**
   * 加载通知数据
   */
  _loadNotifications: function (isLoadMore = false) {
    const { currentFilter, currentPage, pageSize } = this.data;
    
    if (!isLoadMore) {
      this.setData({ isLoading: true });
    }
    
    // 构建查询参数
    const params = {
      page: isLoadMore ? currentPage + 1 : 1,
      pageSize: pageSize
    };
    
    // 根据过滤器设置查询参数
    if (currentFilter === 'unread') {
      params.onlyUnread = true;
    } else if (currentFilter === 'system' || currentFilter === 'genealogy') {
      // 使用类型映射筛选通知类型
      params.types = this.data.typeMapping[currentFilter];
    }
    
    // 获取通知列表
    notificationService.getNotifications(params)
      .then(res => {
        if (res.success) {
          const { list, total, hasMore } = res.data;
          
          if (isLoadMore) {
            // 加载更多模式：拼接新数据
            this.setData({
              notifications: [...this.data.notifications, ...list],
              hasMore: hasMore,
              currentPage: params.page,
              isLoading: false
            });
          } else {
            // 初始加载模式：替换数据
            this.setData({
              notifications: list,
              hasMore: hasMore,
              currentPage: 1,
              isLoading: false,
              checkedIds: [],
              isAllChecked: false
            });
          }
        } else {
          wx.showToast({
            title: '加载失败，请重试',
            icon: 'none'
          });
          this.setData({ isLoading: false });
        }
      })
      .catch(err => {
        console.error('Load notifications failed:', err);
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
        this.setData({ isLoading: false });
      });
  },

  /**
   * 切换过滤器
   */
  switchFilter: function (e) {
    const { filter } = e.currentTarget.dataset;
    
    if (filter === this.data.currentFilter) return;
    
    this.setData({
      currentFilter: filter,
      currentPage: 1
    }, () => {
      this._loadNotifications();
    });
  },

  /**
   * 加载更多
   */
  loadMore: function () {
    if (this.data.hasMore) {
      this._loadNotifications(true);
    }
  },

  /**
   * 查看通知详情
   */
  viewNotificationDetail: function (e) {
    const { id } = e.currentTarget.dataset;
    const notification = this.data.notifications.find(item => item.id === id);
    
    if (!notification) return;
    
    // 如果通知未读，标记为已读
    if (!notification.read) {
      this._markAsRead(id);
    }
    
    // 显示通知详情
    wx.showModal({
      title: notification.title,
      content: notification.content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 标记为已读
   */
  markAsRead: function (e) {
    e.stopPropagation(); // 阻止冒泡，防止触发点击通知项事件
    const { id } = e.currentTarget.dataset;
    this._markAsRead(id);
  },

  /**
   * 标记为已读（内部方法）
   */
  _markAsRead: function (id) {
    notificationService.markAsRead(id)
      .then(res => {
        if (res.success) {
          // 更新本地通知状态
          const notifications = this.data.notifications.map(item => {
            if (item.id === id) {
              return { ...item, read: true };
            }
            return item;
          });
          
          this.setData({ notifications });
          
          // 重新加载未读消息数
          this._updateUnreadBadge();
        } else {
          wx.showToast({
            title: '操作失败，请重试',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('Mark as read failed:', err);
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 标记所有为已读
   */
  markAllAsRead: function () {
    wx.showLoading({
      title: '处理中...',
      mask: true
    });
    
    notificationService.markAllAsRead()
      .then(res => {
        wx.hideLoading();
        
        if (res.success) {
          // 更新本地通知状态
          const notifications = this.data.notifications.map(item => {
            return { ...item, read: true };
          });
          
          this.setData({ notifications });
          
          // 重新加载未读消息数
          this._updateUnreadBadge();
          
          wx.showToast({
            title: '已全部标为已读',
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
        wx.hideLoading();
        console.error('Mark all as read failed:', err);
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 删除通知
   */
  deleteNotification: function (e) {
    e.stopPropagation(); // 阻止冒泡，防止触发点击通知项事件
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '删除通知',
      content: '确定要删除这条通知吗？',
      success: (res) => {
        if (res.confirm) {
          this._deleteNotifications([id]);
        }
      }
    });
  },

  /**
   * 删除选中的通知
   */
  deleteChecked: function () {
    const { checkedIds } = this.data;
    
    if (checkedIds.length === 0) {
      wx.showToast({
        title: '请先选择通知',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '删除通知',
      content: `确定要删除选中的 ${checkedIds.length} 条通知吗？`,
      success: (res) => {
        if (res.confirm) {
          this._deleteNotifications(checkedIds);
        }
      }
    });
  },

  /**
   * 删除通知（内部方法）
   */
  _deleteNotifications: function (ids) {
    wx.showLoading({
      title: '删除中...',
      mask: true
    });
    
    notificationService.deleteNotifications(ids)
      .then(res => {
        wx.hideLoading();
        
        if (res.success) {
          // 从本地通知列表中移除已删除的通知
          const notifications = this.data.notifications.filter(
            item => !ids.includes(item.id)
          );
          
          // 清空选中状态
          this.setData({
            notifications,
            checkedIds: [],
            isAllChecked: false
          });
          
          // 重新加载未读消息数
          this._updateUnreadBadge();
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: '删除失败，请重试',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('Delete notifications failed:', err);
        wx.showToast({
          title: '删除失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 全选/取消全选
   */
  checkAllChange: function (e) {
    const isChecked = e.detail.value.includes('all');
    
    if (isChecked) {
      // 全选：获取所有通知ID
      const allIds = this.data.notifications.map(item => item.id);
      this.setData({
        checkedIds: allIds,
        isAllChecked: true
      });
    } else {
      // 取消全选
      this.setData({
        checkedIds: [],
        isAllChecked: false
      });
    }
  },

  /**
   * 更新未读通知数量徽章
   */
  _updateUnreadBadge: function() {
    // 获取未读通知数量并更新首页
    if (typeof this.getOpenerEventChannel === 'function') {
      const eventChannel = this.getOpenerEventChannel();
      if (eventChannel && typeof eventChannel.emit === 'function') {
        // 通知父页面更新未读消息数
        notificationService.getUnreadCount().then(res => {
          if (res.success) {
            eventChannel.emit('updateUnreadCount', { count: res.data.count });
          }
        });
      }
    }
  },

  /**
   * 用户下拉刷新
   */
  onPullDownRefresh: function () {
    this._loadNotifications();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.hasMore) {
      this._loadNotifications(true);
    }
  }
}); 