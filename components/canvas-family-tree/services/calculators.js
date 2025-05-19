/**
 * 族谱树布局与计算工具
 * 替代原WebAssembly实现的纯JavaScript版本
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

/**
 * 路径计算器
 * 用于计算UI元素的路径
 */
class PathCalculator {
  /**
   * 计算圆角矩形路径点
   * @param {Number} x - 矩形左上角X坐标
   * @param {Number} y - 矩形左上角Y坐标
   * @param {Number} width - 矩形宽度
   * @param {Number} height - 矩形高度
   * @param {Number} radius - 圆角半径
   * @returns {Array} 路径点数组
   */
  roundRectPath(x, y, width, height, radius) {
    const points = [];
    const segments = 8; // 每个圆角的分段数
    
    // 右上角圆弧
    for (let i = 0; i <= segments; i++) {
      const angle = i * Math.PI / (2 * segments);
      const px = x + width - radius + radius * Math.cos(angle);
      const py = y + radius - radius * Math.sin(angle);
      points.push({ x: px, y: py });
    }
    
    // 右下角圆弧
    for (let i = 0; i <= segments; i++) {
      const angle = i * Math.PI / (2 * segments) + Math.PI / 2;
      const px = x + width - radius + radius * Math.cos(angle);
      const py = y + height - radius + radius * Math.sin(angle);
      points.push({ x: px, y: py });
    }
    
    // 左下角圆弧
    for (let i = 0; i <= segments; i++) {
      const angle = i * Math.PI / (2 * segments) + Math.PI;
      const px = x + radius + radius * Math.cos(angle);
      const py = y + height - radius + radius * Math.sin(angle);
      points.push({ x: px, y: py });
    }
    
    // 左上角圆弧
    for (let i = 0; i <= segments; i++) {
      const angle = i * Math.PI / (2 * segments) + 3 * Math.PI / 2;
      const px = x + radius + radius * Math.cos(angle);
      const py = y + radius + radius * Math.sin(angle);
      points.push({ x: px, y: py });
    }
    
    return points;
  }
  
  /**
   * 生成连接线控制点
   * @param {Number} fromX - 起点X坐标
   * @param {Number} fromY - 起点Y坐标
   * @param {Number} toX - 终点X坐标
   * @param {Number} toY - 终点Y坐标
   * @param {Boolean} isSpouse - 是否为配偶连接线
   * @returns {Array} 路径点数组
   */
  generateConnectorPoints(fromX, fromY, toX, toY, isSpouse) {
    const points = [];
    
    if (isSpouse) {
      // 配偶连接线（直线）
      points.push({ x: fromX, y: fromY });
      points.push({ x: toX, y: toY });
    } else {
      // 父子连接线（三段线）
      const midY = (fromY + toY) / 2;
      
      points.push({ x: fromX, y: fromY });
      points.push({ x: fromX, y: midY });
      points.push({ x: toX, y: midY });
      points.push({ x: toX, y: toY });
    }
    
    return points;
  }
}

/**
 * 可见性计算器
 * 用于计算哪些元素在视口内可见
 */
class VisibilityCalculator {
  /**
   * 计算可见元素
   * @param {Array} elements - 元素数组
   * @param {Object} area - 可见区域
   * @returns {Array} 可见元素ID数组
   */
  checkVisibility(params) {
    const { elements, area } = params;
    const visibleIds = [];
    
    for (const element of elements) {
      if (this._isVisible(element, area)) {
        visibleIds.push(element.id);
      }
    }
    
    return visibleIds;
  }
  
  /**
   * 判断元素是否可见
   * @private
   */
  _isVisible(rect, area) {
    return !(rect.x > area.right + area.buffer || 
             rect.x + rect.width < area.left - area.buffer || 
             rect.y > area.bottom + area.buffer || 
             rect.y + rect.height < area.top - area.buffer);
  }
}

// 创建单例导出
const treeLayoutCalculator = new TreeLayoutCalculator();
const pathCalculator = new PathCalculator();
const visibilityCalculator = new VisibilityCalculator();

module.exports = {
  treeLayoutCalculator,
  pathCalculator,
  visibilityCalculator
}; 