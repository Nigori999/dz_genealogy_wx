/**
 * Canvas 2D渲染器
 * 负责Canvas 2D绘制相关的渲染逻辑
 */

// 导入坐标系统工具类
const { coordinateSystem, CoordinateSystem } = require('../services/coordinate-system');
// 导入错误处理工具
const ErrorHandler = require('../../../utils/error-handler');

/**
 * Canvas 2D树渲染器
 * 负责2D渲染的底层实现
 */
class Canvas2DTreeRenderer {
  /**
   * 构造函数
   * @param {Object} canvas - Canvas对象
   * @param {Object} ctx - 2D上下文
   */
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.transform = {
      offsetX: 0,
      offsetY: 0,
      scale: 1.0
    };
    
    // 使用新API获取设备像素比
    this._initDevicePixelRatio();
    
    // 初始化坐标系统
    this.coordSystem = new CoordinateSystem({
      canvasWidth: this.canvas ? this.canvas.width : 300,
      canvasHeight: this.canvas ? this.canvas.height : 400,
      devicePixelRatio: this._dpr,
      isYAxisDown: true
    });
  }

  /**
   * 初始化设备像素比
   * @private
   */
  _initDevicePixelRatio = ErrorHandler.wrap(function() {
    const deviceInfo = wx.getDeviceInfo();
    this._dpr = deviceInfo.pixelRatio || 1;
  }, {
    operation: '获取设备像素比',
    defaultValue: 1,
    onError(error) {
      console.warn('[Canvas 2D] 获取设备信息失败，使用默认像素比:', error.message);
      this._dpr = 1;
    }
  });

  /**
   * 清除画布
   */
  clear = ErrorHandler.wrap(function() {
    if (!this.ctx) return;
    
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }, {
    operation: '清除画布',
    onError(error) {
      console.error('[Canvas 2D] 清除画布失败:', error.message);
    }
  });

  /**
   * 更新视口尺寸
   * @param {Number} width - 宽度
   * @param {Number} height - 高度
   */
  updateViewport = ErrorHandler.wrap(function(width, height) {
    if (!this.canvas) return;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 更新坐标系统
    this.coordSystem.updateCanvasSize(width, height);
  }, {
    operation: '更新视口尺寸',
    onError(error) {
      console.error('[Canvas 2D] 更新视口尺寸失败:', error.message);
    }
  });

  /**
   * 设置变换参数
   * @param {Number} offsetX - X轴偏移
   * @param {Number} offsetY - Y轴偏移
   * @param {Number} scale - 缩放比例
   */
  setTransform = ErrorHandler.wrap(function(offsetX, offsetY, scale) {
    this.transform.offsetX = offsetX;
    this.transform.offsetY = offsetY;
    this.transform.scale = scale;
    
    // 更新坐标系统
    this.coordSystem.updateTransform(scale, offsetX, offsetY);
  }, {
    operation: '设置变换参数',
    onError(error) {
      console.error('[Canvas 2D] 设置变换参数失败:', error.message);
    }
  });

  /**
   * 渲染族谱树
   * @param {Object} params - 渲染参数
   * @returns {Boolean} 渲染是否成功
   */
  render = ErrorHandler.wrap(function(params) {
    if (!this.ctx || !this.canvas) {
      console.warn('[Canvas2D] 上下文或画布未初始化，无法渲染');
      return false;
    }

    const {
      nodes,
      connectors,
      transform,
      visibleArea,
      currentMemberId
    } = params;

    // 应用变换
    if (transform) {
      this.setTransform(
        transform.offsetX || 0,
        transform.offsetY || 0,
        transform.scale || 1.0
      );
    }

    // 清除画布
    this.clear();
    
    // 设置背景
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    // 设置变换
    this.ctx.save();
    this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
    this.ctx.scale(this.transform.scale, this.transform.scale);

    // 渲染连接线
    if (connectors && connectors.length) {
      this._renderConnectors(connectors, visibleArea);
    }

    // 渲染节点
    if (nodes && nodes.length) {
      this._renderNodes(nodes, visibleArea, currentMemberId);
    }

    // 恢复上下文
    this.ctx.restore();

    return true;
  }, {
    operation: '渲染族谱树',
    defaultValue: false,
    onError(error) {
      console.error('[Canvas2D] 渲染族谱树失败:', error.message);
      return false;
    }
  });

  /**
   * 渲染连接线
   * @param {Array} connectors - 连接线数组
   * @param {Object} visibleArea - 可视区域
   * @private
   */
  _renderConnectors = ErrorHandler.wrap(function(connectors, visibleArea) {
    if (!connectors || connectors.length === 0) return;
    
    // 批量绘制连接线以提高性能
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.6)';
    this.ctx.lineWidth = 1;
    
    for (const conn of connectors) {
      // 快速可见性检查 - 如果可视区域存在，跳过不可见的连接线
      if (visibleArea && (
        conn.fromX > visibleArea.right + visibleArea.buffer ||
        conn.toX < visibleArea.left - visibleArea.buffer ||
        conn.fromY > visibleArea.bottom + visibleArea.buffer ||
        conn.toY < visibleArea.top - visibleArea.buffer
      )) {
        continue;
      }
      
      this.ctx.moveTo(conn.fromX, conn.fromY);
      this.ctx.lineTo(conn.toX, conn.toY);
    }
    
    this.ctx.stroke();
  }, {
    operation: '渲染连接线',
    onError(error) {
      console.error('[Canvas2D] 渲染连接线失败:', error.message);
    }
  });

  /**
   * 渲染节点
   * @param {Array} nodes - 节点数组
   * @param {Object} visibleArea - 可视区域
   * @param {String} currentMemberId - 当前成员ID
   * @private
   */
  _renderNodes(nodes, visibleArea, currentMemberId) {
    if (!nodes || nodes.length === 0) return;
    
    // 筛选可见节点
    let visibleNodes = nodes;
    if (visibleArea) {
      visibleNodes = nodes.filter(node => 
        node.x < visibleArea.right + visibleArea.buffer &&
        node.x + node.width > visibleArea.left - visibleArea.buffer &&
        node.y < visibleArea.bottom + visibleArea.buffer &&
        node.y + node.height > visibleArea.top - visibleArea.buffer
      );
    }
    
    // 绘制节点背景
    this._batchDrawNodeBackgrounds(visibleNodes);
    
    // 绘制节点边框
    this._batchDrawNodeBorders(visibleNodes, currentMemberId);
    
    // 绘制节点内容（名称、头像等）
    this._batchDrawNodeContents(visibleNodes, currentMemberId);
  }
  
  /**
   * 批量绘制节点背景
   * @param {Array} nodes - 节点数组
   * @private
   */
  _batchDrawNodeBackgrounds(nodes) {
    // 默认背景颜色
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    // 批量绘制普通节点背景
    for (const node of nodes) {
      this.ctx.fillRect(node.x, node.y, node.width, node.height);
    }
  }
  
  /**
   * 批量绘制节点边框
   * @param {Array} nodes - 节点数组
   * @param {String} currentMemberId - 当前成员ID
   * @private
   */
  _batchDrawNodeBorders(nodes, currentMemberId) {
    // 分组绘制，减少状态切换
    
    // 绘制普通节点边框
    this.ctx.strokeStyle = 'rgba(204, 204, 204, 0.8)';
    this.ctx.lineWidth = 1;
    
    const normalNodes = nodes.filter(node => 
      !node.isRoot && (!currentMemberId || node.id !== currentMemberId)
    );
    
    if (normalNodes.length > 0) {
      this.ctx.beginPath();
      for (const node of normalNodes) {
        this.ctx.rect(node.x, node.y, node.width, node.height);
      }
      this.ctx.stroke();
    }
    
    // 绘制根节点边框
    this.ctx.strokeStyle = 'rgba(255, 128, 0, 0.8)';
    this.ctx.lineWidth = 1.5;
    
    const rootNodes = nodes.filter(node => node.isRoot);
    
    if (rootNodes.length > 0) {
      this.ctx.beginPath();
      for (const node of rootNodes) {
        this.ctx.rect(node.x, node.y, node.width, node.height);
      }
      this.ctx.stroke();
    }
    
    // 绘制当前节点边框
    if (currentMemberId) {
      this.ctx.strokeStyle = 'rgba(24, 144, 255, 0.8)';
      this.ctx.lineWidth = 2;
      
      const currentNodes = nodes.filter(node => node.id === currentMemberId);
      
      if (currentNodes.length > 0) {
        this.ctx.beginPath();
        for (const node of currentNodes) {
          this.ctx.rect(node.x, node.y, node.width, node.height);
        }
        this.ctx.stroke();
      }
    }
  }
  
  /**
   * 批量绘制节点内容
   * @param {Array} nodes - 节点数组
   * @param {String} currentMemberId - 当前成员ID
   * @private
   */
  _batchDrawNodeContents(nodes, currentMemberId) {
    // 绘制节点内容（名称等）
    this.ctx.fillStyle = 'black';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    
    for (const node of nodes) {
      const name = node.name || '';
      this.ctx.fillText(name, node.x + node.width / 2, node.y + node.height - 10);
    }
  }

  /**
   * 销毁资源
   */
  dispose = ErrorHandler.wrap(function() {
    // 清理资源
    this.canvas = null;
    this.ctx = null;
    this.coordSystem = null;
  }, {
    operation: '释放Canvas2D树渲染器资源',
    onError(error) {
      console.error('[Canvas2D] 释放资源失败:', error.message);
    }
  });
}

/**
 * Canvas 2D渲染器
 * 作为组件与Canvas 2D树渲染器的桥接层
 */
class Canvas2DRenderer {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Object} options.canvas - Canvas节点
   * @param {Object} options.ctx - 2D上下文
   * @param {Object} [options.component] - 组件实例
   */
  constructor(options) {
    // 支持直接传递组件或传递options对象
    if (options.component) {
      this.component = options.component;
      this.canvas = options.canvas || options.component.canvas;
      this.ctx = options.ctx || (this.canvas ? this.canvas.getContext('2d') : null);
    } else if (options.canvas) {
      this.canvas = options.canvas;
      this.ctx = options.ctx || (this.canvas ? this.canvas.getContext('2d') : null);
      this.component = null;
    } else {
      console.error('Canvas 2D渲染器初始化失败：未提供Canvas或组件实例');
      return;
    }

    // 初始化树渲染器
    this.treeRenderer = null;
    this._initTreeRenderer();
    
    // 精灵图相关属性
    this._spriteEnabled = false;
    this._spriteCache = null;
    this._avatarUrls = new Set(); // 用于收集需要的头像URL
  }

  /**
   * 初始化树渲染器
   * @private
   */
  _initTreeRenderer = ErrorHandler.wrap(function() {
    if (!this.canvas || !this.ctx) {
      console.error('[Canvas2D] 无效的Canvas或上下文，无法初始化树渲染器');
      return;
    }

    // 创建树渲染器
    this.treeRenderer = new Canvas2DTreeRenderer(this.canvas, this.ctx);
  }, {
    operation: '初始化树渲染器',
    onError(error) {
      console.error('[Canvas2D] 初始化树渲染器失败:', error.message);
    }
  });

  /**
   * 检查是否可用
   * @returns {Boolean} 是否可用
   */
  canUse() {
    return !!this.ctx && !!this.canvas && !!this.treeRenderer;
  }

  /**
   * 清除画布
   */
  clear = ErrorHandler.wrap(function() {
    if (this.treeRenderer) {
      this.treeRenderer.clear();
    }
  }, {
    operation: '清除画布',
    onError(error) {
      console.error('[Canvas2D] 清除画布失败:', error.message);
    }
  });

  /**
   * 更新视口尺寸
   * @param {Number} width - 宽度
   * @param {Number} height - 高度
   */
  updateViewport = ErrorHandler.wrap(function(width, height) {
    if (this.treeRenderer) {
      this.treeRenderer.updateViewport(width, height);
    }
  }, {
    operation: '更新视口尺寸',
    onError(error) {
      console.error('[Canvas2D] 更新视口尺寸失败:', error.message);
    }
  });

  /**
   * 设置变换参数
   * @param {Number} offsetX - X轴偏移
   * @param {Number} offsetY - Y轴偏移
   * @param {Number} scale - 缩放比例
   */
  setTransform = ErrorHandler.wrap(function(offsetX, offsetY, scale) {
    if (this.treeRenderer) {
      this.treeRenderer.setTransform(offsetX, offsetY, scale);
    }
  }, {
    operation: '设置变换参数',
    onError(error) {
      console.error('[Canvas2D] 设置变换参数失败:', error.message);
    }
  });

  /**
   * 渲染族谱树
   * @param {Object} options - 渲染选项
   * @returns {Boolean} 渲染是否成功
   */
  render = ErrorHandler.wrap(function(options) {
    if (!this.treeRenderer) {
      console.warn('[Canvas2D] 树渲染器未初始化，无法渲染');
      return false;
    }

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

    // 获取当前变换参数
    const transformOffsetX = options.offsetX !== undefined ? 
      options.offsetX : (this.component ? this.component.data.offsetX : 0);
    const transformOffsetY = options.offsetY !== undefined ? 
      options.offsetY : (this.component ? this.component.data.offsetY : 0);
    const transformScale = options.scale !== undefined ? 
      options.scale : (this.component ? this.component.data.currentScale : 1.0);

    // 按优化模式渲染
    if (this.component && this.component.data.layeredRendering && 
        this.component.data.layeredRendering.enabled && layeredRendering) {
      return this._renderLayers(layeredRendering, transformOffsetX, transformOffsetY, transformScale);
    } else {
      // 执行标准渲染
      return this.treeRenderer.render({
        nodes,
        connectors,
        visibleArea,
        currentMemberId,
        transform: {
          offsetX: transformOffsetX,
          offsetY: transformOffsetY,
          scale: transformScale
        }
      });
    }
  }, {
    operation: '渲染族谱树',
    defaultValue: false,
    onError(error) {
      console.error('[Canvas2D] 渲染出错:', error.message);
      return false;
    }
  });
  
  /**
   * 分层渲染
   * @param {Object} layeredData - 分层数据
   * @param {Number} offsetX - X轴偏移
   * @param {Number} offsetY - Y轴偏移
   * @param {Number} scale - 缩放比例
   * @returns {Boolean} 渲染是否成功
   * @private
   */
  _renderLayers = ErrorHandler.wrap(function(layeredData, offsetX, offsetY, scale) {
    const { layerCount, layerNodes, layerConnectors, currentLayer } = layeredData;
    
    if (layerCount === 0) return true;
    
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
    
    // 清除画布
    this.clear();
    
    // 设置背景
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    
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
      
      // 渲染当前层
      this.treeRenderer.render({
        nodes: hasNodes ? layerNodes[layer] : [],
        connectors: hasConnectors ? layerConnectors[layer] : [],
        visibleArea: null, // 分层渲染时不进行可见性筛选
        currentMemberId: this.component ? this.component.properties.currentMemberId : null,
        transform: {
          offsetX,
          offsetY,
          scale
        }
      });
    }
    
    // 恢复默认状态
    this.ctx.globalAlpha = 1.0;
    
    return true;
  }, {
    operation: '分层渲染',
    defaultValue: false,
    onError(error) {
      console.error('[Canvas2D] 分层渲染失败:', error.message);
      return false;
    }
  });

  /**
   * 销毁资源
   */
  dispose = ErrorHandler.wrap(function() {
    if (this.treeRenderer) {
      this.treeRenderer.dispose();
      this.treeRenderer = null;
    }
    
    this.canvas = null;
    this.ctx = null;
    this._spriteCache = null;
    this._avatarUrls.clear();
  }, {
    operation: '释放Canvas2D渲染器资源',
    onError(error) {
      console.error('[Canvas2D] 释放资源失败:', error.message);
    }
  });
}

module.exports = {
  Canvas2DRenderer
}; 