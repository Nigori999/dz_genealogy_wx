// pages/notification-list/notification-list.js
const app = getApp();
const notificationService = require('../../services/notification');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    isLoadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    notifications: [],
    searchKeyword: '',
    currentType: '',
    notificationTypes: [
      { label: '系统公告', value: 'system' },
      { label: '活动通知', value: 'activity' },
      { label: '重要更新', value: 'update' },
      { label: '其他', value: 'other' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function() {
    this.loadNotifications();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 检查用户是否是管理员
    if (!app.globalData.userInfo || !app.globalData.userInfo.isAdmin) {
      wx.showModal({
        title: '无权限',
        content: '您没有访问此页面的权限',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.loadNotifications(true)
      .then(() => {
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        wx.stopPullDownRefresh();
      });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    this.loadMoreNotifications();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 加载通知列表
   */
  loadNotifications: function(isRefresh = true) {
    if (isRefresh) {
      this.setData({ isLoading: true, page: 1 });
    } else {
      this.setData({ isLoadingMore: true });
    }

    const params = {
      page: this.data.page,
      pageSize: this.data.pageSize
    };

    if (this.data.searchKeyword) {
      params.keyword = this.data.searchKeyword;
    }

    if (this.data.currentType) {
      params.type = this.data.currentType;
    }

    notificationService.getAdminNotifications(params)
      .then(res => {
        let newNotifications = res.data.list || [];
        let notifications = isRefresh ? newNotifications : this.data.notifications.concat(newNotifications);
        
        this.setData({
          notifications: notifications,
          hasMore: newNotifications.length === this.data.pageSize,
          isLoading: false,
          isLoadingMore: false
        });
      })
      .catch(err => {
        console.error('Load notifications failed:', err);
        wx.showToast({
          title: '加载通知失败',
          icon: 'none'
        });
        this.setData({ 
          isLoading: false,
          isLoadingMore: false
        });
      });
  },

  /**
   * 加载更多通知
   */
  loadMoreNotifications: function() {
    if (this.data.isLoadingMore || !this.data.hasMore) return;
    
    this.setData({
      page: this.data.page + 1
    }, () => {
      this.loadNotifications(false);
    });
  },

  /**
   * 按类型筛选
   */
  filterByType: function(e) {
    const type = e.currentTarget.dataset.type;
    if (type === this.data.currentType) return;
    
    this.setData({
      currentType: type,
      page: 1
    }, () => {
      this.loadNotifications(true);
    });
  },

  /**
   * 搜索输入
   */
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /**
   * 搜索通知
   */
  searchNotifications: function() {
    this.loadNotifications(true);
  },

  /**
   * 查看通知详情
   */
  viewNotificationDetail: function(e) {
    const { id } = e.currentTarget.dataset;
    const notification = this.data.notifications.find(item => item.id === id);
    
    if (!notification) return;
    
    wx.showModal({
      title: notification.title,
      content: notification.content,
      showCancel: false
    });
  },

  /**
   * 撤回通知
   */
  recallNotification: function(e) {
    e.stopPropagation(); // 阻止冒泡
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '撤回通知',
      content: '确定要撤回这条通知吗？撤回后用户将不再收到该通知。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '撤回中...',
            mask: true
          });
          
          notificationService.recallNotification(id)
            .then(res => {
              wx.hideLoading();
              
              if (res.success) {
                // 更新本地通知状态
                const notifications = this.data.notifications.map(item => {
                  if (item.id === id) {
                    return { ...item, recalled: true };
                  }
                  return item;
                });
                
                this.setData({ notifications });
                
                wx.showToast({
                  title: '撤回成功',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: '撤回失败，请重试',
                  icon: 'none'
                });
              }
            })
            .catch(err => {
              wx.hideLoading();
              console.error('Recall notification failed:', err);
              wx.showToast({
                title: '撤回失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  }
})