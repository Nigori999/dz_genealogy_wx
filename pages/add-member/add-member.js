/**
 * 添加成员页面
 * 用于向族谱中添加新成员
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
    parentId: '', // 如果有指定父母ID
    allMembers: [],
    
    // 表单数据
    formData: {
      name: '',
      gender: 'male',
      birthDate: '',
      deathDate: '',
      birthPlace: '',
      rank: '',
      generation: 1,
      occupation: '',
      education: '',
      biography: '',
      parentId: '',
      spouseIds: []
    },
    
    // 校验错误信息
    errors: {
      name: ''
    },
    
    // 性别选项
    genderOptions: [
      { name: '男', value: 'male' },
      { name: '女', value: 'female' }
    ],
    
    // 日期选择
    birthDateText: '请选择',
    deathDateText: '请选择',
    showDatePicker: false,
    currentDateField: '', // birthDate 或 deathDate
    
    // 选择父母和配偶
    parentMember: null,
    spouseMembers: [],
    
    // 组件显示控制
    showPickParentDialog: false,
    showPickSpouseDialog: false,
    
    // 最大世代（用于确定可选世代范围）
    maxGeneration: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { genealogyId, parentId } = options;
    
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
      'formData.parentId': parentId || '',
      isLoading: true
    });
    
    // 加载所有成员（用于选择父母和配偶）
    this._loadAllMembers(genealogyId);
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
        
        // 计算最大世代
        const maxGeneration = Math.max(...members.map(m => m.generation || 1));
        
        this.setData({
          allMembers: members,
          maxGeneration,
          isLoading: false
        });
        
        // 如果指定了父母ID，设置父母信息
        if (this.data.formData.parentId) {
          const parent = members.find(m => m.id === this.data.formData.parentId);
          if (parent) {
            this.setData({
              parentMember: parent,
              'formData.generation': (parent.generation || 1) + 1
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
   * 处理性别变更
   */
  onGenderChange: function (e) {
    this.setData({
      'formData.gender': e.detail.value
    });
  },

  /**
   * 生成选择
   */
  onGenerationChange: function (e) {
    this.setData({
      'formData.generation': parseInt(e.detail.value) + 1
    });
  },

  /**
   * 处理日期选择器显示
   */
  showDatePicker: function (e) {
    const field = e.currentTarget.dataset.field;
    
    this.setData({
      showDatePicker: true,
      currentDateField: field
    });
  },

  /**
   * 处理日期选择确认
   */
  onDatePickerConfirm: function (e) {
    const date = dateUtil.formatDate(e.detail.value);
    const formattedDate = dateUtil.formatDate(e.detail.value, 'YYYY年MM月DD日');
    const field = this.data.currentDateField;
    
    if (field === 'birthDate') {
      this.setData({
        'formData.birthDate': date,
        birthDateText: formattedDate,
        showDatePicker: false
      });
    } else if (field === 'deathDate') {
      this.setData({
        'formData.deathDate': date,
        deathDateText: formattedDate,
        showDatePicker: false
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
   * 显示选择父母对话框
   */
  showPickParentDialog: function () {
    this.setData({
      showPickParentDialog: true
    });
  },

  /**
   * 选择父母确认
   */
  onPickParentConfirm: function (e) {
    const { member } = e.detail;
    
    if (member) {
      this.setData({
        parentMember: member,
        'formData.parentId': member.id,
        'formData.generation': (member.generation || 1) + 1,
        showPickParentDialog: false
      });
    } else {
      this.setData({
        parentMember: null,
        'formData.parentId': '',
        showPickParentDialog: false
      });
    }
  },

  /**
   * 选择父母取消
   */
  onPickParentCancel: function () {
    this.setData({
      showPickParentDialog: false
    });
  },

  /**
   * 移除父母
   */
  removeParent: function () {
    this.setData({
      parentMember: null,
      'formData.parentId': ''
    });
  },

  /**
   * 显示选择配偶对话框
   */
  showPickSpouseDialog: function () {
    this.setData({
      showPickSpouseDialog: true
    });
  },

  /**
   * 选择配偶确认
   */
  onPickSpouseConfirm: function (e) {
    const { members } = e.detail;
    
    if (members && members.length > 0) {
      this.setData({
        spouseMembers: members,
        'formData.spouseIds': members.map(m => m.id),
        showPickSpouseDialog: false
      });
    } else {
      this.setData({
        spouseMembers: [],
        'formData.spouseIds': [],
        showPickSpouseDialog: false
      });
    }
  },

  /**
   * 选择配偶取消
   */
  onPickSpouseCancel: function () {
    this.setData({
      showPickSpouseDialog: false
    });
  },

  /**
   * 移除配偶
   */
  removeSpouse: function (e) {
    const { index } = e.currentTarget.dataset;
    const spouseMembers = [...this.data.spouseMembers];
    const spouseIds = [...this.data.formData.spouseIds];
    
    spouseMembers.splice(index, 1);
    spouseIds.splice(index, 1);
    
    this.setData({
      spouseMembers,
      'formData.spouseIds': spouseIds
    });
  },

  /**
   * 上传头像
   */
  uploadAvatar: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        this.setData({
          avatarUrl: tempFilePath
        });
      }
    });
  },

  /**
   * 验证表单
   */
  validateForm: function () {
    const { formData } = this.data;
    let isValid = true;
    const errors = {};
    
    // 验证姓名
    if (!formData.name || formData.name.trim() === '') {
      errors.name = '请输入姓名';
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
    
    // 添加成员
    api.memberAPI.addMember(this.data.genealogyId, submitData)
      .then(result => {
        this.setData({ isLoading: false });
        
        if (result) {
          // 如果有头像，上传头像
          if (this.data.avatarUrl) {
            this._uploadMemberAvatar(result.id);
          } else {
            this._onAddSuccess();
          }
        } else {
          wx.showToast({
            title: '添加失败，请重试',
            icon: 'none'
          });
        }
      })
      .catch(error => {
        console.error('Add member failed:', error);
        
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '添加失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 上传成员头像
   */
  _uploadMemberAvatar: function (memberId) {
    const { genealogyId, avatarUrl } = this.data;
    
    wx.showLoading({
      title: '上传头像中...',
      mask: true
    });
    
    api.memberAPI.uploadMemberPhoto(genealogyId, memberId, avatarUrl)
      .then(() => {
        wx.hideLoading();
        this._onAddSuccess();
      })
      .catch(error => {
        console.error('Upload avatar failed:', error);
        wx.hideLoading();
        
        // 即使头像上传失败，也认为添加成功
        this._onAddSuccess();
      });
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