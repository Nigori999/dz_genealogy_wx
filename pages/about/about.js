// 关于我们页面
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    appInfo: {
      name: '云族谱',
      version: 'v1.0.0',
      copyright: '© 2023-2024 云族谱团队',
      description: '云族谱是一款专为家族谱系管理打造的微信小程序，致力于帮助用户记录、整理和传承家族历史。通过数字化方式，让家族血脉与记忆永久保存。',
      features: [
        '简易直观的族谱编辑功能',
        '精美的家族树图形化展示',
        '家族大事记时间轴',
        '成员详细资料管理',
        '多族谱切换与管理',
        '安全可靠的数据存储'
      ],
      contact: {
        email: 'contact@yunzupu.com',
        website: 'https://www.yunzupu.com',
        weixin: 'yunzupu666'
      }
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 模拟数据加载
    setTimeout(() => {
      this.setData({
        isLoading: false
      });
    }, 500);
  },

  /**
   * 复制联系方式
   */
  copyContact: function (e) {
    const { type } = e.currentTarget.dataset;
    const contact = this.data.appInfo.contact;
    
    let content = '';
    switch (type) {
      case 'email':
        content = contact.email;
        break;
      case 'website':
        content = contact.website;
        break;
      case 'weixin':
        content = contact.weixin;
        break;
      default:
        break;
    }
    
    if (content) {
      wx.setClipboardData({
        data: content,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          });
        }
      });
    }
  },

  /**
   * 打开用户协议
   */
  openUserAgreement: function () {
    wx.showModal({
      title: '用户协议',
      content: '感谢您使用云族谱小程序。使用本小程序，即表示您已同意我们的用户协议，包括数据使用、功能限制和责任声明等内容。我们将严格保护您的个人信息和族谱数据安全。',
      confirmText: '我已了解',
      showCancel: false
    });
  },

  /**
   * 打开隐私政策
   */
  openPrivacyPolicy: function () {
    wx.showModal({
      title: '隐私政策',
      content: '云族谱重视您的隐私保护。我们收集的信息仅用于提供和改进服务，不会向第三方分享您的个人信息。我们使用业界标准的安全措施保护您的数据安全。您有权随时查看、更正或删除您的个人信息。',
      confirmText: '我已了解',
      showCancel: false
    });
  }
}); 