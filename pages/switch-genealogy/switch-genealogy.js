// pages/switch-genealogy/switch-genealogy.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    genealogies: [],
    hasReachedGenealogyLimit: false,
    limit: 10, // 最大族谱数量
    currentGenealogy: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadGenealogies();
    this.setData({
      currentGenealogy: app.globalData.currentGenealogy || null
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 可能从其他页面返回，重新加载数据
    this.loadGenealogies();
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
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 加载用户的所有族谱
   */
  loadGenealogies: function () {
    const that = this;
    that.setData({ isLoading: true });

    // 模拟API调用
    setTimeout(() => {
      // 实际项目中应该调用API获取用户的族谱列表
      const genealogies = app.globalData.genealogies || [];
      
      that.setData({
        genealogies: genealogies,
        isLoading: false,
        hasReachedGenealogyLimit: genealogies.length >= that.data.limit
      });
    }, 1000);
  },

  /**
   * 选择族谱
   */
  onGenealogySelect: function (e) {
    const genealogyId = e.detail.id;
    const selectedGenealogy = this.data.genealogies.find(item => item.id === genealogyId);
    
    if (selectedGenealogy) {
      // 设置当前选中的族谱
      app.globalData.currentGenealogy = selectedGenealogy;
      
      // 显示成功提示
      wx.showToast({
        title: '已切换到族谱：' + selectedGenealogy.name,
        icon: 'success',
        duration: 2000
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 编辑族谱
   */
  onGenealogyEdit: function (e) {
    const genealogyId = e.detail.id;
    
    wx.navigateTo({
      url: '../edit-genealogy/edit-genealogy?id=' + genealogyId
    });
  },

  /**
   * 删除族谱
   */
  onGenealogyDelete: function (e) {
    const genealogyId = e.detail.id;
    const genealogyName = this.data.genealogies.find(item => item.id === genealogyId)?.name || '';
    
    const that = this;
    
    // 删除确认
    wx.showModal({
      title: '删除族谱',
      content: `确定要删除族谱"${genealogyName}"吗？删除后无法恢复，所有族谱数据将永久丢失。`,
      confirmText: '删除',
      confirmColor: '#E53935',
      success(res) {
        if (res.confirm) {
          // 用户点击了确定按钮
          that.deleteGenealogy(genealogyId);
        }
      }
    });
  },

  /**
   * 删除族谱
   */
  deleteGenealogy: function (genealogyId) {
    const that = this;
    
    // 显示加载中
    wx.showLoading({
      title: '删除中...',
    });
    
    // 模拟API调用
    setTimeout(() => {
      // 实际项目中应该调用API删除族谱
      const newGenealogyList = that.data.genealogies.filter(item => item.id !== genealogyId);
      
      // 更新本地数据
      app.globalData.genealogies = newGenealogyList;
      
      // 如果删除的是当前选中的族谱，则清空当前选中
      if (app.globalData.currentGenealogy && app.globalData.currentGenealogy.id === genealogyId) {
        app.globalData.currentGenealogy = newGenealogyList.length > 0 ? newGenealogyList[0] : null;
      }
      
      that.setData({
        genealogies: newGenealogyList,
        hasReachedGenealogyLimit: newGenealogyList.length >= that.data.limit
      });
      
      wx.hideLoading();
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    }, 1500);
  },

  /**
   * 导航到创建族谱页面
   */
  navigateToCreateGenealogy: function () {
    wx.navigateTo({
      url: '../create-genealogy/create-genealogy'
    });
  },

  /**
   * 导航到加入族谱页面
   */
  navigateToJoinGenealogy: function () {
    wx.navigateTo({
      url: '../join-genealogy/join-genealogy'
    });
  }
})