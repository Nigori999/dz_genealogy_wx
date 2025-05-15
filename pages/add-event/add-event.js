/**
 * 添加事件页面
 * 用于向族谱中添加新事件
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
    memberId: '', // 如果有指定关联成员ID
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
    
    // 当前选中的类型索引
    typeIndex: 6, // 默认为"其他"选项的索引
    
    // 选择关联成员
    relatedMembersList: [],
    
    // 组件显示控制
    showPickMembersDialog: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { genealogyId, memberId } = options;
    
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
    
    // 如果有指定关联成员ID，添加到关联成员列表
    if (memberId) {
      this.setData({
        memberId,
        'formData.relatedMembers': [memberId]
      });
    }
    
    // 初始化类型索引
    this._updateTypeIndex('other');
    
    // 加载所有成员（用于选择关联成员）
    this._loadAllMembers(genealogyId);
  },

  /**
   * 更新类型索引
   */
  _updateTypeIndex: function(typeValue) {
    const index = this.data.typeOptions.findIndex(item => item.value === typeValue);
    if (index !== -1) {
      this.setData({
        typeIndex: index
      });
    }
  },

  /**
   * 加载所有成员
   */
  _loadAllMembers: function (genealogyId) {
    api.memberAPI.getMembers(genealogyId)
      .then(members => {
        this.setData({
          allMembers: members || [],
          isLoading: false
        });
        
        // 如果有指定关联成员ID，更新关联成员列表
        if (this.data.memberId && members.length > 0) {
          const relatedMember = members.find(m => m.id === this.data.memberId);
          if (relatedMember) {
            this.setData({
              relatedMembersList: [relatedMember]
            });
          }
        }
      })
      .catch(error => {
        console.error('Load members failed:', error);
        
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
    const index = e.detail.value;
    const typeValue = this.data.typeOptions[index].value;
    
    this.setData({
      'formData.type': typeValue,
      typeIndex: index
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
          mediaFiles: [...this.data.mediaFiles, ...tempFilePaths]
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
    
    mediaFiles.splice(index, 1);
    
    this.setData({
      mediaFiles
    });
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
  onPickMembersConfirm: function () {
    const { allMembers, formData } = this.data;
    
    // 找出选中的成员
    const relatedMembersList = allMembers.filter(member => 
      formData.relatedMembers.includes(member.id)
    );
    
    this.setData({
      relatedMembersList,
      showPickMembersDialog: false
    });
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
    
    // 添加事件
    api.eventsAPI.addEvent(this.data.genealogyId, submitData)
      .then(result => {
        if (result) {
          // 如果有媒体文件，上传媒体文件
          if (this.data.mediaFiles.length > 0) {
            this._uploadEventMedia(result.id);
          } else {
            this.setData({ isLoading: false });
            this._onAddSuccess();
          }
        } else {
          this.setData({ isLoading: false });
          
          wx.showToast({
            title: '添加失败，请重试',
            icon: 'none'
          });
        }
      })
      .catch(error => {
        console.error('Add event failed:', error);
        
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '添加失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 上传事件媒体文件
   */
  _uploadEventMedia: function (eventId) {
    const { genealogyId, mediaFiles } = this.data;
    
    // 显示上传进度
    wx.showLoading({
      title: `上传媒体文件 (0/${mediaFiles.length})`,
      mask: true
    });
    
    // 逐个上传媒体文件
    const uploadFile = (index) => {
      if (index >= mediaFiles.length) {
        // 所有文件上传完成
        wx.hideLoading();
        this.setData({ isLoading: false });
        this._onAddSuccess();
        return;
      }
      
      const filePath = mediaFiles[index];
      
      // 更新上传进度
      wx.showLoading({
        title: `上传媒体文件 (${index + 1}/${mediaFiles.length})`,
        mask: true
      });
      
      // 上传文件
      api.eventsAPI.uploadEventMedia(genealogyId, eventId, filePath)
        .then(() => {
          // 上传下一个文件
          uploadFile(index + 1);
        })
        .catch(error => {
          console.error('Upload media failed:', error);
          
          // 继续上传下一个文件
          uploadFile(index + 1);
        });
    };
    
    // 开始上传
    uploadFile(0);
  },

  /**
   * 添加成功处理
   */
  _onAddSuccess: function () {
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
    
    // 延迟返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  /**
   * 取消添加
   */
  cancelAdd: function () {
    wx.navigateBack();
  }
});