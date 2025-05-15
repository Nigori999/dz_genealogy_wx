/**
 * Mock数据服务
 * 提供模拟API数据以便在无后端环境下进行开发
 */

// 初始的模拟数据
let mockData = {
  // 用户信息
  user: {
    id: 'user_001',
    nickname: '张三',
    avatar: '/assets/images/avatar_default.png',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    createdAt: '2023-01-01T00:00:00Z'
  },
  
  // 当前订阅计划
  subscription: {
    id: 'sub_001',
    name: '免费版',
    genealogyLimit: 1,
    memberLimit: 10,
    storageLimit: 100, // MB
    expireDate: '2026-01-01T00:00:00Z'
  },
  
  // 订阅计划列表
  subscriptionPlans: [
    {
      id: 'plan_001',
      name: '免费版',
      price: 0,
      genealogyLimit: 1,
      memberLimit: 10,
      storageLimit: 100, // MB
      features: ['创建1个族谱', '10个席位', '100MB存储']
    },
    {
      id: 'plan_002',
      name: '家庭版',
      price: 99,
      genealogyLimit: 3,
      memberLimit: 50,
      storageLimit: 1024, // MB
      features: ['创建3个族谱', '50个席位', '1GB存储', '高级统计']
    },
    {
      id: 'plan_003',
      name: '宗族版',
      price: 299,
      genealogyLimit: 10,
      memberLimit: 200,
      storageLimit: 5120, // MB
      features: ['创建10个族谱', '200个席位', '5GB存储', '高级统计', '族谱导出']
    }
  ],
  
  // 族谱列表
  genealogies: [
    {
      id: 'gen_001',
      name: '张氏家族',
      description: '张氏家族始于明朝，源自河南，传承至今已有十二代。',
      coverImage: '/images/genealogy_cover_1.jpg',
      memberCount: 12,
      eventsCount: 8,
      rootMemberId: 'mem_001',
      isOwner: true,
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2023-04-20T14:30:00Z'
    }
  ],
  
  // 族谱历史
  genealogyHistories: [
    {
      genealogyId: 'gen_001',
      history: '张氏家族起源于明朝中叶，祖上曾为朝廷命官，后因战乱迁徙至河南定居。历经数百年变迁，家族传承了忠孝仁义的家风，培养了众多杰出人才。现代族人遍布全国各地，但仍保持着密切联系，定期举行家族聚会，传承家族文化。'
    }
  ],
  
  // 族谱成员
  members: [
    {
      id: 'mem_001',
      genealogyId: 'gen_001',
      name: '张世泽',
      gender: 'male',
      avatar: '/images/avatar_male_default.png',
      birthDate: '1920-05-10',
      deathDate: '1995-08-22',
      birthPlace: '河南郑州',
      rank: '族长',
      generation: 1,
      occupation: '教师',
      education: '师范大学',
      biography: '张世泽先生一生从教，桃李满天下。作为家族第一代族长，他重视家族传统的传承，编撰了张氏家谱初稿。',
      photos: ['/images/member_photo_1.jpg', '/images/member_photo_2.jpg'],
      parentId: null,
      spouseIds: ['mem_002'],
      childrenIds: ['mem_003', 'mem_004'],
      createdAt: '2023-01-15T10:30:00Z',
      updatedAt: '2023-02-10T15:45:00Z'
    },
    {
      id: 'mem_002',
      genealogyId: 'gen_001',
      name: '李红梅',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '1922-11-15',
      deathDate: '1998-04-05',
      birthPlace: '河南开封',
      rank: '族长夫人',
      generation: 1,
      occupation: '家庭主妇',
      education: '小学',
      biography: '李红梅女士勤劳善良，相夫教子，为家族繁衍做出了巨大贡献。',
      photos: ['/images/member_photo_3.jpg'],
      parentId: null,
      spouseIds: ['mem_001'],
      childrenIds: ['mem_003', 'mem_004'],
      createdAt: '2023-01-15T11:00:00Z',
      updatedAt: '2023-02-10T16:00:00Z'
    },
    {
      id: 'mem_003',
      genealogyId: 'gen_001',
      name: '张明',
      gender: 'male',
      avatar: '/images/avatar_male_default.png',
      birthDate: '1945-09-20',
      deathDate: null,
      birthPlace: '河南郑州',
      rank: '长子',
      generation: 2,
      occupation: '医生',
      education: '医科大学',
      biography: '张明先生继承父亲的勤奋好学，成为了一名优秀的医生，在当地医院担任主任医师。',
      photos: ['/images/member_photo_4.jpg'],
      parentId: 'mem_001',
      spouseIds: ['mem_005'],
      childrenIds: ['mem_007', 'mem_008'],
      createdAt: '2023-01-15T11:30:00Z',
      updatedAt: '2023-02-10T16:15:00Z'
    },
    {
      id: 'mem_004',
      genealogyId: 'gen_001',
      name: '张丽',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '1948-03-15',
      deathDate: null,
      birthPlace: '河南郑州',
      rank: '长女',
      generation: 2,
      occupation: '教师',
      education: '师范大学',
      biography: '张丽女士继承父亲的教育事业，成为一名优秀的中学教师，桃李满天下。',
      photos: ['/images/member_photo_5.jpg'],
      parentId: 'mem_001',
      spouseIds: ['mem_006'],
      childrenIds: ['mem_009'],
      createdAt: '2023-01-15T12:00:00Z',
      updatedAt: '2023-02-10T16:30:00Z'
    },
    {
      id: 'mem_005',
      genealogyId: 'gen_001',
      name: '王秀英',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '1947-11-10',
      deathDate: null,
      birthPlace: '河南洛阳',
      rank: '儿媳',
      generation: 2,
      occupation: '护士',
      education: '护理专科',
      biography: '王秀英女士是一名护士长，与丈夫张明共同在医疗领域作出了贡献。',
      photos: ['/images/member_photo_6.jpg'],
      parentId: null,
      spouseIds: ['mem_003'],
      childrenIds: ['mem_007', 'mem_008'],
      createdAt: '2023-01-15T12:30:00Z',
      updatedAt: '2023-02-10T16:45:00Z'
    },
    {
      id: 'mem_006',
      genealogyId: 'gen_001',
      name: '赵建国',
      gender: 'male',
      avatar: '/images/avatar_male_default.png',
      birthDate: '1946-10-01',
      deathDate: null,
      birthPlace: '河南开封',
      rank: '女婿',
      generation: 2,
      occupation: '工程师',
      education: '工科大学',
      biography: '赵建国先生是一名优秀的土木工程师，参与了多项国家重点工程建设。',
      photos: ['/images/member_photo_7.jpg'],
      parentId: null,
      spouseIds: ['mem_004'],
      childrenIds: ['mem_009'],
      createdAt: '2023-01-15T13:00:00Z',
      updatedAt: '2023-02-10T17:00:00Z'
    },
    {
      id: 'mem_007',
      genealogyId: 'gen_001',
      name: '张伟',
      gender: 'male',
      avatar: '/images/avatar_male_default.png',
      birthDate: '1970-05-20',
      deathDate: null,
      birthPlace: '北京',
      rank: '长孙',
      generation: 3,
      occupation: '企业家',
      education: '工商管理硕士',
      biography: '张伟先生是家族中第一位大学生，毕业后创办了自己的公司，成为了一名成功的企业家。',
      photos: ['/images/member_photo_8.jpg'],
      parentId: 'mem_003',
      spouseIds: ['mem_010'],
      childrenIds: ['mem_012'],
      createdAt: '2023-01-15T13:30:00Z',
      updatedAt: '2023-02-10T17:15:00Z'
    },
    {
      id: 'mem_008',
      genealogyId: 'gen_001',
      name: '张芳',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '1975-09-15',
      deathDate: null,
      birthPlace: '北京',
      rank: '次女',
      generation: 3,
      occupation: '医生',
      education: '医学博士',
      biography: '张芳女士继承父母的医学事业，成为了一名优秀的心脏科医生，在国内外享有盛誉。',
      photos: ['/images/member_photo_9.jpg'],
      parentId: 'mem_003',
      spouseIds: ['mem_011'],
      childrenIds: [],
      createdAt: '2023-01-15T14:00:00Z',
      updatedAt: '2023-02-10T17:30:00Z'
    },
    {
      id: 'mem_009',
      genealogyId: 'gen_001',
      name: '赵明',
      gender: 'male',
      avatar: '/images/avatar_male_default.png',
      birthDate: '1972-12-10',
      deathDate: null,
      birthPlace: '上海',
      rank: '外甥',
      generation: 3,
      occupation: '教授',
      education: '物理学博士',
      biography: '赵明先生是一名物理学教授，在量子物理领域有重要研究成果。',
      photos: ['/images/member_photo_10.jpg'],
      parentId: 'mem_004',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-01-15T14:30:00Z',
      updatedAt: '2023-02-10T17:45:00Z'
    },
    {
      id: 'mem_010',
      genealogyId: 'gen_001',
      name: '陈娟',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '1972-03-25',
      deathDate: null,
      birthPlace: '上海',
      rank: '孙媳',
      generation: 3,
      occupation: '会计师',
      education: '财会硕士',
      biography: '陈娟女士是一名注册会计师，负责管理家族企业的财务工作。',
      photos: ['/images/member_photo_11.jpg'],
      parentId: null,
      spouseIds: ['mem_007'],
      childrenIds: ['mem_012'],
      createdAt: '2023-01-15T15:00:00Z',
      updatedAt: '2023-02-10T18:00:00Z'
    },
    {
      id: 'mem_011',
      genealogyId: 'gen_001',
      name: '李强',
      gender: 'male',
      avatar: '/images/avatar_male_default.png',
      birthDate: '1973-07-18',
      deathDate: null,
      birthPlace: '广州',
      rank: '孙女婿',
      generation: 3,
      occupation: '律师',
      education: '法学硕士',
      biography: '李强先生是一名知名律师，专注于商业法律服务。',
      photos: ['/images/member_photo_12.jpg'],
      parentId: null,
      spouseIds: ['mem_008'],
      childrenIds: [],
      createdAt: '2023-01-15T15:30:00Z',
      updatedAt: '2023-02-10T18:15:00Z'
    },
    {
      id: 'mem_012',
      genealogyId: 'gen_001',
      name: '张小雨',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '2000-11-05',
      deathDate: null,
      birthPlace: '北京',
      rank: '曾孙女',
      generation: 4,
      occupation: '学生',
      education: '大学在读',
      biography: '张小雨是家族第四代的代表，现在是一名计算机科学专业的大学生，热爱编程和人工智能。',
      photos: ['/images/member_photo_13.jpg'],
      parentId: 'mem_007',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-01-15T16:00:00Z',
      updatedAt: '2023-02-10T18:30:00Z'
    }
  ],
  
  // 大事记
  events: [
    {
      id: 'evt_001',
      genealogyId: 'gen_001',
      title: '家族创始',
      description: '张世泽先生创立家族族谱，正式确立张氏家族的传承。',
      date: '1950-10-01',
      type: 'achievement',
      location: '河南郑州',
      media: ['/images/event_photo_1.jpg'],
      relatedMembers: ['mem_001'],
      createdAt: '2023-01-16T10:00:00Z',
      updatedAt: '2023-02-11T12:00:00Z'
    },
    {
      id: 'evt_002',
      genealogyId: 'gen_001',
      title: '张世泽先生诞辰',
      description: '家族创始人张世泽先生出生。',
      date: '1920-05-10',
      type: 'birth',
      location: '河南郑州',
      media: ['/images/event_photo_2.jpg'],
      relatedMembers: ['mem_001'],
      createdAt: '2023-01-16T10:30:00Z',
      updatedAt: '2023-02-11T12:30:00Z'
    },
    {
      id: 'evt_003',
      genealogyId: 'gen_001',
      title: '张世泽与李红梅结婚',
      description: '家族创始人张世泽先生与李红梅女士结为夫妻。',
      date: '1944-09-15',
      type: 'wedding',
      location: '河南郑州',
      media: ['/images/event_photo_3.jpg'],
      relatedMembers: ['mem_001', 'mem_002'],
      createdAt: '2023-01-16T11:00:00Z',
      updatedAt: '2023-02-11T13:00:00Z'
    },
    {
      id: 'evt_004',
      genealogyId: 'gen_001',
      title: '张明出生',
      description: '张世泽和李红梅的长子张明出生。',
      date: '1945-09-20',
      type: 'birth',
      location: '河南郑州',
      media: ['/images/event_photo_4.jpg'],
      relatedMembers: ['mem_001', 'mem_002', 'mem_003'],
      createdAt: '2023-01-16T11:30:00Z',
      updatedAt: '2023-02-11T13:30:00Z'
    },
    {
      id: 'evt_005',
      genealogyId: 'gen_001',
      title: '张丽出生',
      description: '张世泽和李红梅的长女张丽出生。',
      date: '1948-03-15',
      type: 'birth',
      location: '河南郑州',
      media: ['/images/event_photo_5.jpg'],
      relatedMembers: ['mem_001', 'mem_002', 'mem_004'],
      createdAt: '2023-01-16T12:00:00Z',
      updatedAt: '2023-02-11T14:00:00Z'
    },
    {
      id: 'evt_006',
      genealogyId: 'gen_001',
      title: '张明与王秀英结婚',
      description: '张明先生与王秀英女士结为夫妻。',
      date: '1969-05-10',
      type: 'wedding',
      location: '北京',
      media: ['/images/event_photo_6.jpg'],
      relatedMembers: ['mem_003', 'mem_005'],
      createdAt: '2023-01-16T12:30:00Z',
      updatedAt: '2023-02-11T14:30:00Z'
    },
    {
      id: 'evt_007',
      genealogyId: 'gen_001',
      title: '张世泽先生去世',
      description: '家族创始人张世泽先生因病去世，享年75岁。',
      date: '1995-08-22',
      type: 'death',
      location: '北京',
      media: ['/images/event_photo_7.jpg'],
      relatedMembers: ['mem_001'],
      createdAt: '2023-01-16T13:00:00Z',
      updatedAt: '2023-02-11T15:00:00Z'
    },
    {
      id: 'evt_008',
      genealogyId: 'gen_001',
      title: '家族第一次大型聚会',
      description: '为纪念张世泽先生逝世五周年，家族举行了第一次大型聚会，所有成员齐聚北京。',
      date: '2000-08-22',
      type: 'other',
      location: '北京',
      media: ['/images/event_photo_8.jpg'],
      relatedMembers: ['mem_003', 'mem_004', 'mem_005', 'mem_006', 'mem_007', 'mem_008', 'mem_009', 'mem_010', 'mem_011'],
      createdAt: '2023-01-16T13:30:00Z',
      updatedAt: '2023-02-11T15:30:00Z'
    }
  ],
  
  // 邀请码
  inviteCodes: [
    {
      code: 'ZHANG123456',
      genealogyId: 'gen_001',
      createdBy: 'user_001',
      createdAt: '2023-05-01T10:00:00Z',
      expiresAt: '2023-12-31T23:59:59Z',
      usageLimit: 10,
      usageCount: 2
    }
  ]
};

/**
 * 生成唯一ID
 * @param {String} prefix - ID前缀
 * @returns {String} 唯一ID
 */
const generateId = (prefix = '') => {
  return prefix + '_' + Math.random().toString(36).substring(2, 10);
};

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = deepClone(obj[key]);
    }
  }
  
  return newObj;
};

/**
 * 添加延迟模拟网络请求
 * @param {Number} ms - 延迟毫秒数
 * @returns {Promise} 延迟Promise
 */
const delay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 响应包装器（添加延迟和成功状态）
 * @param {Any} data - 响应数据
 * @param {Boolean} success - 是否成功
 * @param {String} message - 消息
 * @param {Number} delayMs - 延迟毫秒数
 * @returns {Promise} 响应Promise
 */
const response = async (data, success = true, message = '', delayMs = 500) => {
  await delay(delayMs);
  return {
    code: success ? 0 : 1,
    data: deepClone(data),
    message
  };
};

/**
 * 用户相关API
 */
const userAPI = {
  /**
   * 用户登录
   * @param {Object} data - 登录参数
   * @returns {Promise} 登录结果
   */
  login: async (data) => {
    // 这里简单模拟登录，实际应验证用户名密码
    return response({
      token: 'mock_token_' + Date.now(),
      user: mockData.user
    });
  },

  /**
   * 获取用户信息
   * @returns {Promise} 用户信息
   */
  getUserInfo: async () => {
    return response(mockData.user);
  },

  /**
   * 更新用户信息
   * @param {Object} data - 用户信息
   * @returns {Promise} 更新结果
   */
  updateUserInfo: async (data) => {
    mockData.user = {
      ...mockData.user,
      ...data,
      updatedAt: new Date().toISOString()
    };
    return response(mockData.user);
  },

  /**
   * 上传用户头像
   * @param {String} filePath - 头像文件路径
   * @returns {Promise} 上传结果
   */
  uploadAvatar: async (filePath) => {
    // 模拟上传，返回文件URL
    const url = filePath; // 在实际环境中，这会是服务器返回的URL
    mockData.user.avatar = url;
    return response({
      url
    });
  }
};

/**
 * 族谱相关API
 */
const genealogyAPI = {
  /**
   * 获取我的族谱列表
   * @returns {Promise} 族谱列表
   */
  getMyGenealogies: async () => {
    return response(mockData.genealogies);
  },

  /**
   * 创建族谱
   * @param {Object} data - 族谱信息
   * @returns {Promise} 创建结果
   */
  createGenealogy: async (data) => {
    const newGenealogy = {
      id: generateId('gen'),
      ...data,
      memberCount: 0,
      eventsCount: 0,
      isOwner: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockData.genealogies.push(newGenealogy);
    return response(newGenealogy);
  },

  /**
   * 获取族谱详情
   * @param {String} id - 族谱ID
   * @returns {Promise} 族谱详情
   */
  getGenealogyDetail: async (id) => {
    const genealogy = mockData.genealogies.find(g => g.id === id);
    
    if (!genealogy) {
      return response(null, false, '族谱不存在');
    }
    
    // 更新成员和事件数量
    const members = mockData.members.filter(m => m.genealogyId === id);
    const events = mockData.events.filter(e => e.genealogyId === id);
    
    genealogy.memberCount = members.length;
    genealogy.eventsCount = events.length;
    
    return response(genealogy);
  },

  /**
   * 更新族谱信息
   * @param {String} id - 族谱ID
   * @param {Object} data - 族谱信息
   * @returns {Promise} 更新结果
   */
  updateGenealogy: async (id, data) => {
    const index = mockData.genealogies.findIndex(g => g.id === id);
    
    if (index === -1) {
      return response(null, false, '族谱不存在');
    }
    
    mockData.genealogies[index] = {
      ...mockData.genealogies[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return response(mockData.genealogies[index]);
  },

  /**
   * 获取族谱历史信息
   * @param {String} id - 族谱ID
   * @returns {Promise} 族谱历史
   */
  getGenealogyHistory: async (id) => {
    const history = mockData.genealogyHistories.find(h => h.genealogyId === id);
    
    if (!history) {
      return response({ genealogyId: id, history: '' });
    }
    
    return response(history);
  },

  /**
   * 更新族谱历史信息
   * @param {String} id - 族谱ID
   * @param {Object} data - 族谱历史信息
   * @returns {Promise} 更新结果
   */
  updateGenealogyHistory: async (id, data) => {
    const index = mockData.genealogyHistories.findIndex(h => h.genealogyId === id);
    
    if (index === -1) {
      // 创建新历史
      const newHistory = {
        genealogyId: id,
        history: data.history || ''
      };
      
      mockData.genealogyHistories.push(newHistory);
      return response(newHistory);
    }
    
    // 更新现有历史
    mockData.genealogyHistories[index] = {
      ...mockData.genealogyHistories[index],
      history: data.history || ''
    };
    
    return response(mockData.genealogyHistories[index]);
  },

  /**
   * 生成族谱邀请码
   * @param {String} genealogyId - 族谱ID
   * @returns {Promise} 邀请码结果
   */
  generateInviteCode: async (genealogyId) => {
    // 检查族谱是否存在
    const genealogy = mockData.genealogies.find(g => g.id === genealogyId);
    
    if (!genealogy) {
      return response(null, false, '族谱不存在');
    }
    
    // 生成一个6位随机字母数字组合的邀请码
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = genealogy.name.substring(0, 2).toUpperCase();
    
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // 创建邀请码记录
    const inviteCode = {
      code,
      genealogyId,
      createdBy: mockData.user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后过期
      usageLimit: 10,
      usageCount: 0
    };
    
    mockData.inviteCodes.push(inviteCode);
    
    return response(inviteCode);
  },

  /**
   * 通过邀请码加入族谱
   * @param {String} inviteCode - 邀请码
   * @returns {Promise} 加入结果
   */
  joinGenealogyByCode: async (inviteCode) => {
    // 查找邀请码
    const invite = mockData.inviteCodes.find(i => i.code === inviteCode);
    
    if (!invite) {
      return response(null, false, '邀请码不存在');
    }
    
    // 检查是否过期
    if (new Date(invite.expiresAt) < new Date()) {
      return response(null, false, '邀请码已过期');
    }
    
    // 检查使用次数
    if (invite.usageCount >= invite.usageLimit) {
      return response(null, false, '邀请码已达到使用上限');
    }
    
    // 查找对应族谱
    const genealogy = mockData.genealogies.find(g => g.id === invite.genealogyId);
    
    if (!genealogy) {
      return response(null, false, '族谱不存在');
    }
    
    // 检查是否已加入该族谱
    const isAlreadyJoined = mockData.genealogies.some(g => 
      g.id === invite.genealogyId && g.members && g.members.includes(mockData.user.id)
    );
    
    if (isAlreadyJoined) {
      return response(null, false, '您已加入该族谱');
    }
    
    // 增加使用次数
    invite.usageCount += 1;
    
    // 将该族谱标记为非所有者
    const newGenealogy = {
      ...genealogy,
      isOwner: false
    };
    
    // 添加到用户的族谱列表（确保不重复）
    const existingIndex = mockData.genealogies.findIndex(g => g.id === newGenealogy.id);
    
    if (existingIndex !== -1) {
      mockData.genealogies[existingIndex] = newGenealogy;
    } else {
      mockData.genealogies.push(newGenealogy);
    }
    
    return response(newGenealogy);
  }
};

/**
 * 族谱成员相关API
 */
const memberAPI = {
  /**
   * 获取族谱成员列表
   * @param {String} genealogyId - 族谱ID
   * @returns {Promise} 成员列表
   */
  getMembers: async (genealogyId) => {
    const members = mockData.members.filter(m => m.genealogyId === genealogyId);
    return response(members);
  },

  /**
   * 获取族谱成员详情
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @returns {Promise} 成员详情
   */
  getMemberDetail: async (genealogyId, memberId) => {
    const member = mockData.members.find(m => m.genealogyId === genealogyId && m.id === memberId);
    
    if (!member) {
      return response(null, false, '成员不存在');
    }
    
    return response(member);
  },

  /**
   * 添加族谱成员
   * @param {String} genealogyId - 族谱ID
   * @param {Object} data - 成员信息
   * @returns {Promise} 添加结果
   */
  addMember: async (genealogyId, data) => {
    // 检查族谱是否存在
    const genealogy = mockData.genealogies.find(g => g.id === genealogyId);
    
    if (!genealogy) {
      return response(null, false, '族谱不存在');
    }
    
    // 创建新成员
    const newMember = {
      id: generateId('mem'),
      genealogyId,
      ...data,
      photos: data.photos || [],
      childrenIds: data.childrenIds || [],
      spouseIds: data.spouseIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 更新父母的子女列表
    if (data.parentId) {
      const parent = mockData.members.find(m => m.id === data.parentId);
      if (parent) {
        parent.childrenIds = [...(parent.childrenIds || []), newMember.id];
      }
    }
    
    // 更新配偶的配偶列表
    if (data.spouseIds && data.spouseIds.length > 0) {
      data.spouseIds.forEach(spouseId => {
        const spouse = mockData.members.find(m => m.id === spouseId);
        if (spouse) {
          spouse.spouseIds = [...(spouse.spouseIds || []), newMember.id];
        }
      });
    }
    
    mockData.members.push(newMember);
    
    // 更新族谱成员数量
    genealogy.memberCount = mockData.members.filter(m => m.genealogyId === genealogyId).length;
    
    return response(newMember);
  },

  /**
   * 更新族谱成员信息
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @param {Object} data - 成员信息
   * @returns {Promise} 更新结果
   */
  updateMember: async (genealogyId, memberId, data) => {
    const index = mockData.members.findIndex(m => m.genealogyId === genealogyId && m.id === memberId);
    
    if (index === -1) {
      return response(null, false, '成员不存在');
    }
    
    // 处理关系更新
    if (data.parentId !== mockData.members[index].parentId) {
      // 从旧父母的子女列表中移除
      if (mockData.members[index].parentId) {
        const oldParent = mockData.members.find(m => m.id === mockData.members[index].parentId);
        if (oldParent && oldParent.childrenIds) {
          oldParent.childrenIds = oldParent.childrenIds.filter(id => id !== memberId);
        }
      }
      
      // 添加到新父母的子女列表
      if (data.parentId) {
        const newParent = mockData.members.find(m => m.id === data.parentId);
        if (newParent) {
          newParent.childrenIds = [...(newParent.childrenIds || []), memberId];
        }
      }
    }
    
    // 处理配偶关系更新
    if (JSON.stringify(data.spouseIds) !== JSON.stringify(mockData.members[index].spouseIds)) {
      // 从旧配偶的配偶列表中移除
      if (mockData.members[index].spouseIds) {
        mockData.members[index].spouseIds.forEach(spouseId => {
          const spouse = mockData.members.find(m => m.id === spouseId);
          if (spouse && spouse.spouseIds) {
            spouse.spouseIds = spouse.spouseIds.filter(id => id !== memberId);
          }
        });
      }
      
      // 添加到新配偶的配偶列表
      if (data.spouseIds) {
        data.spouseIds.forEach(spouseId => {
          const spouse = mockData.members.find(m => m.id === spouseId);
          if (spouse) {
            spouse.spouseIds = [...(spouse.spouseIds || []), memberId];
          }
        });
      }
    }
    
    mockData.members[index] = {
      ...mockData.members[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return response(mockData.members[index]);
  },

  /**
   * 删除族谱成员
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @returns {Promise} 删除结果
   */
  deleteMember: async (genealogyId, memberId) => {
    const member = mockData.members.find(m => m.genealogyId === genealogyId && m.id === memberId);
    
    if (!member) {
      return response(null, false, '成员不存在');
    }
    
    // 处理关系
    // 1. 从父母的子女列表中移除
    if (member.parentId) {
      const parent = mockData.members.find(m => m.id === member.parentId);
      if (parent && parent.childrenIds) {
        parent.childrenIds = parent.childrenIds.filter(id => id !== memberId);
      }
    }
    
    // 2. 从配偶的配偶列表中移除
    if (member.spouseIds) {
      member.spouseIds.forEach(spouseId => {
        const spouse = mockData.members.find(m => m.id === spouseId);
        if (spouse && spouse.spouseIds) {
          spouse.spouseIds = spouse.spouseIds.filter(id => id !== memberId);
        }
      });
    }
    
    // 3. 删除相关大事记
    mockData.events = mockData.events.filter(e => 
      e.genealogyId !== genealogyId || !e.relatedMembers.includes(memberId)
    );
    
    // 删除成员
    mockData.members = mockData.members.filter(m => 
      m.genealogyId !== genealogyId || m.id !== memberId
    );
    
    // 更新族谱成员数量
    const genealogy = mockData.genealogies.find(g => g.id === genealogyId);
    if (genealogy) {
      genealogy.memberCount = mockData.members.filter(m => m.genealogyId === genealogyId).length;
    }
    
    return response({ success: true });
  },

  /**
   * 上传成员照片
   * @param {String} genealogyId - 族谱ID
   * @param {String} memberId - 成员ID
   * @param {String} filePath - 照片文件路径
   * @returns {Promise} 上传结果
   */
  uploadMemberPhoto: async (genealogyId, memberId, filePath) => {
    const member = mockData.members.find(m => m.genealogyId === genealogyId && m.id === memberId);
    
    if (!member) {
      return response(null, false, '成员不存在');
    }
    
    // 模拟上传，返回文件URL
    const url = filePath; // 在实际环境中，这会是服务器返回的URL
    
    // 更新成员照片列表
    member.photos = [...(member.photos || []), url];
    
    return response({
      url,
      member
    });
  }
};

/**
 * 大事记相关API
 */
const eventsAPI = {
  /**
   * 获取族谱大事记列表
   * @param {String} genealogyId - 族谱ID
   * @param {Object} params - 查询参数
   * @returns {Promise} 大事记列表
   */
  getEvents: async (genealogyId, params = {}) => {
    let events = mockData.events.filter(e => e.genealogyId === genealogyId);
    
    // 根据成员ID筛选
    if (params.memberId) {
      events = events.filter(e => e.relatedMembers && e.relatedMembers.includes(params.memberId));
    }
    
    // 根据类型筛选
    if (params.type) {
      events = events.filter(e => e.type === params.type);
    }
    
    // 根据日期范围筛选
    if (params.startDate) {
      events = events.filter(e => new Date(e.date) >= new Date(params.startDate));
    }
    
    if (params.endDate) {
      events = events.filter(e => new Date(e.date) <= new Date(params.endDate));
    }
    
    // 排序
    if (params.orderBy) {
      const [field, order] = params.orderBy.split(' ');
      events = events.sort((a, b) => {
        if (field === 'date') {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return order === 'desc' ? dateB - dateA : dateA - dateB;
        }
        return 0;
      });
    }
    
    // 分页
    if (params.limit) {
      const limit = parseInt(params.limit);
      const page = parseInt(params.page) || 1;
      const start = (page - 1) * limit;
      events = events.slice(start, start + limit);
    }
    
    return response(events);
  },

  /**
   * 获取大事记详情
   * @param {String} genealogyId - 族谱ID
   * @param {String} eventId - 大事记ID
   * @returns {Promise} 大事记详情
   */
  getEventDetail: async (genealogyId, eventId) => {
    const event = mockData.events.find(e => e.genealogyId === genealogyId && e.id === eventId);
    
    if (!event) {
      return response(null, false, '大事记不存在');
    }
    
    return response(event);
  },

  /**
   * 添加大事记
   * @param {String} genealogyId - 族谱ID
   * @param {Object} data - 大事记信息
   * @returns {Promise} 添加结果
   */
  addEvent: async (genealogyId, data) => {
    // 检查族谱是否存在
    const genealogy = mockData.genealogies.find(g => g.id === genealogyId);
    
    if (!genealogy) {
      return response(null, false, '族谱不存在');
    }
    
    // 创建新大事记
    const newEvent = {
      id: generateId('evt'),
      genealogyId,
      ...data,
      media: data.media || [],
      relatedMembers: data.relatedMembers || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockData.events.push(newEvent);
    
    // 更新族谱事件数量
    genealogy.eventsCount = mockData.events.filter(e => e.genealogyId === genealogyId).length;
    
    return response(newEvent);
  },

  /**
   * 更新大事记
   * @param {String} genealogyId - 族谱ID
   * @param {String} eventId - 大事记ID
   * @param {Object} data - 大事记信息
   * @returns {Promise} 更新结果
   */
  updateEvent: async (genealogyId, eventId, data) => {
    const index = mockData.events.findIndex(e => e.genealogyId === genealogyId && e.id === eventId);
    
    if (index === -1) {
      return response(null, false, '大事记不存在');
    }
    
    mockData.events[index] = {
      ...mockData.events[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return response(mockData.events[index]);
  },

  /**
   * 删除大事记
   * @param {String} genealogyId - 族谱ID
   * @param {String} eventId - 大事记ID
   * @returns {Promise} 删除结果
   */
  deleteEvent: async (genealogyId, eventId) => {
    const event = mockData.events.find(e => e.genealogyId === genealogyId && e.id === eventId);
    
    if (!event) {
      return response(null, false, '大事记不存在');
    }
    
    // 删除大事记
    mockData.events = mockData.events.filter(e => 
      e.genealogyId !== genealogyId || e.id !== eventId
    );
    
    // 更新族谱事件数量
    const genealogy = mockData.genealogies.find(g => g.id === genealogyId);
    if (genealogy) {
      genealogy.eventsCount = mockData.events.filter(e => e.genealogyId === genealogyId).length;
    }
    
    return response({ success: true });
  },

  /**
   * 上传大事记媒体文件
   * @param {String} genealogyId - 族谱ID
   * @param {String} eventId - 大事记ID
   * @param {String} filePath - 媒体文件路径
   * @param {String} type - 媒体类型（photo/video）
   * @returns {Promise} 上传结果
   */
  uploadEventMedia: async (genealogyId, eventId, filePath, type = 'photo') => {
    const event = mockData.events.find(e => e.genealogyId === genealogyId && e.id === eventId);
    
    if (!event) {
      return response(null, false, '大事记不存在');
    }
    
    // 模拟上传，返回文件URL
    const url = filePath; // 在实际环境中，这会是服务器返回的URL
    
    // 更新大事记媒体列表
    event.media = [...(event.media || []), url];
    
    return response({
      url,
      event
    });
  }
};

/**
 * 支付与订阅相关API
 */
const paymentAPI = {
  /**
   * 获取订阅方案列表
   * @returns {Promise} 订阅方案列表
   */
  getSubscriptionPlans: async () => {
    return response(mockData.subscriptionPlans);
  },

  /**
   * 获取当前订阅信息
   * @returns {Promise} 订阅信息
   */
  getCurrentSubscription: async () => {
    return response(mockData.subscription);
  },

  /**
   * 创建订阅订单
   * @param {Object} data - 订阅参数
   * @returns {Promise} 订单信息
   */
  createSubscriptionOrder: async (data) => {
    // 检查订阅计划是否存在
    const plan = mockData.subscriptionPlans.find(p => p.id === data.planId);
    
    if (!plan) {
      return response(null, false, '订阅计划不存在');
    }
    
    // 创建订单
    const order = {
      id: generateId('order'),
      planId: data.planId,
      price: plan.price,
      userId: mockData.user.id,
      status: 'pending', // pending, success, failed
      createTime: new Date().toISOString()
    };
    
    return response(order);
  },

  /**
   * 支付订单
   * @param {String} orderId - 订单ID
   * @returns {Promise} 支付参数
   */
  payOrder: async (orderId) => {
    // 模拟支付成功，更新订阅信息
    // 在实际环境中，这里会返回微信支付参数
    
    // 假设订单对应的计划ID
    const planId = 'plan_002'; // 家庭版
    const plan = mockData.subscriptionPlans.find(p => p.id === planId);
    
    if (plan) {
      mockData.subscription = {
        ...mockData.subscription,
        id: generateId('sub'),
        name: plan.name,
        genealogyLimit: plan.genealogyLimit,
        memberLimit: plan.memberLimit,
        storageLimit: plan.storageLimit,
        expireDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 一年后过期
      };
    }
    
    return response({
      success: true,
      subscription: mockData.subscription
    });
  }
};

// 导出Mock服务
module.exports = {
  // 方法
  login: userAPI.login,
  getUserInfo: userAPI.getUserInfo,
  updateUserInfo: userAPI.updateUserInfo,
  uploadAvatar: userAPI.uploadAvatar,
  
  getMyGenealogies: genealogyAPI.getMyGenealogies,
  createGenealogy: genealogyAPI.createGenealogy,
  getGenealogyDetail: genealogyAPI.getGenealogyDetail,
  updateGenealogy: genealogyAPI.updateGenealogy,
  getGenealogyHistory: genealogyAPI.getGenealogyHistory,
  updateGenealogyHistory: genealogyAPI.updateGenealogyHistory,
  generateInviteCode: genealogyAPI.generateInviteCode,
  joinGenealogyByCode: genealogyAPI.joinGenealogyByCode,
  
  getMembers: memberAPI.getMembers,
  getMemberDetail: memberAPI.getMemberDetail,
  addMember: memberAPI.addMember,
  updateMember: memberAPI.updateMember,
  deleteMember: memberAPI.deleteMember,
  uploadMemberPhoto: memberAPI.uploadMemberPhoto,
  
  getEvents: eventsAPI.getEvents,
  getEventDetail: eventsAPI.getEventDetail,
  addEvent: eventsAPI.addEvent,
  updateEvent: eventsAPI.updateEvent,
  deleteEvent: eventsAPI.deleteEvent,
  uploadEventMedia: eventsAPI.uploadEventMedia,
  
  getSubscriptionPlans: paymentAPI.getSubscriptionPlans,
  getCurrentSubscription: paymentAPI.getCurrentSubscription,
  createSubscriptionOrder: paymentAPI.createSubscriptionOrder,
  payOrder: paymentAPI.payOrder,
  
  // 数据（用于测试和调试）
  _getMockData: () => deepClone(mockData),
  _setMockData: (data) => {
    mockData = deepClone(data);
    return true;
  },
  _resetMockData: () => {
    // 重置为初始数据
    mockData = deepClone(mockData);
    return true;
  }
};