/**
 * 邀请页面
 * 用于生成邀请码，邀请其他用户加入族谱
 */

const app = getApp();
const api = require('../../services/api');
const util = require('../../utils/util');
const toast = require('../../utils/toast');

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
    showSuccessDialog: false,
    // 分页控制
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      hasMore: false
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { genealogyId } = options;
    
    if (!genealogyId) {
      toast.show('参数错误');
      
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
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    const { genealogyId } = this.data;
    
    // 重置分页
    this.setData({
      'pagination.page': 1
    });
    
    // 重新加载数据
    Promise.all([
      this._loadGenealogyInfo(genealogyId),
      this._loadInviteRecords(genealogyId)
    ]).then(() => {
      wx.stopPullDownRefresh();
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 上拉加载更多
   */
  onReachBottom: function() {
    const { genealogyId, pagination } = this.data;
    
    if (pagination.hasMore) {
      // 加载下一页
      this.setData({
        'pagination.page': pagination.page + 1
      });
      
      this._loadInviteRecords(genealogyId);
    }
  },

  /**
   * 加载族谱信息
   */
  _loadGenealogyInfo: function (genealogyId) {
    return api.genealogyAPI.getGenealogyDetail(genealogyId)
      .then(genealogy => {
        if (!genealogy) {
          toast.show('族谱不存在');
          
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
        console.error('加载族谱信息失败:', error);
        toast.show('加载失败，请重试');
        this.setData({ isLoading: false });
      });
  },

  /**
   * 加载邀请记录
   */
  _loadInviteRecords: function (genealogyId) {
    const { pagination } = this.data;
    
    this.setData({ isLoading: true });
    
    return api.genealogyAPI.getInviteRecords(genealogyId)
      .then(records => {
        if (!records || !records.length) {
          this.setData({
            inviteRecords: [],
            isLoading: false,
            'pagination.hasMore': false,
            'pagination.total': 0
          });
          return;
        }
        
        // 处理记录日期和状态
        const processedRecords = records.map(record => {
          const now = new Date();
          const expiresAt = new Date(record.expiresAt);
          return {
            ...record,
            expired: record.expired || expiresAt < now,
            createdAt: util.formatDate(new Date(record.createdAt), 'yyyy-MM-dd')
          };
        });
        
        // 按创建时间逆序排序
        processedRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // 处理分页
        const start = (pagination.page - 1) * pagination.limit;
        const end = start + pagination.limit;
        const paginatedRecords = processedRecords.slice(0, end);
        
        this.setData({
          inviteRecords: pagination.page === 1 ? paginatedRecords : [...this.data.inviteRecords, ...paginatedRecords.slice(start)],
          isLoading: false,
          'pagination.hasMore': processedRecords.length > end,
          'pagination.total': processedRecords.length
        });
      })
      .catch(error => {
        console.error('加载邀请记录失败:', error);
        toast.show('加载记录失败');
        this.setData({ isLoading: false });
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
        
        // 生成邀请URL
        const inviteURL = `https://example.com/join?code=${result.code}`;
        
        // 生成二维码（实际项目中可能需要通过后端接口生成，或使用小程序码）
        // 这里简单模拟二维码图片地址
        const inviteQrCode = `/images/qrcode_placeholder.png`;
        
        this.setData({
          inviteCode: result.code,
          inviteURL: inviteURL,
          inviteQrCode: inviteQrCode,
          showSuccessDialog: true,
          isLoading: false
        });
        
        // 重置分页并刷新邀请记录
        this.setData({
          'pagination.page': 1
        });
        this._loadInviteRecords(genealogyId);
      })
      .catch(error => {
        console.error('生成邀请码失败:', error);
        toast.show('生成邀请码失败，请重试');
        this.setData({ isLoading: false });
      });
  },

  /**
   * 复制邀请码
   */
  copyInviteCode: function () {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        toast.show('邀请码已复制', 'success');
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
        toast.show('邀请链接已复制', 'success');
      }
    });
  },

  /**
   * 复制历史邀请码
   */
  copyHistoryCode: function (e) {
    const { code } = e.currentTarget.dataset;
    
    wx.setClipboardData({
      data: code,
      success: () => {
        toast.show('邀请码已复制', 'success');
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
    const { inviteQrCode } = this.data;
    
    if (!inviteQrCode) {
      toast.show('二维码不存在');
      return;
    }
    
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    // 下载二维码图片
    wx.downloadFile({
      url: inviteQrCode,
      success: (res) => {
        if (res.statusCode === 200) {
          // 保存到相册
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              toast.show('已保存到相册', 'success');
              this.setData({
                showQrCode: false
              });
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('保存图片失败:', err);
              
              if (err.errMsg.indexOf('auth deny') >= 0) {
                wx.showModal({
                  title: '提示',
                  content: '需要您授权保存图片到相册',
                  showCancel: true,
                  confirmText: '去设置',
                  success: (res) => {
                    if (res.confirm) {
                      wx.openSetting();
                    }
                  }
                });
              } else {
                toast.show('保存失败，请重试');
              }
            }
          });
        } else {
          wx.hideLoading();
          toast.show('下载二维码失败，请重试');
        }
      },
      fail: () => {
        wx.hideLoading();
        toast.show('下载二维码失败，请重试');
      }
    });
  },

  /**
   * 分享到微信
   */
  shareToWechat: function () {
    // 实际上，这里应该调用 wx.showShareMenu 或依赖小程序分享机制
    toast.show('请点击右上角"..."分享');
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
    
    if (genealogy) {
      return {
        title: `邀请您加入「${genealogy.name}」族谱`,
        path: `/pages/invite/invite?genealogyId=${genealogy.id}`,
        imageUrl: '/images/share_invite.png'
      };
    }
    
    return {
      title: '邀请加入族谱',
      path: '/pages/index/index'
    };
  }
});