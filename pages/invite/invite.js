/**
 * 邀请页面
 * 用于生成邀请码，邀请其他用户加入族谱
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
    genealogy: null,
    inviteCode: '',
    inviteURL: '',
    inviteQrCode: '',
    showQrCode: false,
    // 邀请记录
    inviteRecords: [],
    // 显示控制
    showSuccessDialog: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { genealogyId } = options;
    
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
      isLoading: true
    });
    
    // 加载族谱信息
    this._loadGenealogyInfo(genealogyId);
    
    // 加载邀请记录
    this._loadInviteRecords(genealogyId);
  },

  /**
   * 加载族谱信息
   */
  _loadGenealogyInfo: function (genealogyId) {
    api.genealogyAPI.getGenealogyDetail(genealogyId)
      .then(genealogy => {
        if (!genealogy) {
          wx.showToast({
            title: '族谱不存在',
            icon: 'none'
          });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
          
          return;
        }
        
        this.setData({
          genealogy,
          isLoading: false
        });
      })
      .catch(error => {
        console.error('Load genealogy failed:', error);
        
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 加载邀请记录
   */
  _loadInviteRecords: function (genealogyId) {
    // 假设API提供了获取邀请记录的方法
    api.genealogyAPI.getInviteRecords(genealogyId)
      .then(records => {
        this.setData({
          inviteRecords: records || []
        });
      })
      .catch(error => {
        console.error('Load invite records failed:', error);
      });
  },

  /**
   * 生成邀请码
   */
  generateInviteCode: function () {
    const { genealogyId } = this.data;
    
    this.setData({ isLoading: true });
    
    api.genealogyAPI.generateInviteCode(genealogyId)
      .then(result => {
        if (!result || !result.code) {
          throw new Error('生成邀请码失败');
        }
        
        // 生成邀请URL和二维码
        const inviteURL = `https://example.com/join?code=${result.code}`;
        // 实际项目中，二维码可能需要通过后端接口生成，或者使用小程序码
        
        this.setData({
          inviteCode: result.code,
          inviteURL: inviteURL,
          showSuccessDialog: true,
          isLoading: false
        });
        
        // 刷新邀请记录
        this._loadInviteRecords(genealogyId);
      })
      .catch(error => {
        console.error('Generate invite code failed:', error);
        
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '生成邀请码失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 复制邀请码
   */
  copyInviteCode: function () {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        wx.showToast({
          title: '邀请码已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 复制邀请链接
   */
  copyInviteURL: function () {
    wx.setClipboardData({
      data: this.data.inviteURL,
      success: () => {
        wx.showToast({
          title: '邀请链接已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 显示二维码
   */
  showQrCode: function () {
    this.setData({
      showQrCode: true
    });
  },

  /**
   * 关闭二维码弹窗
   */
  closeQrCode: function () {
    this.setData({
      showQrCode: false
    });
  },

  /**
   * 保存二维码到相册
   */
  saveQrCode: function () {
    // 实际项目中，需要先将二维码绘制到 Canvas，然后导出为图片
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showToast({
        title: '已保存到相册',
        icon: 'success'
      });
      
      this.setData({
        showQrCode: false
      });
    }, 1000);
  },

  /**
   * 分享到微信
   */
  shareToWechat: function () {
    // 实际上，这里应该调用 wx.showShareMenu 或依赖小程序分享机制
    wx.showToast({
      title: '请点击右上角"..."分享',
      icon: 'none'
    });
  },

  /**
   * 关闭成功对话框
   */
  closeSuccessDialog: function () {
    this.setData({
      showSuccessDialog: false
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const { genealogy, inviteCode } = this.data;
    
    if (genealogy && inviteCode) {
      return {
        title: `邀请您加入「${genealogy.name}」族谱`,
        path: `/pages/join-genealogy/join-genealogy?code=${inviteCode}`,
        imageUrl: '/images/share_invite.png'
      };
    }
    
    return {
      title: '云族谱-云端数字族谱',
      path: '/pages/index/index',
      imageUrl: '/images/share_app.png'
    };
  }
});