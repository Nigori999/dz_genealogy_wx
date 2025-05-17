// 首页
const app = getApp();
const api = require('../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    currentGenealogy: null,
    allMembers: [],
    recentEvents: [],
    isQuickActionsCollapsed: false, // 快捷操作区域是否折叠
    unreadNotificationsCount: 0 // 未读通知数量
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 检查登录状态
    this._checkLoginStatus();
    
    // 恢复快捷操作区域的折叠状态
    this._restoreQuickActionsState();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 获取当前族谱
    this._getCurrentGenealogy();
    
    // 获取未读通知数量
    this._getUnreadNotificationsCount();
  },
  
  /**
   * 功能按钮点击前的登录检查
   * @returns {Boolean} 是否已登录
   */
  checkLoginBeforeAction: function() {
    return app.checkLogin();
  },
  
  /**
   * 获取未读通知数量
   */
  _getUnreadNotificationsCount: function () {
    if (!app.globalData.isLogin) return;
    
    // 直接从app.globalData获取未读通知数量
    this.setData({
      unreadNotificationsCount: app.globalData.unreadNotificationCount || 0
    });
    
    // 也可以主动更新一次
    app.loadUnreadNotificationCount();
  },
  
  /**
   * 导航到通知中心
   */
  navigateToNotificationCenter: function () {
    if (!this.checkLoginBeforeAction()) return;
    
    wx.navigateTo({
      url: '/pages/notification-center/notification-center?filter=unread'
    });
  },
  
  /**
   * 恢复快捷操作区域的折叠状态
   */
  _restoreQuickActionsState: function() {
    const isCollapsed = wx.getStorageSync('quickActionsCollapsed');
    if (isCollapsed !== '') {
      this.setData({
        isQuickActionsCollapsed: isCollapsed
      });
    }
  },

  /**
   * 切换快捷操作区域的折叠状态
   */
  toggleQuickActions: function() {
    const isCollapsed = !this.data.isQuickActionsCollapsed;
    this.setData({
      isQuickActionsCollapsed: isCollapsed
    });
    
    // 保存折叠状态到本地存储
    wx.setStorageSync('quickActionsCollapsed', isCollapsed);
  },

  /**
   * 检查登录状态
   */
  _checkLoginStatus: function () {
    const isLogin = app.globalData.isLogin;
    
    if (!isLogin) {
      app.checkLoginStatus()
        .then(() => {
          this._getCurrentGenealogy();
          this._getUnreadNotificationsCount();
        })
        .catch(() => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        });
    }
  },

  /**
   * 获取当前族谱
   */
  _getCurrentGenealogy: function () {
    const currentGenealogy = app.getCurrentGenealogy();
    
    if (currentGenealogy) {
      this.setData({
        currentGenealogy,
        isLoading: true
      });
      
      // 加载族谱数据
      this._loadGenealogyData(currentGenealogy.id);
    } else {
      // 尝试获取用户的族谱列表
      this._loadUserGenealogies();
    }
  },

  /**
   * 加载用户的族谱列表
   */
  _loadUserGenealogies: function () {
    this.setData({ isLoading: true });
    
    api.genealogyAPI.getMyGenealogies()
      .then(genealogies => {
        this.setData({ isLoading: false });
        
        if (genealogies && genealogies.length > 0) {
          // 默认选择第一个族谱
          const firstGenealogy = genealogies[0];
          app.setCurrentGenealogy(firstGenealogy);
          
          this.setData({
            currentGenealogy: firstGenealogy
          });
          
          // 加载族谱数据
          this._loadGenealogyData(firstGenealogy.id);
        }
      })
      .catch(error => {
        console.error('Load genealogies failed:', error);
        this.setData({ isLoading: false });
      });
  },

  /**
   * 加载族谱数据（成员和事件）
   */
  _loadGenealogyData: function (genealogyId) {
    if (!genealogyId) {
      this.setData({ isLoading: false });
      return;
    }
    
    // 加载成员数据
    const loadMembers = api.memberAPI.getMembers(genealogyId)
      .catch(err => {
        console.error('Load members failed:', err);
        return [];
      });
    
    // 加载近期事件
    const loadEvents = api.eventsAPI.getEvents(genealogyId, {
      limit: 5,
      orderBy: 'date desc'
    })
    .catch(err => {
      console.error('Load events failed:', err);
      return [];
    });
    
    // 并行请求
    Promise.all([loadMembers, loadEvents])
      .then(([members, events]) => {
        this.setData({
          allMembers: members || [],
          recentEvents: events || [],
          isLoading: false
        });
      })
      .catch(error => {
        console.error('Load genealogy data failed:', error);
        this.setData({ 
          isLoading: false,
          allMembers: [],
          recentEvents: []
        });
      });
  },

  /**
   * 根据成员ID获取成员信息
   */
  getMembersById: function (memberIds) {
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return [];
    }
    
    const { allMembers } = this.data;
    if (!allMembers || allMembers.length === 0) {
      return [];
    }
    
    // 过滤掉无效的ID，然后查找对应的成员
    return memberIds
      .filter(id => id) // 过滤掉null、undefined、空字符串等
      .map(id => allMembers.find(m => m && m.id === id))
      .filter(Boolean); // 过滤掉未找到的成员
  },

  /**
   * 搜索输入事件
   */
  onSearchInput: function (e) {
    const searchText = e.detail.value;
    // 可以实现实时搜索提示等功能
  },

  /**
   * 搜索确认事件
   */
  onSearchConfirm: function (e) {
    const searchText = e.detail.value;
    if (!searchText.trim()) return;
    
    wx.navigateTo({
      url: `/pages/search/search?keyword=${encodeURIComponent(searchText)}`
    });
  },

  /**
   * 导航到家族树页面
   */
  navigateToFamilyTree: function () {
    const { currentGenealogy } = this.data;
    if (!currentGenealogy) return;
    
    wx.switchTab({
      url: '/pages/family-tree/family-tree'
    });
  },

  /**
   * 导航到切换族谱页面
   */
  navigateToSwitchGenealogy: function () {
    wx.navigateTo({
      url: '/pages/switch-genealogy/switch-genealogy'
    });
  },

  /**
   * 创建族谱
   */
  createGenealogy: function () {
    wx.navigateTo({
      url: '/pages/create-genealogy/create-genealogy'
    });
  },

  /**
   * 加入族谱
   */
  joinGenealogy: function () {
    wx.navigateTo({
      url: '/pages/join-genealogy/join-genealogy'
    });
  },

  /**
   * 导航到大事记页面
   */
  navigateToEvents: function () {
    wx.switchTab({
      url: '/pages/events/events'
    });
  },

  /**
   * 导航到添加成员页面
   */
  navigateToAddMember: function () {
    if (!this.checkLoginBeforeAction()) return;
    
    // 确保有选择的族谱
    if (!this.data.currentGenealogy) {
      wx.showToast({
        title: '请先选择族谱',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/add-member/add-member'
    });
  },

  /**
   * 导航到添加事件页面
   */
  navigateToAddEvent: function () {
    if (!this.checkLoginBeforeAction()) return;
    
    // 确保有选择的族谱
    if (!this.data.currentGenealogy) {
      wx.showToast({
        title: '请先选择族谱',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/add-event/add-event'
    });
  },

  /**
   * 导航到邀请页面
   */
  navigateToInvite: function () {
    const { currentGenealogy } = this.data;
    if (!currentGenealogy) {
      this._showNoGenealogyTip();
      return;
    }
    
    wx.navigateTo({
      url: `/pages/invite/invite?genealogyId=${currentGenealogy.id}`
    });
  },

  /**
   * 导航到族谱历史页面
   */
  navigateToGenealogyHistory: function () {
    const { currentGenealogy } = this.data;
    if (!currentGenealogy) {
      this._showNoGenealogyTip();
      return;
    }
    
    wx.navigateTo({
      url: `/pages/edit-history/edit-history?genealogyId=${currentGenealogy.id}`
    });
  },
  
  /**
   * 显示无族谱提示
   */
  _showNoGenealogyTip: function() {
    wx.showToast({
      title: '请先创建或加入族谱',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 事件详情点击
   */
  onEventDetail: function (e) {
    const eventId = e.detail.id;
    
    wx.navigateTo({
      url: `/pages/event-detail/event-detail?id=${eventId}`
    });
  },

  /**
   * 成员点击
   */
  onMemberTap: function (e) {
    const memberId = e.detail.id;
    
    wx.navigateTo({
      url: `/pages/member-detail/member-detail?id=${memberId}`
    });
  },

  /**
   * 用户下拉刷新
   */
  onPullDownRefresh: function () {
    const { currentGenealogy } = this.data;
    
    if (currentGenealogy) {
      this._loadGenealogyData(currentGenealogy.id);
      
      // 获取最新的族谱信息
      api.genealogyAPI.getGenealogyDetail(currentGenealogy.id)
        .then(genealogy => {
          if (genealogy) {
            app.setCurrentGenealogy(genealogy);
            this.setData({ currentGenealogy: genealogy });
          }
          wx.stopPullDownRefresh();
        })
        .catch(() => {
          wx.stopPullDownRefresh();
        });
    } else {
      this._loadUserGenealogies();
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // 可以实现加载更多事件
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const { currentGenealogy } = this.data;
    
    if (currentGenealogy) {
      return {
        title: `邀请您加入「${currentGenealogy.name}」族谱`,
        path: `/pages/share/share?genealogyId=${currentGenealogy.id}`,
        imageUrl: '/images/share_genealogy.png'
      };
    }
    
    return {
      title: '云族谱-云端数字族谱',
      path: '/pages/index/index',
      imageUrl: '/images/share_app.png'
    };
  },

  /**
   * 跳转到添加成员页面
   */
  navigateToAddMember: function () {
    if (!this.checkLoginBeforeAction()) return;
    
    // 确保有选择的族谱
    if (!this.data.currentGenealogy) {
      wx.showToast({
        title: '请先选择族谱',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/add-member/add-member'
    });
  },
  
  /**
   * 跳转到添加大事记页面
   */
  navigateToAddEvent: function () {
    if (!this.checkLoginBeforeAction()) return;
    
    // 确保有选择的族谱
    if (!this.data.currentGenealogy) {
      wx.showToast({
        title: '请先选择族谱',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/add-event/add-event'
    });
  },
  
  /**
   * 跳转到创建族谱页面
   */
  navigateToCreateGenealogy: function () {
    if (!this.checkLoginBeforeAction()) return;
    
    wx.navigateTo({
      url: '/pages/create-genealogy/create-genealogy'
    });
  },
  
  /**
   * 跳转到大事记详情页
   */
  navigateToEventDetail: function (e) {
    if (!this.checkLoginBeforeAction()) return;
    
    const { eventId } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/pages/event-detail/event-detail?id=${eventId}`
    });
  },
  
  /**
   * 跳转到成员详情页
   */
  navigateToMemberDetail: function (e) {
    if (!this.checkLoginBeforeAction()) return;
    
    const { memberId } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/pages/member-detail/member-detail?id=${memberId}`
    });
  },
});