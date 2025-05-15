/**
 * 树形结构工具函数
 * 用于处理族谱树形结构数据
 */

/**
 * 将扁平结构的成员数据转换为树形结构
 * @param {Array} members - 成员列表
 * @param {String} rootMemberId - 根成员ID
 * @returns {Object} 树形结构
 */
const buildFamilyTree = (members, rootMemberId) => {
  if (!members || members.length === 0) {
    return null;
  }

  // 如果没有指定根节点，则查找没有父节点的最早一代成员
  if (!rootMemberId) {
    const rootMembers = members.filter(m => !m.parentId);
    if (rootMembers.length > 0) {
      // 按出生日期排序，取最早出生的
      rootMembers.sort((a, b) => {
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return new Date(a.birthDate) - new Date(b.birthDate);
      });
      rootMemberId = rootMembers[0].id;
    } else {
      return null;
    }
  }

  // 查找根成员
  const rootMember = members.find(m => m.id === rootMemberId);
  if (!rootMember) {
    return null;
  }

  // 递归构建树形结构
  const buildTreeNode = (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return null;

    // 构建基本节点
    const node = { ...member };

    // 添加配偶节点
    if (member.spouseIds && member.spouseIds.length > 0) {
      node.spouses = member.spouseIds
        .map(spouseId => {
          const spouse = members.find(m => m.id === spouseId);
          return spouse ? { ...spouse } : null;
        })
        .filter(spouse => spouse !== null);
    } else {
      node.spouses = [];
    }

    // 添加子女节点
    if (member.childrenIds && member.childrenIds.length > 0) {
      node.children = member.childrenIds
        .map(childId => buildTreeNode(childId))
        .filter(child => child !== null);

      // 对子女按性别和出生日期排序
      node.children.sort((a, b) => {
        // 先按性别排序，男性在前
        if (a.gender !== b.gender) {
          return a.gender === 'male' ? -1 : 1;
        }
        // 再按出生日期排序
        if (!a.birthDate) return 1;
        if (!b.birthDate) return -1;
        return new Date(a.birthDate) - new Date(b.birthDate);
      });
    } else {
      node.children = [];
    }

    return node;
  };

  return buildTreeNode(rootMemberId);
};

/**
 * 按世代分组成员数据
 * @param {Array} members - 成员列表
 * @returns {Object} 按世代分组的成员列表
 */
const groupMembersByGeneration = (members) => {
  if (!members || members.length === 0) {
    return {};
  }

  const generations = {};

  members.forEach(member => {
    const generation = member.generation || 0;
    if (!generations[generation]) {
      generations[generation] = [];
    }
    generations[generation].push(member);
  });

  // 对每个世代内的成员进行排序
  Object.keys(generations).forEach(gen => {
    generations[gen].sort((a, b) => {
      // 先按性别排序，男性在前
      if (a.gender !== b.gender) {
        return a.gender === 'male' ? -1 : 1;
      }
      // 再按出生日期排序
      if (!a.birthDate) return 1;
      if (!b.birthDate) return -1;
      return new Date(a.birthDate) - new Date(b.birthDate);
    });
  });

  return generations;
};

/**
 * 查找两个成员之间的关系路径
 * @param {String} startMemberId - 起始成员ID
 * @param {String} endMemberId - 目标成员ID
 * @param {Array} members - 所有成员数据
 * @returns {Array} 关系路径
 */
const findRelationPath = (startMemberId, endMemberId, members) => {
  if (startMemberId === endMemberId) {
    return [startMemberId];
  }

  // 构建成员关系图
  const graph = {};
  members.forEach(member => {
    graph[member.id] = {
      parentId: member.parentId,
      spouseIds: member.spouseIds || [],
      childrenIds: member.childrenIds || []
    };
  });

  // 广度优先搜索
  const queue = [[startMemberId]];
  const visited = new Set([startMemberId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const currentId = path[path.length - 1];
    const current = graph[currentId];

    if (!current) continue;

    // 检查相关的所有人
    const relatedIds = [
      current.parentId,
      ...current.spouseIds,
      ...current.childrenIds
    ].filter(id => id);

    for (const relatedId of relatedIds) {
      if (relatedId === endMemberId) {
        return [...path, relatedId];
      }

      if (!visited.has(relatedId)) {
        visited.add(relatedId);
        queue.push([...path, relatedId]);
      }
    }
  }

  return []; // 没有找到路径
};

/**
 * 描述两个成员之间的关系
 * @param {String} memberId1 - 成员ID1
 * @param {String} memberId2 - 成员ID2
 * @param {Array} members - 所有成员数据
 * @returns {String} 关系描述
 */
const describeRelation = (memberId1, memberId2, members) => {
  if (memberId1 === memberId2) return '本人';

  const member1 = members.find(m => m.id === memberId1);
  const member2 = members.find(m => m.id === memberId2);

  if (!member1 || !member2) return '未知关系';

  // 直接关系检查
  if (member1.parentId === memberId2) {
    return member2.gender === 'male' ? '父亲' : '母亲';
  }
  
  if (member2.parentId === memberId1) {
    return member2.gender === 'male' ? '儿子' : '女儿';
  }
  
  if (member1.spouseIds && member1.spouseIds.includes(memberId2)) {
    return member2.gender === 'male' ? '丈夫' : '妻子';
  }
  
  // 兄弟姐妹关系
  if (member1.parentId && member1.parentId === member2.parentId) {
    if (member2.gender === 'male') {
      // 判断兄或弟
      const birthDate1 = new Date(member1.birthDate || 0);
      const birthDate2 = new Date(member2.birthDate || 0);
      return birthDate1 > birthDate2 ? '哥哥' : '弟弟';
    } else {
      // 判断姐或妹
      const birthDate1 = new Date(member1.birthDate || 0);
      const birthDate2 = new Date(member2.birthDate || 0);
      return birthDate1 > birthDate2 ? '姐姐' : '妹妹';
    }
  }

  // 寻找关系路径
  const path = findRelationPath(memberId1, memberId2, members);
  if (path.length === 0) return '远亲';

  // 复杂关系处理
  // 这里只是简化处理，实际可能需要更复杂的逻辑
  return path.length <= 3 ? '近亲' : '远亲';
};

/**
 * 获取树的高度（最大世代数）
 * @param {Object} treeNode - 树节点
 * @returns {Number} 树高度
 */
const getTreeHeight = (treeNode) => {
  if (!treeNode) return 0;
  if (!treeNode.children || treeNode.children.length === 0) return 1;
  
  let maxChildHeight = 0;
  for (const child of treeNode.children) {
    const childHeight = getTreeHeight(child);
    if (childHeight > maxChildHeight) {
      maxChildHeight = childHeight;
    }
  }
  
  return maxChildHeight + 1;
};

/**
 * 计算树的宽度（最宽层的节点数）
 * @param {Object} treeNode - 树节点
 * @returns {Number} 树宽度
 */
const getTreeWidth = (treeNode) => {
  if (!treeNode) return 0;
  
  const widthByLevel = {};
  
  const traverseTree = (node, level = 0) => {
    if (!node) return;
    
    // 计算当前层的宽度
    widthByLevel[level] = (widthByLevel[level] || 0) + 1;
    
    // 递归遍历子节点
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        traverseTree(child, level + 1);
      }
    }
  };
  
  traverseTree(treeNode);
  
  return Math.max(...Object.values(widthByLevel));
};

/**
 * 获取特定成员的祖先
 * @param {String} memberId - 成员ID
 * @param {Array} members - 所有成员数据
 * @param {Number} levels - 向上追溯的层数（可选）
 * @returns {Array} 祖先列表
 */
const getAncestors = (memberId, members, levels = -1) => {
  const ancestors = [];
  let currentId = memberId;
  let currentLevel = 0;
  
  while (currentId && (levels === -1 || currentLevel < levels)) {
    const member = members.find(m => m.id === currentId);
    if (!member || !member.parentId) break;
    
    const parent = members.find(m => m.id === member.parentId);
    if (parent) {
      ancestors.push(parent);
      currentId = parent.id;
      currentLevel++;
    } else {
      break;
    }
  }
  
  return ancestors;
};

/**
 * 获取特定成员的后代
 * @param {String} memberId - 成员ID
 * @param {Array} members - 所有成员数据
 * @param {Number} levels - 向下追溯的层数（可选）
 * @returns {Array} 后代列表
 */
const getDescendants = (memberId, members, levels = -1) => {
  const descendants = [];
  
  const traverseChildren = (id, currentLevel = 0) => {
    if (levels !== -1 && currentLevel >= levels) return;
    
    const member = members.find(m => m.id === id);
    if (!member || !member.childrenIds || member.childrenIds.length === 0) return;
    
    for (const childId of member.childrenIds) {
      const child = members.find(m => m.id === childId);
      if (child) {
        descendants.push(child);
        traverseChildren(childId, currentLevel + 1);
      }
    }
  };
  
  traverseChildren(memberId);
  
  return descendants;
};

/**
 * 布局族谱树节点坐标（用于绘制）
 * @param {Object} treeNode - 树节点
 * @param {Number} nodeWidth - 节点宽度
 * @param {Number} nodeHeight - 节点高度
 * @param {Number} horizontalGap - 水平间距
 * @param {Number} verticalGap - 垂直间距
 * @returns {Object} 布局后的树
 */
const layoutFamilyTree = (treeNode, nodeWidth = 80, nodeHeight = 100, horizontalGap = 20, verticalGap = 50) => {
  if (!treeNode) return null;
  
  // 计算每个节点的坐标
  const layoutNode = (node, x = 0, y = 0, level = 0) => {
    if (!node) return null;
    
    // 复制节点，添加坐标信息
    const layoutedNode = {
      ...node,
      x,
      y,
      level,
      width: nodeWidth,
      height: nodeHeight
    };
    
    // 布局配偶节点
    if (node.spouses && node.spouses.length > 0) {
      layoutedNode.spouses = node.spouses.map((spouse, index) => {
        return {
          ...spouse,
          x: x + (index + 1) * (nodeWidth + horizontalGap / 2),
          y,
          level,
          width: nodeWidth,
          height: nodeHeight
        };
      });
    }
    
    // 布局子女节点
    if (node.children && node.children.length > 0) {
      // 计算子女节点的总宽度
      const childrenCount = node.children.length;
      const totalChildrenWidth = childrenCount * nodeWidth + (childrenCount - 1) * horizontalGap;
      
      // 计算起始x坐标
      const startX = x - totalChildrenWidth / 2 + nodeWidth / 2;
      
      // 递归布局每个子女节点
      layoutedNode.children = node.children.map((child, index) => {
        const childX = startX + index * (nodeWidth + horizontalGap);
        const childY = y + nodeHeight + verticalGap;
        return layoutNode(child, childX, childY, level + 1);
      });
    }
    
    return layoutedNode;
  };
  
  return layoutNode(treeNode);
};

/**
 * 导出树形结构为JSON格式
 * @param {Object} treeNode - 树节点
 * @returns {String} JSON字符串
 */
const exportTreeToJSON = (treeNode) => {
  if (!treeNode) return '{}';
  return JSON.stringify(treeNode, null, 2);
};

/**
 * 导入JSON格式的树形结构
 * @param {String} jsonStr - JSON字符串
 * @returns {Object} 树节点
 */
const importTreeFromJSON = (jsonStr) => {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
};

/**
 * 查找最新一代的成员
 * @param {Array} members - 成员列表
 * @returns {Array} 最新一代成员列表
 */
const findLatestGeneration = (members) => {
  if (!members || members.length === 0) return [];
  
  // 找出最大世代值
  const maxGeneration = Math.max(...members.map(m => m.generation || 0));
  
  // 返回该世代的成员
  return members.filter(m => (m.generation || 0) === maxGeneration);
};

/**
 * 检查是否可以将一个成员添加为另一个成员的子女
 * @param {Object} parentMember - 父母成员
 * @param {Object} childMember - 子女成员
 * @returns {Boolean} 是否可以添加
 */
const canAddAsChild = (parentMember, childMember) => {
  if (!parentMember || !childMember) return false;
  
  // 检查是否已经是子女
  if (parentMember.childrenIds && parentMember.childrenIds.includes(childMember.id)) {
    return false;
  }
  
  // 检查是否形成循环关系
  // 即检查子女是否已经是父母的祖先
  if (childMember.childrenIds && childMember.childrenIds.length > 0) {
    const checkCycle = (currentId, targetId) => {
      if (currentId === targetId) return true;
      
      const current = members.find(m => m.id === currentId);
      if (!current || !current.childrenIds || current.childrenIds.length === 0) {
        return false;
      }
      
      return current.childrenIds.some(childId => checkCycle(childId, targetId));
    };
    
    if (checkCycle(childMember.id, parentMember.id)) {
      return false;
    }
  }
  
  return true;
};

/**
 * 检查是否可以将一个成员添加为另一个成员的配偶
 * @param {Object} member1 - 成员1
 * @param {Object} member2 - 成员2
 * @returns {Boolean} 是否可以添加
 */
const canAddAsSpouse = (member1, member2) => {
  if (!member1 || !member2) return false;
  
  // 检查是否已经是配偶
  if (member1.spouseIds && member1.spouseIds.includes(member2.id)) {
    return false;
  }
  
  // 检查是否是近亲关系（父子、兄妹等）
  // 这里简单检查是否有直接的亲子关系
  if (member1.parentId === member2.id || member2.parentId === member1.id) {
    return false;
  }
  
  // 检查是否有共同的父母（兄弟姐妹关系）
  if (member1.parentId && member1.parentId === member2.parentId) {
    return false;
  }
  
  return true;
};

/**
 * 检查树形结构中是否存在循环引用
 * @param {Object} treeNode - 树节点
 * @returns {Boolean} 是否存在循环引用
 */
const checkCyclicReference = (treeNode) => {
  const visitedIds = new Set();
  
  const dfs = (node) => {
    if (!node) return false;
    
    if (visitedIds.has(node.id)) {
      return true; // 发现循环引用
    }
    
    visitedIds.add(node.id);
    
    // 检查子节点
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (dfs(child)) {
          return true;
        }
      }
    }
    
    // 回溯
    visitedIds.delete(node.id);
    
    return false;
  };
  
  return dfs(treeNode);
};

/**
 * 查找最近的共同祖先
 * @param {String} memberId1 - 成员ID1
 * @param {String} memberId2 - 成员ID2
 * @param {Array} allMembers - 所有成员数据
 * @returns {String|null} 共同祖先ID或null
 */
const findLowestCommonAncestor = (memberId1, memberId2, allMembers) => {
  if (memberId1 === memberId2) return memberId1;
  
  // 获取成员1的所有祖先（包括自己）
  const getAncestorsWithSelf = (memberId) => {
    const result = [memberId];
    let currentId = memberId;
    
    while (true) {
      const member = allMembers.find(m => m.id === currentId);
      if (!member || !member.parentId) break;
      
      result.push(member.parentId);
      currentId = member.parentId;
    }
    
    return result;
  };
  
  const ancestors1 = getAncestorsWithSelf(memberId1);
  const ancestors2 = getAncestorsWithSelf(memberId2);
  
  // 创建祖先映射表（用于O(1)查找）
  const ancestorMap = {};
  for (const id of ancestors1) {
    ancestorMap[id] = true;
  }
  
  // 查找最近的共同祖先
  for (const id of ancestors2) {
    if (ancestorMap[id]) {
      return id;
    }
  }
  
  return null;
};

/**
 * 获取族谱统计信息
 * @param {Array} members - 成员列表
 * @returns {Object} 统计信息
 */
const getGenealogySummary = (members) => {
  if (!members || members.length === 0) {
    return {
      totalMembers: 0,
      maleCount: 0,
      femaleCount: 0,
      generationCount: 0,
      oldestBirthYear: null,
      youngestBirthYear: null,
      averageAge: 0
    };
  }
  
  // 计算统计信息
  const maleCount = members.filter(m => m.gender === 'male').length;
  const femaleCount = members.filter(m => m.gender === 'female').length;
  
  // 计算世代数
  const generations = new Set(members.map(m => m.generation).filter(Boolean));
  const generationCount = generations.size;
  
  // 计算最早和最晚出生年份
  const birthYears = members
    .filter(m => m.birthDate)
    .map(m => new Date(m.birthDate).getFullYear());
  
  const oldestBirthYear = birthYears.length > 0 ? Math.min(...birthYears) : null;
  const youngestBirthYear = birthYears.length > 0 ? Math.max(...birthYears) : null;
  
  // 计算平均年龄
  const currentYear = new Date().getFullYear();
  let ageSum = 0;
  let ageCount = 0;
  
  members.forEach(m => {
    if (m.birthDate) {
      const birthYear = new Date(m.birthDate).getFullYear();
      const age = m.deathDate 
        ? new Date(m.deathDate).getFullYear() - birthYear
        : currentYear - birthYear;
      
      ageSum += age;
      ageCount++;
    }
  });
  
  const averageAge = ageCount > 0 ? Math.round(ageSum / ageCount) : 0;
  
  return {
    totalMembers: members.length,
    maleCount,
    femaleCount,
    generationCount,
    oldestBirthYear,
    youngestBirthYear,
    averageAge
  };
};

/**
 * 基于力导向算法优化族谱树布局
 * @param {Object} treeNode - 树节点
 * @param {Number} width - 画布宽度
 * @param {Number} height - 画布高度
 * @param {Number} nodeWidth - 节点宽度
 * @param {Number} nodeHeight - 节点高度
 * @returns {Object} 优化后的树
 */
const optimizeTreeLayout = (treeNode, width, height, nodeWidth = 80, nodeHeight = 100) => {
  if (!treeNode) return null;
  
  // 首先使用基本布局算法获取初始位置
  const initialLayout = layoutFamilyTree(treeNode, nodeWidth, nodeHeight, 20, 50);
  
  // 复制节点坐标信息到新对象，以便进行力导向算法优化
  const nodePositions = {};
  
  // 递归收集所有节点的位置信息
  const collectNodePositions = (node) => {
    if (!node) return;
    
    nodePositions[node.id] = {
      x: node.x,
      y: node.y,
      vx: 0, // x方向速度
      vy: 0  // y方向速度
    };
    
    // 收集配偶节点
    if (node.spouses) {
      node.spouses.forEach(spouse => {
        nodePositions[spouse.id] = {
          x: spouse.x,
          y: spouse.y,
          vx: 0,
          vy: 0
        };
      });
    }
    
    // 递归收集子节点
    if (node.children) {
      node.children.forEach(child => {
        collectNodePositions(child);
      });
    }
  };
  
  collectNodePositions(initialLayout);
  
  // 定义节点之间的关系（用于力导向算法）
  const relationships = [];
  
  // 递归收集所有节点之间的关系
  const collectRelationships = (node) => {
    if (!node) return;
    
    // 父子关系
    if (node.children) {
      node.children.forEach(child => {
        relationships.push({
          source: node.id,
          target: child.id,
          type: 'parent-child',
          distance: nodeHeight * 1.5 // 理想距离
        });
        
        collectRelationships(child);
      });
    }
    
    // 配偶关系
    if (node.spouses) {
      node.spouses.forEach(spouse => {
        relationships.push({
          source: node.id,
          target: spouse.id,
          type: 'spouse',
          distance: nodeWidth * 1.2 // 理想距离
        });
      });
    }
    
    // 同级节点之间的关系（兄弟姐妹及其配偶）
    if (node.parent) {
      const siblings = node.parent.children.filter(c => c.id !== node.id);
      
      siblings.forEach(sibling => {
        relationships.push({
          source: node.id,
          target: sibling.id,
          type: 'sibling',
          distance: nodeWidth * 1.5 // 理想距离
        });
      });
    }
  };
  
  collectRelationships(initialLayout);
  
  // 力导向算法主函数
  const runForceDirected = (iterations = 50) => {
    const dampening = 0.9; // 阻尼系数
    const k = 0.1; // 弹簧系数
    const repulsion = 500; // 排斥力系数
    
    for (let i = 0; i < iterations; i++) {
      // 计算节点间的力
      Object.keys(nodePositions).forEach(nodeId1 => {
        const pos1 = nodePositions[nodeId1];
        
        // 排斥力（所有节点之间）
        Object.keys(nodePositions).forEach(nodeId2 => {
          if (nodeId1 === nodeId2) return;
          
          const pos2 = nodePositions[nodeId2];
          
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 0.1) return; // 避免除以零
          
          // 计算排斥力
          const force = repulsion / (distance * distance);
          
          // 应用力
          const directionX = dx / distance;
          const directionY = dy / distance;
          
          pos1.vx += directionX * force;
          pos1.vy += directionY * force;
        });
        
        // 吸引力（与关系对象之间）
        relationships.forEach(rel => {
          if (rel.source === nodeId1 || rel.target === nodeId1) {
            const otherNodeId = rel.source === nodeId1 ? rel.target : rel.source;
            const pos2 = nodePositions[otherNodeId];
            
            const dx = pos1.x - pos2.x;
            const dy = pos1.y - pos2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) return; // 避免除以零
            
            // 计算弹簧力
            let force = k * (distance - rel.distance);
            
            // 根据关系类型调整力度
            if (rel.type === 'parent-child') {
              force *= 2; // 加强父子关系的约束
            } else if (rel.type === 'spouse') {
              force *= 3; // 更强调配偶关系的约束
            }
            
            // 应用力
            const directionX = dx / distance;
            const directionY = dy / distance;
            
            pos1.vx -= directionX * force;
            pos1.vy -= directionY * force;
          }
        });
      });
      
      // 更新位置
      Object.keys(nodePositions).forEach(nodeId => {
        const pos = nodePositions[nodeId];
        pos.vx *= dampening;
        pos.vy *= dampening;
        pos.x += pos.vx;
        pos.y += pos.vy;
        
        // 边界约束
        pos.x = Math.max(nodeWidth / 2, Math.min(width - nodeWidth / 2, pos.x));
        pos.y = Math.max(nodeHeight / 2, Math.min(height - nodeHeight / 2, pos.y));
      });
    }
  };
  
  // 运行力导向算法
  runForceDirected();
  
  // 将优化后的位置应用回树结构
  const applyOptimizedPositions = (node) => {
    if (!node) return null;
    
    // 更新节点位置
    const newNode = { ...node };
    const pos = nodePositions[node.id];
    
    if (pos) {
      newNode.x = pos.x;
      newNode.y = pos.y;
    }
    
    // 更新配偶位置
    if (node.spouses) {
      newNode.spouses = node.spouses.map(spouse => {
        const spousePos = nodePositions[spouse.id];
        
        return {
          ...spouse,
          x: spousePos ? spousePos.x : spouse.x,
          y: spousePos ? spousePos.y : spouse.y
        };
      });
    }
    
    // 更新子节点位置
    if (node.children) {
      newNode.children = node.children.map(child => 
        applyOptimizedPositions(child)
      );
    }
    
    return newNode;
  };
  
  return applyOptimizedPositions(initialLayout);
};

module.exports = {
  buildFamilyTree,
  groupMembersByGeneration,
  findRelationPath,
  describeRelation,
  getTreeHeight,
  getTreeWidth,
  getAncestors,
  getDescendants,
  layoutFamilyTree,
  exportTreeToJSON,
  importTreeFromJSON,
  findLatestGeneration,
  canAddAsChild,
  canAddAsSpouse,
  checkCyclicReference,
  findLowestCommonAncestor,
  getGenealogySummary,
  optimizeTreeLayout
};