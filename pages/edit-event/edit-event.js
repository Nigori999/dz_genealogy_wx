/**
 * 编辑事件页面
 * 用于编辑族谱大事记
 */

const app = getApp();
const api = require('../../services/api');
const dateUtil = require('../../utils/date-util');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: false,
    genealogyId: '',
    eventId: '',
    allMembers: [],
    
    // 表单数据
    formData: {
      title: '',
      description: '',
      date: '',
      type: 'other',
      location: '',
      relatedMembers: []
    },
    
    // 校验错误信息
    errors: {
      title: '',
      date: ''
    },
    
    // 日期显示
    dateText: '请选择',
    showDatePicker: false,
    
    // 媒体文件
    mediaFiles: [],
    originalMedia: [], // 原始媒体文件URL列表
    deletedMedia: [], // 被删除的媒体文件URL列表
    newMedia: [], // 新增的媒体文件路径列表
    
    // 事件类型选项
    typeOptions: [
      { name: '出生', value: 'birth' },
      { name: '去世', value: 'death' },
      { name: '婚礼', value: 'wedding' },
      { name: '职业', value: 'career' },
      { name: '教育', value: 'education' },
      { name: '成就', value: 'achievement' },
      { name: '其他', value: 'other' }
    ],
    
    // 选择关联成员
    relatedMembersList: [],
    
    // 组件显示控制
    showPickMembersDialog: false
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
      eventId,
      isLoading: true
    });
    
    // 加载事件信息
    this._loadEventData(genealogyId, eventId);
    
    // 加载所有成员（用于选择关联成员）
    this._loadAllMembers(genealogyId);
  },

  /**
   * 加载事件数据
   */
  _loadEventData: function (genealogyId, eventId) {
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
        
        // 设置表单数据
        this.setData({
          formData: {
            title: event.title || '',
            description: event.description || '',
            date: event.date || '',
            type: event.type || 'other',
            location: event.location || '',
            relatedMembers: event.relatedMembers || []
          },
          mediaFiles: event.media || [],
          originalMedia: [...(event.media || [])],
          isLoading: false
        });
        
        // 格式化日期显示
        if (event.date) {
          this.setData({
            dateText: dateUtil.formatDate(event.date, 'YYYY年MM月DD日')
          });
        }
      })
      .catch(error => {
        console.error('Load event data failed:', error);
        
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
        if (!members || members.length === 0) {
          this.setData({
            allMembers: [],
            isLoading: false
          });
          return;
        }
        
        this.setData({
          allMembers: members
        });
        
        // 更新关联成员信息
        this._updateRelatedMembers();
      })
      .catch(error => {
        console.error('Load members failed:', error);
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 更新关联成员信息
   */
  _updateRelatedMembers: function () {
    const { formData, allMembers } = this.data;
    
    // 查找关联成员信息
    let relatedMembersList = [];
    if (formData.relatedMembers && formData.relatedMembers.length > 0) {
      relatedMembersList = formData.relatedMembers
        .map(id => allMembers.find(m => m.id === id))
        .filter(Boolean);
    }
    
    this.setData({
      relatedMembersList
    });
  },

  /**
   * 处理表单输入
   */
  onInput: function (e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value
    });
    
    // 清除对应的错误信息
    if (this.data.errors[field]) {
      this.setData({
        [`errors.${field}`]: ''
      });
    }
  },

  /**
   * 处理事件类型变更
   */
  onTypeChange: function (e) {
    this.setData({
      'formData.type': e.detail.value
    });
  },

  /**
   * 显示日期选择器
   */
  showDatePicker: function () {
    this.setData({
      showDatePicker: true
    });
  },

  /**
   * 处理日期选择确认
   */
  onDatePickerConfirm: function (e) {
    const date = dateUtil.formatDate(e.detail.value);
    const formattedDate = dateUtil.formatDate(e.detail.value, 'YYYY年MM月DD日');
    
    this.setData({
      'formData.date': date,
      dateText: formattedDate,
      showDatePicker: false
    });
    
    // 清除日期错误信息
    if (this.data.errors.date) {
      this.setData({
        'errors.date': ''
      });
    }
  },

  /**
   * 处理日期选择取消
   */
  onDatePickerCancel: function () {
    this.setData({
      showDatePicker: false
    });
  },

  /**
   * 上传媒体文件
   */
  uploadMedia: function () {
    wx.chooseImage({
      count: 9 - this.data.mediaFiles.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        
        // 添加到媒体文件列表
        this.setData({
          mediaFiles: [...this.data.mediaFiles, ...tempFilePaths],
          newMedia: [...this.data.newMedia, ...tempFilePaths]
        });
      }
    });
  },

  /**
   * 预览媒体文件
   */
  previewMedia: function (e) {
    const { index } = e.currentTarget.dataset;
    
    wx.previewImage({
      current: this.data.mediaFiles[index],
      urls: this.data.mediaFiles
    });
  },

  /**
   * 移除媒体文件
   */
  removeMedia: function (e) {
    const { index } = e.currentTarget.dataset;
    const mediaFiles = [...this.data.mediaFiles];
    const fileUrl = mediaFiles[index];
    
    // 移除文件
    mediaFiles.splice(index, 1);
    
    // 更新状态
    this.setData({
      mediaFiles
    });
    
    // 判断是否是原始媒体文件
    if (this.data.originalMedia.includes(fileUrl)) {
      // 添加到已删除列表
      this.setData({
        deletedMedia: [...this.data.deletedMedia, fileUrl]
      });
    } else {
      // 从新增列表中移除
      const newMediaIndex = this.data.newMedia.indexOf(fileUrl);
      if (newMediaIndex !== -1) {
        const newMedia = [...this.data.newMedia];
        newMedia.splice(newMediaIndex, 1);
        this.setData({
          newMedia
        });
      }
    }
  },

  /**
   * 显示成员选择对话框
   */
  showPickMembersDialog: function () {
    this.setData({
      showPickMembersDialog: true
    });
  },

  /**
   * 处理成员复选框变更
   */
  onMemberCheckboxChange: function (e) {
    const selectedIds = e.detail.value;
    
    // 更新表单数据
    this.setData({
      'formData.relatedMembers': selectedIds
    });
  },

  /**
   * 选择成员确认
   */
  onPickMembersConfirm: function (e) {
    const { members, ids } = e.detail;
    
    if (members && members.length > 0) {
      this.setData({
        relatedMembersList: members,
        'formData.relatedMembers': ids,
        showPickMembersDialog: false
      });
    } else {
      this.setData({
        relatedMembersList: [],
        'formData.relatedMembers': [],
        showPickMembersDialog: false
      });
    }
  },

  /**
   * 选择成员取消
   */
  onPickMembersCancel: function () {
    this.setData({
      showPickMembersDialog: false
    });
  },

  /**
   * 移除关联成员
   */
  removeMember: function (e) {
    const { index } = e.currentTarget.dataset;
    const { relatedMembersList, formData } = this.data;
    
    // 移除成员
    const memberId = relatedMembersList[index].id;
    const newMembersList = relatedMembersList.filter((_, i) => i !== index);
    const newRelatedMembers = formData.relatedMembers.filter(id => id !== memberId);
    
    this.setData({
      relatedMembersList: newMembersList,
      'formData.relatedMembers': newRelatedMembers
    });
  },

  /**
   * 验证表单
   */
  validateForm: function () {
    const { formData } = this.data;
    let isValid = true;
    const errors = {};
    
    // 验证标题
    if (!formData.title || formData.title.trim() === '') {
      errors.title = '请输入事件标题';
      isValid = false;
    }
    
    // 验证日期
    if (!formData.date) {
      errors.date = '请选择事件日期';
      isValid = false;
    }
    
    // 设置错误信息
    this.setData({ errors });
    
    return isValid;
  },

  /**
   * 提交表单
   */
  submitForm: function () {
    if (!this.validateForm()) {
      wx.showToast({
        title: '请完善表单信息',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isLoading: true });
    
    // 准备提交数据
    const submitData = { ...this.data.formData };
    
    // 更新事件基本信息
    api.eventsAPI.updateEvent(this.data.genealogyId, this.data.eventId, submitData)
      .then(result => {
        if (result) {
          // 处理媒体文件变更
          const uploadPromises = [];
          
          // 上传新媒体文件
          if (this.data.newMedia.length > 0) {
            this.data.newMedia.forEach(filePath => {
              uploadPromises.push(
                api.eventsAPI.uploadEventMedia(this.data.genealogyId, this.data.eventId, filePath)
              );
            });
          }
          
          // 删除已移除的媒体文件
          if (this.data.deletedMedia.length > 0) {
            // 这里假设 API 提供了删除媒体文件的功能
            // 如果 API 没有提供该功能，可能需要其他处理方式
            this.data.deletedMedia.forEach(fileUrl => {
              uploadPromises.push(
                api.eventsAPI.deleteEventMedia(this.data.genealogyId, this.data.eventId, fileUrl)
              );
            });
          }
          
          // 等待所有媒体文件操作完成
          if (uploadPromises.length > 0) {
            Promise.all(uploadPromises)
              .then(() => {
                this.setData({ isLoading: false });
                this._onUpdateSuccess();
              })
              .catch(error => {
                console.error('Media operations failed:', error);
                this.setData({ isLoading: false });
                
                // 即使媒体操作失败，仍然认为更新成功
                this._onUpdateSuccess();
              });
          } else {
            // 没有媒体文件操作
            this.setData({ isLoading: false });
            this._onUpdateSuccess();
          }
        } else {
          this.setData({ isLoading: false });
          
          wx.showToast({
            title: '更新失败，请重试',
            icon: 'none'
          });
        }
      })
      .catch(error => {
        console.error('Update event failed:', error);
        
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '更新失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 更新成功处理
   */
  _onUpdateSuccess: function () {
    wx.showToast({
      title: '更新成功',
      icon: 'success'
    });
    
    // 延迟返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  /**
   * 取消编辑
   */
  cancelEdit: function () {
    wx.navigateBack();
  }
});