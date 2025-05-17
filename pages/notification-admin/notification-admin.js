// 通知管理页面
const app = getApp();
const notificationService = require('../../services/notification');
const mockUtils = require('../../utils/mock');  // 引入模拟工具

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    stats: {
      totalCount: 0,
      unreadCount: 0,
      readRate: '0%'
    },
    recentNotifications: [],
    
    // 弹窗相关数据
    showCreatePopup: false,
    notificationForm: {
      title: '',
      content: '',
      type: 'system',
      receiver: 'all'
    },
    typeIndex: 0,
    receiverIndex: 0,
    notificationTypes: [
      { label: '系统公告', value: 'system' },
      { label: '活动通知', value: 'activity' },
      { label: '重要更新', value: 'update' },
      { label: '其他', value: 'other' }
    ],
    
    // 搜索下拉框相关数据
    showReceiverDropdown: false,
    receiverSearchKeyword: '',
    genealogyMembers: [],
    filteredReceivers: [],
    selectedReceiverId: 'all',
    selectedReceiverName: '所有人',
    
    // 旧的receivers数据，暂时保留
    receiverOptions: [
      { label: '所有人', value: 'all' },
      { label: '管理员', value: 'admin' },
      { label: '族长', value: 'leader' },
      { label: '普通成员', value: 'member' }
    ],
    submitDisabled: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this._loadNotificationStats();
    this._loadRecentNotifications();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
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
   * 加载通知统计数据
   */
  _loadNotificationStats: function() {
    this.setData({ isLoading: true });
    
    notificationService.getNotificationStats()
      .then(res => {
        if (res.success) {
          // 计算阅读率
          let readRate = '0%';
          if (res.data.totalCount > 0) {
            const rate = ((res.data.totalCount - res.data.unreadCount) / res.data.totalCount * 100).toFixed(1);
            readRate = rate + '%';
          }
          
          this.setData({
            stats: {
              totalCount: res.data.totalCount || 0,
              unreadCount: res.data.unreadCount || 0,
              readRate: readRate
            },
            isLoading: false
          });
        } else {
          this.setData({ isLoading: false });
          wx.showToast({
            title: '加载统计数据失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('Load notification stats failed:', err);
        this.setData({ isLoading: false });
        wx.showToast({
          title: '加载统计数据失败',
          icon: 'none'
        });
      });
  },

  /**
   * 加载最近发布的通知
   */
  _loadRecentNotifications: function() {
    notificationService.getAdminNotifications({ page: 1, pageSize: 5 })
      .then(res => {
        if (res.success) {
          this.setData({
            recentNotifications: res.data.list || []
          });
        }
      })
      .catch(err => {
        console.error('Load recent notifications failed:', err);
      });
  },

  /**
   * 查看通知详情
   */
  viewNotificationDetail: function(e) {
    const { id } = e.currentTarget.dataset;
    const notification = this.data.recentNotifications.find(item => item.id === id);
    
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
                const recentNotifications = this.data.recentNotifications.map(item => {
                  if (item.id === id) {
                    return { ...item, recalled: true };
                  }
                  return item;
                });
                
                this.setData({ recentNotifications });
                
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
  },

  /**
   * 显示创建通知弹窗
   */
  showCreateNotificationPopup: function() {
    this.setData({
      showCreatePopup: true,
      notificationForm: {
        title: '',
        content: '',
        type: 'system',
        receiver: 'all'
      },
      typeIndex: 0,
      selectedReceiverId: 'all',
      selectedReceiverName: '所有人',
      showReceiverDropdown: false,
      submitDisabled: true
    });
    
    // 加载族谱成员
    this._loadGenealogyMembers();
  },
  
  /**
   * 加载当前族谱的成员列表
   */
  _loadGenealogyMembers: function() {
    const currentGenealogyId = app.globalData.currentGenealogy ? app.globalData.currentGenealogy.id : null;
    
    if (!currentGenealogyId) {
      // 使用模拟数据
      const mockMembers = this._getMockMembers();
      this.setData({
        genealogyMembers: mockMembers,
        filteredReceivers: mockMembers
      });
      return;
    }
    
    // 调用API获取族谱成员列表
    wx.request({
      url: app.globalData.apiBaseUrl + '/genealogy/' + currentGenealogyId + '/members',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + app.globalData.token
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          // 转换数据结构
          const members = res.data.data.members || [];
          const formattedMembers = members.map(member => {
            return {
              id: member.id,
              name: member.name || member.nickName || '未命名成员',
              avatar: member.avatar || '../../images/default-avatar.png'
            };
          });
          
          this.setData({
            genealogyMembers: formattedMembers,
            filteredReceivers: formattedMembers
          });
        } else {
          console.error('Failed to load members:', res);
          // 使用模拟数据(实际项目中可以删除)
          const mockMembers = this._getMockMembers();
          this.setData({
            genealogyMembers: mockMembers,
            filteredReceivers: mockMembers
          });
        }
      },
      fail: (err) => {
        console.error('Load members failed:', err);
        
        // 使用模拟数据(实际项目中可以删除)
        const mockMembers = this._getMockMembers();
        this.setData({
          genealogyMembers: mockMembers,
          filteredReceivers: mockMembers
        });
      }
    });
  },
  
  /**
   * 生成模拟成员数据(开发测试用)
   */
  _getMockMembers: function() {
    return [
      { id: 'user1', name: '张三', avatar: '../../images/default-avatar.png' },
      { id: 'user2', name: '李四', avatar: '../../images/default-avatar.png' },
      { id: 'user3', name: '王五', avatar: '../../images/default-avatar.png' },
      { id: 'user4', name: '赵六', avatar: '../../images/default-avatar.png' },
      { id: 'user5', name: '钱七', avatar: '../../images/default-avatar.png' },
      { id: 'user6', name: '孙八', avatar: '../../images/default-avatar.png' },
      { id: 'user7', name: '周九', avatar: '../../images/default-avatar.png' },
      { id: 'user8', name: '吴十', avatar: '../../images/default-avatar.png' },
      { id: 'user9', name: '郑十一', avatar: '../../images/default-avatar.png' },
      { id: 'user10', name: '王十二', avatar: '../../images/default-avatar.png' }
    ];
  },
  
  /**
   * 切换接收对象下拉框的显示状态
   */
  toggleReceiverDropdown: function() {
    // 如果当前是显示状态，点击会隐藏
    if (this.data.showReceiverDropdown) {
      this.setData({
        showReceiverDropdown: false
      });
      return;
    }
    
    // 否则显示下拉框并重置搜索
    this.setData({
      showReceiverDropdown: true,
      receiverSearchKeyword: '',
      filteredReceivers: this.data.genealogyMembers
    });
  },
  
  /**
   * 接收对象搜索输入
   */
  onReceiverSearchInput: function(e) {
    const keyword = e.detail.value.toLowerCase().trim();
    
    let filtered = this.data.genealogyMembers;
    if (keyword) {
      filtered = this.data.genealogyMembers.filter(member => 
        member.name.toLowerCase().indexOf(keyword) !== -1
      );
    }
    
    this.setData({
      receiverSearchKeyword: keyword,
      filteredReceivers: filtered
    });
  },
  
  /**
   * 选择接收对象
   */
  selectReceiver: function(e) {
    const { id, name } = e.currentTarget.dataset;
    
    this.setData({
      selectedReceiverId: id,
      selectedReceiverName: name,
      showReceiverDropdown: false,
      'notificationForm.receiver': id
    });
  },

  /**
   * 隐藏创建通知弹窗
   */
  hideCreateNotificationPopup: function() {
    this.setData({
      showCreatePopup: false,
      showReceiverDropdown: false
    });
  },

  /**
   * 防止滑动穿透
   */
  preventTouchMove: function() {
    return false;
  },

  /**
   * 标题输入事件
   */
  onTitleInput: function(e) {
    const title = e.detail.value;
    this.setData({
      'notificationForm.title': title
    });
    this._checkFormValid();
  },

  /**
   * 内容输入事件
   */
  onContentInput: function(e) {
    const content = e.detail.value;
    this.setData({
      'notificationForm.content': content
    });
    this._checkFormValid();
  },

  /**
   * 类型选择事件
   */
  onTypeChange: function(e) {
    const index = e.detail.value;
    this.setData({
      typeIndex: index,
      'notificationForm.type': this.data.notificationTypes[index].value
    });
  },

  /**
   * 检查表单是否有效
   */
  _checkFormValid: function() {
    const { title, content } = this.data.notificationForm;
    const isValid = title.trim() !== '' && content.trim() !== '';
    
    this.setData({
      submitDisabled: !isValid
    });
  },

  /**
   * 提交创建通知
   */
  submitCreateNotification: function(e) {
    const formData = this.data.notificationForm;
    
    if (!formData.title || !formData.content) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '发送中...',
      mask: true
    });
    
    notificationService.createNotification(formData)
      .then(res => {
        wx.hideLoading();
        
        if (res.success) {
          this.hideCreateNotificationPopup();
          wx.showToast({
            title: '发布成功',
            icon: 'success'
          });
          
          // 刷新列表
          this._loadRecentNotifications();
          this._loadNotificationStats();
        } else {
          wx.showToast({
            title: res.message || '发布失败，请重试',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('Create notification failed:', err);
        wx.showToast({
          title: '发布失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 导航到创建通知页面 (保留但不使用)
   */
  navigateToCreateNotification: function() {
    wx.navigateTo({
      url: '/pages/notification-create/notification-create'
    });
  },

  /**
   * 导航到管理通知页面
   */
  navigateToManageNotifications: function() {
    wx.navigateTo({
      url: '/pages/notification-list/notification-list'
    });
  },

  /**
   * 用户下拉刷新
   */
  onPullDownRefresh: function() {
    Promise.all([
      this._loadNotificationStats(),
      this._loadRecentNotifications()
    ])
      .then(() => {
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        wx.stopPullDownRefresh();
      });
  }
}); 