/**
 * 编辑成员页面
 * 用于编辑族谱中的成员信息
 */

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
    maxGeneration: 1,
    
    // 世代选项数组
    generationOptions: ['第1代'],
    
    // 配偶选择过滤数组
    filteredSpouseMembers: [],
    
    // 头像相关
    avatarUrl: '',
    hasChangedAvatar: false
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
      memberId,
      isLoading: true
    });
    
    // 加载成员信息
    this._loadMemberData(genealogyId, memberId);
    
    // 加载所有成员（用于选择父母和配偶）
    this._loadAllMembers(genealogyId);
  },

  /**
   * 更新世代选项数组
   */
  _updateGenerationOptions: function(maxGeneration) {
    const options = [];
    for (let i = 0; i < maxGeneration; i++) {
      options.push(`第${i + 1}代`);
    }
    this.setData({
      generationOptions: options
    });
  },

  /**
   * 更新配偶选择列表
   */
  _updateFilteredSpouseMembers: function() {
    const filteredMembers = this.data.allMembers.filter(m => 
      !this.data.formData.spouseIds.includes(m.id)
    );
    this.setData({
      filteredSpouseMembers: filteredMembers
    });
  },

  /**
   * 加载成员数据
   */
  _loadMemberData: function (genealogyId, memberId) {
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
        
        // 设置表单数据
        this.setData({
          formData: {
            name: member.name || '',
            gender: member.gender || 'male',
            birthDate: member.birthDate || '',
            deathDate: member.deathDate || '',
            birthPlace: member.birthPlace || '',
            rank: member.rank || '',
            generation: member.generation || 1,
            occupation: member.occupation || '',
            education: member.education || '',
            biography: member.biography || '',
            parentId: member.parentId || '',
            spouseIds: member.spouseIds || []
          },
          avatarUrl: member.avatar || '',
          isLoading: false
        });
        
        // 格式化日期显示
        this._formatDates();
      })
      .catch(error => {
        console.error('Load member data failed:', error);
        
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
        
        // 过滤掉自己
        const filteredMembers = members.filter(m => m.id !== this.data.memberId);
        
        // 计算最大世代
        const maxGeneration = Math.max(...filteredMembers.map(m => m.generation || 1));
        
        // 更新世代选项
        this._updateGenerationOptions(maxGeneration);
        
        this.setData({
          allMembers: filteredMembers,
          maxGeneration,
          isLoading: false
        });
        
        // 更新父母和配偶信息
        this._updateRelationships();
        
        // 更新配偶选择列表
        this._updateFilteredSpouseMembers();
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
   * 更新关系信息
   */
  _updateRelationships: function () {
    const { formData, allMembers } = this.data;
    
    // 查找父母信息
    let parentMember = null;
    if (formData.parentId) {
      parentMember = allMembers.find(m => m.id === formData.parentId);
    }
    
    // 查找配偶信息
    let spouseMembers = [];
    if (formData.spouseIds && formData.spouseIds.length > 0) {
      spouseMembers = formData.spouseIds
        .map(id => allMembers.find(m => m.id === id))
        .filter(Boolean);
    }
    
    this.setData({
      parentMember,
      spouseMembers
    });
  },

  /**
   * 格式化日期显示
   */
  _formatDates: function () {
    const { formData } = this.data;
    
    if (formData.birthDate) {
      this.setData({
        birthDateText: dateUtil.formatDate(formData.birthDate, 'YYYY年MM月DD日')
      });
    }
    
    if (formData.deathDate) {
      this.setData({
        deathDateText: dateUtil.formatDate(formData.deathDate, 'YYYY年MM月DD日')
      });
    }
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
          avatarUrl: tempFilePath,
          hasChangedAvatar: true
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
    
    // 更新成员信息
    api.memberAPI.updateMember(this.data.genealogyId, this.data.memberId, submitData)
      .then(result => {
        if (result) {
          // 如果有更新头像，上传头像
          if (this.data.hasChangedAvatar) {
            this._uploadMemberAvatar();
          } else {
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
        console.error('Update member failed:', error);
        
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '更新失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 上传成员头像
   */
  _uploadMemberAvatar: function () {
    const { genealogyId, memberId, avatarUrl } = this.data;
    
    wx.showLoading({
      title: '上传头像中...',
      mask: true
    });
    
    api.memberAPI.uploadMemberPhoto(genealogyId, memberId, avatarUrl)
      .then(() => {
        wx.hideLoading();
        this._onUpdateSuccess();
      })
      .catch(error => {
        console.error('Upload avatar failed:', error);
        wx.hideLoading();
        
        // 即使头像上传失败，也认为更新成功
        this._onUpdateSuccess();
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
  },

  /**
   * 处理配偶复选框变更
   */
  onPickSpouseChange: function (e) {
    const selectedId = e.detail.value[0];
    let spouseIds = [...this.data.formData.spouseIds];
    
    // 切换选中状态
    if (selectedId) {
      if (!spouseIds.includes(selectedId)) {
        spouseIds.push(selectedId);
      } else {
        spouseIds = spouseIds.filter(id => id !== selectedId);
      }
      
      // 更新表单数据
      this.setData({
        'formData.spouseIds': spouseIds
      });
    }
  }
});