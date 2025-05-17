/**
 * API接口封装服务
 * 集中管理所有接口调用
 */

const http = require('./http');
const mock = require('./mock');

// 是否使用Mock数据
const USE_MOCK = true;

/**
 * 用户相关接口
 */
const userAPI = {
  /**
   * 用户登录
   * @param {Object} data - 登录参数
   * @returns {Promise} 登录结果
   */
  login: (data) => {
    // 使用微信小程序登录，现在直接返回用户信息
    if (USE_MOCK) {
      return mock.user.getUserInfo().then(user => {
        return { token: 'mock_token_' + Date.now(), user };
      });
    }
    return http.post('/user/login', data);
  },

  /**
   * 获取用户信息
   * @returns {Promise} 用户信息
   */
  getUserInfo: () => {
    if (USE_MOCK) return mock.user.getUserInfo();
    return http.get('/user/info');
  },

  /**
   * 更新用户信息
   * @param {Object} data - 用户信息
   * @returns {Promise} 更新结果
   */
  updateUserInfo: (data) => {
    if (USE_MOCK) return mock.user.updateProfile(data);
    return http.put('/user/info', data);
  },

  /**
   * 上传用户头像
   * @param {String} filePath - 头像文件路径
   * @returns {Promise} 上传结果
   */
  uploadAvatar: (filePath) => {
    if (USE_MOCK) {
      // 模拟上传头像
      return mock.user.updateProfile({ avatar: filePath }).then(user => {
        return { url: user.avatar, user };
      });
    }
    return http.upload('/user/avatar', filePath, 'avatar');
  },
  
  /**
   * 获取用户列表
   * @returns {Promise} 用户列表
   */
  getUsers: () => {
    if (USE_MOCK) return mock.user.getUsers();
    return http.get('/users');
  }
};

/**
 * 族谱相关接口
 */
const genealogyAPI = {
  /**
   * 获取我的族谱列表
   * @returns {Promise} 族谱列表
   */
  getMyGenealogies: () => {
    if (USE_MOCK) return mock.genealogy.getGenealogies();
    return http.get('/genealogy/list');
  },

  /**
   * 创建族谱
   * @param {Object} data - 族谱信息
   * @returns {Promise} 创建结果
   */
  createGenealogy: (data) => {
    if (USE_MOCK) return mock.genealogy.createGenealogy(data);
    return http.post('/genealogy', data);
  },

  /**
   * 获取族谱详情
   * @param {String} id - 族谱ID
   * @returns {Promise} 族谱详情
   */
  getGenealogyDetail: (id) => {
    if (USE_MOCK) return mock.genealogy.getGenealogy(id);
    return http.get(`/genealogy/${id}`);
  },

  /**
   * 更新族谱信息
   * @param {String} id - 族谱ID
   * @param {Object} data - 族谱信息
   * @returns {Promise} 更新结果
   */
  updateGenealogy: (id, data) => {
    if (USE_MOCK) return mock.genealogy.updateGenealogy(id, data);
    return http.put(`/genealogy/${id}`, data);
  },

  /**
   * 获取族谱历史信息
   * @param {String} id - 族谱ID
   * @returns {Promise} 族谱历史
   */
  getGenealogyHistory: (id) => {
    if (USE_MOCK) return mock.genealogy.getGenealogistory(id);
    return http.get(`/genealogy/${id}/history`);
  },

  /**
   * 更新族谱历史信息
   * @param {String} id - 族谱ID
   * @param {Object} data - 族谱历史信息
   * @returns {Promise} 更新结果
   */
  updateGenealogyHistory: (id, data) => {
    if (USE_MOCK) return mock.genealogy.updateGenealogistory(id, data);
    return http.put(`/genealogy/${id}/history`, data);
  },

  /**
   * 生成族谱邀请码
   * @param {String} genealogyId - 族谱ID
   * @returns {Promise} 邀请码结果
   */
  generateInviteCode: (genealogyId) => {
    if (USE_MOCK) {
      return mock.invite.createInviteCode({
        genealogyId,
        createdBy: 'user_001',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 10
      });
    }
    return http.post(`/genealogy/${genealogyId}/invite-code`);
  },

  /**
   * 通过邀请码加入族谱
   * @param {String} inviteCode - 邀请码
   * @returns {Promise} 加入结果
   */
  joinGenealogyByCode: (inviteCode) => {
    if (USE_MOCK) return mock.invite.acceptInvite(inviteCode);
    return http.post('/genealogy/join', { inviteCode });
  },
  
  /**
   * 获取邀请记录列表
   * @param {String} genealogyId - 族谱ID
   * @returns {Promise} 邀请记录列表
   */
  getInviteRecords: (genealogyId) => {
    if (USE_MOCK) return mock.invite.getInviteCodes(genealogyId);
    return http.get(`/genealogy/${genealogyId}/invite-codes`);
  },
  
  /**
   * 获取族谱席位分配信息
   * @param {String} genealogyId - 族谱ID
   * @returns {Promise} 席位分配信息
   */
  getSeatAllocation: (genealogyId) => {
    if (USE_MOCK) return mock.genealogy.getSeatAllocation(genealogyId);
    return http.get(`/genealogy/${genealogyId}/seats`);
  },
  
  /**
   * 更新成员角色
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @param {Object} data - 角色信息
   * @returns {Promise} 更新结果
   */
  updateMemberRole: (genealogyId, memberId, data) => {
    if (USE_MOCK) return mock.genealogy.updateMemberRole(genealogyId, memberId, data);
    return http.put(`/genealogy/${genealogyId}/members/${memberId}/role`, data);
  },
  
  /**
   * 移除成员席位
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @returns {Promise} 移除结果
   */
  removeMemberSeat: (genealogyId, memberId) => {
    if (USE_MOCK) return mock.genealogy.removeMemberSeat(genealogyId, memberId);
    return http.del(`/genealogy/${genealogyId}/members/${memberId}/seat`);
  },
  
  /**
   * 分配席位
   * @param {String} genealogyId - 族谱ID
   * @param {Object} data - 席位数据
   * @returns {Promise} 分配结果
   */
  allocateSeats: (genealogyId, data) => {
    if (USE_MOCK) return mock.genealogy.allocateSeats(genealogyId, data);
    return http.post(`/genealogy/${genealogyId}/seats`, data);
  }
};

/**
 * 族谱成员相关接口
 */
const memberAPI = {
  /**
   * 获取族谱成员列表
   * @param {String} genealogyId - 族谱ID
   * @returns {Promise} 成员列表
   */
  getMembers: (genealogyId) => {
    if (USE_MOCK) return mock.member.getMembers(genealogyId);
    return http.get(`/genealogy/${genealogyId}/members`);
  },

  /**
   * 获取族谱成员详情
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @returns {Promise} 成员详情
   */
  getMemberDetail: (genealogyId, memberId) => {
    if (USE_MOCK) return mock.member.getMember(memberId);
    return http.get(`/genealogy/${genealogyId}/members/${memberId}`);
  },

  /**
   * 添加族谱成员
   * @param {String} genealogyId - 族谱ID
   * @param {Object} data - 成员信息
   * @returns {Promise} 添加结果
   */
  addMember: (genealogyId, data) => {
    if (USE_MOCK) return mock.member.createMember({ ...data, genealogyId });
    return http.post(`/genealogy/${genealogyId}/members`, data);
  },

  /**
   * 更新族谱成员信息
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @param {Object} data - 成员信息
   * @returns {Promise} 更新结果
   */
  updateMember: (genealogyId, memberId, data) => {
    if (USE_MOCK) return mock.member.updateMember(memberId, data);
    return http.put(`/genealogy/${genealogyId}/members/${memberId}`, data);
  },

  /**
   * 删除族谱成员
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @returns {Promise} 删除结果
   */
  deleteMember: (genealogyId, memberId) => {
    if (USE_MOCK) return mock.member.deleteMember(memberId);
    return http.del(`/genealogy/${genealogyId}/members/${memberId}`);
  },

  /**
   * 上传成员照片
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @param {String} filePath - 照片文件路径
   * @returns {Promise} 上传结果
   */
  uploadMemberPhoto: (genealogyId, memberId, filePath) => {
    if (USE_MOCK) {
      // 模拟上传照片并更新成员
      return mock.member.getMember(memberId).then(member => {
        const photos = [...member.photos, filePath];
        return mock.member.updateMember(memberId, { photos }).then(updatedMember => {
          return { url: filePath, member: updatedMember };
        });
      });
    }
    return http.upload(`/genealogy/${genealogyId}/members/${memberId}/photos`, filePath, 'photo');
  }
};

/**
 * 大事记相关接口
 */
const eventsAPI = {
  /**
   * 获取族谱大事记列表
   * @param {String} genealogyId - 族谱ID
   * @param {Object} params - 查询参数
   * @returns {Promise} 大事记列表
   */
  getEvents: (genealogyId, params = {}) => {
    if (USE_MOCK) return mock.event.getEvents(genealogyId);
    return http.get(`/genealogy/${genealogyId}/events`, params);
  },

  /**
   * 获取大事记详情
   * @param {String} genealogyId - 族谱ID
   * @param {String} eventId - 大事记ID
   * @returns {Promise} 大事记详情
   */
  getEventDetail: (genealogyId, eventId) => {
    if (USE_MOCK) return mock.event.getEvent(eventId);
    return http.get(`/genealogy/${genealogyId}/events/${eventId}`);
  },

  /**
   * 添加大事记
   * @param {String} genealogyId - 族谱ID
   * @param {Object} data - 大事记信息
   * @returns {Promise} 添加结果
   */
  addEvent: (genealogyId, data) => {
    if (USE_MOCK) return mock.event.createEvent({ ...data, genealogyId });
    return http.post(`/genealogy/${genealogyId}/events`, data);
  },

  /**
   * 更新大事记
   * @param {String} genealogyId - 族谱ID
   * @param {String} eventId - 大事记ID
   * @param {Object} data - 大事记信息
   * @returns {Promise} 更新结果
   */
  updateEvent: (genealogyId, eventId, data) => {
    if (USE_MOCK) return mock.event.updateEvent(eventId, data);
    return http.put(`/genealogy/${genealogyId}/events/${eventId}`, data);
  },

  /**
   * 删除大事记
   * @param {String} genealogyId - 族谱ID
   * @param {String} eventId - 大事记ID
   * @returns {Promise} 删除结果
   */
  deleteEvent: (genealogyId, eventId) => {
    if (USE_MOCK) return mock.event.deleteEvent(eventId);
    return http.del(`/genealogy/${genealogyId}/events/${eventId}`);
  },

  /**
   * 上传大事记媒体文件
   * @param {String} genealogyId - 族谱ID
   * @param {String} eventId - 大事记ID
   * @param {String} filePath - 媒体文件路径
   * @param {String} type - 媒体类型（photo/video）
   * @returns {Promise} 上传结果
   */
  uploadEventMedia: (genealogyId, eventId, filePath, type = 'photo') => {
    if (USE_MOCK) {
      // 模拟上传媒体并更新事件
      return mock.event.getEvent(eventId).then(event => {
        const media = [...event.media, filePath];
        return mock.event.updateEvent(eventId, { media }).then(updatedEvent => {
          return { url: filePath, event: updatedEvent };
        });
      });
    }
    return http.upload(`/genealogy/${genealogyId}/events/${eventId}/media`, filePath, 'media', { type });
  }
};

/**
 * 支付与订阅相关接口
 */
const paymentAPI = {
  /**
   * 获取订阅方案列表
   * @returns {Promise} 订阅方案列表
   */
  getSubscriptionPlans: () => {
    if (USE_MOCK) return mock.subscription.getSubscriptionPlans();
    return http.get('/subscription/plans');
  },

  /**
   * 获取当前订阅信息
   * @returns {Promise} 订阅信息
   */
  getCurrentSubscription: () => {
    if (USE_MOCK) return mock.subscription.getCurrentSubscription();
    return http.get('/subscription/current');
  },

  /**
   * 创建订阅订单
   * @param {Object} data - 订阅参数
   * @returns {Promise} 订单信息
   */
  createSubscriptionOrder: (data) => {
    if (USE_MOCK) {
      // 模拟订单创建
      return mock.subscription.getSubscriptionPlans().then(plans => {
        const plan = plans.find(p => p.id === data.planId);
        if (!plan) {
          return Promise.reject(new Error('订阅计划不存在'));
        }
        return Promise.resolve({
          id: 'order_' + Date.now(),
          planId: data.planId,
          price: plan.price,
          status: 'pending',
          createTime: new Date().toISOString()
        });
      });
    }
    return http.post('/subscription/order', data);
  },

  /**
   * 支付订单
   * @param {String} orderId - 订单ID
   * @returns {Promise} 支付参数
   */
  payOrder: (orderId) => {
    if (USE_MOCK) {
      // 模拟订单支付成功，更新订阅信息
      return mock.subscription.getSubscriptionPlans().then(plans => {
        const plan = plans[1]; // 默认使用家庭版
        if (plan) {
          return mock.subscription.updateSubscription({
            name: plan.name,
            genealogyLimit: plan.genealogyLimit,
            memberLimit: plan.memberLimit,
            storageLimit: plan.storageLimit,
            expireDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }).then(subscription => {
            return { success: true, subscription };
          });
        }
        return Promise.reject(new Error('支付失败'));
      });
    }
    return http.post(`/subscription/order/${orderId}/pay`);
  }
};

/**
 * 通知相关接口
 */
const notificationAPI = {
  /**
   * 获取通知列表
   * @param {Object} params - 查询参数
   * @returns {Promise} 通知列表
   */
  getNotifications: (params = {}) => {
    if (USE_MOCK) {
      return mock.notification.getNotifications().then(notifications => {
        // 根据参数过滤通知
        let result = [...notifications];
        
        // 过滤已读/未读通知
        if (params.read !== undefined) {
          result = result.filter(n => n.read === params.read);
        }
        
        // 过滤通知类型
        if (params.type) {
          result = result.filter(n => n.type === params.type);
        }
        
        // 排序
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // 分页
        if (params.limit) {
          const start = params.offset || 0;
          const end = start + parseInt(params.limit);
          result = result.slice(start, end);
        }
        
        return result;
      });
    }
    return http.get('/notifications', params);
  },

  /**
   * 获取未读通知数量
   * @returns {Promise} 未读通知数量
   */
  getUnreadCount: () => {
    if (USE_MOCK) {
      return mock.notification.getNotifications()
        .then(notifications => notifications.filter(n => !n.read).length);
    }
    return http.get('/notifications/unread-count');
  },

  /**
   * 标记通知为已读
   * @param {String} notificationId - 通知ID, 如不提供则标记所有通知为已读
   * @returns {Promise} 标记结果
   */
  markAsRead: (notificationId) => {
    if (USE_MOCK) {
      if (notificationId) {
        return mock.notification.markAsRead(notificationId);
      } else {
        return mock.notification.markAllAsRead();
      }
    }
    return http.put(notificationId ? `/notifications/${notificationId}/read` : '/notifications/read-all');
  },

  /**
   * 删除通知
   * @param {String} notificationId - 通知ID
   * @returns {Promise} 删除结果
   */
  deleteNotification: (notificationId) => {
    if (USE_MOCK) {
      // 目前mock API没有提供删除通知的方法，可以简单返回成功
      return Promise.resolve({ success: true });
    }
    return http.del(`/notifications/${notificationId}`);
  },

  /**
   * 获取通知设置
   * @returns {Promise} 通知设置
   */
  getNotificationSettings: () => {
    if (USE_MOCK) return mock.notification.getNotificationSettings();
    return http.get('/notifications/settings');
  },

  /**
   * 更新通知设置
   * @param {Object} settings - 通知设置
   * @returns {Promise} 更新结果
   */
  updateNotificationSettings: (settings) => {
    if (USE_MOCK) return mock.notification.updateNotificationSettings(settings);
    return http.put('/notifications/settings', settings);
  }
};

module.exports = {
  userAPI,
  genealogyAPI,
  memberAPI,
  eventsAPI,
  paymentAPI,
  notificationAPI
};