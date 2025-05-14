/**
 * 族谱历史编辑页面
 * 用于编辑族谱历史信息
 */

const app = getApp();
const api = require('../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: false,
    genealogyId: '',
    history: '',
    maxLength: 1000, // 最大字符数
    currentLength: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { genealogyId, history } = options;
    
    if (!genealogyId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
      return;
    }
    
    this.setData({
      genealogyId,
      history: history ? decodeURIComponent(history) : '',
      currentLength: history ? decodeURIComponent(history).length : 0
    });
    
    // 如果没有传入历史内容，从API获取
    if (!history) {
      this._loadGenealogyHistory(genealogyId);
    }
  },

  /**
   * 加载族谱历史
   */
  _loadGenealogyHistory: function (genealogyId) {
    this.setData({ isLoading: true });
    
    api.genealogyAPI.getGenealogyHistory(genealogyId)
      .then(result => {
        if (result) {
          this.setData({
            history: result.history || '',
            currentLength: (result.history || '').length,
            isLoading: false
          });
        } else {
          this.setData({ isLoading: false });
        }
      })
      .catch(error => {
        console.error('Load genealogy history failed:', error);
        
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 处理输入变化
   */
  onInput: function (e) {
    const value = e.detail.value;
    const length = value.length;
    
    // 更新输入内容和当前长度
    this.setData({
      history: value,
      currentLength: length
    });
  },

  /**
   * 保存历史
   */
  saveHistory: function () {
    const { genealogyId, history } = this.data;
    
    this.setData({ isLoading: true });
    
    api.genealogyAPI.updateGenealogyHistory(genealogyId, { history })
      .then(result => {
        this.setData({ isLoading: false });
        
        if (result) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          });
        }
      })
      .catch(error => {
        console.error('Save genealogy history failed:', error);
        
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 取消编辑
   */
  cancelEdit: function () {
    wx.navigateBack();
  }
});