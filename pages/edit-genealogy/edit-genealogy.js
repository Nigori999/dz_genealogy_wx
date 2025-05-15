// 编辑族谱页面
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    isSubmitting: false,
    genealogyId: '',
    formData: {
      name: '',
      surname: '',
      description: '',
      isPublic: true,
      joinMethod: 'approval',
      inviteCode: '',
      coverImage: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const genealogyId = options.id;
    if (genealogyId) {
      this.setData({ genealogyId });
      this.loadGenealogyData(genealogyId);
    } else {
      wx.showToast({
        title: '缺少族谱ID参数',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 加载族谱数据
   */
  loadGenealogyData: function (genealogyId) {
    const that = this;
    
    // 模拟API调用
    setTimeout(() => {
      // 实际项目中应该调用API获取族谱详情
      const genealogies = app.globalData.genealogies || [];
      const genealogy = genealogies.find(item => item.id === genealogyId);
      
      if (genealogy) {
        that.setData({
          isLoading: false,
          formData: {
            name: genealogy.name || '',
            surname: genealogy.surname || '',
            description: genealogy.description || '',
            isPublic: genealogy.isPublic !== undefined ? genealogy.isPublic : true,
            joinMethod: genealogy.joinMethod || 'approval',
            inviteCode: genealogy.inviteCode || this.generateRandomCode(),
            coverImage: genealogy.coverImage || ''
          }
        });
      } else {
        wx.showToast({
          title: '未找到族谱信息',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }, 1000);
  },

  /**
   * 生成随机邀请码
   */
  generateRandomCode: function () {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * 重新生成邀请码
   */
  generateInviteCode: function () {
    const newCode = this.generateRandomCode();
    this.setData({
      'formData.inviteCode': newCode
    });
    
    wx.showToast({
      title: '邀请码已更新',
      icon: 'success'
    });
  },

  /**
   * 上传封面
   */
  uploadCover: function () {
    const that = this;
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        const tempFilePath = res.tempFilePaths[0];
        
        // 实际项目中，这里应该调用上传API
        // 这里只是简单的设置本地路径
        that.setData({
          'formData.coverImage': tempFilePath
        });
      }
    });
  },

  /**
   * 预览封面
   */
  previewCover: function () {
    const coverImage = this.data.formData.coverImage;
    if (coverImage) {
      wx.previewImage({
        urls: [coverImage],
        current: coverImage
      });
    }
  },

  /**
   * 表单提交
   */
  submitForm: function (e) {
    const formValues = e.detail.value;
    const { name, surname, description, isPublic, joinMethod } = formValues;
    
    // 表单验证
    if (!name.trim()) {
      wx.showToast({
        title: '请输入族谱名称',
        icon: 'none'
      });
      return;
    }
    
    if (!surname.trim()) {
      wx.showToast({
        title: '请输入姓氏',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isSubmitting: true });
    
    // 构建提交数据
    const submitData = {
      id: this.data.genealogyId,
      name: name.trim(),
      surname: surname.trim(),
      description: description.trim(),
      isPublic: isPublic,
      joinMethod: joinMethod,
      inviteCode: this.data.formData.inviteCode,
      coverImage: this.data.formData.coverImage
    };
    
    // 模拟API调用
    setTimeout(() => {
      // 实际项目中应该调用API更新族谱信息
      const genealogies = app.globalData.genealogies || [];
      const index = genealogies.findIndex(item => item.id === this.data.genealogyId);
      
      if (index !== -1) {
        // 更新族谱信息
        genealogies[index] = {
          ...genealogies[index],
          ...submitData
        };
        
        app.globalData.genealogies = genealogies;
        
        // 如果更新的是当前选中的族谱，也更新当前族谱信息
        if (app.globalData.currentGenealogy && app.globalData.currentGenealogy.id === this.data.genealogyId) {
          app.globalData.currentGenealogy = genealogies[index];
        }
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: '族谱不存在',
          icon: 'none'
        });
      }
      
      this.setData({ isSubmitting: false });
    }, 1500);
  },

  /**
   * 返回上一页
   */
  navigateBack: function () {
    wx.navigateBack();
  }
}) 