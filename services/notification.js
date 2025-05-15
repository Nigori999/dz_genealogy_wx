/**
 * 通知服务
 * 处理通知相关的API调用
 */

const app = getApp();
const { request } = require('./http');

/**
 * 获取通知列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码
 * @param {number} params.pageSize 每页条数
 * @param {boolean} params.onlyUnread 是否仅获取未读通知
 * @param {boolean} params.onlyRead 是否仅获取已读通知
 * @returns {Promise} 请求结果
 */
function getNotifications(params = {}) {
  const { page = 1, pageSize = 20, onlyUnread, onlyRead } = params;
  
  // 模拟API调用
  return new Promise((resolve) => {
    // 从本地存储获取通知历史（实际应用中应从服务器获取）
    const notifications = wx.getStorageSync('notificationHistory') || [];
    
    // 筛选逻辑
    let filteredNotifications = [...notifications];
    
    // 按已读/未读状态筛选
    if (onlyUnread === true) {
      filteredNotifications = filteredNotifications.filter(item => !item.read);
    } else if (onlyRead === true) {
      filteredNotifications = filteredNotifications.filter(item => item.read);
    }
    
    // 分页处理
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedNotifications = filteredNotifications.slice(startIndex, endIndex);
    
    // 模拟请求延迟
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          list: pagedNotifications,
          total: filteredNotifications.length,
          page,
          pageSize,
          hasMore: endIndex < filteredNotifications.length
        }
      });
    }, 500);
  });
}

/**
 * 获取未读通知数量
 * @returns {Promise} 请求结果
 */
function getUnreadCount() {
  // 模拟API调用
  return new Promise((resolve) => {
    // 从本地存储获取通知历史（实际应用中应从服务器获取）
    const notifications = wx.getStorageSync('notificationHistory') || [];
    
    // 计算未读通知数量
    const unreadCount = notifications.filter(item => !item.read).length;
    
    // 模拟请求延迟
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          count: unreadCount
        }
      });
    }, 300);
  });
}

/**
 * 标记通知为已读
 * @param {string|Array} notificationIds 通知ID或ID数组
 * @returns {Promise} 请求结果
 */
function markAsRead(notificationIds) {
  // 确保参数为数组
  const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
  
  if (ids.length === 0) {
    return Promise.resolve({ success: false, message: '未指定通知ID' });
  }
  
  // 模拟API调用
  return new Promise((resolve) => {
    // 从本地存储获取通知历史（实际应用中应从服务器更新）
    const notifications = wx.getStorageSync('notificationHistory') || [];
    
    // 更新已读状态
    const updatedNotifications = notifications.map(item => {
      if (ids.includes(item.id) && !item.read) {
        return { ...item, read: true };
      }
      return item;
    });
    
    // 更新存储
    wx.setStorageSync('notificationHistory', updatedNotifications);
    
    // 模拟请求延迟
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          updatedCount: ids.length
        }
      });
    }, 300);
  });
}

/**
 * 标记所有通知为已读
 * @returns {Promise} 请求结果
 */
function markAllAsRead() {
  // 模拟API调用
  return new Promise((resolve) => {
    // 从本地存储获取通知历史（实际应用中应从服务器更新）
    const notifications = wx.getStorageSync('notificationHistory') || [];
    
    // 标记所有通知为已读
    const updatedNotifications = notifications.map(item => {
      if (!item.read) {
        return { ...item, read: true };
      }
      return item;
    });
    
    // 更新存储
    wx.setStorageSync('notificationHistory', updatedNotifications);
    
    // 计算更新的通知数量
    const updatedCount = notifications.filter(item => !item.read).length;
    
    // 模拟请求延迟
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          updatedCount
        }
      });
    }, 300);
  });
}

/**
 * 删除通知
 * @param {string|Array} notificationIds 通知ID或ID数组
 * @returns {Promise} 请求结果
 */
function deleteNotifications(notificationIds) {
  // 确保参数为数组
  const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
  
  if (ids.length === 0) {
    return Promise.resolve({ success: false, message: '未指定通知ID' });
  }
  
  // 模拟API调用
  return new Promise((resolve) => {
    // 从本地存储获取通知历史（实际应用中应从服务器删除）
    const notifications = wx.getStorageSync('notificationHistory') || [];
    
    // 过滤掉要删除的通知
    const updatedNotifications = notifications.filter(item => !ids.includes(item.id));
    
    // 更新存储
    wx.setStorageSync('notificationHistory', updatedNotifications);
    
    // 模拟请求延迟
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          deletedCount: ids.length
        }
      });
    }, 300);
  });
}

/**
 * 清空所有通知
 * @returns {Promise} 请求结果
 */
function clearAllNotifications() {
  // 模拟API调用
  return new Promise((resolve) => {
    // 从本地存储获取通知历史（实际应用中应从服务器删除）
    const notifications = wx.getStorageSync('notificationHistory') || [];
    
    // 记录清空的通知数量
    const clearedCount = notifications.length;
    
    // 清空存储
    wx.setStorageSync('notificationHistory', []);
    
    // 模拟请求延迟
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          clearedCount
        }
      });
    }, 300);
  });
}

/**
 * 发送测试通知（仅用于开发测试）
 * @param {Object} notification 通知内容
 * @returns {Promise} 请求结果
 */
function sendTestNotification(notification = {}) {
  // 默认通知内容
  const defaultNotification = {
    title: '测试通知',
    content: '这是一条测试通知，用于验证通知功能是否正常工作。',
    type: '测试'
  };
  
  // 合并通知内容
  const notificationData = { ...defaultNotification, ...notification };
  
  // 生成通知ID和时间
  const id = 'notice-' + Date.now();
  const now = new Date();
  const time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // 完整通知对象
  const newNotification = {
    id,
    time,
    read: false,
    ...notificationData
  };
  
  // 模拟API调用
  return new Promise((resolve) => {
    // 从本地存储获取通知历史
    const notifications = wx.getStorageSync('notificationHistory') || [];
    
    // 添加新通知
    const updatedNotifications = [newNotification, ...notifications];
    
    // 更新存储
    wx.setStorageSync('notificationHistory', updatedNotifications);
    
    // 模拟请求延迟
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          notification: newNotification
        }
      });
    }, 300);
  });
}

/**
 * 获取通知设置
 * @returns {Promise} 请求结果
 */
function getNotificationSettings() {
  // 模拟API调用
  return new Promise((resolve) => {
    // 从本地存储获取设置
    const subscriptionSettings = wx.getStorageSync('subscriptionSettings') || {};
    const appNotificationSettings = wx.getStorageSync('appNotificationSettings') || {};
    const notificationMainSwitch = wx.getStorageSync('notificationMainSwitch');
    
    // 模拟请求延迟
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          mainSwitch: notificationMainSwitch === undefined ? true : notificationMainSwitch,
          subscriptionSettings,
          appNotificationSettings
        }
      });
    }, 300);
  });
}

/**
 * 更新通知设置
 * @param {Object} settings 通知设置
 * @returns {Promise} 请求结果
 */
function updateNotificationSettings(settings = {}) {
  const { mainSwitch, subscriptionSettings, appNotificationSettings } = settings;
  
  // 模拟API调用
  return new Promise((resolve) => {
    // 更新设置
    if (mainSwitch !== undefined) {
      wx.setStorageSync('notificationMainSwitch', mainSwitch);
    }
    
    if (subscriptionSettings) {
      wx.setStorageSync('subscriptionSettings', subscriptionSettings);
    }
    
    if (appNotificationSettings) {
      wx.setStorageSync('appNotificationSettings', appNotificationSettings);
    }
    
    // 模拟请求延迟
    setTimeout(() => {
      resolve({
        success: true,
        message: '设置已更新'
      });
    }, 300);
  });
}

// 导出通知服务接口
module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotifications,
  clearAllNotifications,
  sendTestNotification,
  getNotificationSettings,
  updateNotificationSettings
}; 