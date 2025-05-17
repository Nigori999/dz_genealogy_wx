/**
 * Canvas 2D渲染器
 * 负责Canvas 2D绘制相关的渲染逻辑
 */

class Canvas2DRenderer {
  /**
   * 构造函数
   * @param {Object} component - 组件实例
   */
  constructor(component) {
    this.component = component;
    this.ctx = component.ctx;
    this.canvas = component.canvas;
    this._dpr = wx.getSystemInfoSync().pixelRatio || 1;
    // 精灵图相关属性
    this._spriteEnabled = false;
    this._spriteCache = null;
    this._avatarUrls = new Set(); // 用于收集需要的头像URL
  }

  /**
   * 检查是否可用
   * @returns {Boolean} 是否可用
   */
  canUse() {
    return !!this.ctx && !!this.canvas;
  }

  /**
   * 执行渲染
   * @param {Object} options - 渲染选项
   * @param {Object} options.visibleArea - 可视区域
   * @param {Array} options.nodes - 节点数据
   * @param {Array} options.connectors - 连接线数据
   * @param {String} options.currentMemberId - 当前成员ID
   * @param {Object} options.layeredRendering - 分层渲染配置
   * @param {Object} options.spriteSupport - 精灵图支持配置
   * @returns {Boolean} 渲染是否成功
   */
  render(options) {
    const { 
      visibleArea, 
      nodes, 
      connectors, 
      currentMemberId, 
      layeredRendering, 
      spriteSupport 
    } = options;
    
    // 更新精灵图设置
    this._spriteEnabled = spriteSupport && spriteSupport.enabled;
    this._spriteCache = spriteSupport && spriteSupport.spriteCache;
    
    // 获取当前缩放和偏移值
    const { currentScale, offsetX, offsetY } = this.component.data;
    
    // 单次清除与设置背景，减少状态变化
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 保存状态并应用变换（仅一次状态保存）
    this.ctx.save();
    this.ctx.scale(this._dpr, this._dpr);
    this.ctx.translate(offsetX, offsetY);
    this.ctx.scale(currentScale, currentScale);
    
    // 初始化URL集合用于收集需要的头像URL
    this._avatarUrls = new Set();
    
    // 按优化模式渲染
    if (this.component.data.layeredRendering.enabled && layeredRendering) {
      this._renderLayers(visibleArea, layeredRendering);
    } else {
      this._renderStandard(visibleArea, nodes, connectors, currentMemberId);
    }
    
    // 恢复画布状态
    this.ctx.restore();
    
    // 如果启用了精灵图，处理收集到的URL
    if (this._spriteEnabled && this._avatarUrls.size > 0) {
      this._processCollectedAvatars();
    }
    
    return true;
  }
  
  /**
   * 处理收集到的头像URL，生成精灵图
   * @private
   */
  _processCollectedAvatars() {
    // 从组件获取RenderStrategies引用
    const RenderStrategies = require('../strategies/render-strategies');
    
    // 获取批处理大小
    const batchSize = this.component.data.spriteSupport.batchSize || 20;
    
    // 将头像URL转为数组并限制批处理大小
    const avatarUrls = Array.from(this._avatarUrls).slice(0, batchSize);
    
    if (avatarUrls.length === 0) return;
    
    // 生成精灵图
    RenderStrategies.getAvatarSprite(avatarUrls, (spriteInfo) => {
      if (spriteInfo) {
        console.log(`精灵图生成成功，包含${avatarUrls.length}个头像，尺寸：${spriteInfo.width}x${spriteInfo.height}`);
        
        // 将精灵图添加到队列加载并注册为精灵图
        if (spriteInfo.spriteUrl && this.component.imageCacheManager) {
          // 注册精灵图并预加载
          this.component.imageCacheManager.registerSprite(spriteInfo.spriteUrl);
          this.component.imageCacheManager.preloadSprite(spriteInfo.spriteUrl);
        }
        
        // 触发重新渲染
        if (this.component._render) {
          setTimeout(() => {
            this.component._render();
          }, 150); // 延迟一点时间，确保精灵图有机会加载到缓存
        }
      } else {
        console.error('精灵图生成失败');
      }
    });
    
    // 清空URL集合，避免重复生成
    this._avatarUrls.clear();
  }
  
  /**
   * 标准渲染（非分层）
   * @param {Object} visibleArea - 可视区域
   * @param {Array} nodes - 节点数据
   * @param {Array} connectors - 连接线数据
   * @param {String} currentMemberId - 当前成员ID
   * @private
   */
  _renderStandard(visibleArea, nodes, connectors, currentMemberId) {
    this.drawConnectors(visibleArea, connectors);
    this.drawNodes(visibleArea, nodes, true, currentMemberId);
  }
  
  /**
   * 分层渲染
   * @param {Object} visibleArea - 可视区域
   * @param {Object} layeredData - 分层数据
   * @private
   */
  _renderLayers(visibleArea, layeredData) {
    const { layerCount, layerNodes, layerConnectors, currentLayer } = layeredData;
    
    if (layerCount === 0) return;
    
    // 优化渲染顺序：使用距离排序算法
    const renderOrder = [];
    
    // 为所有层构建一个距离映射
    for (let i = 0; i < layerCount; i++) {
      const distance = Math.abs(i - currentLayer);
      renderOrder.push({ 
        layer: i, 
        distance,
        isCurrent: i === currentLayer
      });
    }
    
    // 按距离排序，远的层先渲染（背景），再渲染近的层（前景）
    renderOrder.sort((a, b) => {
      // 非当前层按距离排序
      if (!a.isCurrent && !b.isCurrent) {
        return b.distance - a.distance;
      }
      // 当前层始终最后渲染（置于最上层）
      return a.isCurrent ? 1 : -1;
    });
    
    // 按顺序渲染各层
    for (const item of renderOrder) {
      const layer = item.layer;
      const isCurrentLayer = layer === currentLayer;
      
      // 跳过没有内容的层，减少不必要的状态切换
      const hasConnectors = layerConnectors[layer] && layerConnectors[layer].length > 0;
      const hasNodes = layerNodes[layer] && layerNodes[layer].length > 0;
      
      if (!hasConnectors && !hasNodes) continue;
      
      // 设置层的透明度 - 按距离计算渐变透明度，增强层次感
      const alpha = isCurrentLayer ? 1.0 : Math.max(0.6, 1 - (item.distance * 0.1));
      this.ctx.globalAlpha = alpha;
      
      // 先绘制连接线，再绘制节点，确保节点在线的上面
      if (hasConnectors) {
        this.drawConnectors(visibleArea, layerConnectors[layer], isCurrentLayer);
      }
      
      if (hasNodes) {
        this.drawNodes(visibleArea, layerNodes[layer], isCurrentLayer, this.component.properties.currentMemberId);
      }
    }
    
    // 恢复默认状态
    this.ctx.globalAlpha = 1.0;
  }
  
  /**
   * 清除画布
   */
  clear() {
    if (!this.ctx || !this.canvas) return;
    
    // 重置为单位矩阵
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // 清除整个画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 填充背景色
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 绘制所有节点
   * @param {Object} visibleArea - 可视区域
   * @param {Array} nodes - 节点数组
   * @param {Boolean} isCurrentLayer - 是否当前层
   * @param {String} currentMemberId - 当前成员ID
   */
  drawNodes(visibleArea, nodes, isCurrentLayer = true, currentMemberId) {
    if (!this.ctx || !nodes || !nodes.length) return;
    
    // 过滤可见节点
    const visibleNodes = this._filterVisibleNodes(nodes, visibleArea);
    
    if (!visibleNodes.length) return;
    
    // 绘制节点背景
    this._batchDrawNodeBackgrounds(visibleNodes);
    
    // 绘制节点边框
    this._batchDrawNodeBorders(visibleNodes, currentMemberId);
    
    // 绘制节点内容
    this._batchDrawNodeContents(visibleNodes, currentMemberId);
  }
  
  /**
   * 过滤可见节点
   * @param {Array} nodes - 节点数组
   * @param {Object} visibleArea - 可视区域
   * @returns {Array} 可见节点数组
   * @private
   */
  _filterVisibleNodes(nodes, visibleArea) {
    if (!visibleArea) return [];
    
    return nodes.filter(node => {
      // 基本边界框检查
      const right = node.x + (node.width || 120);
      const bottom = node.y + (node.height || 150);
      
      return (
        right >= visibleArea.left - visibleArea.buffer &&
        node.x <= visibleArea.right + visibleArea.buffer &&
        bottom >= visibleArea.top - visibleArea.buffer &&
        node.y <= visibleArea.bottom + visibleArea.buffer
      );
    });
  }
  
  /**
   * 绘制连接线
   * @param {Object} visibleArea - 可视区域
   * @param {Array} connectors - 连接线数组
   * @param {Boolean} isCurrentLayer - 是否当前层
   */
  drawConnectors(visibleArea, connectors, isCurrentLayer = true) {
    if (!this.ctx || !connectors || !connectors.length) return;
    
    // 绘制连接线
    connectors.forEach(conn => {
      // 基本可见性检查
      if (
        conn.fromX > visibleArea.right + visibleArea.buffer ||
        conn.toX < visibleArea.left - visibleArea.buffer ||
        conn.fromY > visibleArea.bottom + visibleArea.buffer ||
        conn.toY < visibleArea.top - visibleArea.buffer
      ) {
        return; // 不可见，跳过
      }
      
      // 设置线的样式
      this.ctx.strokeStyle = conn.type === 'spouse' ? '#f0c542' : '#4287f5';
      this.ctx.lineWidth = 2;
      
      // 绘制连接线
      this.ctx.beginPath();
      this.ctx.moveTo(conn.fromX, conn.fromY);
      
      if (conn.type === 'spouse') {
        // 配偶关系用直线
        this.ctx.lineTo(conn.toX, conn.toY);
      } else {
        // 父子关系用折线
        const midY = (conn.fromY + conn.toY) / 2;
        this.ctx.lineTo(conn.fromX, midY);
        this.ctx.lineTo(conn.toX, midY);
        this.ctx.lineTo(conn.toX, conn.toY);
      }
      
      this.ctx.stroke();
    });
  }
  
  /**
   * 批量绘制节点背景
   * @param {Array} nodes - 节点数组
   * @private
   */
  _batchDrawNodeBackgrounds(nodes) {
    this.ctx.fillStyle = '#ffffff';
    
    nodes.forEach(node => {
      const x = node.x;
      const y = node.y;
      const width = node.width || 120;
      const height = node.height || 150;
      const radius = 10;
      
      // 使用统一的圆角矩形绘制
      this._drawRoundRect(x, y, width, height, radius);
      this.ctx.fill();
    });
  }
  
  /**
   * 绘制圆角矩形
   * @param {Number} x - X坐标
   * @param {Number} y - Y坐标
   * @param {Number} width - 宽度
   * @param {Number} height - 高度
   * @param {Number} radius - 圆角半径
   * @private
   */
  _drawRoundRect(x, y, width, height, radius) {
    if (!this.ctx) return;
    
    // 参数验证
    x = Number(x) || 0;
    y = Number(y) || 0;
    width = Number(width) || 0;
    height = Number(height) || 0;
    radius = Number(radius) || 0;
    
    // 异常大小检查
    if (width > 10000 || height > 10000 || width < 0 || height < 0) {
      width = Math.max(0, Math.min(width, 10000));
      height = Math.max(0, Math.min(height, 10000));
    }

    // 无效尺寸不绘制
    if (width <= 0 || height <= 0) return;

    // 确保半径不超过矩形尺寸的一半
    radius = Math.min(radius, Math.min(width / 2, height / 2));
    
    // 极小半径使用普通矩形
    if (radius <= 1) {
      this.ctx.beginPath();
      this.ctx.rect(x, y, width, height);
      this.ctx.closePath();
      return;
    }

    // 使用arcTo方法绘制圆角
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.arcTo(x + width, y, x + width, y + height, radius);
    this.ctx.arcTo(x + width, y + height, x, y + height, radius);
    this.ctx.arcTo(x, y + height, x, y, radius);
    this.ctx.arcTo(x, y, x + width, y, radius);
    this.ctx.closePath();
  }
  
  /**
   * 批量绘制节点边框
   * @param {Array} nodes - 节点数组
   * @param {String} currentMemberId - 当前成员ID
   * @private
   */
  _batchDrawNodeBorders(nodes, currentMemberId) {
    // 保存当前状态
    this.ctx.save();
    
    nodes.forEach(node => {
      const x = node.x;
      const y = node.y;
      const width = node.width || 120;
      const height = node.height || 150;
      const radius = 10;
      
      // 判断是否当前成员
      const isCurrent = node.memberId === currentMemberId;
      
      // 根据状态设置边框颜色
      if (isCurrent) {
        this.ctx.strokeStyle = '#FF5722'; // 当前成员高亮
        this.ctx.lineWidth = 3;
      } else {
        this.ctx.strokeStyle = '#E0E0E0';
        this.ctx.lineWidth = 1;
      }
      
      // 绘制边框
      this._drawRoundRect(x, y, width, height, radius);
      this.ctx.stroke();
    });
    
    // 恢复状态
    this.ctx.restore();
  }
  
  /**
   * 批量绘制节点内容
   * @param {Array} nodes - 节点数组
   * @param {String} currentMemberId - 当前成员ID
   * @private
   */
  _batchDrawNodeContents(nodes, currentMemberId) {
    const allMembers = this.component.properties.allMembers || [];
    
    // 遍历所有节点
    nodes.forEach(node => {
      const x = node.x;
      const y = node.y;
      const width = node.width || 120;
      const height = node.height || 150;
      
      // 查找成员数据
      const member = allMembers.find(m => m.id === node.memberId);
      if (!member) return;
      
      // 计算头像位置
      const avatarSize = Math.min(width * 0.6, 60);
      const avatarX = x + (width - avatarSize) / 2;
      const avatarY = y + 20;
      
      // 绘制头像
      this._drawAvatar(member, avatarX, avatarY, avatarSize);
      
      // 绘制文字
      this._drawNodeText(member, x, y, width, height, avatarY, avatarSize);
    });
  }
  
  /**
   * 绘制头像
   * @param {Object} member - 成员数据
   * @param {Number} avatarX - 头像X坐标
   * @param {Number} avatarY - 头像Y坐标
   * @param {Number} avatarSize - 头像尺寸
   * @private
   */
  _drawAvatar(member, avatarX, avatarY, avatarSize) {
    // 保存当前状态
    this.ctx.save();
    
    // 创建圆形裁剪区域
    this.ctx.beginPath();
    this.ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    this.ctx.clip();
    
    // 获取头像URL
    const avatarUrl = member.avatar || '';
    
    // 精灵图渲染模式
    if (this._spriteEnabled && avatarUrl) {
      // 添加到要处理的URL集合，稍后会用于生成新的精灵图
      this._avatarUrls.add(avatarUrl);
      
      // 检查是否存在精灵图信息
      if (this._spriteCache) {
        // 查找包含该URL的所有精灵图
        for (const cacheKey in this._spriteCache) {
          const spriteInfo = this._spriteCache[cacheKey];
          
          // 如果该精灵图包含这个头像
          if (spriteInfo && spriteInfo.positionMap && spriteInfo.positionMap[avatarUrl]) {
            // 获取头像在精灵图中的位置信息
            const pos = spriteInfo.positionMap[avatarUrl];
            
            // 绘制精灵图的对应区域
            try {
              // 使用组件的图像缓存管理器获取图像
              if (this.component.imageCacheManager) {
                const image = this.component.imageCacheManager.get(spriteInfo.spriteUrl);
                if (image) {
                  this.ctx.drawImage(
                    image,
                    pos.x, pos.y, pos.size, pos.size, // 精灵图中的位置和大小
                    avatarX, avatarY, avatarSize, avatarSize // 画布上的位置和大小
                  );
                  // 成功绘制，恢复状态并返回
                  this.ctx.restore();
                  return;
                } else {
                  // 精灵图未加载，预加载它
                  this.component.imageCacheManager.preloadSprite(spriteInfo.spriteUrl);
                }
              }
            } catch (error) {
              console.error('绘制精灵图失败:', error);
              // 失败时继续使用普通模式
            }
          }
        }
      }
    }
    
    // 普通模式：使用单张图像
    // 使用组件的图像缓存管理器获取图像
    if (this.component.imageCacheManager && avatarUrl) {
      const cachedImage = this.component.imageCacheManager.get(avatarUrl);
      
      if (cachedImage) {
        // 从缓存绘制
        try {
          this.ctx.drawImage(cachedImage, avatarX, avatarY, avatarSize, avatarSize);
          // 恢复状态并返回
          this.ctx.restore();
          return;
        } catch (error) {
          console.warn('绘制头像失败:', error);
          // 继续执行, 使用默认头像
        }
      }
    }
    
    // 缓存中没有图像或绘制失败，使用默认头像
    this._drawDefaultAvatar(member, avatarX, avatarY, avatarSize);
    
    // 队列加载图像
    if (avatarUrl && this.component.imageCacheManager) {
      this.component.imageCacheManager.queueImageLoad(avatarUrl);
    }
    
    // 恢复状态
    this.ctx.restore();
  }
  
  /**
   * 绘制默认头像
   * @param {Object} member - 成员数据
   * @param {Number} x - X坐标
   * @param {Number} y - Y坐标
   * @param {Number} size - 尺寸
   * @private
   */
  _drawDefaultAvatar(member, x, y, size) {
    // 根据性别绘制不同底色
    if (member.gender === 'female') {
      this.ctx.fillStyle = '#FFC0CB'; // 女性粉色
    } else {
      this.ctx.fillStyle = '#ADD8E6'; // 男性蓝色
    }
    
    // 绘制圆形背景
    this.ctx.fillRect(x, y, size, size);
    
    // 绘制文本
    this.ctx.fillStyle = '#333333';
    this.ctx.font = `${Math.floor(size / 3)}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 获取姓名首字
    const firstChar = (member.name || '').charAt(0) || '?';
    this.ctx.fillText(firstChar, x + size / 2, y + size / 2);
  }
  
  /**
   * 绘制节点文本
   * @param {Object} member - 成员数据
   * @param {Number} nodeX - 节点X坐标
   * @param {Number} nodeY - 节点Y坐标
   * @param {Number} width - 节点宽度
   * @param {Number} height - 节点高度
   * @param {Number} avatarY - 头像Y坐标
   * @param {Number} avatarSize - 头像尺寸
   * @private
   */
  _drawNodeText(member, nodeX, nodeY, width, height, avatarY, avatarSize) {
    // 设置文本样式
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    // 计算文本位置
    const textY = avatarY + avatarSize + 10;
    const textX = nodeX + width / 2;
    
    // 绘制姓名
    this.ctx.font = '14px sans-serif';
    this.ctx.fillStyle = '#333333';
    this.ctx.fillText(member.name || '', textX, textY, width - 10);
    
    // 绘制年龄
    const birthYear = member.birthYear ? ` (${member.birthYear})` : '';
    this.ctx.font = '12px sans-serif';
    this.ctx.fillStyle = '#666666';
    this.ctx.fillText(birthYear, textX, textY + 20, width - 10);
  }
}

module.exports = Canvas2DRenderer; 