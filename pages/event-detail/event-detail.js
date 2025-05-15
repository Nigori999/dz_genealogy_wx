// 事件详情页面
const app = getApp();
const api = require('../../services/api');
const dateUtil = require('../../utils/date-util');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    genealogyId: '',
    eventId: '',
    event: null,
    allMembers: [],
    relatedMembersInfo: [],
    formatDate: '',
    eventTypeText: '',
    eventTypeClass: '',
    isEditable: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { genealogyId, eventId } = options;
    
    if (!genealogyId || !eventId) {
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
      eventId
    });
    
    // 加载事件详情
    this._loadEventDetail(genealogyId, eventId);
    
    // 加载所有成员（用于关联显示）
    this._loadAllMembers(genealogyId);
    
    // 检查编辑权限
    this._checkEditPermission(genealogyId);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 如果需要刷新
    if (this.needRefresh) {
      const { genealogyId, eventId } = this.data;
      this._loadEventDetail(genealogyId, eventId);
      this.needRefresh = false;
    }
  },

  /**
   * 加载事件详情
   */
  _loadEventDetail: function (genealogyId, eventId) {
    this.setData({ isLoading: true });
    
    api.eventsAPI.getEventDetail(genealogyId, eventId)
      .then(event => {
        if (!event) {
          wx.showToast({
            title: '事件不存在',
            icon: 'none'
          });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
          
          return;
        }
        
        this.setData({
          event,
          isLoading: false
        });
        
        // 格式化日期
        this._formatDate(event);
        
        // 格式化事件类型
        this._formatEventType(event);
        
        // 如果已经加载了所有成员，就更新关联成员信息
        if (this.data.allMembers.length > 0) {
          this._updateRelatedMembers(event);
        }
      })
      .catch(error => {
        console.error('Load event detail failed:', error);
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 加载所有成员
   */
  _loadAllMembers: function (genealogyId) {
    api.memberAPI.getMembers(genealogyId)
      .then(members => {
        this.setData({
          allMembers: members || []
        });
        
        // 如果已经加载了事件详情，就更新关联成员信息
        if (this.data.event) {
          this._updateRelatedMembers(this.data.event);
        }
      })
      .catch(error => {
        console.error('Load all members failed:', error);
      });
  },

  /**
   * 检查编辑权限
   */
  _checkEditPermission: function (genealogyId) {
    const currentGenealogy = app.getCurrentGenealogy();
    
    if (currentGenealogy && currentGenealogy.id === genealogyId) {
      // 如果是族谱所有者，拥有编辑权限
      this.setData({
        isEditable: currentGenealogy.isOwner === true
      });
    }
  },

  /**
   * 格式化日期
   */
  _formatDate: function (event) {
    if (!event || !event.date) {
      this.setData({
        formatDate: '未知日期'
      });
      return;
    }
    
    const date = dateUtil.parseDate(event.date);
    if (date && !isNaN(date.getTime())) {
      this.setData({
        formatDate: dateUtil.formatDate(event.date, 'YYYY年MM月DD日')
      });
    } else {
      console.warn('Invalid date format:', event.date);
      this.setData({
        formatDate: '日期格式错误'
      });
    }
  },

  /**
   * 格式化事件类型
   */
  _formatEventType: function (event) {
    const typeMap = {
      'birth': { text: '出生', class: 'birth' },
      'death': { text: '去世', class: 'death' },
      'wedding': { text: '婚礼', class: 'wedding' },
      'career': { text: '职业', class: 'career' },
      'education': { text: '教育', class: 'education' },
      'achievement': { text: '成就', class: 'achievement' },
      'other': { text: '其他', class: '' }
    };

    const type = event.type || 'other';
    const typeInfo = typeMap[type] || typeMap.other;

    this.setData({
      eventTypeText: typeInfo.text,
      eventTypeClass: typeInfo.class
    });
  },

  /**
   * 更新关联成员信息
   */
  _updateRelatedMembers: function (event) {
    const { allMembers } = this.data;
    
    // 查找关联成员信息
    let relatedMembersInfo = [];
    if (event.relatedMembers && event.relatedMembers.length > 0) {
      relatedMembersInfo = event.relatedMembers
        .map(id => allMembers.find(m => m.id === id))
        .filter(Boolean);
    }
    
    this.setData({
      relatedMembersInfo
    });
  },

  /**
   * 预览媒体
   */
  previewMedia: function (e) {
    const { index } = e.currentTarget.dataset;
    const { event } = this.data;
    
    if (event && event.media && event.media.length > 0) {
      wx.previewImage({
        current: event.media[index],
        urls: event.media
      });
    }
  },

  /**
   * 编辑事件
   */
  editEvent: function () {
    const { genealogyId, eventId } = this.data;
    
    wx.navigateTo({
      url: `/pages/edit-event/edit-event?genealogyId=${genealogyId}&eventId=${eventId}`
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 添加媒体
   */
  addMedia: function () {
    const { genealogyId, eventId } = this.data;
    
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        
        if (!tempFilePaths || tempFilePaths.length === 0) {
          return;
        }
        
        // 显示上传中
        wx.showLoading({
          title: `上传中 (0/${tempFilePaths.length})`,
          mask: true
        });
        
        // 逐个上传媒体，避免并发问题
        this._uploadMediaFilesSequentially(genealogyId, eventId, tempFilePaths)
          .then(() => {
            wx.hideLoading();
            
            // 重新加载事件详情
            this._loadEventDetail(genealogyId, eventId);
            
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            });
          })
          .catch(error => {
            wx.hideLoading();
            console.error('Upload media failed:', error);
            
            wx.showToast({
              title: '上传失败，请重试',
              icon: 'none'
            });
          });
      }
    });
  },
  
  /**
   * 顺序上传媒体文件
   */
  _uploadMediaFilesSequentially: function(genealogyId, eventId, mediaFiles) {
    // 使用Promise链顺序上传所有文件
    let uploadPromise = Promise.resolve();
    let uploadedCount = 0;
    
    mediaFiles.forEach((filePath, index) => {
      uploadPromise = uploadPromise
        .then(() => {
          // 更新上传进度
          wx.showLoading({
            title: `上传中 (${index + 1}/${mediaFiles.length})`,
            mask: true
          });
          
          // 上传单个文件
          return api.eventsAPI.uploadEventMedia(genealogyId, eventId, filePath, 'photo');
        })
        .then(() => {
          uploadedCount++;
        })
        .catch(err => {
          console.error(`上传第 ${index + 1} 个文件失败:`, err);
          // 继续上传下一个文件
        });
    });
    
    return uploadPromise.then(() => {
      // 检查是否所有文件都上传成功
      if (uploadedCount < mediaFiles.length) {
        if (uploadedCount === 0) {
          return Promise.reject(new Error('所有文件上传失败'));
        } else {
          console.warn(`部分文件上传失败，${uploadedCount}/${mediaFiles.length} 上传成功`);
        }
      }
      return Promise.resolve();
    });
  },

  /**
   * 添加关联成员
   */
  addRelatedMember: function () {
    const { genealogyId, eventId, event, allMembers } = this.data;
    
    // 筛选出尚未关联的成员
    const unrelatedMembers = allMembers.filter(member => {
      return !event.relatedMembers || !event.relatedMembers.includes(member.id);
    });
    
    if (unrelatedMembers.length === 0) {
      wx.showToast({
        title: '所有成员都已关联',
        icon: 'none'
      });
      return;
    }
    
    // 显示选择器
    wx.showActionSheet({
      itemList: unrelatedMembers.map(member => member.name),
      success: (res) => {
        const selectedIndex = res.tapIndex;
        const selectedMember = unrelatedMembers[selectedIndex];
        
        // 更新事件关联成员
        const updatedRelatedMembers = [...(event.relatedMembers || []), selectedMember.id];
        
        api.eventsAPI.updateEvent(genealogyId, eventId, {
          relatedMembers: updatedRelatedMembers
        })
          .then(updatedEvent => {
            // 重新加载事件详情
            this._loadEventDetail(genealogyId, eventId);
            
            wx.showToast({
              title: '添加成功',
              icon: 'success'
            });
          })
          .catch(error => {
            console.error('Add related member failed:', error);
            
            wx.showToast({
              title: '添加失败，请重试',
              icon: 'none'
            });
          });
      }
    });
  },

  /**
   * 导航到成员详情页
   */
  navigateToMember: function (e) {
    const memberId = e.currentTarget.dataset.id;
    const { genealogyId } = this.data;
    
    wx.navigateTo({
      url: `/pages/member-detail/member-detail?genealogyId=${genealogyId}&memberId=${memberId}`
    });
  },

  /**
   * 删除事件
   */
  deleteEvent: function () {
    const { genealogyId, eventId } = this.data;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个事件吗？删除后将无法恢复。',
      success: (res) => {
        if (res.confirm) {
          // 显示加载中
          wx.showLoading({
            title: '删除中...',
            mask: true
          });
          
          api.eventsAPI.deleteEvent(genealogyId, eventId)
            .then(result => {
              wx.hideLoading();
              
              if (result && result.success) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                
                // 返回上一页
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              } else {
                wx.showToast({
                  title: '删除失败，请重试',
                  icon: 'none'
                });
              }
            })
            .catch(error => {
              wx.hideLoading();
              console.error('Delete event failed:', error);
              
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  /**
   * 用户下拉刷新
   */
  onPullDownRefresh: function () {
    const { genealogyId, eventId } = this.data;
    
    // 刷新事件详情
    this._loadEventDetail(genealogyId, eventId);
    
    wx.stopPullDownRefresh();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const { genealogyId, eventId, event } = this.data;
    
    if (event) {
      return {
        title: event.title,
        path: `/pages/share/share?genealogyId=${genealogyId}&eventId=${eventId}`,
        imageUrl: (event.media && event.media.length > 0) ? event.media[0] : '/images/share_event.png'
      };
    }
    
    return {
      title: '云族谱-云端数字族谱',
      path: '/pages/index/index',
      imageUrl: '/images/share_app.png'
    };
  }
});