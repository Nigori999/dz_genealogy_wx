/**
 * Mock数据服务
 * 提供模拟API数据以便在无后端环境下进行开发
 */

// 初始的模拟数据
let mockData = {
  // 用户信息
  user: {
    id: 'user_001',
    nickname: '当前用户',
    avatar: '/assets/images/avatar_default.png',
    phone: '13800138000',
    email: 'test@example.com',
    createdAt: '2023-01-01T00:00:00Z',
    // 关联到成员ID，表示当前用户关联的家族成员
    memberId: 'mem_001'
  },
  
  // 用户列表 - 用于成员权限管理
  users: [
    {
      id: 'user_001',
      nickname: '当前用户',
      avatar: '/assets/images/avatar_default.png',
      phone: '13800138000',
      email: 'test@example.com',
      joinTime: '2023-01-01T00:00:00Z'
    },
    {
      id: 'user_002',
      nickname: '张三',
      avatar: '/assets/images/avatar_default.png',
      phone: '13900139000',
      email: 'zhangsan@example.com',
      joinTime: '2023-02-05T10:20:00Z'
    },
    {
      id: 'user_003',
      nickname: '李四',
      avatar: '/assets/images/avatar_default.png',
      phone: '13700137000',
      email: 'lisi@example.com',
      joinTime: '2023-03-12T14:30:00Z'
    },
    {
      id: 'user_004',
      nickname: '王五',
      avatar: '/assets/images/avatar_default.png',
      phone: '13600136000',
      email: 'wangwu@example.com',
      joinTime: '2023-04-20T09:15:00Z'
    },
    {
      id: 'user_005',
      nickname: '赵六',
      avatar: '/assets/images/avatar_default.png',
      phone: '13500135000',
      email: 'zhaoliu@example.com',
      joinTime: '2023-05-18T16:40:00Z'
    },
    {
      id: 'user_006',
      nickname: '马七',
      avatar: '/images/avatar_female_default.png',
      phone: '13400134000',
      email: 'maqi@example.com',
      joinTime: '2023-06-22T11:10:00Z'
    },
    {
      id: 'user_101',
      nickname: '表哥',
      avatar: '/assets/images/avatar_default.png',
      phone: '13300133000',
      email: 'cousin@example.com',
      joinTime: '2023-02-01T08:30:00Z'
    }
  ],
  
  // 当前订阅计划
  subscription: {
    id: 'sub_001',
    name: '基础版',
    genealogyLimit: 1,
    memberLimit: 30,
    storageLimit: 512, // MB
    expireDate: '2024-12-31T00:00:00Z'
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
      name: '我的家族',
      description: '记录家族历史，传承家族文化，连接过去与未来。',
      coverImage: '/images/cover_default.png',
      memberCount: 8,
      eventsCount: 5,
      rootMemberId: 'mem_003',
      isOwner: true,
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2023-04-20T14:30:00Z'
    },
    {
      id: 'gen_002',
      name: '亲戚家谱',
      description: '记录远亲家系，了解血脉相连的历史渊源。',
      coverImage: '/images/cover_default.png',
      memberCount: 5,
      eventsCount: 3,
      rootMemberId: 'mem_101',
      isOwner: false,
      createdAt: '2023-02-10T08:30:00Z',
      updatedAt: '2023-05-15T11:20:00Z'
    }
  ],
  
  // 族谱历史
  genealogyHistories: [
    {
      genealogyId: 'gen_001',
      history: '我的家族起源于上世纪初，祖上务农为主，后来子孙逐渐分布在全国各地，从事各行各业。家族重视教育传统，培养了多位知识分子。现代家族成员活跃在科技、教育、医疗等领域，为社会发展贡献力量。家族传统注重诚信、勤劳和互助精神，定期举行家族聚会，传承家风家训。'
    },
    {
      genealogyId: 'gen_002',
      history: '亲戚家族与我家有姻亲关系，同样具有优良的家风传统。家族成员多才多艺，在文化艺术方面有特长。每年春节都会举行家族团聚，共同庆祝传统节日，增进亲情。'
    }
  ],
  
  // 族谱成员
  members: [
    // 我的家族成员
    {
      id: 'mem_001',
      genealogyId: 'gen_001',
      name: '当前用户',
      gender: 'male',
      avatar: '/assets/images/avatar_default.png',
      birthDate: '1985-05-15',
      deathDate: null,
      birthPlace: '北京',
      rank: '长子',
      generation: 3,
      occupation: '工程师',
      education: '大学',
      biography: '家族第三代成员，现从事软件开发工作，对家族历史和文化传承有浓厚兴趣。',
      photos: ['/assets/images/avatar_default.png'],
      parentId: 'mem_002',
      spouseIds: [],
      childrenIds: ['mem_007', 'mem_008'],
      createdAt: '2023-01-15T10:30:00Z',
      updatedAt: '2023-02-10T15:45:00Z'
    },
    {
      id: 'mem_002',
      genealogyId: 'gen_001',
      name: '父亲',
      gender: 'male',
      avatar: '/assets/images/avatar_default.png',
      birthDate: '1955-08-10',
      deathDate: null,
      birthPlace: '上海',
      rank: '长子',
      generation: 2,
      occupation: '教师',
      education: '大学',
      biography: '家族第二代成员，从事教育工作多年，关心家族历史文化的传承。',
      photos: ['/assets/images/avatar_default.png'],
      parentId: 'mem_003',
      spouseIds: ['mem_009'],
      childrenIds: ['mem_001', 'mem_005', 'mem_006'],
      createdAt: '2023-01-15T11:00:00Z',
      updatedAt: '2023-02-10T16:00:00Z'
    },
    {
      id: 'mem_003',
      genealogyId: 'gen_001',
      name: '祖父',
      gender: 'male',
      avatar: '/assets/images/avatar_default.png',
      birthDate: '1930-03-20',
      deathDate: '2010-05-15',
      birthPlace: '河南',
      rank: '族长',
      generation: 1,
      occupation: '农民',
      education: '小学',
      biography: '家族第一代族长，经历过战争年代，勤劳朴实，培养了三个子女。',
      photos: ['/assets/images/avatar_default.png'],
      parentId: null,
      spouseIds: ['mem_004'],
      childrenIds: ['mem_002'],
      createdAt: '2023-01-15T11:30:00Z',
      updatedAt: '2023-02-10T16:15:00Z'
    },
    {
      id: 'mem_004',
      genealogyId: 'gen_001',
      name: '祖母',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '1932-11-05',
      deathDate: '2012-09-20',
      birthPlace: '河南',
      rank: '族长夫人',
      generation: 1,
      occupation: '家庭主妇',
      education: '无',
      biography: '家族第一代族长夫人，相夫教子，勤俭持家，为家族的发展奠定了基础。',
      photos: ['/images/avatar_female_default.png'],
      parentId: null,
      spouseIds: ['mem_003'],
      childrenIds: ['mem_002'],
      createdAt: '2023-01-15T12:00:00Z',
      updatedAt: '2023-02-10T16:30:00Z'
    },
    {
      id: 'mem_005',
      genealogyId: 'gen_001',
      name: '叔叔',
      gender: 'male',
      avatar: '/assets/images/avatar_default.png',
      birthDate: '1958-06-18',
      deathDate: null,
      birthPlace: '上海',
      rank: '次子',
      generation: 2,
      occupation: '医生',
      education: '医科大学',
      biography: '家族第二代成员，从事医疗工作，关心家人健康。',
      photos: ['/assets/images/avatar_default.png'],
      parentId: 'mem_003',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-01-15T12:30:00Z',
      updatedAt: '2023-02-10T16:45:00Z'
    },
    {
      id: 'mem_006',
      genealogyId: 'gen_001',
      name: '姑姑',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '1960-09-25',
      deathDate: null,
      birthPlace: '上海',
      rank: '长女',
      generation: 2,
      occupation: '会计',
      education: '大专',
      biography: '家族第二代成员，性格开朗，是家族聚会的组织者。',
      photos: ['/images/avatar_female_default.png'],
      parentId: 'mem_003',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-01-15T13:00:00Z',
      updatedAt: '2023-02-10T17:00:00Z'
    },
    {
      id: 'mem_007',
      genealogyId: 'gen_001',
      name: '儿子',
      gender: 'male',
      avatar: '/assets/images/avatar_default.png',
      birthDate: '2010-04-12',
      deathDate: null,
      birthPlace: '北京',
      rank: '长子',
      generation: 4,
      occupation: '学生',
      education: '初中',
      biography: '家族第四代成员，正在接受教育，对科技和历史有浓厚兴趣。',
      photos: ['/assets/images/avatar_default.png'],
      parentId: 'mem_001',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-01-15T13:30:00Z',
      updatedAt: '2023-02-10T17:15:00Z'
    },
    {
      id: 'mem_008',
      genealogyId: 'gen_001',
      name: '女儿',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '2012-08-30',
      deathDate: null,
      birthPlace: '北京',
      rank: '长女',
      generation: 4,
      occupation: '学生',
      education: '小学',
      biography: '家族第四代成员，活泼开朗，喜欢艺术和音乐。',
      photos: ['/images/avatar_female_default.png'],
      parentId: 'mem_001',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-01-15T14:00:00Z',
      updatedAt: '2023-02-10T17:30:00Z'
    },
    {
      id: 'mem_009',
      genealogyId: 'gen_001',
      name: '母亲',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '1958-03-25',
      deathDate: null,
      birthPlace: '北京',
      rank: '长女',
      generation: 2,
      occupation: '教师',
      education: '大学',
      biography: '家族第二代成员，温柔贤惠，在教育行业工作多年。',
      photos: ['/images/avatar_female_default.png'],
      parentId: null,
      spouseIds: ['mem_002'],
      childrenIds: ['mem_001', 'mem_005', 'mem_006'],
      createdAt: '2023-01-15T12:15:00Z',
      updatedAt: '2023-02-10T16:35:00Z'
    },
    
    // 亲戚家族成员
    {
      id: 'mem_101',
      genealogyId: 'gen_002',
      name: '表哥',
      gender: 'male',
      avatar: '/assets/images/avatar_default.png',
      birthDate: '1980-07-18',
      deathDate: null,
      birthPlace: '广州',
      rank: '族长',
      generation: 1,
      occupation: '企业家',
      education: '硕士',
      biography: '亲戚家族的族长，事业有成，热心公益，经常组织家族活动。',
      photos: ['/assets/images/avatar_default.png'],
      parentId: null,
      spouseIds: ['mem_102'],
      childrenIds: ['mem_103', 'mem_104'],
      createdAt: '2023-02-10T09:00:00Z',
      updatedAt: '2023-02-10T09:00:00Z'
    },
    {
      id: 'mem_102',
      genealogyId: 'gen_002',
      name: '表嫂',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '1982-11-05',
      deathDate: null,
      birthPlace: '北京',
      rank: '族长夫人',
      generation: 1,
      occupation: '设计师',
      education: '本科',
      biography: '亲戚家族族长的妻子，性格温和，擅长艺术设计。',
      photos: ['/images/avatar_female_default.png'],
      parentId: null,
      spouseIds: ['mem_101'],
      childrenIds: ['mem_103', 'mem_104'],
      createdAt: '2023-02-10T09:30:00Z',
      updatedAt: '2023-02-10T09:30:00Z'
    },
    {
      id: 'mem_103',
      genealogyId: 'gen_002',
      name: '表侄',
      gender: 'male',
      avatar: '/assets/images/avatar_default.png',
      birthDate: '2005-10-01',
      deathDate: null,
      birthPlace: '北京',
      rank: '长子',
      generation: 2,
      occupation: '学生',
      education: '高中',
      biography: '亲戚家族的下一代，聪明好学，对计算机科学有浓厚兴趣。',
      photos: ['/assets/images/avatar_default.png'],
      parentId: 'mem_101',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-02-10T10:00:00Z',
      updatedAt: '2023-02-10T10:00:00Z'
    },
    {
      id: 'mem_104',
      genealogyId: 'gen_002',
      name: '表侄女',
      gender: 'female',
      avatar: '/images/avatar_female_default.png',
      birthDate: '2008-05-15',
      deathDate: null,
      birthPlace: '北京',
      rank: '长女',
      generation: 2,
      occupation: '学生',
      education: '初中',
      biography: '亲戚家族的下一代，性格活泼，擅长舞蹈和音乐。',
      photos: ['/images/avatar_female_default.png'],
      parentId: 'mem_101',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-02-10T10:30:00Z',
      updatedAt: '2023-02-10T10:30:00Z'
    },
    {
      id: 'mem_105',
      genealogyId: 'gen_002',
      name: '表弟',
      gender: 'male',
      avatar: '/assets/images/avatar_default.png',
      birthDate: '1983-12-20',
      deathDate: null,
      birthPlace: '上海',
      rank: '次子',
      generation: 1,
      occupation: '工程师',
      education: '本科',
      biography: '亲戚家族的重要成员，从事软件开发工作，与当前用户有共同爱好。',
      photos: ['/assets/images/avatar_default.png'],
      parentId: null,
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-02-10T11:00:00Z',
      updatedAt: '2023-02-10T11:00:00Z'
    }
  ],
  
  // 大事记
  events: [
    // 我的家族大事记
    {
      id: 'evt_001',
      genealogyId: 'gen_001',
      title: '家族创立',
      description: '祖父正式创立家族谱系，开始记录家族历史。',
      date: '1960-10-01',
      type: 'achievement',
      location: '河南',
      media: ['/images/event_photo_1.jpg'],
      relatedMembers: ['mem_003', 'mem_004'],
      createdAt: '2023-01-16T10:00:00Z',
      updatedAt: '2023-02-11T12:00:00Z'
    },
    {
      id: 'evt_002',
      genealogyId: 'gen_001',
      title: '父亲出生',
      description: '家族第二代重要成员出生。',
      date: '1955-08-10',
      type: 'birth',
      location: '上海',
      media: ['/images/event_photo_2.jpg'],
      relatedMembers: ['mem_002', 'mem_003', 'mem_004'],
      createdAt: '2023-01-16T10:30:00Z',
      updatedAt: '2023-02-11T12:30:00Z'
    },
    {
      id: 'evt_003',
      genealogyId: 'gen_001',
      title: '当前用户出生',
      description: '家族第三代重要成员出生。',
      date: '1985-05-15',
      type: 'birth',
      location: '北京',
      media: ['/images/event_photo_3.jpg'],
      relatedMembers: ['mem_001', 'mem_002'],
      createdAt: '2023-01-16T11:00:00Z',
      updatedAt: '2023-02-11T13:00:00Z'
    },
    {
      id: 'evt_004',
      genealogyId: 'gen_001',
      title: '祖父去世',
      description: '家族第一代族长去世，家族成员深切哀悼。',
      date: '2010-05-15',
      type: 'death',
      location: '北京',
      media: ['/images/event_photo_4.jpg'],
      relatedMembers: ['mem_003'],
      createdAt: '2023-01-16T11:30:00Z',
      updatedAt: '2023-02-11T13:30:00Z'
    },
    {
      id: 'evt_005',
      genealogyId: 'gen_001',
      title: '家族团聚',
      description: '家族成员在春节期间共聚一堂，庆祝传统节日。',
      date: '2023-01-22',
      type: 'family_gathering',
      location: '北京',
      media: ['/images/event_photo_5.jpg'],
      relatedMembers: ['mem_001', 'mem_002', 'mem_005', 'mem_006', 'mem_007', 'mem_008'],
      createdAt: '2023-01-16T12:00:00Z',
      updatedAt: '2023-02-11T14:00:00Z'
    },
    
    // 亲戚家族大事记
    {
      id: 'evt_101',
      genealogyId: 'gen_002',
      title: '表哥创业',
      description: '表哥成功创办自己的公司，开始创业之路。',
      date: '2010-07-18',
      type: 'achievement',
      location: '广州',
      media: ['/images/event_photo_6.jpg'],
      relatedMembers: ['mem_101'],
      createdAt: '2023-02-12T10:00:00Z',
      updatedAt: '2023-02-12T10:00:00Z'
    },
    {
      id: 'evt_102',
      genealogyId: 'gen_002',
      title: '表哥婚礼',
      description: '表哥与表嫂举行婚礼，亲友共同见证。',
      date: '2004-09-10',
      type: 'wedding',
      location: '北京',
      media: ['/images/event_photo_7.jpg'],
      relatedMembers: ['mem_101', 'mem_102'],
      createdAt: '2023-02-12T10:30:00Z',
      updatedAt: '2023-02-12T10:30:00Z'
    },
    {
      id: 'evt_103',
      genealogyId: 'gen_002',
      title: '亲戚家庭聚会',
      description: '亲戚家族举行家庭聚会，增进亲情。',
      date: '2022-10-01',
      type: 'family_gathering',
      location: '北京',
      media: ['/images/event_photo_8.jpg'],
      relatedMembers: ['mem_101', 'mem_102', 'mem_103', 'mem_104', 'mem_105'],
      createdAt: '2023-02-12T11:00:00Z',
      updatedAt: '2023-02-12T11:00:00Z'
    }
  ],
  
  // 族谱席位分配
  seatAllocations: [
    {
      genealogyId: 'gen_001',
      totalSeats: 20, // 当前用户家族的总席位数
      usedSeats: 8,   // 已使用的席位数
      baseSeats: 10,  // 基础席位数
      additionalSeats: 10, // 额外购买的席位数
      updatedAt: '2023-09-01T10:00:00Z'
    },
    {
      genealogyId: 'gen_002',
      totalSeats: 10, // 亲戚家族的总席位数
      usedSeats: 5,   // 已使用的席位数
      baseSeats: 10,  // 基础席位数
      additionalSeats: 0, // 额外购买的席位数
      updatedAt: '2023-09-01T10:00:00Z'
    }
  ],
  
  // 族谱成员权限
  memberRoles: [
    {
      genealogyId: 'gen_001',
      userId: 'user_001',
      role: 'admin',
      updatedAt: '2023-06-15T10:00:00Z'
    },
    {
      genealogyId: 'gen_001',
      userId: 'user_002',
      role: 'editor',
      updatedAt: '2023-06-15T10:00:00Z'
    },
    {
      genealogyId: 'gen_001',
      userId: 'user_003',
      role: 'viewer',
      updatedAt: '2023-07-01T10:00:00Z'
    },
    {
      genealogyId: 'gen_001',
      userId: 'user_004',
      role: 'editor',
      updatedAt: '2023-07-15T10:00:00Z'
    },
    {
      genealogyId: 'gen_001',
      userId: 'user_005',
      role: 'viewer',
      updatedAt: '2023-08-01T10:00:00Z'
    },
    {
      genealogyId: 'gen_001',
      userId: 'user_006',
      role: 'viewer',
      updatedAt: '2023-08-15T10:00:00Z'
    },
    {
      genealogyId: 'gen_002',
      userId: 'user_101',
      role: 'admin',
      updatedAt: '2023-06-15T10:00:00Z'
    },
    {
      genealogyId: 'gen_002',
      userId: 'user_001',
      role: 'viewer',
      updatedAt: '2023-06-20T10:00:00Z'
    },
    {
      genealogyId: 'gen_002',
      userId: 'user_003',
      role: 'editor',
      updatedAt: '2023-07-05T10:00:00Z'
    }
  ],
  
  // 邀请码
  inviteCodes: [
    {
      code: 'INVITE123',
      genealogyId: 'gen_001',
      createdBy: 'user_001',
      createdAt: '2023-08-10T10:00:00Z',
      expiresAt: '2023-08-17T10:00:00Z',
      usageLimit: 10,
      usageCount: 3,
      expired: true
    },
    {
      code: 'INVITE456',
      genealogyId: 'gen_001',
      createdBy: 'user_001',
      createdAt: '2023-09-20T10:00:00Z',
      expiresAt: '2023-09-27T10:00:00Z',
      usageLimit: 10,
      usageCount: 1,
      expired: false
    },
    {
      code: 'INVITE789',
      genealogyId: 'gen_002',
      createdBy: 'user_101',
      createdAt: '2023-09-25T10:00:00Z',
      expiresAt: '2023-10-02T10:00:00Z',
      usageLimit: 10,
      usageCount: 0,
      expired: false
    }
  ]
};

// 添加更多mock数据用于Canvas树图测试
mockData.genealogies.push({
  id: 'gen_003',
  name: '测试家族树',
  description: '这是一个用于测试Canvas树图功能的大型族谱数据',
  coverImage: '/images/genealogy_cover_default.png',
  memberCount: 21,
  eventsCount: 0,
  rootMemberId: 'test_001',
  isOwner: true,
  createdAt: '2023-05-01T08:00:00Z',
  updatedAt: '2023-05-01T08:00:00Z'
});

// 添加测试族谱的成员数据
const testMembers = [
  // 第一代 - 始祖夫妇
  {
    id: 'test_001',
    genealogyId: 'gen_003',
    name: '始祖',
    gender: 'male',
    avatar: '/assets/images/avatar_default.png',
    birthDate: '1900-01-01',
    deathDate: '1980-06-15',
    birthPlace: '北京',
    rank: '始祖',
    generation: 1,
    occupation: '农民',
    biography: '家族第一代族长，创立家业',
    parentId: null,
    spouseIds: ['test_002'],
    childrenIds: ['test_003', 'test_004', 'test_005'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_002',
    genealogyId: 'gen_003',
    name: '始祖妻子',
    gender: 'female',
    avatar: '/images/avatar_female_default.png',
    birthDate: '1905-03-10',
    deathDate: '1985-08-20',
    birthPlace: '北京',
    rank: '始祖妻子',
    generation: 1,
    occupation: '家庭主妇',
    biography: '家族第一代族长夫人',
    parentId: null,
    spouseIds: ['test_001'],
    childrenIds: ['test_003', 'test_004', 'test_005'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  
  // 第二代 - 三个子女
  {
    id: 'test_003',
    genealogyId: 'gen_003',
    name: '长子',
    gender: 'male',
    avatar: '/assets/images/avatar_default.png',
    birthDate: '1925-05-12',
    deathDate: '1995-12-30',
    birthPlace: '北京',
    rank: '长子',
    generation: 2,
    occupation: '教师',
    biography: '始祖长子，毕业于师范学校',
    parentId: 'test_001',
    spouseIds: ['test_006'],
    childrenIds: ['test_007', 'test_008'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_004',
    genealogyId: 'gen_003',
    name: '次子',
    gender: 'male',
    avatar: '/assets/images/avatar_default.png',
    birthDate: '1927-08-15',
    deathDate: '2000-02-10',
    birthPlace: '北京',
    rank: '次子',
    generation: 2,
    occupation: '军人',
    biography: '始祖次子，参军入伍',
    parentId: 'test_001',
    spouseIds: ['test_009'],
    childrenIds: ['test_010', 'test_011', 'test_012'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_005',
    genealogyId: 'gen_003',
    name: '长女',
    gender: 'female',
    avatar: '/images/avatar_female_default.png',
    birthDate: '1930-11-20',
    deathDate: '2010-07-08',
    birthPlace: '北京',
    rank: '长女',
    generation: 2,
    occupation: '医生',
    biography: '始祖长女，医学院毕业',
    parentId: 'test_001',
    spouseIds: ['test_013'],
    childrenIds: ['test_014'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  
  // 第二代配偶
  {
    id: 'test_006',
    genealogyId: 'gen_003',
    name: '长子妻子',
    gender: 'female',
    avatar: '/images/avatar_female_default.png',
    birthDate: '1926-06-05',
    deathDate: '1998-04-15',
    birthPlace: '上海',
    rank: '儿媳',
    generation: 2,
    occupation: '教师',
    biography: '长子的妻子，同为教师',
    parentId: null,
    spouseIds: ['test_003'],
    childrenIds: ['test_007', 'test_008'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_009',
    genealogyId: 'gen_003',
    name: '次子妻子',
    gender: 'female',
    avatar: '/images/avatar_female_default.png',
    birthDate: '1928-03-25',
    deathDate: '2005-09-20',
    birthPlace: '天津',
    rank: '儿媳',
    generation: 2,
    occupation: '护士',
    biography: '次子的妻子，从事医护工作',
    parentId: null,
    spouseIds: ['test_004'],
    childrenIds: ['test_010', 'test_011', 'test_012'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_013',
    genealogyId: 'gen_003',
    name: '长女丈夫',
    gender: 'male',
    avatar: '/assets/images/avatar_default.png',
    birthDate: '1929-02-18',
    deathDate: '2008-11-12',
    birthPlace: '广州',
    rank: '女婿',
    generation: 2,
    occupation: '工程师',
    biography: '长女的丈夫，工科毕业',
    parentId: null,
    spouseIds: ['test_005'],
    childrenIds: ['test_014'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  
  // 第三代 - 长子的子女
  {
    id: 'test_007',
    genealogyId: 'gen_003',
    name: '长孙',
    gender: 'male',
    avatar: '/assets/images/avatar_default.png',
    birthDate: '1950-04-30',
    deathDate: null,
    birthPlace: '北京',
    rank: '孙子',
    generation: 3,
    occupation: '大学教授',
    biography: '长子的长子，学者',
    parentId: 'test_003',
    spouseIds: ['test_015'],
    childrenIds: ['test_016', 'test_017'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_008',
    genealogyId: 'gen_003',
    name: '次孙女',
    gender: 'female',
    avatar: '/images/avatar_female_default.png',
    birthDate: '1952-09-08',
    deathDate: null,
    birthPlace: '北京',
    rank: '孙女',
    generation: 3,
    occupation: '艺术家',
    biography: '长子的长女，从事艺术工作',
    parentId: 'test_003',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  
  // 第三代 - 次子的子女
  {
    id: 'test_010',
    genealogyId: 'gen_003',
    name: '三孙',
    gender: 'male',
    avatar: '/assets/images/avatar_default.png',
    birthDate: '1955-07-15',
    deathDate: null,
    birthPlace: '南京',
    rank: '孙子',
    generation: 3,
    occupation: '企业家',
    biography: '次子的长子，经商有成',
    parentId: 'test_004',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_011',
    genealogyId: 'gen_003',
    name: '四孙',
    gender: 'male',
    avatar: '/assets/images/avatar_default.png',
    birthDate: '1957-11-20',
    deathDate: null,
    birthPlace: '南京',
    rank: '孙子',
    generation: 3,
    occupation: '医生',
    biography: '次子的次子，从医',
    parentId: 'test_004',
    spouseIds: ['test_018'],
    childrenIds: ['test_019'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_012',
    genealogyId: 'gen_003',
    name: '次孙女',
    gender: 'female',
    avatar: '/images/avatar_female_default.png',
    birthDate: '1960-05-03',
    deathDate: null,
    birthPlace: '南京',
    rank: '孙女',
    generation: 3,
    occupation: '教师',
    biography: '次子的长女，继承父业',
    parentId: 'test_004',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  
  // 第三代 - 长女的子女
  {
    id: 'test_014',
    genealogyId: 'gen_003',
    name: '外孙',
    gender: 'male',
    avatar: '/assets/images/avatar_default.png',
    birthDate: '1955-10-10',
    deathDate: null,
    birthPlace: '广州',
    rank: '外孙',
    generation: 3,
    occupation: '工程师',
    biography: '长女的儿子，承父业',
    parentId: 'test_005',
    spouseIds: ['test_020'],
    childrenIds: ['test_021'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  
  // 第三代配偶
  {
    id: 'test_015',
    genealogyId: 'gen_003',
    name: '长孙妻子',
    gender: 'female',
    avatar: '/images/avatar_female_default.png',
    birthDate: '1953-08-12',
    deathDate: null,
    birthPlace: '杭州',
    rank: '孙媳',
    generation: 3,
    occupation: '律师',
    biography: '长孙的妻子，法学院毕业',
    parentId: null,
    spouseIds: ['test_007'],
    childrenIds: ['test_016', 'test_017'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_018',
    genealogyId: 'gen_003',
    name: '四孙妻子',
    gender: 'female',
    avatar: '/images/avatar_female_default.png',
    birthDate: '1960-01-25',
    deathDate: null,
    birthPlace: '武汉',
    rank: '孙媳',
    generation: 3,
    occupation: '护士',
    biography: '四孙的妻子，医院护士长',
    parentId: null,
    spouseIds: ['test_011'],
    childrenIds: ['test_019'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_020',
    genealogyId: 'gen_003',
    name: '外孙妻子',
    gender: 'female',
    avatar: '/images/avatar_female_default.png',
    birthDate: '1958-04-05',
    deathDate: null,
    birthPlace: '深圳',
    rank: '外孙媳',
    generation: 3,
    occupation: '会计师',
    biography: '外孙的妻子，财务专家',
    parentId: null,
    spouseIds: ['test_014'],
    childrenIds: ['test_021'],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  
  // 第四代
  {
    id: 'test_016',
    genealogyId: 'gen_003',
    name: '长曾孙',
    gender: 'male',
    avatar: '/assets/images/avatar_default.png',
    birthDate: '1980-06-18',
    deathDate: null,
    birthPlace: '北京',
    rank: '曾孙',
    generation: 4,
    occupation: '程序员',
    biography: '长孙的长子，IT工程师',
    parentId: 'test_007',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_017',
    genealogyId: 'gen_003',
    name: '长曾孙女',
    gender: 'female',
    avatar: '/images/avatar_female_default.png',
    birthDate: '1982-12-03',
    deathDate: null,
    birthPlace: '北京',
    rank: '曾孙女',
    generation: 4,
    occupation: '医生',
    biography: '长孙的长女，儿科医生',
    parentId: 'test_007',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_019',
    genealogyId: 'gen_003',
    name: '次曾孙',
    gender: 'male',
    avatar: '/assets/images/avatar_default.png',
    birthDate: '1985-10-10',
    deathDate: null,
    birthPlace: '南京',
    rank: '曾孙',
    generation: 4,
    occupation: '教师',
    biography: '四孙的儿子，中学教师',
    parentId: 'test_011',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  },
  {
    id: 'test_021',
    genealogyId: 'gen_003',
    name: '外曾孙',
    gender: 'male',
    avatar: '/assets/images/avatar_default.png',
    birthDate: '1988-05-20',
    deathDate: null,
    birthPlace: '广州',
    rank: '外曾孙',
    generation: 4,
    occupation: '设计师',
    biography: '外孙的儿子，UI设计师',
    parentId: 'test_014',
    spouseIds: [],
    childrenIds: [],
    createdAt: '2023-05-01T08:00:00Z',
    updatedAt: '2023-05-01T08:00:00Z'
  }
];

// 统一替换所有createAt和updateAt为静态日期字符串
for (let i = 0; i < testMembers.length; i++) {
  testMembers[i].createdAt = '2023-05-01T08:00:00Z';
  testMembers[i].updatedAt = '2023-05-01T08:00:00Z';
}

// 将测试成员添加到mock数据中
mockData.members = [...mockData.members, ...testMembers];

// 保存初始数据的深拷贝，用于重置功能
const initialMockData = JSON.parse(JSON.stringify(mockData));

// 添加通知模拟数据
let mockNotifications = [
  {
    id: '1',
    title: '族谱邀请',
    content: '李大山邀请您加入"李氏家族"族谱',
    type: 'invite',
    relatedId: '1',
    read: false,
    createdAt: '2023-10-15T08:30:00Z'
  },
  {
    id: '2',
    title: '新成员加入',
    content: '王小明加入了"我的家族"族谱',
    type: 'member_join',
    relatedId: '2',
    read: true,
    createdAt: '2023-10-10T14:20:00Z'
  },
  {
    id: '3',
    title: '家族大事记已添加',
    content: '新的家族大事记已添加: "家族百年纪念"',
    type: 'event_add',
    relatedId: '3',
    read: false,
    createdAt: '2023-10-05T11:15:00Z'
  },
  {
    id: '4',
    title: '订阅到期提醒',
    content: '您的"基础版"订阅将在30天后到期',
    type: 'subscription_expiring',
    relatedId: null,
    read: false,
    createdAt: '2023-10-01T09:00:00Z'
  },
  {
    id: '5',
    title: '族谱信息更新',
    content: '张叔叔更新了族谱"我的家族"的基本信息',
    type: 'genealogy_update',
    relatedId: '1',
    read: true,
    createdAt: '2023-09-28T16:45:00Z'
  }
];

let mockNotificationSettings = {
  pushEnabled: true,
  emailEnabled: true,
  notificationTypes: {
    invite: true,
    member_join: true,
    event_add: true,
    subscription_expiring: true,
    genealogy_update: true
  }
};

// API请求延迟时间（毫秒）
const API_DELAY = 300;

// 模拟API请求
function simulateApiRequest(data, error = null, delay = API_DELAY) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    }, delay);
  });
}

// 生成唯一ID
function generateId(prefix) {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${randomStr}`;
}

// 获取当前时间ISO字符串
function getCurrentISOString() {
  return new Date().toISOString();
}

// API方法
const mockApi = {
  // 用户相关API
  user: {
    // 获取用户信息
    async getUserInfo() {
      return simulateApiRequest(mockData.user);
    },
    
    // 更新用户信息
    async updateProfile(userData) {
      mockData.user = { ...mockData.user, ...userData, updatedAt: getCurrentISOString() };
      return simulateApiRequest(mockData.user);
    },
    
    // 获取用户列表
    async getUsers() {
      return simulateApiRequest(mockData.users);
    }
  },
  
  // 族谱相关API
  genealogy: {
    // 获取族谱列表
    async getGenealogies() {
      return simulateApiRequest(mockData.genealogies);
    },
    
    // 获取单个族谱
    async getGenealogy(genealogyId) {
      const genealogy = mockData.genealogies.find(g => g.id === genealogyId);
      if (!genealogy) {
        return simulateApiRequest(null, new Error('族谱不存在'));
      }
      return simulateApiRequest(genealogy);
    },
    
    // 创建族谱
    async createGenealogy(genealogyData) {
    const newGenealogy = {
      id: generateId('gen'),
        ...genealogyData,
        memberCount: 1,
      eventsCount: 0,
      isOwner: true,
        createdAt: getCurrentISOString(),
        updatedAt: getCurrentISOString()
    };
    
    mockData.genealogies.push(newGenealogy);
      return simulateApiRequest(newGenealogy);
    },
    
    // 更新族谱
    async updateGenealogy(genealogyId, genealogyData) {
      const index = mockData.genealogies.findIndex(g => g.id === genealogyId);
      if (index === -1) {
        return simulateApiRequest(null, new Error('族谱不存在'));
      }
      
      mockData.genealogies[index] = {
        ...mockData.genealogies[index],
        ...genealogyData,
        updatedAt: getCurrentISOString()
      };
      
      return simulateApiRequest(mockData.genealogies[index]);
    },
    
    // 删除族谱
    async deleteGenealogy(genealogyId) {
      const index = mockData.genealogies.findIndex(g => g.id === genealogyId);
    if (index === -1) {
        return simulateApiRequest(null, new Error('族谱不存在'));
      }
      
      mockData.genealogies.splice(index, 1);
      // 同时删除相关成员和事件
      mockData.members = mockData.members.filter(m => m.genealogyId !== genealogyId);
      mockData.events = mockData.events.filter(e => e.genealogyId !== genealogyId);
      
      return simulateApiRequest({ success: true });
    },
    
    // 获取族谱历史
    async getGenealogistory(genealogyId) {
      const history = mockData.genealogyHistories.find(h => h.genealogyId === genealogyId);
    if (!history) {
        return simulateApiRequest(null, new Error('族谱历史不存在'));
      }
      return simulateApiRequest(history);
    },
    
    // 更新族谱历史
    async updateGenealogistory(genealogyId, historyData) {
      const index = mockData.genealogyHistories.findIndex(h => h.genealogyId === genealogyId);
    if (index === -1) {
        // 如果不存在则创建
      const newHistory = {
          genealogyId,
          history: historyData.history
      };
      mockData.genealogyHistories.push(newHistory);
        return simulateApiRequest(newHistory);
    }
    
    mockData.genealogyHistories[index] = {
      ...mockData.genealogyHistories[index],
        history: historyData.history
      };
      
      return simulateApiRequest(mockData.genealogyHistories[index]);
    },
    
    /**
     * 获取族谱席位分配信息
     * @param {String} genealogyId - 族谱ID
     * @returns {Promise} 席位分配信息
     */
    async getSeatAllocation(genealogyId) {
      const allocation = mockData.seatAllocations.find(s => s.genealogyId === genealogyId);
      return simulateApiRequest(allocation || {
        genealogyId,
        totalSeats: 10,
        usedSeats: 0,
        baseSeats: 10,
        additionalSeats: 0,
        updatedAt: getCurrentISOString()
      });
    },
    
    /**
     * 更新成员角色
     * @param {String} genealogyId - 族谱ID
     * @param {String} memberId - 成员ID
     * @param {Object} data - 角色信息
     * @returns {Promise} 更新结果
     */
    async updateMemberRole(genealogyId, memberId, data) {
      let memberRole = mockData.memberRoles.find(r => r.genealogyId === genealogyId && r.userId === memberId);
      
      if (memberRole) {
        // 更新现有角色
        memberRole.role = data.role || memberRole.role;
        memberRole.permissions = data.permissions || memberRole.permissions;
        memberRole.updatedAt = getCurrentISOString();
      } else {
        // 创建新角色
        memberRole = {
          genealogyId,
          userId: memberId,
          role: data.role || 'viewer',
          permissions: data.permissions || [],
          updatedAt: getCurrentISOString()
        };
        mockData.memberRoles.push(memberRole);
      }
      
      return simulateApiRequest(memberRole);
    },
    
    /**
     * 移除成员席位
     * @param {String} genealogyId - 族谱ID
     * @param {String} memberId - 成员ID
     * @returns {Promise} 移除结果
     */
    async removeMemberSeat(genealogyId, memberId) {
      // 从角色记录中移除
      const roleIndex = mockData.memberRoles.findIndex(r => r.genealogyId === genealogyId && r.userId === memberId);
      if (roleIndex !== -1) {
        mockData.memberRoles.splice(roleIndex, 1);
      }
      
      // 减少已使用席位数量
      const allocation = mockData.seatAllocations.find(s => s.genealogyId === genealogyId);
      if (allocation && allocation.usedSeats > 0) {
        allocation.usedSeats -= 1;
      }
      
      return simulateApiRequest({ success: true });
    },
    
    /**
     * 分配席位
     * @param {String} genealogyId - 族谱ID
     * @param {Object} data - 席位数据
     * @returns {Promise} 分配结果
     */
    async allocateSeats(genealogyId, data) {
      const allocation = mockData.seatAllocations.find(s => s.genealogyId === genealogyId);
      
      if (allocation) {
        allocation.additionalSeats += (data.additionalSeats || 0);
        allocation.totalSeats = allocation.baseSeats + allocation.additionalSeats;
        allocation.updatedAt = getCurrentISOString();
      } else {
        // 创建新的席位分配记录
        const newAllocation = {
          genealogyId,
          totalSeats: 10 + (data.additionalSeats || 0),
          usedSeats: 0,
          baseSeats: 10,
          additionalSeats: data.additionalSeats || 0,
          updatedAt: getCurrentISOString()
        };
        mockData.seatAllocations.push(newAllocation);
      }
      
      return simulateApiRequest({ success: true });
    }
  },
  
  // 族谱成员相关API
  member: {
    // 获取族谱成员列表
    async getMembers(genealogyId) {
      return simulateApiRequest(mockData.members.filter(m => m.genealogyId === genealogyId));
    },
    
    // 获取单个成员
    async getMember(memberId) {
      const member = mockData.members.find(m => m.id === memberId);
    if (!member) {
        return simulateApiRequest(null, new Error('成员不存在'));
      }
      return simulateApiRequest(member);
    },
    
    // 创建成员
    async createMember(memberData) {
    const newMember = {
      id: generateId('mem'),
        ...memberData,
        spouseIds: memberData.spouseIds || [],
        childrenIds: memberData.childrenIds || [],
        photos: memberData.photos || [],
        createdAt: getCurrentISOString(),
        updatedAt: getCurrentISOString()
      };
      
      mockData.members.push(newMember);
      
      // 更新相关族谱成员数量
      const genealogyIndex = mockData.genealogies.findIndex(g => g.id === newMember.genealogyId);
      if (genealogyIndex !== -1) {
        mockData.genealogies[genealogyIndex].memberCount += 1;
      }
      
      return simulateApiRequest(newMember);
    },
    
    // 更新成员
    async updateMember(memberId, memberData) {
      const index = mockData.members.findIndex(m => m.id === memberId);
    if (index === -1) {
        return simulateApiRequest(null, new Error('成员不存在'));
    }
    
    mockData.members[index] = {
      ...mockData.members[index],
        ...memberData,
        updatedAt: getCurrentISOString()
      };
      
      return simulateApiRequest(mockData.members[index]);
    },
    
    // 删除成员
    async deleteMember(memberId) {
      const index = mockData.members.findIndex(m => m.id === memberId);
      if (index === -1) {
        return simulateApiRequest(null, new Error('成员不存在'));
      }
      
      const member = mockData.members[index];
      
      // 更新相关族谱成员数量
      const genealogyIndex = mockData.genealogies.findIndex(g => g.id === member.genealogyId);
      if (genealogyIndex !== -1) {
        mockData.genealogies[genealogyIndex].memberCount -= 1;
      }
      
      // 从其他成员的关联关系中移除
      mockData.members.forEach(m => {
        if (m.spouseIds.includes(memberId)) {
          m.spouseIds = m.spouseIds.filter(id => id !== memberId);
        }
        if (m.childrenIds.includes(memberId)) {
          m.childrenIds = m.childrenIds.filter(id => id !== memberId);
        }
        if (m.parentId === memberId) {
          m.parentId = null;
        }
      });
      
      mockData.members.splice(index, 1);
      
      return simulateApiRequest({ success: true });
    }
  },
  
  // 大事记相关API
  event: {
    // 获取大事记列表
    async getEvents(genealogyId) {
      return simulateApiRequest(mockData.events.filter(e => e.genealogyId === genealogyId));
    },
    
    // 获取单个大事记
    async getEvent(eventId) {
      const event = mockData.events.find(e => e.id === eventId);
    if (!event) {
        return simulateApiRequest(null, new Error('大事记不存在'));
      }
      return simulateApiRequest(event);
    },
    
    // 创建大事记
    async createEvent(eventData) {
    const newEvent = {
      id: generateId('evt'),
        ...eventData,
        media: eventData.media || [],
        relatedMembers: eventData.relatedMembers || [],
        createdAt: getCurrentISOString(),
        updatedAt: getCurrentISOString()
    };
    
    mockData.events.push(newEvent);
    
      // 更新相关族谱事件数量
      const genealogyIndex = mockData.genealogies.findIndex(g => g.id === newEvent.genealogyId);
      if (genealogyIndex !== -1) {
        mockData.genealogies[genealogyIndex].eventsCount += 1;
      }
      
      return simulateApiRequest(newEvent);
    },
    
    // 更新大事记
    async updateEvent(eventId, eventData) {
      const index = mockData.events.findIndex(e => e.id === eventId);
    if (index === -1) {
        return simulateApiRequest(null, new Error('大事记不存在'));
    }
    
    mockData.events[index] = {
      ...mockData.events[index],
        ...eventData,
        updatedAt: getCurrentISOString()
      };
      
      return simulateApiRequest(mockData.events[index]);
    },
    
    // 删除大事记
    async deleteEvent(eventId) {
      const index = mockData.events.findIndex(e => e.id === eventId);
      if (index === -1) {
        return simulateApiRequest(null, new Error('大事记不存在'));
      }
      
      const event = mockData.events[index];
      
      // 更新相关族谱事件数量
      const genealogyIndex = mockData.genealogies.findIndex(g => g.id === event.genealogyId);
      if (genealogyIndex !== -1) {
        mockData.genealogies[genealogyIndex].eventsCount -= 1;
      }
      
      mockData.events.splice(index, 1);
      
      return simulateApiRequest({ success: true });
    }
  },
  
  // 订阅相关API
  subscription: {
    // 获取当前订阅
    async getCurrentSubscription() {
      return simulateApiRequest(mockData.subscription);
    },
    
    // 获取订阅计划列表
    async getSubscriptionPlans() {
      return simulateApiRequest(mockData.subscriptionPlans);
    },
    
    // 更新订阅
    async updateSubscription(subscriptionData) {
      mockData.subscription = {
        ...mockData.subscription,
        ...subscriptionData
      };
      
      return simulateApiRequest(mockData.subscription);
    }
  },
  
  // 邀请码相关API
  invite: {
    // 获取邀请码列表
    async getInviteCodes(genealogyId) {
      const codes = mockData.inviteCodes.filter(c => c.genealogyId === genealogyId);
      return simulateApiRequest(codes);
    },
    
    // 创建邀请码
    async createInviteCode(codeData) {
      const newCode = {
        code: codeData.code || `CODE${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        ...codeData,
        createdAt: getCurrentISOString(),
        usageCount: 0
      };
      
      mockData.inviteCodes.push(newCode);
      
      return simulateApiRequest(newCode);
    },
    
    // 验证邀请码
    async verifyInviteCode(code) {
      const inviteCode = mockData.inviteCodes.find(c => c.code === code);
      if (!inviteCode) {
        return simulateApiRequest(null, new Error('邀请码不存在'));
      }
      
      if (inviteCode.expiresAt && new Date(inviteCode.expiresAt) < new Date()) {
        return simulateApiRequest(null, new Error('邀请码已过期'));
      }
      
      if (inviteCode.usageLimit && inviteCode.usageCount >= inviteCode.usageLimit) {
        return simulateApiRequest(null, new Error('邀请码已达使用上限'));
      }
      
      // 查找对应的族谱
      const genealogy = mockData.genealogies.find(g => g.id === inviteCode.genealogyId);
      if (!genealogy) {
        return simulateApiRequest(null, new Error('对应族谱不存在'));
      }
      
      return simulateApiRequest({
        inviteCode,
        genealogy
      });
    },
    
    // 接受邀请
    async acceptInvite(code) {
      const inviteCode = mockData.inviteCodes.find(c => c.code === code);
      if (!inviteCode) {
        return simulateApiRequest(null, new Error('邀请码不存在'));
      }
      
      inviteCode.usageCount += 1;
      
      // 将族谱添加到用户的族谱列表中
      const genealogy = mockData.genealogies.find(g => g.id === inviteCode.genealogyId);
      if (genealogy && !mockData.genealogies.some(g => g.id === genealogy.id)) {
        mockData.genealogies.push({
          ...genealogy,
          isOwner: false
        });
      }
      
      return simulateApiRequest({ success: true });
    }
  },
  
  // 通知相关API
  notification: {
    // 获取通知列表
    async getNotifications() {
      return simulateApiRequest(mockNotifications);
    },
    
    // 标记通知为已读
    async markAsRead(notificationId) {
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      }
      return simulateApiRequest({ success: true });
    },
    
    // 标记所有通知为已读
    async markAllAsRead() {
    mockNotifications.forEach(n => {
      n.read = true;
    });
      return simulateApiRequest({ success: true });
    },
    
    // 获取通知设置
    async getNotificationSettings() {
      return simulateApiRequest(mockNotificationSettings);
    },
    
    // 更新通知设置
    async updateNotificationSettings(settings) {
  mockNotificationSettings = {
    ...mockNotificationSettings,
    ...settings
  };
      return simulateApiRequest(mockNotificationSettings);
    }
  },
  
  // 数据管理
  data: {
    // 重置所有模拟数据
    async resetData() {
      mockData = JSON.parse(JSON.stringify(initialMockData));
      mockNotifications = [
        {
          id: '1',
          title: '族谱邀请',
          content: '李大山邀请您加入"李氏家族"族谱',
          type: 'invite',
          relatedId: '1',
          read: false,
          createdAt: '2023-10-15T08:30:00Z'
        },
        {
          id: '2',
          title: '新成员加入',
          content: '王小明加入了"我的家族"族谱',
          type: 'member_join',
          relatedId: '2',
          read: true,
          createdAt: '2023-10-10T14:20:00Z'
        },
        {
          id: '3',
          title: '家族大事记已添加',
          content: '新的家族大事记已添加: "家族百年纪念"',
          type: 'event_add',
          relatedId: '3',
          read: false,
          createdAt: '2023-10-05T11:15:00Z'
        },
        {
          id: '4',
          title: '订阅到期提醒',
          content: '您的"基础版"订阅将在30天后到期',
          type: 'subscription_expiring',
          relatedId: null,
          read: false,
          createdAt: '2023-10-01T09:00:00Z'
        },
        {
          id: '5',
          title: '族谱信息更新',
          content: '张叔叔更新了族谱"我的家族"的基本信息',
          type: 'genealogy_update',
          relatedId: '1',
          read: true,
          createdAt: '2023-09-28T16:45:00Z'
        }
      ];
      return simulateApiRequest({ success: true });
    }
  }
};

module.exports = mockApi;