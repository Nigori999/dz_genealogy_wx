// 绑定手机号页面
const app = getApp();
const api = require('../../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    phoneNumber: '',
    verifyCode: '',
    codeSending: false,
    countdown: 60,
    buttonDisabled: true,
    errorMsg: '',
    isSubmitting: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 获取已有手机号
    if (app.globalData.userInfo && app.globalData.userInfo.phoneNumber) {
      this.setData({
        phoneNumber: app.globalData.userInfo.phoneNumber
      });
    }
  },

  /**
   * 输入手机号
   */
  inputPhoneNumber: function (e) {
    this.setData({
      phoneNumber: e.detail.value
    });
    this.checkFormValid();
  },

  /**
   * 输入验证码
   */
  inputVerifyCode: function (e) {
    this.setData({
      verifyCode: e.detail.value
    });
    this.checkFormValid();
  },

  /**
   * 检查表单是否有效
   */
  checkFormValid: function () {
    const { phoneNumber, verifyCode } = this.data;
    
    // 检查手机号和验证码是否填写
    if (!phoneNumber || !verifyCode) {
      this.setData({
        buttonDisabled: true,
        errorMsg: ''
      });
      return;
    }
    
    // 检查手机号格式
    if (!/^1\d{10}$/.test(phoneNumber)) {
      this.setData({
        buttonDisabled: true,
        errorMsg: '请输入正确的手机号'
      });
      return;
    }
    
    // 检查验证码长度
    if (verifyCode.length !== 6) {
      this.setData({
        buttonDisabled: true,
        errorMsg: '请输入6位验证码'
      });
      return;
    }
    
    // 表单有效
    this.setData({
      buttonDisabled: false,
      errorMsg: ''
    });
  },

  /**
   * 发送验证码
   */
  sendVerifyCode: function () {
    const { phoneNumber, codeSending } = this.data;
    
    if (codeSending) {
      return;
    }
    
    // 检查手机号格式
    if (!/^1\d{10}$/.test(phoneNumber)) {
      this.setData({
        errorMsg: '请输入正确的手机号'
      });
      return;
    }
    
    this.setData({
      codeSending: true,
      errorMsg: ''
    });
    
    wx.showLoading({
      title: '发送中...',
      mask: true
    });
    
    // 模拟API调用
    setTimeout(() => {
      wx.hideLoading();
      
      // 开始倒计时
      this.startCountdown();
      
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      });
    }, 1000);
  },

  /**
   * 开始倒计时
   */
  startCountdown: function () {
    this.setData({
      countdown: 60
    });
    
    const timer = setInterval(() => {
      let count = this.data.countdown;
      count--;
      
      if (count <= 0) {
        clearInterval(timer);
        this.setData({
          codeSending: false,
          countdown: 60
        });
      } else {
        this.setData({
          countdown: count
        });
      }
    }, 1000);
  },

  /**
   * 提交绑定
   */
  submitForm: function () {
    const { phoneNumber, verifyCode } = this.data;
    
    if (this.data.isSubmitting) {
      return;
    }
    
    this.setData({
      isSubmitting: true
    });
    
    wx.showLoading({
      title: '提交中...',
      mask: true
    });
    
    // 模拟API调用
    setTimeout(() => {
      wx.hideLoading();
      
      // 假设验证码是123456
      if (verifyCode === '123456') {
        // 绑定成功
        
        // 更新全局用户信息
        if (app.globalData.userInfo) {
          app.globalData.userInfo.phoneNumber = phoneNumber;
        }
        
        wx.showToast({
          title: '手机绑定成功',
          icon: 'success',
          duration: 2000,
          success: () => {
            // 2秒后返回上一页
            setTimeout(() => {
              wx.navigateBack();
            }, 2000);
          }
        });
      } else {
        // 验证码错误
        this.setData({
          isSubmitting: false,
          errorMsg: '验证码不正确'
        });
      }
    }, 1500);
  }
});