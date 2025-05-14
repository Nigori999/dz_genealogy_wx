// 成员详情页面
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
    memberId: '',
    member: null,
    allMembers: [],
    parentInfo: null,
    spousesInfo: [],
    childrenInfo: [],
    relatedEvents: [],
    formatBirthDate: '',
    formatDeathDate: '',
    isEditable: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { genealogyId, memberId } = options;
    
    if (!genealogyId || !memberId) {
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
      memberId
    });
    
    // 加载成员详情
    this._loadMemberDetail(genealogyId, memberId);
    
    // 加载所有成员（用于查找关系）
    this._loadAllMembers(genealogyId);
    
    // 加载相关大事记
    this._loadRelatedEvents(genealogyId, memberId);
    
    // 检查编辑权限
    this._checkEditPermission(genealogyId);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 如果需要刷新
    if (this.needRefresh) {
      const { genealogyId, memberId } = this.data;
      this._loadMemberDetail(genealogyId, memberId);
      this._loadRelatedEvents(genealogyId, memberId);
      this.needRefresh = false;
    }
  },

  /**
   * 加载成员详情
   */
  _loadMemberDetail: function (genealogyId, memberId) {
    this.setData({ isLoading: true });
    
    api.memberAPI.getMemberDetail(genealogyId, memberId)
      .then(member => {
        if (!member) {
          wx.showToast({
            title: '成员不存在',
            icon: 'none'
          });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
          
          return;
        }
        
        this.setData({
          member,
          isLoading: false
        });
        
        // 格式化日期
        this._formatDates(member);
        
        // 如果已经加载了所有成员，就更新关系信息
        if (this.data.allMembers.length > 0) {
          this._updateRelationships(member);
        }
      })
      .catch(error => {
        console.error('Load member detail failed:', error);
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
        
        // 如果已经加载了成员详情，就更新关系信息
        if (this.data.member) {
          this._updateRelationships(this.data.member);
        }
      })
      .catch(error => {
        console.error('Load all members failed:', error);
      });
  },

  /**
   * 加载相关大事记
   */
  _loadRelatedEvents: function (genealogyId, memberId) {
    api.eventsAPI.getEvents(genealogyId, {
      memberId,
      limit: 3,
      orderBy: 'date desc'
    })
      .then(events => {
        this.setData({
          relatedEvents: events || []
        });
      })
      .catch(error => {
        console.error('Load related events failed:', error);
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
  _formatDates: function (member) {
    if (member.birthDate) {
      this.setData({
        formatBirthDate: dateUtil.formatDate(member.birthDate, 'YYYY年MM月DD日')
      });
    }
    
    if (member.deathDate) {
      this.setData({
        formatDeathDate: dateUtil.formatDate(member.deathDate, 'YYYY年MM月DD日')
      });
    }
  },

  /**
   * 更新关系信息
   */
  _updateRelationships: function (member) {
    const { allMembers } = this.data;
    
    // 查找父母信息
    let parentInfo = null;
    if (member.parentId) {
      parentInfo = allMembers.find(m => m.id === member.parentId);
    }
    
    // 查找配偶信息
    let spousesInfo = [];
    if (member.spouseIds && member.spouseIds.length > 0) {
      spousesInfo = member.spouseIds
        .map(id => allMembers.find(m => m.id === id))
        .filter(Boolean);
    }
    
    // 查找子女信息
    let childrenInfo = [];
    if (member.childrenIds && member.childrenIds.length > 0) {
      childrenInfo = member.childrenIds
        .map(id => allMembers.find(m => m.id === id))
        .filter(Boolean);
      
      // 对子女按性别和出生日期排序
      childrenInfo.sort((a, b) => {
        // 先按性别排序，男性在前
        if (a.gender !== b.gender) {
          return a.gender === 'male' ? -1 : 1;
        }
        // 再按出生日期排序
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return new Date(a.birthDate) - new Date(b.birthDate);
      });
    }
    
    this.setData({
      parentInfo,
      spousesInfo,
      childrenInfo
    });
  },

  /**
   * 预览头像
   */
  previewAvatar: function () {
    const { member } = this.data;
    
    if (member && member.avatar) {
      wx.previewImage({
        urls: [member.avatar]
      });
    }
  },

  /**
   * 预览照片
   */
  previewPhoto: function (e) {
    const { index } = e.currentTarget.dataset;
    const { member } = this.data;
    
    if (member && member.photos && member.photos.length > 0) {
      wx.previewImage({
        current: member.photos[index],
        urls: member.photos
      });
    }
  },

  /**
   * 编辑成员
   */
  editMember: function () {
    const { genealogyId, memberId } = this.data;
    
    wx.navigateTo({
      url: `/pages/edit-member/edit-member?genealogyId=${genealogyId}&memberId=${memberId}`
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 添加父母
   */
  addParent: function () {
    const { genealogyId, memberId } = this.data;
    
    wx.navigateTo({
      url: `/pages/add-parent/add-parent?genealogyId=${genealogyId}&childId=${memberId}`
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 添加配偶
   */
  addSpouse: function () {
    const { genealogyId, memberId } = this.data;
    
    wx.navigateTo({
      url: `/pages/add-spouse/add-spouse?genealogyId=${genealogyId}&memberId=${memberId}`
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 添加子女
   */
  addChild: function () {
    const { genealogyId, memberId } = this.data;
    
    wx.navigateTo({
      url: `/pages/add-member/add-member?genealogyId=${genealogyId}&parentId=${memberId}`
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 添加照片
   */
  addPhoto: function () {
    const { genealogyId, memberId } = this.data;
    
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        
        // 显示上传中
        wx.showLoading({
          title: '上传中...',
          mask: true
        });
        
        // 上传照片
        const uploadPromises = tempFilePaths.map(filePath => {
          return api.memberAPI.uploadMemberPhoto(genealogyId, memberId, filePath);
        });
        
        Promise.all(uploadPromises)
          .then(results => {
            wx.hideLoading();
            
            // 重新加载成员详情
            this._loadMemberDetail(genealogyId, memberId);
            
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            });
          })
          .catch(error => {
            wx.hideLoading();
            console.error('Upload photos failed:', error);
            
            wx.showToast({
              title: '上传失败，请重试',
              icon: 'none'
            });
          });
      }
    });
  },

  /**
   * 查看事件详情
   */
  onEventDetail: function (e) {
    const { item } = e.detail;
    const { genealogyId } = this.data;
    
    wx.navigateTo({
      url: `/pages/event-detail/event-detail?genealogyId=${genealogyId}&eventId=${item.id}`
    });
  },

  /**
   * 添加大事记
   */
  addEvent: function () {
    const { genealogyId, memberId } = this.data;
    
    wx.navigateTo({
      url: `/pages/add-event/add-event?genealogyId=${genealogyId}&memberId=${memberId}`
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 查看全部大事记
   */
  navigateToAllEvents: function () {
    const { genealogyId, memberId } = this.data;
    
    wx.navigateTo({
      url: `/pages/member-events/member-events?genealogyId=${genealogyId}&memberId=${memberId}`
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
   * 用户下拉刷新
   */
  onPullDownRefresh: function () {
    const { genealogyId, memberId } = this.data;
    
    // 刷新成员详情
    this._loadMemberDetail(genealogyId, memberId);
    
    // 刷新相关大事记
    this._loadRelatedEvents(genealogyId, memberId);
    
    wx.stopPullDownRefresh();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const { genealogyId, memberId, member } = this.data;
    
    if (member) {
      return {
        title: `${member.name}的家族信息`,
        path: `/pages/share/share?genealogyId=${genealogyId}&memberId=${memberId}`,
        imageUrl: member.avatar || '/images/share_member.png'
      };
    }
    
    return {
      title: '云族谱-云端数字族谱',
      path: '/pages/index/index',
      imageUrl: '/images/share_app.png'
    };
  }
});