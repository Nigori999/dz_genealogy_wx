// 创建族谱页面
const app = getApp();
const api = require('../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: false,
    formData: {
      name: '',
      description: ''
    },
    errors: {
      name: ''
    },
    coverImage: '/assets/images/genealogy_default_cover.jpg', // 默认封面
    hasChangedCover: false,
    subscription: null,
    hasReachedLimit: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 检查登录状态
    if (!app.globalData.isLogin) {
      wx.navigateTo({
        url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/create-genealogy/create-genealogy')
      });
      return;
    }
    
    // 加载订阅信息和族谱数量
    this._loadSubscriptionInfo();
  },

  /**
   * 加载订阅信息和检查族谱数量限制
   */
  _loadSubscriptionInfo: function () {
    this.setData({ isLoading: true });
    
    // 获取订阅信息
    api.paymentAPI.getCurrentSubscription()
      .then(subscription => {
        if (!subscription) {
          this.setData({ isLoading: false });
          return;
        }
        
        this.setData({ subscription });
        
        // 获取族谱列表并检查数量
        return api.genealogyAPI.getMyGenealogies();
      })
      .then(genealogies => {
        if (!genealogies) {
          this.setData({ isLoading: false });
          return;
        }
        
        // 确保genealogies是数组
        if (!Array.isArray(genealogies)) {
          console.error('Expected genealogies to be an array but got:', typeof genealogies);
          // 尝试获取genealogies属性（如果response是一个对象）
          if (genealogies && typeof genealogies === 'object' && Array.isArray(genealogies.genealogies)) {
            genealogies = genealogies.genealogies;
          } else {
            this.setData({ isLoading: false });
            return;
          }
        }
        
        // 检查自己创建的族谱数量是否达到上限
        const ownGenealogies = genealogies.filter(g => g.isOwner);
        const subscription = this.data.subscription;
        
        if (subscription && ownGenealogies.length >= subscription.genealogyLimit) {
          this.setData({
            hasReachedLimit: true
          });
        }
        
        this.setData({ isLoading: false });
      })
      .catch(error => {
        console.error('Load subscription info failed:', error);
        this.setData({ isLoading: false });
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
   * 上传封面图片
   */
  uploadCoverImage: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        this.setData({
          coverImage: tempFilePath,
          hasChangedCover: true
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
    
    // 验证族谱名称
    if (!formData.name || formData.name.trim() === '') {
      errors.name = '请输入族谱名称';
      isValid = false;
    }
    
    // 设置错误信息
    this.setData({ errors });
    
    return isValid;
  },

  /**
   * 创建族谱
   */
  createGenealogy: function () {
    if (this.data.hasReachedLimit) {
      wx.navigateTo({
        url: '/pages/subscription/subscription'
      });
      return;
    }
    
    if (!this.validateForm()) {
      wx.showToast({
        title: '请完善表单信息',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isLoading: true });
    
    // 准备创建数据
    const genData = {
      name: this.data.formData.name,
      description: this.data.formData.description
    };
    
    // 创建族谱
    api.genealogyAPI.createGenealogy(genData)
      .then(genealogy => {
        if (!genealogy) {
          throw new Error('创建族谱失败');
        }
        
        // 如果有自定义封面，上传封面
        if (this.data.hasChangedCover) {
          return this._uploadCoverImage(genealogy.id)
            .then(() => genealogy);
        }
        
        return genealogy;
      })
      .then(genealogy => {
        // 设置为当前族谱
        app.setCurrentGenealogy(genealogy);
        
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });
        
        // 延迟跳转到添加族谱成员页面
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/add-member/add-member?genealogyId=${genealogy.id}&isRoot=true`
          });
        }, 1500);
      })
      .catch(error => {
        console.error('Create genealogy failed:', error);
        
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: error.message || '创建失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 上传族谱封面
   */
  _uploadCoverImage: function (genealogyId) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: api.getUploadUrl('/genealogy/cover'),
        filePath: this.data.coverImage,
        name: 'cover',
        formData: {
          genealogyId
        },
        success: (res) => {
          // 解析响应
          try {
            const data = JSON.parse(res.data);
            if (data.code === 0) {
              resolve(data.data);
            } else {
              reject(new Error(data.message || '上传封面失败'));
            }
          } catch (e) {
            reject(new Error('解析响应失败'));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  },

  /**
   * 取消创建
   */
  cancelCreate: function () {
    wx.navigateBack();
  },

  /**
   * 导航到订阅页面
   */
  navigateToSubscription: function () {
    wx.navigateTo({
      url: '/pages/subscription/subscription'
    });
  }
});