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
      residenceRegion: ['', '', ''], // 省、市、区/县
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
    
    // 教育程度选项
    educationOptions: [
      '小学',
      '初中',
      '高中/中专',
      '大专',
      '本科',
      '硕士',
      '博士',
      '其他'
    ],
    educationIndex: -1,
    
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
    // 移除此方法或保留空方法
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
        this._setFormData(member);
        
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
        
        this.setData({
          allMembers: filteredMembers,
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
   * 处理居住地选择变更
   */
  onResidenceRegionChange: function (e) {
    this.setData({
      'formData.residenceRegion': e.detail.value
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
    const member = e.currentTarget.dataset.member;
    
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
    
    // 转换居住地为字符串
    if (submitData.residenceRegion && submitData.residenceRegion.filter(Boolean).length > 0) {
      submitData.residence = submitData.residenceRegion.filter(Boolean).join(' ');
    }
    
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
  },

  /**
   * 设置表单初始值
   */
  _setFormData: function (member) {
    // 转换日期显示格式
    const birthDateText = member.birthDate ? dateUtil.formatDate(member.birthDate, 'YYYY年MM月DD日') : '请选择';
    const deathDateText = member.deathDate ? dateUtil.formatDate(member.deathDate, 'YYYY年MM月DD日') : '请选择';
    
    // 确保居住地区域有值
    if (!member.residenceRegion || !Array.isArray(member.residenceRegion) || member.residenceRegion.length !== 3) {
      member.residenceRegion = ['', '', ''];
    }
    
    // 查找教育选项索引
    let educationIndex = -1;
    if (member.education) {
      educationIndex = this.data.educationOptions.findIndex(option => option === member.education);
    }
    
    this.setData({
      formData: { ...member },
      birthDateText,
      deathDateText,
      educationIndex,
      avatarUrl: member.avatar || ''
    });
  },

  /**
   * 处理出生日期选择确认
   */
  onBirthDateChange: function (e) {
    const date = e.detail.value;
    const formattedDate = dateUtil.formatDate(date, 'YYYY年MM月DD日');
    
    this.setData({
      'formData.birthDate': date,
      birthDateText: formattedDate
    });
  },

  /**
   * 处理去世日期选择确认
   */
  onDeathDateChange: function (e) {
    const date = e.detail.value;
    const formattedDate = dateUtil.formatDate(date, 'YYYY年MM月DD日');
    
    this.setData({
      'formData.deathDate': date,
      deathDateText: formattedDate
    });
  },

  /**
   * 处理教育选项变更
   */
  onEducationChange: function (e) {
    const index = parseInt(e.detail.value);
    const education = this.data.educationOptions[index];
    
    this.setData({
      'formData.education': education,
      educationIndex: index
    });
  }
});