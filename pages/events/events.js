// 大事记页面
const app = getApp();
const api = require('../../services/api');
const dateUtil = require('../../utils/date-util');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    currentGenealogy: null,
    genealogyHistory: '',
    events: [],
    groupedEvents: [],
    allMembers: [],
    timelineHeight: 500,
    // 筛选相关
    timeFilter: 'all', // all, century, decade
    typeFilterOptions: ['全部类型', '出生', '去世', '婚礼', '职业', '教育', '成就', '其他'],
    typeFilterIndex: 0,
    typeFilters: ['', 'birth', 'death', 'wedding', 'career', 'education', 'achievement', 'other'],
    // 分页相关
    page: 1,
    pageSize: 20,
    hasMore: true,
    // 权限
    isEditable: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 获取屏幕高度
    const systemInfo = wx.getSystemInfoSync();
    const windowHeight = systemInfo.windowHeight;
    
    // 计算时间轴高度（减去顶部区域高度）
    const headerHeight = 200; // 族谱历史 + 筛选控制条 的大致高度
    const timelineHeight = windowHeight - headerHeight;
    
    this.setData({
      timelineHeight
    });
    
    // 获取当前族谱
    this._getCurrentGenealogy();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 如果有更新，重新加载数据
    if (this.data.currentGenealogy && this.needRefresh) {
      this._loadEvents();
      this.needRefresh = false;
    }
  },

  /**
   * 获取当前族谱
   */
  _getCurrentGenealogy: function () {
    const currentGenealogy = app.getCurrentGenealogy();
    
    if (currentGenealogy) {
      // 检查编辑权限
      const isEditable = currentGenealogy.isOwner === true;
      
      this.setData({
        currentGenealogy,
        isEditable,
        isLoading: true
      });
      
      // 加载族谱历史
      this._loadGenealogyHistory(currentGenealogy.id);
      
      // 加载所有成员（用于事件关联显示）
      this._loadMembers(currentGenealogy.id);
      
      // 加载大事记
      this._loadEvents();
    } else {
      // 跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  /**
   * 加载族谱历史
   */
  _loadGenealogyHistory: function (genealogyId) {
    api.genealogyAPI.getGenealogyHistory(genealogyId)
      .then(history => {
        if (history) {
          this.setData({
            genealogyHistory: history.history || ''
          });
        }
      })
      .catch(error => {
        console.error('Load genealogy history failed:', error);
      });
  },

  /**
   * 加载成员数据
   */
  _loadMembers: function (genealogyId) {
    api.memberAPI.getMembers(genealogyId)
      .then(members => {
        this.setData({
          allMembers: members || []
        });
      })
      .catch(error => {
        console.error('Load members failed:', error);
      });
  },

  /**
   * 加载大事记
   */
  _loadEvents: function (loadMore = false) {
    const { currentGenealogy, page, pageSize, typeFilters, typeFilterIndex, events } = this.data;
    
    if (!currentGenealogy) return;
    
    this.setData({ isLoading: true });
    
    // 构建查询参数
    const params = {
      page,
      pageSize,
      orderBy: 'date asc'
    };
    
    // 添加类型筛选
    if (typeFilterIndex > 0) {
      params.type = typeFilters[typeFilterIndex];
    }
    
    api.eventsAPI.getEvents(currentGenealogy.id, params)
      .then(newEvents => {
        // 合并事件列表
        const combinedEvents = loadMore ? [...events, ...newEvents] : newEvents;
        
        this.setData({
          events: combinedEvents,
          hasMore: newEvents.length >= pageSize,
          isLoading: false
        });
        
        // 按时间分组显示
        this._groupEventsByTime(combinedEvents);
      })
      .catch(error => {
        console.error('Load events failed:', error);
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 按时间分组事件
   */
  _groupEventsByTime: function (events) {
    if (!events || events.length === 0) {
      this.setData({ groupedEvents: [] });
      return;
    }
    
    const { timeFilter } = this.data;
    const grouped = {};
    
    events.forEach(event => {
      if (!event.date) return;
      
      const date = dateUtil.parseDate(event.date);
      if (!date) return;
      
      const year = date.getFullYear();
      let groupKey = '';
      
      if (timeFilter === 'century') {
        // 按世纪分组
        const century = Math.floor(year / 100) + 1;
        groupKey = `${century}世纪`;
      } else if (timeFilter === 'decade') {
        // 按年代分组
        const decade = Math.floor(year / 10) * 10;
        groupKey = `${decade}年代`;
      } else {
        // 默认按年分组
        groupKey = `${year}年`;
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      
      grouped[groupKey].push(event);
    });
    
    // 转换为数组并排序
    const groupedArray = Object.keys(grouped).map(era => ({
      era,
      events: grouped[era]
    }));
    
    // 按时间排序（从旧到新）
    groupedArray.sort((a, b) => {
      const yearA = parseInt(a.era.replace(/[^0-9]/g, ''));
      const yearB = parseInt(b.era.replace(/[^0-9]/g, ''));
      return yearA - yearB;
    });
    
    this.setData({
      groupedEvents: groupedArray
    });
  },

  /**
   * 设置时间筛选
   */
  setTimeFilter: function (e) {
    const filter = e.currentTarget.dataset.filter;
    
    if (filter === this.data.timeFilter) return;
    
    this.setData({ timeFilter: filter });
    
    // 重新分组显示
    this._groupEventsByTime(this.data.events);
  },

  /**
   * 类型筛选变化
   */
  onTypeFilterChange: function (e) {
    const index = parseInt(e.detail.value);
    
    if (index === this.data.typeFilterIndex) return;
    
    this.setData({
      typeFilterIndex: index,
      page: 1, // 重置分页
      hasMore: true
    });
    
    // 重新加载事件
    this._loadEvents();
  },

  /**
   * 加载更多事件
   */
  loadMoreEvents: function () {
    if (!this.data.hasMore || this.data.isLoading) return;
    
    this.setData({
      page: this.data.page + 1
    });
    
    this._loadEvents(true);
  },

  /**
   * 滚动到底部时触发
   */
  onLoadMore: function () {
    this.loadMoreEvents();
  },

  /**
   * 编辑族谱历史
   */
  editHistory: function () {
    const { currentGenealogy, genealogyHistory } = this.data;
    
    wx.navigateTo({
      url: `/pages/edit-history/edit-history?genealogyId=${currentGenealogy.id}&history=${encodeURIComponent(genealogyHistory || '')}`
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 查看事件详情
   */
  onEventDetail: function (e) {
    const { item } = e.detail;
    const { currentGenealogy } = this.data;
    
    wx.navigateTo({
      url: `/pages/event-detail/event-detail?genealogyId=${currentGenealogy.id}&eventId=${item.id}`
    });
  },

  /**
   * 编辑事件
   */
  onEventEdit: function (e) {
    const { item } = e.detail;
    const { currentGenealogy } = this.data;
    
    wx.navigateTo({
      url: `/pages/edit-event/edit-event?genealogyId=${currentGenealogy.id}&eventId=${item.id}`
    });
    
    // 标记需要刷新
    this.needRefresh = true;
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
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 用户下拉刷新
   */
  onPullDownRefresh: function () {
    this.setData({
      page: 1,
      hasMore: true
    });
    
    this._loadEvents();
    this._loadGenealogyHistory(this.data.currentGenealogy.id);
    
    wx.stopPullDownRefresh();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const { currentGenealogy } = this.data;
    
    if (currentGenealogy) {
      return {
        title: `「${currentGenealogy.name}」家族大事记`,
        path: `/pages/share/share?genealogyId=${currentGenealogy.id}&tab=events`,
        imageUrl: '/images/share_events.png'
      };
    }
    
    return {
      title: '云族谱-云端数字族谱',
      path: '/pages/index/index',
      imageUrl: '/images/share_app.png'
    };
  }
});