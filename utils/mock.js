/**
 * 模拟数据工具
 * 用于开发和测试阶段生成模拟数据
 */

// 定义三个订阅计划
const SUBSCRIPTION_PLANS = {
  FREE: {
    name: '免费版',
    genealogyLimit: 1,
    memberLimit: 10,
    storageLimit: 100 // MB
  },
  PREMIUM: {
    name: '高级版',
    genealogyLimit: 5,
    memberLimit: 100,
    storageLimit: 1024 // MB
  },
  UNLIMITED: {
    name: '企业版',
    genealogyLimit: 999999,
    memberLimit: 999999,
    storageLimit: 999999 // MB
  }
};

// 定义权限类型
const PERMISSION_TYPES = {
  ADMIN: 'admin',      // 超级管理员
  OWNER: 'owner',      // 家族长
  EDITOR: 'editor',    // 编辑
  VIEWER: 'viewer'     // 普通查看
};

/**
 * 初始化模拟用户数据
 */
function initMockUsers() {
  // 1. 超级管理员用户
  const adminUser = {
    id: 'admin-001',
    nickname: '超级管理员',
    avatar: '/assets/images/avatar_admin.png',
    phone: '13900000001',
    email: 'admin@yunzupu.com',
    isAdmin: true,                   // 超级管理员标识
    role: PERMISSION_TYPES.ADMIN,    // 角色
    subscriptionPlan: SUBSCRIPTION_PLANS.UNLIMITED,  // 无限制订阅计划
    createTime: '2023-01-01 00:00:00'
  };
  
  // 2. 家族长用户
  const ownerUser = {
    id: 'owner-001',
    nickname: '家族长',
    avatar: '/assets/images/avatar_owner.png',
    phone: '13900000002',
    email: 'owner@yunzupu.com',
    isAdmin: false,                  // 不是超级管理员
    isOwner: true,                   // 家族长标识
    role: PERMISSION_TYPES.OWNER,    // 角色
    subscriptionPlan: SUBSCRIPTION_PLANS.FREE,  // 免费订阅计划
    createTime: '2023-02-01 00:00:00'
  };
  
  // 3. 普通成员用户
  const memberUser = {
    id: 'member-001',
    nickname: '普通成员',
    avatar: '/assets/images/avatar_member.png',
    phone: '13900000003',
    email: 'member@yunzupu.com',
    isAdmin: false,                  // 不是超级管理员
    isOwner: false,                  // 不是家族长
    role: PERMISSION_TYPES.VIEWER,   // 角色
    subscriptionPlan: SUBSCRIPTION_PLANS.FREE,  // 免费订阅计划
    createTime: '2023-03-01 00:00:00'
  };
  
  // 将用户信息存储到本地
  const users = [adminUser, ownerUser, memberUser];
  wx.setStorageSync('mockUsers', users);
  
  // 默认使用超级管理员用户
  wx.setStorageSync('userInfo', adminUser);
  
  // 更新全局数据中的用户
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.userInfo = adminUser;
    app.globalData.isLogin = true; // 确保已登录状态
  }
  
  console.log('已初始化模拟用户数据');
  return users;
}

/**
 * 切换用户
 * @param {string} userType - 用户类型: 'admin', 'owner', 'member'
 */
function switchUser(userType) {
  const users = wx.getStorageSync('mockUsers') || initMockUsers();
  let user;
  
  switch (userType) {
    case 'admin':
      user = users.find(u => u.isAdmin);
      break;
    case 'owner':
      user = users.find(u => u.isOwner && !u.isAdmin);
      break;
    case 'member':
      user = users.find(u => !u.isOwner && !u.isAdmin);
      break;
    default:
      user = users[0]; // 默认第一个用户
  }
  
  if (!user) {
    console.error('找不到指定的用户类型');
    return null;
  }
  
  // 更新当前用户
  wx.setStorageSync('userInfo', user);
  
  // 更新全局数据中的用户
  const app = getApp();
  if (app && app.globalData) {
    app.globalData.userInfo = user;
    app.globalData.isLogin = true;
  }
  
  console.log(`已切换为用户: ${user.nickname}`);
  return user;
}

/**
 * 初始化模拟家族数据
 */
function initMockGenealogies() {
  // 创建三个模拟家族
  const genealogies = [
    {
      id: 'genealogy-001',
      name: '测试家族一',
      description: '超级管理员创建的家族，没有权限限制',
      coverImage: '/assets/images/genealogy_cover1.png',
      memberCount: 100,
      createTime: '2023-01-15 08:30:00',
      isOwner: true,  // 超级管理员拥有家族和家族成员所拥有的权限
      ownerId: 'admin-001'
    },
    {
      id: 'genealogy-002',
      name: '测试家族二',
      description: '家族长创建的家族，受到免费订阅计划的限制',
      coverImage: '/assets/images/genealogy_cover2.png',
      memberCount: 10,
      createTime: '2023-02-15 10:45:00',
      isOwner: true,  // 家族长拥有家族和家族成员所拥有的权限
      ownerId: 'owner-001'
    },
    {
      id: 'genealogy-003',
      name: '测试家族三',
      description: '普通成员加入的家族，没有管理权限限制',
      coverImage: '/assets/images/genealogy_cover3.png',
      memberCount: 50,
      createTime: '2023-03-15 16:20:00',
      isOwner: false,  // 普通成员没有家族成员所拥有的权限
      ownerId: 'owner-001'  // 原家族长创建的家族
    }
  ];
  
  // 将家族信息存储到本地
  wx.setStorageSync('genealogies', genealogies);
  console.log('已初始化模拟家族数据');
  return genealogies;
}

/**
 * 初始化模拟通知数据
 */
function initMockNotifications() {
  // 通知类型
  const notificationTypes = ['系统消息', '更新通知', '活动通知', '功能提示', '订阅提醒'];
  
  // 创建模拟通知数据
  const mockNotifications = [];
  
  // 生成30条测试通知
  for (let i = 0; i < 30; i++) {
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const isRead = Math.random() > 0.6; // 40%未读
    const date = new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000);
    const time = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    mockNotifications.push({
      id: `notice-${1000 + i}`,
      title: `${type}${i + 1}`,
      content: `这是一条${type}，用于测试通知管理功能。内容编号: ${i + 1}`,
      type: type,
      time: time,
      read: isRead,
      recalled: Math.random() > 0.9, // 10%被撤回
      sendCount: Math.floor(Math.random() * 100) + 20,
      readCount: Math.floor(Math.random() * 80)
    });
  }
  
  // 保存到本地存储
  wx.setStorageSync('notificationHistory', mockNotifications);
  
  console.log('已初始化模拟通知数据');
  return mockNotifications;
}

/**
 * 初始化所有模拟数据
 */
function initAllMockData() {
  const users = initMockUsers();
  const genealogies = initMockGenealogies();
  const notifications = initMockNotifications();
  
  return {
    users,
    genealogies,
    notifications
  };
}

module.exports = {
  initMockUsers,
  initMockGenealogies,
  initMockNotifications,
  initAllMockData,
  switchUser
}; 