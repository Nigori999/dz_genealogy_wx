/**
 * 族谱树布局与计算工具 - Worker专用版本
 * 纯JavaScript实现，供Worker线程使用
 */

/**
 * 树布局计算器
 * 用于计算家族树中节点的布局位置
 */
class TreeLayoutCalculator {
  /**
   * 计算树布局位置
   * @param {Array} nodes - 节点数组，每个节点包含id、parentId等信息
   * @param {Number} levelHeight - 层级高度
   * @param {Number} siblingDistance - 兄弟节点间距
   * @returns {Object} 布局结果，包含节点位置和连接线信息
   */
  calculateLayout(nodes, levelHeight = 150, siblingDistance = 100) {
    // 布局结果
    const result = {
      nodes: [],
      connectors: [],
      totalWidth: 0,
      totalHeight: 0
    };
    
    if (!nodes || nodes.length === 0) {
      return result;
    }
    
    // 1. 构建节点索引
    const nodeIndex = {};
    const childrenMap = {};
    
    // 创建节点索引和子节点映射
    for (const node of nodes) {
      nodeIndex[node.id] = { ...node };
      
      if (node.parentId) {
        if (!childrenMap[node.parentId]) {
          childrenMap[node.parentId] = [];
        }
        childrenMap[node.parentId].push(node.id);
      }
    }
    
    // 2. 查找根节点
    const rootNodeIds = [];
    for (const node of nodes) {
      if (!node.parentId) {
        rootNodeIds.push(node.id);
      }
    }
    
    // 3. 执行布局计算
    let currentX = 0;
    let maxY = 0;
    
    // 逐个处理根节点
    for (const rootId of rootNodeIds) {
      const layoutInfo = this._layoutSubtree(rootId, 0, currentX, levelHeight, siblingDistance, 
                                        nodeIndex, childrenMap);
      currentX = layoutInfo.currentX;
      maxY = Math.max(maxY, layoutInfo.maxY);
    }
    
    // 4. 将计算结果转换回节点数组
    for (const id in nodeIndex) {
      result.nodes.push(nodeIndex[id]);
    }
    
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
    // 实现递归布局算法
    const node = nodeIndex[nodeId];
    node.y = level * levelHeight;
    let currentX = startX;
    let maxY = node.y;
    
    // 检查是否有子节点
    const children = childrenMap[nodeId] || [];
    if (children.length === 0) {
      // 叶节点
      node.x = currentX;
      currentX += node.width + siblingDistance;
      return { currentX, maxY };
    }
    
    // 处理所有子节点
    const childStartX = currentX;
    const childrenCenters = [];
    
    for (const childId of children) {
      const result = this._layoutSubtree(childId, level + 1, currentX, levelHeight, 
                                    siblingDistance, nodeIndex, childrenMap);
      currentX = result.currentX;
      maxY = Math.max(maxY, result.maxY);
      
      // 记录子节点中心位置
      const childNode = nodeIndex[childId];
      childrenCenters.push(childNode.x + childNode.width / 2);
    }
    
    // 父节点位于所有子节点中心
    const leftMost = childrenCenters[0];
    const rightMost = childrenCenters[childrenCenters.length - 1];
    node.x = (leftMost + rightMost) / 2 - node.width / 2;
    
    return { currentX, maxY };
  }
  
  /**
   * 生成连接线
   * @private
   */
  _generateConnectors(nodeIndex) {
    const connectors = [];
    
    // 生成父子关系连接线
    for (const id in nodeIndex) {
      const node = nodeIndex[id];
      if (node.parentId) {
        const parent = nodeIndex[node.parentId];
        if (parent) {
          connectors.push({
            type: 'parent-child',
            fromId: parent.id,
            toId: node.id,
            fromX: parent.x + parent.width / 2,
            fromY: parent.y + parent.height,
            toX: node.x + node.width / 2,
            toY: node.y
          });
        }
      }
    }
    
    // 生成配偶关系连接线
    for (const id in nodeIndex) {
      const node = nodeIndex[id];
      if (node.spouseId) {
        const spouse = nodeIndex[node.spouseId];
        if (spouse && node.id < spouse.id) { // 避免重复添加
          connectors.push({
            type: 'spouse',
            fromId: node.id,
            toId: spouse.id,
            fromX: node.x + node.width,
            fromY: node.y + node.height / 2,
            toX: spouse.x,
            toY: spouse.y + spouse.height / 2
          });
        }
      }
    }
    
    return connectors;
  }
}

// 创建单例导出
const treeLayoutCalculator = new TreeLayoutCalculator();

// 仅导出Worker需要的计算器
module.exports = {
  treeLayoutCalculator
}; 