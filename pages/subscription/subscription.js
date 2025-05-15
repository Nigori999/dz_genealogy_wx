// 订阅服务页面
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    hasChanged: false,
    currentPlan: {
      genealogyCount: 1,
      memberCount: 50,
      storageSize: 100 * 1024 * 1024, // 100MB
      totalPrice: 0,
      expireDate: '永久'
    },
    customPlan: {
      genealogyCount: 1,
      memberCount: 50,
      storageSize: 100 * 1024 * 1024, // 100MB
      totalPrice: 0,
      discount: 0
    },
    priceRates: {
      genealogy: 9.9, // 每个族谱的月费用
      member: 0.1,    // 每个席位的月费用
      storage: 1.0     // 每GB存储的月费用
    },
    // 添加格式化后的价格字符串
    priceStrings: {
      genealogyTotal: '0.00',
      memberTotal: '0.00',
      storageTotal: '0.00',
      totalPrice: '0.00',
      discount: '0.00',
      finalPrice: '0.00'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadSubscriptionData();
  },

  /**
   * 加载订阅数据
   */
  loadSubscriptionData: function () {
    const that = this;
    
    // 模拟API调用
    setTimeout(() => {
      // 实际项目中应该调用API获取订阅信息
      // 获取当前订阅信息
      const currentPlan = {
        genealogyCount: 1,
        memberCount: 50,
        storageSize: 100 * 1024 * 1024, // 100MB
        totalPrice: 0,
        expireDate: '永久'
      };
      
      // 从app全局数据获取当前订阅信息
      if (app.globalData.subscriptionPlan) {
        Object.assign(currentPlan, app.globalData.subscriptionPlan);
      }
      
      // 初始化自定义套餐为当前套餐
      const customPlan = {
        genealogyCount: currentPlan.genealogyCount,
        memberCount: currentPlan.memberCount,
        storageSize: currentPlan.storageSize,
        totalPrice: 0,
        discount: 0
      };
      
      // 计算初始价格
      this.calculatePrice(customPlan);
      
      // 计算格式化的价格字符串
      const { priceRates } = this.data;
      const priceStrings = {
        genealogyTotal: (customPlan.genealogyCount * priceRates.genealogy).toFixed(2),
        memberTotal: (customPlan.memberCount * priceRates.member).toFixed(2),
        storageTotal: ((customPlan.storageSize / (1024 * 1024 * 1024)) * priceRates.storage).toFixed(2),
        totalPrice: customPlan.totalPrice.toFixed(2),
        discount: customPlan.discount.toFixed(2),
        finalPrice: (customPlan.totalPrice - customPlan.discount).toFixed(2)
      };
      
      that.setData({
        isLoading: false,
        currentPlan,
        customPlan,
        priceStrings
      });
    }, 1000);
  },

  /**
   * 计算订阅价格
   */
  calculatePrice: function(planData) {
    const { priceRates } = this.data;
    
    // 计算各项费用
    const genealogyPrice = planData.genealogyCount * priceRates.genealogy;
    const memberPrice = planData.memberCount * priceRates.member;
    const storagePrice = (planData.storageSize / (1024 * 1024 * 1024)) * priceRates.storage;
    
    // 总价
    let totalPrice = genealogyPrice + memberPrice + storagePrice;
    
    // 计算优惠（示例：超过5个族谱给9折优惠）
    let discount = 0;
    if (planData.genealogyCount > 5) {
      discount = totalPrice * 0.1;
    }
    
    // 更新价格数据
    planData.totalPrice = totalPrice;
    planData.discount = discount;
    
    return planData;
  },

  /**
   * 计算总价并更新状态
   */
  calculateTotal: function() {
    let { customPlan, priceRates } = this.data;
    
    // 使用calculatePrice计算价格
    this.calculatePrice(customPlan);
    
    // 计算格式化的价格字符串
    const priceStrings = {
      genealogyTotal: (customPlan.genealogyCount * priceRates.genealogy).toFixed(2),
      memberTotal: (customPlan.memberCount * priceRates.member).toFixed(2),
      storageTotal: ((customPlan.storageSize / (1024 * 1024 * 1024)) * priceRates.storage).toFixed(2),
      totalPrice: customPlan.totalPrice.toFixed(2),
      discount: customPlan.discount.toFixed(2),
      finalPrice: (customPlan.totalPrice - customPlan.discount).toFixed(2)
    };
    
    // 更新UI
    this.setData({ 
      customPlan: customPlan,
      priceStrings: priceStrings
    });
    
    // 检查是否有变更
    this.checkChanges();
  },

  /**
   * 检查是否有变更
   */
  checkChanges: function() {
    const { currentPlan, customPlan } = this.data;
    
    const hasChanged = 
      currentPlan.genealogyCount !== customPlan.genealogyCount ||
      currentPlan.memberCount !== customPlan.memberCount ||
      currentPlan.storageSize !== customPlan.storageSize;
    
    this.setData({ hasChanged });
  },

  /**
   * 族谱数量变化处理
   */
  onGenealogyCountChange: function(e) {
    const value = parseInt(e.detail.value);
    this.updateGenealogyCount(value);
  },
  
  onGenealogyCountInput: function(e) {
    const value = parseInt(e.detail.value) || 1;
    this.updateGenealogyCount(value);
  },
  
  increaseGenealogyCount: function() {
    const value = this.data.customPlan.genealogyCount + 1;
    if (value <= 50) {
      this.updateGenealogyCount(value);
    }
  },
  
  decreaseGenealogyCount: function() {
    const value = this.data.customPlan.genealogyCount - 1;
    if (value >= 1) {
      this.updateGenealogyCount(value);
    }
  },
  
  updateGenealogyCount: function(value) {
    // 限制范围
    if (value < 1) value = 1;
    if (value > 50) value = 50;
    
    let customPlan = this.data.customPlan;
    customPlan.genealogyCount = value;
    this.setData({
      customPlan: customPlan
    });
    this.calculateTotal();
  },

  /**
   * 席位数量变化处理
   */
  onMemberCountChange: function(e) {
    const value = parseInt(e.detail.value);
    this.updateMemberCount(value);
  },
  
  onMemberCountInput: function(e) {
    const value = parseInt(e.detail.value) || 50;
    this.updateMemberCount(value);
  },
  
  increaseMemberCount: function() {
    const value = this.data.customPlan.memberCount + 50;
    if (value <= 5000) {
      this.updateMemberCount(value);
    }
  },
  
  decreaseMemberCount: function() {
    const value = this.data.customPlan.memberCount - 50;
    if (value >= 50) {
      this.updateMemberCount(value);
    }
  },
  
  updateMemberCount: function(value) {
    // 限制范围
    if (value < 50) value = 50;
    if (value > 5000) value = 5000;
    
    // 确保是50的倍数
    value = Math.round(value / 50) * 50;
    
    const customPlan = this.data.customPlan;
    customPlan.memberCount = value;
    
    // 重新计算价格
    this.calculatePrice(customPlan);
    
    this.setData({ customPlan });
    this.checkChanges();
  },

  /**
   * 存储空间变化处理
   */
  onStorageSizeChange: function(e) {
    const value = parseInt(e.detail.value);
    this.updateStorageSize(value);
  },
  
  onStorageSizeInput: function(e) {
    const value = parseInt(e.detail.value) || 1;
    this.updateStorageSize(value);
  },
  
  increaseStorageSize: function() {
    const gbValue = this.data.customPlan.storageSize / (1024 * 1024 * 1024) + 1;
    if (gbValue <= 100) {
      this.updateStorageSize(gbValue);
    }
  },
  
  decreaseStorageSize: function() {
    const gbValue = this.data.customPlan.storageSize / (1024 * 1024 * 1024) - 1;
    if (gbValue >= 1) {
      this.updateStorageSize(gbValue);
    }
  },
  
  updateStorageSize: function(gbValue) {
    // 限制范围
    if (gbValue < 1) gbValue = 1;
    if (gbValue > 100) gbValue = 100;
    
    const customPlan = this.data.customPlan;
    customPlan.storageSize = gbValue * 1024 * 1024 * 1024; // 转换为字节
    
    // 重新计算价格
    this.calculatePrice(customPlan);
    
    this.setData({ customPlan });
    this.checkChanges();
  },

  /**
   * 订阅
   */
  subscribe: function () {
    const that = this;
    const { customPlan } = this.data;
    
    if (!this.data.hasChanged) {
      return;
    }
    
    // 调用支付
    wx.showLoading({
      title: '正在创建订单...',
    });
    
    // 模拟调用支付API
    setTimeout(() => {
      wx.hideLoading();
      
      // 调用微信支付
      wx.requestPayment({
        timeStamp: '' + Math.floor(Date.now() / 1000),
        nonceStr: Math.random().toString(36).substr(2, 15),
        package: 'prepay_id=wx' + Math.random().toString(36).substr(2, 10),
        signType: 'MD5',
        paySign: '',
        success(res) {
          // 支付成功
          that.updateSubscription(customPlan);
        },
        fail(err) {
          // 支付失败
          wx.showToast({
            title: '支付已取消',
            icon: 'none'
          });
        }
      });
    }, 1500);
  },

  /**
   * 更新订阅信息
   */
  updateSubscription: function (plan) {
    const that = this;
    
    wx.showLoading({
      title: '正在更新订阅...',
    });
    
    // 模拟API调用
    setTimeout(() => {
      // 更新当前订阅
      const newPlan = {
        ...plan,
        expireDate: this.calculateExpireDate()
      };
      
      // 更新全局数据
      app.globalData.subscriptionPlan = newPlan;
      
      that.setData({
        currentPlan: newPlan,
        customPlan: JSON.parse(JSON.stringify(newPlan)),
        hasChanged: false
      });
      
      wx.hideLoading();
      
      wx.showToast({
        title: '订阅成功',
        icon: 'success'
      });
    }, 1000);
  },

  /**
   * 计算到期时间
   */
  calculateExpireDate: function () {
    const now = new Date();
    let expireDate = new Date(now);
    
    // 默认订阅一个月
    expireDate.setMonth(now.getMonth() + 1);
    
    return expireDate.getFullYear() + '-' + 
           this.padZero(expireDate.getMonth() + 1) + '-' + 
           this.padZero(expireDate.getDate());
  },

  /**
   * 格式化存储空间
   */
  formatStorage: function (bytes) {
    if (!bytes) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return size.toFixed(2) + ' ' + units[unitIndex];
  },

  /**
   * 数字补零
   */
  padZero: function (num) {
    return (num < 10 ? '0' : '') + num;
  },

  // 减少席位数量
  decreaseMemberCount() {
    let { customPlan } = this.data;
    if (customPlan.memberCount > 30) {
      customPlan.memberCount -= 1;
      this.setData({ customPlan });
      this.calculateTotal();
    }
  },

  // 增加席位数量
  increaseMemberCount() {
    let { customPlan } = this.data;
    if (customPlan.memberCount < 5000) {
      customPlan.memberCount += 1;
      this.setData({ customPlan });
      this.calculateTotal();
    }
  },

  // 快捷设置席位数量
  setQuickMemberCount(e) {
    const value = parseInt(e.currentTarget.dataset.value);
    let { customPlan } = this.data;
    customPlan.memberCount = value;
    this.setData({ customPlan });
    this.calculateTotal();
  },

  // 席位数量输入变化
  onMemberCountInput(e) {
    let value = parseInt(e.detail.value);
    let { customPlan } = this.data;
    
    if (isNaN(value)) {
      value = 30;
    } else if (value < 30) {
      value = 30;
    } else if (value > 5000) {
      value = 5000;
    }
    
    customPlan.memberCount = value;
    this.setData({ customPlan });
    this.calculateTotal();
  },

  // 席位数量滑块变化
  onMemberCountChange(e) {
    let { customPlan } = this.data;
    customPlan.memberCount = e.detail.value;
    this.setData({ customPlan });
    this.calculateTotal();
  },
}) 