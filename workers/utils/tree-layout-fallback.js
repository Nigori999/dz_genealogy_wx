/**
 * JavaScript实现的树布局算法
 * 作为WebAssembly的降级方案 (Worker副本)
 */

/**
 * 树布局计算器类
 * 用于计算族谱树的布局
 */
class TreeLayoutCalculator {
  /**
   * 构造函数
   */
  constructor() {
    // 初始化器
  }
  
  /**
   * 计算族谱树布局
   * @param {Array} inputNodes - 输入节点数组
   * @param {Number|Object} options - 层级高度或配置对象
   * @param {Number} siblingDistance - 兄弟节点间距
   * @returns {Object} 布局结果
   */
  calculateLayout(inputNodes, options, siblingDistance) {
    // 处理参数
    let levelHeight = 150;
    let siblingDist = 100;
    
    if (typeof options === 'number') {
      levelHeight = options;
      siblingDist = siblingDistance || 100;
    } else if (typeof options === 'object' && options !== null) {
      levelHeight = options.levelHeight || 150;
      siblingDist = options.siblingDistance || 100;
    }
    
    // 布局结果对象
    const result = {
      nodes: [],
      connectors: [],
      totalWidth: 0,
      totalHeight: 0
    };
    
    // 如果没有节点，返回空结果
    if (!inputNodes || inputNodes.length === 0) return result;
    
    // 创建节点的深拷贝
    const nodes = JSON.parse(JSON.stringify(inputNodes));
    
    // 1. 构建节点索引和子节点映射
    const nodeIndex = {};
    const childrenMap = {};
    
    for (const node of nodes) {
      nodeIndex[node.id] = node;
      
      if (node.parentId) {
        if (!childrenMap[node.parentId]) {
          childrenMap[node.parentId] = [];
        }
        childrenMap[node.parentId].push(node.id);
      }
    }
    
    // 2. 查找根节点
    const rootNodeIds = nodes.filter(node => !node.parentId).map(node => node.id);
    
    // 3. 执行布局计算
    let currentX = 0;
    let maxY = 0;
    
    // 逐个处理根节点
    for (const rootId of rootNodeIds) {
      const layoutInfo = this._layoutSubtree(rootId, 0, currentX, levelHeight, siblingDist, nodeIndex, childrenMap);
      currentX = layoutInfo.currentX;
      maxY = Math.max(maxY, layoutInfo.maxY);
    }
    
    // 4. 将计算结果转换回节点数组
    result.nodes = Object.values(nodeIndex);
    
    // 5. 生成连接线
    result.connectors = this._generateConnectors(nodeIndex);
    
    // 设置布局总尺寸
    result.totalWidth = currentX;
    result.totalHeight = maxY + levelHeight;
    
    return result;
  }

  /**
   * 递归布局子树
   * @private
   */
  _layoutSubtree(nodeId, level, startX, levelHeight, siblingDistance, nodeIndex, childrenMap) {
    const node = nodeIndex[nodeId];
    node.y = level * levelHeight;
    let currentX = startX;
    let maxY = node.y;
    
    // 检查是否有子节点
    const children = childrenMap[nodeId] || [];
    
    if (children.length === 0) {
      // 叶节点
      node.x = currentX;
      currentX += siblingDistance;
      return { currentX, maxY };
    }
    
    // 处理所有子节点
    const childStartX = currentX;
    const childrenCenters = [];
    
    for (const childId of children) {
      const result = this._layoutSubtree(childId, level + 1, currentX, levelHeight, siblingDistance, nodeIndex, childrenMap);
      currentX = result.currentX;
      maxY = Math.max(maxY, result.maxY);
      
      // 记录子节点中心位置
      const childNode = nodeIndex[childId];
      childrenCenters.push(childNode.x + childNode.width/2);
    }
    
    // 父节点位于所有子节点中心
    const leftMost = childrenCenters[0];
    const rightMost = childrenCenters[childrenCenters.length - 1];
    node.x = (leftMost + rightMost) / 2 - node.width/2;
    
    return { currentX, maxY };
  }

  /**
   * 生成连接线
   * @private
   */
  _generateConnectors(nodeIndex) {
    const connectors = [];
    
    // 生成父子关系连接线
    for (const nodeId in nodeIndex) {
      const node = nodeIndex[nodeId];
      if (node.parentId && nodeIndex[node.parentId]) {
        const parent = nodeIndex[node.parentId];
        
        connectors.push({
          type: 'parent-child',
          fromId: parent.id,
          toId: node.id,
          fromX: parent.x + parent.width/2,
          fromY: parent.y + parent.height,
          toX: node.x + node.width/2,
          toY: node.y
        });
      }
    }
    
    // 生成配偶关系连接线
    for (const nodeId in nodeIndex) {
      const node = nodeIndex[nodeId];
      if (node.spouseId && nodeIndex[node.spouseId]) {
        const spouse = nodeIndex[node.spouseId];
        
        // 避免重复添加
        if (node.id < spouse.id) {
          connectors.push({
            type: 'spouse',
            fromId: node.id,
            toId: spouse.id,
            fromX: node.x + node.width,
            fromY: node.y + node.height/2,
            toX: spouse.x,
            toY: spouse.y + spouse.height/2
          });
        }
      }
    }
    
    return connectors;
  }
}

// 导出类
module.exports = TreeLayoutCalculator; 