// 切换族谱页面
const app = getApp();
const api = require('../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    genealogies: [],
    currentGenealogyId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 获取当前族谱ID
    const currentGenealogy = app.getCurrentGenealogy();
    if (currentGenealogy) {
      this.setData({
        currentGenealogyId: currentGenealogy.id
      });
    }
    
    // 加载族谱列表
    this._loadGenealogies();
  },

  /**
   * 加载族谱列表
   */
  _loadGenealogies: function () {
    this.setData({ isLoading: true });
    
    api.genealogyAPI.getMyGenealogies()
      .then(genealogies => {
        this.setData({
          genealogies: genealogies || [],
          isLoading: false
        });
      })
      .catch(error => {
        console.error('Load genealogies failed:', error);
        
        this.setData({
          isLoading: false
        });
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 选择族谱
   */
  selectGenealogy: function (e) {
    const { id } = e.currentTarget.dataset;
    const genealogy = this.data.genealogies.find(g => g.id === id);
    
    if (genealogy) {
      // 设置为当前族谱
      app.setCurrentGenealogy(genealogy);
      
      wx.showToast({
        title: '切换成功',
        icon: 'success'
      });
      
      // 延迟返回
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 跳转到创建族谱页面
   */
  navigateToCreate: function () {
    wx.navigateTo({
      url: '/pages/create-genealogy/create-genealogy'
    });
  },

  /**
   * 跳转到加入族谱页面
   */
  navigateToJoin: function () {
    wx.navigateTo({
      url: '/pages/join-genealogy/join-genealogy'
    });
  },

  /**
   * 用户下拉刷新
   */
  onPullDownRefresh: function () {
    this._loadGenealogies();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});