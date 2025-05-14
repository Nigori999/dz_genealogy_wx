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
    recentEvents: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 检查登录状态
    this._checkLoginStatus();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 获取当前族谱
    this._getCurrentGenealogy();
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
    if (!genealogyId) return;
    
    // 加载成员数据
    const loadMembers = api.memberAPI.getMembers(genealogyId);
    
    // 加载近期事件
    const loadEvents = api.eventsAPI.getEvents(genealogyId, {
      limit: 5,
      orderBy: 'date desc'
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
        this.setData({ isLoading: false });
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
    return memberIds.map(id => allMembers.find(m => m.id === id)).filter(Boolean);
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
    const { currentGenealogy } = this.data;
    if (!currentGenealogy) return;
    
    wx.navigateTo({
      url: `/pages/add-member/add-member?genealogyId=${currentGenealogy.id}`
    });
  },

  /**
   * 导航到添加事件页面
   */
  navigateToAddEvent: function () {
    const { currentGenealogy } = this.data;
    if (!currentGenealogy) return;
    
    wx.navigateTo({
      url: `/pages/add-event/add-event?genealogyId=${currentGenealogy.id}`
    });
  },

  /**
   * 导航到邀请页面
   */
  navigateToInvite: function () {
    const { currentGenealogy } = this.data;
    if (!currentGenealogy) return;
    
    wx.navigateTo({
      url: `/pages/invite/invite?genealogyId=${currentGenealogy.id}`
    });
  },

  /**
   * 导航到族谱历史页面
   */
  navigateToGenealogyHistory: function () {
    const { currentGenealogy } = this.data;
    if (!currentGenealogy) return;
    
    wx.navigateTo({
      url: `/pages/genealogy-history/genealogy-history?genealogyId=${currentGenealogy.id}`
    });
  },

  /**
   * 事件详情
   */
  onEventDetail: function (e) {
    const { event } = e.detail;
    const { currentGenealogy } = this.data;
    
    wx.navigateTo({
      url: `/pages/event-detail/event-detail?genealogyId=${currentGenealogy.id}&eventId=${event.id}`
    });
  },

  /**
   * 点击成员
   */
  onMemberTap: function (e) {
    const { memberId } = e.detail;
    const { currentGenealogy } = this.data;
    
    wx.navigateTo({
      url: `/pages/member-detail/member-detail?genealogyId=${currentGenealogy.id}&memberId=${memberId}`
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
  }
});