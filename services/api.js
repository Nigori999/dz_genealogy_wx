/**
 * API接口封装服务
 * 集中管理所有接口调用
 */

const http = require('./http');
const mockService = require('./mock');

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
    if (USE_MOCK) return mockService.login(data);
    return http.post('/user/login', data);
  },

  /**
   * 获取用户信息
   * @returns {Promise} 用户信息
   */
  getUserInfo: () => {
    if (USE_MOCK) return mockService.getUserInfo();
    return http.get('/user/info');
  },

  /**
   * 更新用户信息
   * @param {Object} data - 用户信息
   * @returns {Promise} 更新结果
   */
  updateUserInfo: (data) => {
    if (USE_MOCK) return mockService.updateUserInfo(data);
    return http.put('/user/info', data);
  },

  /**
   * 上传用户头像
   * @param {String} filePath - 头像文件路径
   * @returns {Promise} 上传结果
   */
  uploadAvatar: (filePath) => {
    if (USE_MOCK) return mockService.uploadAvatar(filePath);
    return http.upload('/user/avatar', filePath, 'avatar');
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
    if (USE_MOCK) return mockService.getMyGenealogies();
    return http.get('/genealogy/list');
  },

  /**
   * 创建族谱
   * @param {Object} data - 族谱信息
   * @returns {Promise} 创建结果
   */
  createGenealogy: (data) => {
    if (USE_MOCK) return mockService.createGenealogy(data);
    return http.post('/genealogy', data);
  },

  /**
   * 获取族谱详情
   * @param {String} id - 族谱ID
   * @returns {Promise} 族谱详情
   */
  getGenealogyDetail: (id) => {
    if (USE_MOCK) return mockService.getGenealogyDetail(id);
    return http.get(`/genealogy/${id}`);
  },

  /**
   * 更新族谱信息
   * @param {String} id - 族谱ID
   * @param {Object} data - 族谱信息
   * @returns {Promise} 更新结果
   */
  updateGenealogy: (id, data) => {
    if (USE_MOCK) return mockService.updateGenealogy(id, data);
    return http.put(`/genealogy/${id}`, data);
  },

  /**
   * 获取族谱历史信息
   * @param {String} id - 族谱ID
   * @returns {Promise} 族谱历史
   */
  getGenealogyHistory: (id) => {
    if (USE_MOCK) return mockService.getGenealogyHistory(id);
    return http.get(`/genealogy/${id}/history`);
  },

  /**
   * 更新族谱历史信息
   * @param {String} id - 族谱ID
   * @param {Object} data - 族谱历史信息
   * @returns {Promise} 更新结果
   */
  updateGenealogyHistory: (id, data) => {
    if (USE_MOCK) return mockService.updateGenealogyHistory(id, data);
    return http.put(`/genealogy/${id}/history`, data);
  },

  /**
   * 生成族谱邀请码
   * @param {String} genealogyId - 族谱ID
   * @returns {Promise} 邀请码结果
   */
  generateInviteCode: (genealogyId) => {
    if (USE_MOCK) return mockService.generateInviteCode(genealogyId);
    return http.post(`/genealogy/${genealogyId}/invite-code`);
  },

  /**
   * 通过邀请码加入族谱
   * @param {String} inviteCode - 邀请码
   * @returns {Promise} 加入结果
   */
  joinGenealogyByCode: (inviteCode) => {
    if (USE_MOCK) return mockService.joinGenealogyByCode(inviteCode);
    return http.post('/genealogy/join', { inviteCode });
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
    if (USE_MOCK) return mockService.getMembers(genealogyId);
    return http.get(`/genealogy/${genealogyId}/members`);
  },

  /**
   * 获取族谱成员详情
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @returns {Promise} 成员详情
   */
  getMemberDetail: (genealogyId, memberId) => {
    if (USE_MOCK) return mockService.getMemberDetail(genealogyId, memberId);
    return http.get(`/genealogy/${genealogyId}/members/${memberId}`);
  },

  /**
   * 添加族谱成员
   * @param {String} genealogyId - 族谱ID
   * @param {Object} data - 成员信息
   * @returns {Promise} 添加结果
   */
  addMember: (genealogyId, data) => {
    if (USE_MOCK) return mockService.addMember(genealogyId, data);
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
    if (USE_MOCK) return mockService.updateMember(genealogyId, memberId, data);
    return http.put(`/genealogy/${genealogyId}/members/${memberId}`, data);
  },

  /**
   * 删除族谱成员
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @returns {Promise} 删除结果
   */
  deleteMember: (genealogyId, memberId) => {
    if (USE_MOCK) return mockService.deleteMember(genealogyId, memberId);
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
    if (USE_MOCK) return mockService.uploadMemberPhoto(genealogyId, memberId, filePath);
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
    if (USE_MOCK) return mockService.getEvents(genealogyId, params);
    return http.get(`/genealogy/${genealogyId}/events`, params);
  },

  /**
   * 获取大事记详情
   * @param {String} genealogyId - 族谱ID
   * @param {String} eventId - 大事记ID
   * @returns {Promise} 大事记详情
   */
  getEventDetail: (genealogyId, eventId) => {
    if (USE_MOCK) return mockService.getEventDetail(genealogyId, eventId);
    return http.get(`/genealogy/${genealogyId}/events/${eventId}`);
  },

  /**
   * 添加大事记
   * @param {String} genealogyId - 族谱ID
   * @param {Object} data - 大事记信息
   * @returns {Promise} 添加结果
   */
  addEvent: (genealogyId, data) => {
    if (USE_MOCK) return mockService.addEvent(genealogyId, data);
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
    if (USE_MOCK) return mockService.updateEvent(genealogyId, eventId, data);
    return http.put(`/genealogy/${genealogyId}/events/${eventId}`, data);
  },

  /**
   * 删除大事记
   * @param {String} genealogyId - 族谱ID
   * @param {String} eventId - 大事记ID
   * @returns {Promise} 删除结果
   */
  deleteEvent: (genealogyId, eventId) => {
    if (USE_MOCK) return mockService.deleteEvent(genealogyId, eventId);
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
    if (USE_MOCK) return mockService.uploadEventMedia(genealogyId, eventId, filePath, type);
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
    if (USE_MOCK) return mockService.getSubscriptionPlans();
    return http.get('/subscription/plans');
  },

  /**
   * 获取当前订阅信息
   * @returns {Promise} 订阅信息
   */
  getCurrentSubscription: () => {
    if (USE_MOCK) return mockService.getCurrentSubscription();
    return http.get('/subscription/current');
  },

  /**
   * 创建订阅订单
   * @param {Object} data - 订阅参数
   * @returns {Promise} 订单信息
   */
  createSubscriptionOrder: (data) => {
    if (USE_MOCK) return mockService.createSubscriptionOrder(data);
    return http.post('/subscription/order', data);
  },

  /**
   * 支付订单
   * @param {String} orderId - 订单ID
   * @returns {Promise} 支付参数
   */
  payOrder: (orderId) => {
    if (USE_MOCK) return mockService.payOrder(orderId);
    return http.post(`/subscription/order/${orderId}/pay`);
  }
};

module.exports = {
  userAPI,
  genealogyAPI,
  memberAPI,
  eventsAPI,
  paymentAPI
};