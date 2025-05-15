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
    avatar: '/images/avatar_male_default.png',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    createdAt: '2023-01-01T00:00:00Z'
  },
  
  // 当前订阅计划
  subscription: {
    id: 'sub_001',
    name: '家庭版',
    genealogyLimit: 3,
    memberLimit: 50,
    storageLimit: 1024, // MB
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
      description: '张氏家族始于明朝，源自河南，传承至今已有十二代。家族以"忠孝传家"为家训，族人遍布全国各地。',
      coverImage: '/images/cover_default.png',
      memberCount: 12,
      eventsCount: 8,
      rootMemberId: 'mem_001',
      isOwner: true,
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2023-04-20T14:30:00Z'
    },
    {
      id: 'gen_002',
      name: '王氏族谱',
      description: '王氏家族起源于宋朝，祖籍山东，家族成员多从事商业和学术研究。',
      coverImage: '/images/cover_default.png',
      memberCount: 15,
      eventsCount: 10,
      rootMemberId: 'mem_101',
      isOwner: true,
      createdAt: '2023-02-10T08:30:00Z',
      updatedAt: '2023-05-15T11:20:00Z'
    },
    {
      id: 'gen_003',
      name: '李氏家谱',
      description: '李氏家族渊源深厚，自唐代以来世代簪缨，家族传承诗礼传家的优良传统。',
      coverImage: '/images/cover_default.png',
      memberCount: 8,
      eventsCount: 6,
      rootMemberId: 'mem_201',
      isOwner: false,
      createdAt: '2023-03-05T14:45:00Z',
      updatedAt: '2023-06-01T09:15:00Z'
    }
  ],
  
  // 族谱历史
  genealogyHistories: [
    {
      genealogyId: 'gen_001',
      history: '张氏家族起源于明朝中叶，祖上曾为朝廷命官，后因战乱迁徙至河南定居。历经数百年变迁，家族传承了忠孝仁义的家风，培养了众多杰出人才。现代族人遍布全国各地，但仍保持着密切联系，定期举行家族聚会，传承家族文化。\n\n家族世代重视教育，出过多位举人和进士。近代有张世泽先生编撰族谱，使族谱得以传承。现今家族子孙在各行各业都有突出贡献，尤其在教育和医疗领域成绩斐然。'
    },
    {
      genealogyId: 'gen_002',
      history: '王氏家族起源于宋朝，祖先王德曾是一名饱学之士，以教书为业。家族历代以经商和学术闻名，在明清两代涌现出多位进士和举人。\n\n清末民初，王氏家族有多位成员投身实业救国运动，创办工厂和学校。新中国成立后，家族成员积极参与国家建设，在科研、教育和经济领域做出贡献。\n\n家族传统注重诗书传家，每年春节都会举行家族团聚，朗诵祖训，勉励后人。'
    },
    {
      genealogyId: 'gen_003',
      history: '李氏家族源于唐代名相李德裕，世代簪缨，家风淳朴。宋元之际，为避战乱南迁至江南一带，以耕读传家。\n\n明清时期，家族出了多位文人学士，著书立说，声名远播。近代以来，李氏后人投身国家建设，在工商、医药、科技等领域建树颇丰。\n\n李氏家训"诚信为本，厚德载物"，激励着一代又一代李氏子孙奋发向上，努力成为对社会有用之材。'
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
    },
    // 王氏族谱成员
    {
      id: 'mem_101',
      genealogyId: 'gen_002',
      name: '王德胜',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '1925-07-18',
      deathDate: '2010-03-22',
      birthPlace: '山东济南',
      rank: '族长',
      generation: 1,
      occupation: '教授',
      education: '北京大学',
      biography: '王德胜先生是著名历史学家，曾任教于多所知名大学，著有《中国古代家族制度研究》等多部学术著作。作为家族族长，他致力于家族文化传承，组织整理王氏族谱。',
      photos: ['/assets/images/photo_default.png'],
      parentId: null,
      spouseIds: ['mem_102'],
      childrenIds: ['mem_103', 'mem_104', 'mem_105'],
      createdAt: '2023-02-10T09:00:00Z',
      updatedAt: '2023-02-10T09:00:00Z'
    },
    {
      id: 'mem_102',
      genealogyId: 'gen_002',
      name: '刘雅芝',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '1928-11-05',
      deathDate: '2015-06-18',
      birthPlace: '北京',
      rank: '族长夫人',
      generation: 1,
      occupation: '医生',
      education: '北京医学院',
      biography: '刘雅芝女士是一名儿科医生，行医60余年，挽救了无数儿童的生命。她同时也是一位贤妻良母，将三个子女抚养成才。',
      photos: ['/assets/images/photo_default.png'],
      parentId: null,
      spouseIds: ['mem_101'],
      childrenIds: ['mem_103', 'mem_104', 'mem_105'],
      createdAt: '2023-02-10T09:30:00Z',
      updatedAt: '2023-02-10T09:30:00Z'
    },
    {
      id: 'mem_103',
      genealogyId: 'gen_002',
      name: '王建国',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '1952-10-01',
      deathDate: null,
      birthPlace: '北京',
      rank: '长子',
      generation: 2,
      occupation: '企业家',
      education: '清华大学',
      biography: '王建国先生是一名成功的企业家，创办了国内知名的科技公司，在IT领域有重要贡献。他积极参与公益事业，设立了多个教育基金。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_101',
      spouseIds: ['mem_106'],
      childrenIds: ['mem_108', 'mem_109'],
      createdAt: '2023-02-10T10:00:00Z',
      updatedAt: '2023-02-10T10:00:00Z'
    },
    {
      id: 'mem_104',
      genealogyId: 'gen_002',
      name: '王丽华',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '1955-05-15',
      deathDate: null,
      birthPlace: '北京',
      rank: '长女',
      generation: 2,
      occupation: '艺术家',
      education: '中央美术学院',
      biography: '王丽华女士是知名画家，作品多次在国内外展出，获得多项艺术大奖。她的国画作品《山水长卷》被国家博物馆收藏。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_101',
      spouseIds: ['mem_107'],
      childrenIds: ['mem_110'],
      createdAt: '2023-02-10T10:30:00Z',
      updatedAt: '2023-02-10T10:30:00Z'
    },
    {
      id: 'mem_105',
      genealogyId: 'gen_002',
      name: '王学智',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '1960-12-20',
      deathDate: null,
      birthPlace: '上海',
      rank: '次子',
      generation: 2,
      occupation: '科学家',
      education: '北京大学物理系',
      biography: '王学智先生是著名物理学家，在量子物理领域有重要研究成果，现任某研究所所长，曾获国家自然科学奖。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_101',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-02-10T11:00:00Z',
      updatedAt: '2023-02-10T11:00:00Z'
    },
    {
      id: 'mem_106',
      genealogyId: 'gen_002',
      name: '张小红',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '1954-08-30',
      deathDate: null,
      birthPlace: '天津',
      rank: '儿媳',
      generation: 2,
      occupation: '会计师',
      education: '南开大学',
      biography: '张小红女士是一名高级会计师，曾在多家大型企业担任财务总监，现协助丈夫管理家族企业。',
      photos: ['/assets/images/photo_default.png'],
      parentId: null,
      spouseIds: ['mem_103'],
      childrenIds: ['mem_108', 'mem_109'],
      createdAt: '2023-02-10T11:30:00Z',
      updatedAt: '2023-02-10T11:30:00Z'
    },
    {
      id: 'mem_107',
      genealogyId: 'gen_002',
      name: '李志强',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '1953-06-15',
      deathDate: null,
      birthPlace: '重庆',
      rank: '女婿',
      generation: 2,
      occupation: '建筑师',
      education: '同济大学',
      biography: '李志强先生是知名建筑师，设计了多个标志性建筑，获得过多项国际建筑设计大奖。',
      photos: ['/assets/images/photo_default.png'],
      parentId: null,
      spouseIds: ['mem_104'],
      childrenIds: ['mem_110'],
      createdAt: '2023-02-10T12:00:00Z',
      updatedAt: '2023-02-10T12:00:00Z'
    },
    {
      id: 'mem_108',
      genealogyId: 'gen_002',
      name: '王天明',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '1980-02-15',
      deathDate: null,
      birthPlace: '北京',
      rank: '长孙',
      generation: 3,
      occupation: '软件工程师',
      education: '清华大学计算机系',
      biography: '王天明先生是一名优秀的软件工程师，在人工智能领域有突出贡献，现任某科技公司技术总监。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_103',
      spouseIds: ['mem_111'],
      childrenIds: ['mem_113'],
      createdAt: '2023-02-10T12:30:00Z',
      updatedAt: '2023-02-10T12:30:00Z'
    },
    {
      id: 'mem_109',
      genealogyId: 'gen_002',
      name: '王雨晴',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '1985-09-26',
      deathDate: null,
      birthPlace: '北京',
      rank: '次女',
      generation: 3,
      occupation: '医生',
      education: '北京协和医学院',
      biography: '王雨晴女士是一名心脏外科医生，跟随祖母的脚步选择了医学事业，现在一家三甲医院担任主任医师。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_103',
      spouseIds: ['mem_112'],
      childrenIds: ['mem_114', 'mem_115'],
      createdAt: '2023-02-10T13:00:00Z',
      updatedAt: '2023-02-10T13:00:00Z'
    },
    {
      id: 'mem_110',
      genealogyId: 'gen_002',
      name: '李艺文',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '1982-11-18',
      deathDate: null,
      birthPlace: '上海',
      rank: '外孙女',
      generation: 3,
      occupation: '艺术策展人',
      education: '中央美术学院',
      biography: '李艺文女士继承了母亲的艺术才华，现在是一名知名艺术策展人，为多个国际艺术展览提供策划。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_104',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-02-10T13:30:00Z',
      updatedAt: '2023-02-10T13:30:00Z'
    },
    {
      id: 'mem_111',
      genealogyId: 'gen_002',
      name: '陈思思',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '1982-05-30',
      deathDate: null,
      birthPlace: '广州',
      rank: '孙媳',
      generation: 3,
      occupation: '设计师',
      education: '广州美术学院',
      biography: '陈思思女士是一名室内设计师，作品多次获得国内外设计大奖，现与丈夫共同经营一家设计工作室。',
      photos: ['/assets/images/photo_default.png'],
      parentId: null,
      spouseIds: ['mem_108'],
      childrenIds: ['mem_113'],
      createdAt: '2023-02-10T14:00:00Z',
      updatedAt: '2023-02-10T14:00:00Z'
    },
    {
      id: 'mem_112',
      genealogyId: 'gen_002',
      name: '赵文博',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '1983-01-15',
      deathDate: null,
      birthPlace: '天津',
      rank: '孙女婿',
      generation: 3,
      occupation: '金融分析师',
      education: '南开大学金融系',
      biography: '赵文博先生是一名资深金融分析师，在华尔街工作多年，现在是一家投资公司的合伙人。',
      photos: ['/assets/images/photo_default.png'],
      parentId: null,
      spouseIds: ['mem_109'],
      childrenIds: ['mem_114', 'mem_115'],
      createdAt: '2023-02-10T14:30:00Z',
      updatedAt: '2023-02-10T14:30:00Z'
    },
    {
      id: 'mem_113',
      genealogyId: 'gen_002',
      name: '王小明',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '2010-08-12',
      deathDate: null,
      birthPlace: '北京',
      rank: '曾孙',
      generation: 4,
      occupation: '学生',
      education: '北京市第一中学',
      biography: '王小明是一名中学生，成绩优异，尤其在数学和计算机方面有特长，曾获得全国青少年信息学奥林匹克竞赛银牌。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_108',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-02-10T15:00:00Z',
      updatedAt: '2023-02-10T15:00:00Z'
    },
    {
      id: 'mem_114',
      genealogyId: 'gen_002',
      name: '赵阳阳',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '2012-06-20',
      deathDate: null,
      birthPlace: '北京',
      rank: '曾外孙',
      generation: 4,
      occupation: '学生',
      education: '北京市实验小学',
      biography: '赵阳阳是一名小学生，活泼开朗，对音乐有浓厚兴趣，学习钢琴和小提琴，曾在多个少儿音乐比赛中获奖。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_109',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-02-10T15:30:00Z',
      updatedAt: '2023-02-10T15:30:00Z'
    },
    {
      id: 'mem_115',
      genealogyId: 'gen_002',
      name: '赵月月',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '2015-11-05',
      deathDate: null,
      birthPlace: '北京',
      rank: '曾外孙女',
      generation: 4,
      occupation: '学龄前儿童',
      education: '幼儿园',
      biography: '赵月月是一个活泼可爱的小女孩，喜欢画画和讲故事，已经展现出艺术天赋。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_109',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-02-10T16:00:00Z',
      updatedAt: '2023-02-10T16:00:00Z'
    },
    // 李氏家谱成员
    {
      id: 'mem_201',
      genealogyId: 'gen_003',
      name: '李志远',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '1930-03-15',
      deathDate: '2018-11-20',
      birthPlace: '江苏南京',
      rank: '族长',
      generation: 1,
      occupation: '工程师',
      education: '同济大学',
      biography: '李志远先生是著名土木工程师，参与了多项国家重点工程建设，曾获国家科技进步奖。作为家族族长，他一生致力于传承家族文化和价值观。',
      photos: ['/assets/images/photo_default.png'],
      parentId: null,
      spouseIds: ['mem_202'],
      childrenIds: ['mem_203', 'mem_204'],
      createdAt: '2023-03-05T15:00:00Z',
      updatedAt: '2023-03-05T15:00:00Z'
    },
    {
      id: 'mem_202',
      genealogyId: 'gen_003',
      name: '钱惠珍',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '1932-09-25',
      deathDate: null,
      birthPlace: '浙江杭州',
      rank: '族长夫人',
      generation: 1,
      occupation: '教师',
      education: '南京师范学院',
      biography: '钱惠珍女士是一名退休中学语文教师，培养了一代又一代优秀学生。她热爱文学和历史，为家族文化传承做出了重要贡献。',
      photos: ['/assets/images/photo_default.png'],
      parentId: null,
      spouseIds: ['mem_201'],
      childrenIds: ['mem_203', 'mem_204'],
      createdAt: '2023-03-05T15:30:00Z',
      updatedAt: '2023-03-05T15:30:00Z'
    },
    {
      id: 'mem_203',
      genealogyId: 'gen_003',
      name: '李晓峰',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '1958-07-10',
      deathDate: null,
      birthPlace: '南京',
      rank: '长子',
      generation: 2,
      occupation: '医生',
      education: '南京医科大学',
      biography: '李晓峰先生是一名外科医生，在南京一家三甲医院担任外科主任，曾参与多项医疗援助任务。他是家族的现任族长，继承父亲的遗志继续传承家族文化。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_201',
      spouseIds: ['mem_205'],
      childrenIds: ['mem_206', 'mem_207'],
      createdAt: '2023-03-05T16:00:00Z',
      updatedAt: '2023-03-05T16:00:00Z'
    },
    {
      id: 'mem_204',
      genealogyId: 'gen_003',
      name: '李梅',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '1962-04-05',
      deathDate: null,
      birthPlace: '南京',
      rank: '长女',
      generation: 2,
      occupation: '大学教授',
      education: '北京大学',
      biography: '李梅女士是一名大学教授，研究方向为中国古代文学，著有多部学术著作。她热爱家族文化，积极参与家族文化活动的组织。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_201',
      spouseIds: ['mem_208'],
      childrenIds: ['mem_209'],
      createdAt: '2023-03-05T16:30:00Z',
      updatedAt: '2023-03-05T16:30:00Z'
    },
    {
      id: 'mem_205',
      genealogyId: 'gen_003',
      name: '张丽华',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '1960-12-15',
      deathDate: null,
      birthPlace: '苏州',
      rank: '儿媳',
      generation: 2,
      occupation: '护士长',
      education: '南京医科大学',
      biography: '张丽华女士是一名护士长，与丈夫在同一家医院工作，被称为"医院模范夫妻"。她热心公益，多次参与医疗援助活动。',
      photos: ['/assets/images/photo_default.png'],
      parentId: null,
      spouseIds: ['mem_203'],
      childrenIds: ['mem_206', 'mem_207'],
      createdAt: '2023-03-05T17:00:00Z',
      updatedAt: '2023-03-05T17:00:00Z'
    },
    {
      id: 'mem_206',
      genealogyId: 'gen_003',
      name: '李强',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '1985-08-20',
      deathDate: null,
      birthPlace: '南京',
      rank: '长孙',
      generation: 3,
      occupation: '软件工程师',
      education: '南京大学',
      biography: '李强先生是一名软件工程师，在一家知名互联网公司担任技术经理。他既有父母的严谨作风，又有年轻一代的创新精神。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_203',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-03-05T17:30:00Z',
      updatedAt: '2023-03-05T17:30:00Z'
    },
    {
      id: 'mem_207',
      genealogyId: 'gen_003',
      name: '李雯',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '1988-11-10',
      deathDate: null,
      birthPlace: '南京',
      rank: '次女',
      generation: 3,
      occupation: '医生',
      education: '上海交通大学医学院',
      biography: '李雯女士继承了父母的医学事业，成为一名儿科医生。她有着温柔的性格和出色的医术，深受小患者和家长的喜爱。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_203',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-03-05T18:00:00Z',
      updatedAt: '2023-03-05T18:00:00Z'
    },
    {
      id: 'mem_208',
      genealogyId: 'gen_003',
      name: '王建华',
      gender: 'male',
      avatar: '/assets/images/avatar_male_default.png',
      birthDate: '1960-06-18',
      deathDate: null,
      birthPlace: '武汉',
      rank: '女婿',
      generation: 2,
      occupation: '建筑设计师',
      education: '同济大学',
      biography: '王建华先生是一名知名建筑设计师，设计了多个标志性建筑。他与妻子李梅志同道合，共同支持家族文化的传承。',
      photos: ['/assets/images/photo_default.png'],
      parentId: null,
      spouseIds: ['mem_204'],
      childrenIds: ['mem_209'],
      createdAt: '2023-03-05T18:30:00Z',
      updatedAt: '2023-03-05T18:30:00Z'
    },
    {
      id: 'mem_209',
      genealogyId: 'gen_003',
      name: '王李安',
      gender: 'female',
      avatar: '/assets/images/avatar_female_default.png',
      birthDate: '1990-05-12',
      deathDate: null,
      birthPlace: '北京',
      rank: '外孙女',
      generation: 3,
      occupation: '记者',
      education: '中国传媒大学',
      biography: '王李安女士是一名资深记者，曾报道多个重大国际事件。她随父姓王，但也加入了母亲的姓李，以示对母系家族的尊重。',
      photos: ['/assets/images/photo_default.png'],
      parentId: 'mem_204',
      spouseIds: [],
      childrenIds: [],
      createdAt: '2023-03-05T19:00:00Z',
      updatedAt: '2023-03-05T19:00:00Z'
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
    },
    // 王氏族谱事件
    {
      id: 'evt_101',
      genealogyId: 'gen_002',
      title: '王德胜先生诞辰',
      description: '王氏族谱族长王德胜先生出生于山东济南。',
      date: '1925-07-18',
      type: 'birth',
      location: '山东济南',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_101'],
      createdAt: '2023-02-12T10:00:00Z',
      updatedAt: '2023-02-12T10:00:00Z'
    },
    {
      id: 'evt_102',
      genealogyId: 'gen_002',
      title: '王德胜与刘雅芝结婚',
      description: '王德胜先生与刘雅芝女士在北京举行婚礼，两家亲友共同见证。',
      date: '1950-09-10',
      type: 'wedding',
      location: '北京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_101', 'mem_102'],
      createdAt: '2023-02-12T10:30:00Z',
      updatedAt: '2023-02-12T10:30:00Z'
    },
    {
      id: 'evt_103',
      genealogyId: 'gen_002',
      title: '王氏族谱编纂',
      description: '王德胜先生主持编纂《王氏家族史》，记录家族迁徙和发展历程，为后人留下宝贵资料。',
      date: '1980-05-20',
      type: 'achievement',
      location: '北京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_101', 'mem_102', 'mem_103', 'mem_104', 'mem_105'],
      createdAt: '2023-02-12T11:00:00Z',
      updatedAt: '2023-02-12T11:00:00Z'
    },
    {
      id: 'evt_104',
      genealogyId: 'gen_002',
      title: '王建国创业',
      description: '王建国先生创办"王氏科技"公司，开始了家族在科技领域的创业征程。',
      date: '1985-03-15',
      type: 'achievement',
      location: '北京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_103', 'mem_106'],
      createdAt: '2023-02-12T11:30:00Z',
      updatedAt: '2023-02-12T11:30:00Z'
    },
    {
      id: 'evt_105',
      genealogyId: 'gen_002',
      title: '王丽华艺术展',
      description: '王丽华女士举办首次个人画展，展出其国画作品50余幅，获得广泛赞誉。',
      date: '1990-09-25',
      type: 'achievement',
      location: '上海',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_104', 'mem_107'],
      createdAt: '2023-02-12T12:00:00Z',
      updatedAt: '2023-02-12T12:00:00Z'
    },
    {
      id: 'evt_106',
      genealogyId: 'gen_002',
      title: '王天明出生',
      description: '王建国和张小红的长子王天明出生，是王氏家族第三代的代表人物之一。',
      date: '1980-02-15',
      type: 'birth',
      location: '北京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_103', 'mem_106', 'mem_108'],
      createdAt: '2023-02-12T12:30:00Z',
      updatedAt: '2023-02-12T12:30:00Z'
    },
    {
      id: 'evt_107',
      genealogyId: 'gen_002',
      title: '王氏家族基金会成立',
      description: '王建国先生创立"王氏家族教育基金会"，资助贫困学生和教育事业。',
      date: '2000-10-01',
      type: 'achievement',
      location: '北京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_103', 'mem_106', 'mem_108', 'mem_109'],
      createdAt: '2023-02-12T13:00:00Z',
      updatedAt: '2023-02-12T13:00:00Z'
    },
    {
      id: 'evt_108',
      genealogyId: 'gen_002',
      title: '刘雅芝荣获"人民医生"称号',
      description: '刘雅芝女士因在儿科医疗领域的突出贡献，被授予"人民医生"荣誉称号。',
      date: '2005-08-19',
      type: 'honor',
      location: '北京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_102'],
      createdAt: '2023-02-12T13:30:00Z',
      updatedAt: '2023-02-12T13:30:00Z'
    },
    {
      id: 'evt_109',
      genealogyId: 'gen_002',
      title: '王德胜先生逝世',
      description: '王氏族谱族长王德胜先生因病在北京逝世，享年85岁。家族举行隆重葬礼，各界人士前来悼念。',
      date: '2010-03-22',
      type: 'death',
      location: '北京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_101', 'mem_102', 'mem_103', 'mem_104', 'mem_105'],
      createdAt: '2023-02-12T14:00:00Z',
      updatedAt: '2023-02-12T14:00:00Z'
    },
    {
      id: 'evt_110',
      genealogyId: 'gen_002',
      title: '王氏家族百年庆典',
      description: '王氏家族举行百年庆典，家族成员从世界各地归来共襄盛举，回顾家族历史，展望未来发展。',
      date: '2020-10-10',
      type: 'family_gathering',
      location: '北京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_102', 'mem_103', 'mem_104', 'mem_105', 'mem_106', 'mem_107', 'mem_108', 'mem_109', 'mem_110', 'mem_111', 'mem_112', 'mem_113', 'mem_114', 'mem_115'],
      createdAt: '2023-02-12T14:30:00Z',
      updatedAt: '2023-02-12T14:30:00Z'
    },
    
    // 李氏家谱事件
    {
      id: 'evt_201',
      genealogyId: 'gen_003',
      title: '李志远先生诞辰',
      description: '李氏家谱族长李志远先生出生于江苏南京。',
      date: '1930-03-15',
      type: 'birth',
      location: '江苏南京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_201'],
      createdAt: '2023-03-08T10:00:00Z',
      updatedAt: '2023-03-08T10:00:00Z'
    },
    {
      id: 'evt_202',
      genealogyId: 'gen_003',
      title: '李志远与钱惠珍结婚',
      description: '李志远先生与钱惠珍女士在南京举行婚礼，开始了他们共同的人生旅程。',
      date: '1955-10-05',
      type: 'wedding',
      location: '南京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_201', 'mem_202'],
      createdAt: '2023-03-08T10:30:00Z',
      updatedAt: '2023-03-08T10:30:00Z'
    },
    {
      id: 'evt_203',
      genealogyId: 'gen_003',
      title: '李晓峰出生',
      description: '李志远和钱惠珍的长子李晓峰出生，成为家族第二代的重要成员。',
      date: '1958-07-10',
      type: 'birth',
      location: '南京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_201', 'mem_202', 'mem_203'],
      createdAt: '2023-03-08T11:00:00Z',
      updatedAt: '2023-03-08T11:00:00Z'
    },
    {
      id: 'evt_204',
      genealogyId: 'gen_003',
      title: '李志远参与长江大桥建设',
      description: '李志远先生作为主要工程师之一，参与了南京长江大桥的建设工作，为国家基础设施建设做出贡献。',
      date: '1968-12-29',
      type: 'achievement',
      location: '南京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_201'],
      createdAt: '2023-03-08T11:30:00Z',
      updatedAt: '2023-03-08T11:30:00Z'
    },
    {
      id: 'evt_205',
      genealogyId: 'gen_003',
      title: '李氏家谱修订',
      description: '李志远先生主持修订《李氏家谱》，追溯家族源流，记录家族发展历程。',
      date: '1985-08-15',
      type: 'achievement',
      location: '南京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_201', 'mem_202', 'mem_203', 'mem_204'],
      createdAt: '2023-03-08T12:00:00Z',
      updatedAt: '2023-03-08T12:00:00Z'
    },
    {
      id: 'evt_206',
      genealogyId: 'gen_003',
      title: '李志远获国家科技进步奖',
      description: '李志远先生因在桥梁工程领域的突出贡献，获得国家科技进步二等奖。',
      date: '1990-01-08',
      type: 'honor',
      location: '北京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_201'],
      createdAt: '2023-03-08T12:30:00Z',
      updatedAt: '2023-03-08T12:30:00Z'
    },
    {
      id: 'evt_207',
      genealogyId: 'gen_003',
      title: '李志远先生逝世',
      description: '李氏家谱族长李志远先生在南京逝世，享年88岁。家族举行隆重葬礼，各界人士前来悼念。',
      date: '2018-11-20',
      type: 'death',
      location: '南京',
      media: ['/assets/images/event_default.png'],
      relatedMembers: ['mem_201', 'mem_202', 'mem_203', 'mem_204', 'mem_205', 'mem_206', 'mem_207', 'mem_208', 'mem_209'],
      createdAt: '2023-03-08T13:00:00Z',
      updatedAt: '2023-03-08T13:00:00Z'
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

// 保存初始数据的深拷贝，用于重置功能
const initialMockData = JSON.parse(JSON.stringify(mockData));

// 添加通知模拟数据
let mockNotifications = [
  {
    id: '1',
    title: '族谱邀请',
    content: '张大山邀请您加入"张氏家族"族谱',
    type: 'invite',
    relatedId: '1',
    read: false,
    createdAt: '2023-10-15T08:30:00Z'
  },
  {
    id: '2',
    title: '新成员加入',
    content: '李小明加入了"张氏家族"族谱',
    type: 'member_join',
    relatedId: '2',
    read: true,
    createdAt: '2023-10-10T14:20:00Z'
  },
  {
    id: '3',
    title: '家族大事记已添加',
    content: '张三添加了新的家族大事记: "张家老宅翻修完成"',
    type: 'event_add',
    relatedId: '3',
    read: false,
    createdAt: '2023-10-05T11:15:00Z'
  },
  {
    id: '4',
    title: '订阅到期提醒',
    content: '您的"家庭版"订阅将在7天后到期',
    type: 'subscription_expiring',
    relatedId: null,
    read: false,
    createdAt: '2023-10-01T09:00:00Z'
  },
  {
    id: '5',
    title: '族谱信息更新',
    content: '王五更新了族谱"张氏家族"的基本信息',
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
    // 检查是否是账号密码登录
    if (data.username && data.password) {
      // 验证默认账号密码
      if (data.username === '13800138000' && data.password === '123456') {
        return response({
          token: 'mock_token_' + Date.now(),
          user: mockData.user
        });
      } else {
        // 登录失败
        return response(null, false, '用户名或密码错误', 1000);
      }
    } 
    
    // 微信登录，不检查用户名密码，直接通过
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

/**
 * 获取通知列表
 * @param {Object} params - 查询参数
 * @returns {Promise} 通知列表
 */
function getNotifications(params = {}) {
  let result = [...mockNotifications];
  
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
  
  return Promise.resolve(result);
}

/**
 * 获取未读通知数量
 * @returns {Promise} 未读通知数量
 */
function getUnreadNotificationsCount() {
  const count = mockNotifications.filter(n => !n.read).length;
  return Promise.resolve(count);
}

/**
 * 标记通知为已读
 * @param {String} notificationId - 通知ID, 如不提供则标记所有通知为已读
 * @returns {Promise} 标记结果
 */
function markNotificationAsRead(notificationId) {
  if (notificationId) {
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return Promise.resolve({ success: true });
    }
    return Promise.reject(new Error('通知不存在'));
  } else {
    // 标记所有为已读
    mockNotifications.forEach(n => {
      n.read = true;
    });
    return Promise.resolve({ success: true });
  }
}

/**
 * 删除通知
 * @param {String} notificationId - 通知ID
 * @returns {Promise} 删除结果
 */
function deleteNotification(notificationId) {
  const index = mockNotifications.findIndex(n => n.id === notificationId);
  if (index > -1) {
    mockNotifications.splice(index, 1);
    return Promise.resolve({ success: true });
  }
  return Promise.reject(new Error('通知不存在'));
}

/**
 * 获取通知设置
 * @returns {Promise} 通知设置
 */
function getNotificationSettings() {
  return Promise.resolve(mockNotificationSettings);
}

/**
 * 更新通知设置
 * @param {Object} settings - 通知设置
 * @returns {Promise} 更新结果
 */
function updateNotificationSettings(settings) {
  mockNotificationSettings = {
    ...mockNotificationSettings,
    ...settings
  };
  return Promise.resolve({ success: true });
}

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
    mockData = deepClone(initialMockData);
    return true;
  },
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings
};