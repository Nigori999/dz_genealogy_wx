/**
 * 坐标系统工具类
 * 用于处理族谱树渲染中的所有坐标转换，确保算法一致性
 */

/**
 * 坐标系统转换工具
 * 提供世界坐标和屏幕坐标之间的转换方法
 */
class CoordinateSystem {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Number} options.canvasWidth - 画布宽度
   * @param {Number} options.canvasHeight - 画布高度
   * @param {Number} options.scale - 初始缩放比例
   * @param {Number} options.offsetX - 初始X偏移量
   * @param {Number} options.offsetY - 初始Y偏移量
   */
  constructor(options = {}) {
    this.canvasWidth = options.canvasWidth || 300;
    this.canvasHeight = options.canvasHeight || 400;
    this.scale = options.scale || 1.0;
    this.offsetX = options.offsetX || 0;
    this.offsetY = options.offsetY || 0;
    
    // Y轴是否朝下(微信小程序WebGL中Y轴向下为正)
    this.isYAxisDown = options.isYAxisDown !== undefined ? options.isYAxisDown : true;
    
    // 设备像素比，用于Canvas2D高清绘制
    this.devicePixelRatio = options.devicePixelRatio || 1;
  }
  
  /**
   * 更新画布尺寸
   * @param {Number} width - 画布宽度
   * @param {Number} height - 画布高度
   */
  updateCanvasSize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
  
  /**
   * 更新变换参数
   * @param {Number} scale - 缩放比例
   * @param {Number} offsetX - X偏移量
   * @param {Number} offsetY - Y偏移量
   */
  updateTransform(scale, offsetX, offsetY) {
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
  
  /**
   * 更新设备像素比
   * @param {Number} dpr - 设备像素比
   */
  updateDevicePixelRatio(dpr) {
    this.devicePixelRatio = dpr || 1;
  }
  
  /**
   * 世界坐标转屏幕坐标
   * @param {Number} worldX - 世界X坐标
   * @param {Number} worldY - 世界Y坐标
   * @returns {Object} 屏幕坐标 {x, y}
   */
  worldToScreen(worldX, worldY) {
    // 确保输入是数字
    worldX = Number(worldX);
    worldY = Number(worldY);
    
    if (isNaN(worldX) || isNaN(worldY)) {
      console.error('[坐标系统] 世界坐标无效:', {x: worldX, y: worldY});
      return {x: 0, y: 0};
    }
    
    return {
      x: worldX * this.scale + this.offsetX,
      y: worldY * this.scale + this.offsetY
    };
  }
  
  /**
   * 屏幕坐标转世界坐标
   * @param {Number} screenX - 屏幕X坐标
   * @param {Number} screenY - 屏幕Y坐标
   * @returns {Object} 世界坐标 {x, y}
   */
  screenToWorld(screenX, screenY) {
    // 确保输入是数字
    screenX = Number(screenX);
    screenY = Number(screenY);
    
    if (isNaN(screenX) || isNaN(screenY)) {
      console.error('[坐标系统] 屏幕坐标无效:', {x: screenX, y: screenY});
      return {x: 0, y: 0};
    }
    
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale
    };
  }
  
  /**
   * 创建正交投影矩阵
   * @returns {Float32Array} 投影矩阵
   */
  createOrthographicMatrix() {
    // 根据Y轴方向选择合适的正交矩阵
    if (this.isYAxisDown) {
      // 微信小程序WebGL中Y轴向下为正
      return new Float32Array([
        2 / this.canvasWidth, 0, 0, 0,
        0, 2 / this.canvasHeight, 0, 0,  // 正值表示Y轴向下
        0, 0, 1, 0,
        -1, -1, 0, 1  // 原点在左上角
      ]);
    } else {
      // 标准WebGL中Y轴向上为正
      return new Float32Array([
        2 / this.canvasWidth, 0, 0, 0,
        0, -2 / this.canvasHeight, 0, 0,  // 负值表示Y轴向上
        0, 0, 1, 0,
        -1, 1, 0, 1  // 原点在左下角
      ]);
    }
  }
  
  /**
   * 创建WebGL变换矩阵
   * @param {Number} x - 左上角X位置
   * @param {Number} y - 左上角Y位置
   * @param {Number} width - 宽度
   * @param {Number} height - 高度
   * @param {Boolean} useCenterPoint - 是否使用中心点计算(默认为false)
   * @returns {Float32Array} 变换矩阵
   */
  createTransformMatrix(x, y, width, height, useCenterPoint = false) {
    // 确保所有输入值都是数字
    x = Number(x);
    y = Number(y);
    width = Number(width);
    height = Number(height);
    
    // 验证输入
    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
      console.error('[坐标系统] 变换矩阵输入无效:', {x, y, width, height});
      // 返回默认矩阵
      return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]);
    }
    
    if (useCenterPoint) {
      // 使用中心点坐标计算
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      
      return new Float32Array([
        width, 0, 0, 0,
        0, height, 0, 0,
        0, 0, 1, 0,
        centerX, centerY, 0, 1
      ]);
    } else {
      // 使用左上角坐标计算
      return new Float32Array([
        width, 0, 0, 0,
        0, height, 0, 0,
        0, 0, 1, 0,
        x, y, 0, 1
      ]);
    }
  }
  
  /**
   * 计算当前可视区域 (世界坐标系中)
   * @param {Number} buffer - 缓冲区大小(世界坐标单位)
   * @returns {Object} 可视区域 {left, top, right, bottom, width, height, buffer}
   */
  calculateVisibleArea(buffer = 100) {
    // 计算世界坐标中的可视区域
    // 屏幕坐标 = 世界坐标*scale + offset
    // 因此世界坐标 = (屏幕坐标 - offset) / scale
    const left = (0 - this.offsetX) / this.scale;
    const top = (0 - this.offsetY) / this.scale;
    const right = (this.canvasWidth - this.offsetX) / this.scale;
    const bottom = (this.canvasHeight - this.offsetY) / this.scale;
    
    // 缓冲区随缩放变化
    const scaledBuffer = buffer / this.scale;
    
    return {
      left: left,
      top: top,
      right: right,
      bottom: bottom,
      width: right - left,
      height: bottom - top,
      buffer: scaledBuffer
    };
  }
  
  /**
   * 计算居中偏移量
   * @param {Object} bounds - 树的边界 {minX, minY, maxX, maxY, width, height}
   * @returns {Object} 居中参数 {scale, offsetX, offsetY}
   */
  calculateCenteringTransform(bounds) {
    if (!bounds) {
      console.error('[坐标系统] 边界信息不存在，无法计算居中参数');
      return { scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY };
    }
    
    // 验证边界信息是否有效
    if (
      bounds.minX === undefined || bounds.maxX === undefined ||
      bounds.minY === undefined || bounds.maxY === undefined ||
      (bounds.width === undefined && (bounds.maxX - bounds.minX <= 0)) ||
      (bounds.height === undefined && (bounds.maxY - bounds.minY <= 0))
    ) {
      console.error('[坐标系统] 边界信息无效:', bounds);
      return { scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY };
    }
    
    // 计算族谱树的尺寸
    const treeWidth = bounds.width || (bounds.maxX - bounds.minX);
    const treeHeight = bounds.height || (bounds.maxY - bounds.minY);
    
    // 验证树的尺寸
    if (treeWidth <= 0 || treeHeight <= 0) {
      console.error('[坐标系统] 树的尺寸无效:', {宽度: treeWidth, 高度: treeHeight});
      return { scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY };
    }
    
    // 计算合适的缩放比例以适应视口
    // 目标是使树宽度占据视口宽度的80%，或高度占据视口高度的80%
    const scaleX = (this.canvasWidth * 0.8) / treeWidth;
    const scaleY = (this.canvasHeight * 0.8) / treeHeight;
    
    // 选择较小的缩放比例，确保树完全可见
    let scale = Math.min(scaleX, scaleY);
    
    // 限制缩放范围，避免太大或太小
    scale = Math.min(1.5, Math.max(0.3, scale));
    
    // 计算族谱树的中心点(世界坐标)
    const treeCenterX = bounds.minX + treeWidth / 2;
    const treeCenterY = bounds.minY + treeHeight / 2;
    
    // 计算视口中心点(屏幕坐标)
    const viewportCenterX = this.canvasWidth / 2;
    const viewportCenterY = this.canvasHeight / 2;
    
    // 正确计算偏移量：视口中心点 - 树中心点*缩放
    const offsetX = viewportCenterX - (treeCenterX * scale);
    const offsetY = viewportCenterY - (treeCenterY * scale);
    
    // 调试信息
    console.log('[坐标系统] 居中计算:', {
      树尺寸: {宽: treeWidth.toFixed(1), 高: treeHeight.toFixed(1)},
      树中心: {x: treeCenterX.toFixed(1), y: treeCenterY.toFixed(1)},
      视口中心: {x: viewportCenterX, y: viewportCenterY},
      缩放: scale.toFixed(3),
      偏移: {x: offsetX.toFixed(1), y: offsetY.toFixed(1)}
    });
    
    // 保护: 确保最终计算的偏移量是有效数字
    if (isNaN(offsetX) || isNaN(offsetY) || isNaN(scale)) {
      console.error('[坐标系统] 居中计算出的值无效', {
        偏移X: offsetX,
        偏移Y: offsetY,
        缩放: scale
      });
      
      return { scale: this.scale, offsetX: this.offsetX, offsetY: this.offsetY };
    }
    
    return { scale, offsetX, offsetY };
  }
  
  /**
   * 计算元素是否在可视区域内
   * @param {Object} element - 元素 {x, y, width, height}
   * @param {Object} visibleArea - 可视区域 (由calculateVisibleArea()返回)
   * @returns {Boolean} 是否在可视区域内
   */
  isElementVisible(element, visibleArea) {
    if (!element || !visibleArea) return false;
    
    const right = element.x + (element.width || 0);
    const bottom = element.y + (element.height || 0);
    
    return (
      right >= visibleArea.left - visibleArea.buffer &&
      element.x <= visibleArea.right + visibleArea.buffer &&
      bottom >= visibleArea.top - visibleArea.buffer &&
      element.y <= visibleArea.bottom + visibleArea.buffer
    );
  }
  
  /**
   * 将WebGL坐标归一化到(-1,1)范围
   * @param {Number} x - X坐标 
   * @param {Number} y - Y坐标
   * @returns {Object} 归一化坐标 {x, y}
   */
  normalizeToWebGLCoords(x, y) {
    if (isNaN(x) || isNaN(y)) {
      console.error('[坐标系统] 无效的坐标输入:', {x, y});
      return {x: 0, y: 0};
    }
    
    // 屏幕坐标转WebGL归一化坐标
    const normalizedX = (x / this.canvasWidth) * 2 - 1;
    
    // 小程序WebGL中Y轴通常是向下的，但WebGL标准中是向上的
    // 根据isYAxisDown标志适配不同的坐标系统
    let normalizedY;
    if (this.isYAxisDown) {
      // Y轴向下 (小程序WebGL默认)
      normalizedY = (y / this.canvasHeight) * 2 - 1;
    } else {
      // Y轴向上 (WebGL标准)
      normalizedY = 1 - (y / this.canvasHeight) * 2;
    }
    
    // 记录一些样本值以便调试
    if (Math.random() < 0.01) {
      console.log('[坐标系统] 坐标归一化样本:', {
        输入: {x, y},
        canvasSize: {w: this.canvasWidth, h: this.canvasHeight},
        归一化结果: {x: normalizedX, y: normalizedY},
        Y轴朝下: this.isYAxisDown
      });
    }
    
    return { x: normalizedX, y: normalizedY };
  }
  
  /**
   * 过滤可见节点 - 用于Canvas2D渲染
   * @param {Array} nodes - 节点数组
   * @param {Object} visibleArea - 可视区域
   * @returns {Array} 可见节点数组
   */
  filterVisibleNodes(nodes, visibleArea) {
    if (!visibleArea || !nodes) return [];
    
    return nodes.filter(node => this.isElementVisible(node, visibleArea));
  }
  
  /**
   * 过滤可见连接线 - 用于Canvas2D渲染
   * @param {Array} connectors - 连接线数组
   * @param {Object} visibleArea - 可视区域
   * @returns {Array} 可见连接线数组
   */
  filterVisibleConnectors(connectors, visibleArea) {
    if (!visibleArea || !connectors) return [];
    
    return connectors.filter(connector => {
      // 边界框检查 - 包含连接线的起点和终点
      const minX = Math.min(connector.fromX, connector.toX);
      const maxX = Math.max(connector.fromX, connector.toX);
      const minY = Math.min(connector.fromY, connector.toY);
      const maxY = Math.max(connector.fromY, connector.toY);
      
      return (
        maxX >= visibleArea.left - visibleArea.buffer &&
        minX <= visibleArea.right + visibleArea.buffer &&
        maxY >= visibleArea.top - visibleArea.buffer &&
        minY <= visibleArea.bottom + visibleArea.buffer
      );
    });
  }
  
  /**
   * 应用Canvas2D变换
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
   */
  applyCanvas2DTransform(ctx) {
    if (!ctx) return;
    
    // 保存状态
    ctx.save();
    
    // 应用设备像素比
    ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    
    // 应用偏移和缩放
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);
  }
  
  /**
   * 重置Canvas2D变换
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
   */
  resetCanvas2DTransform(ctx) {
    if (!ctx) return;
    
    // 恢复到保存的状态
    ctx.restore();
  }
  
  /**
   * 绘制圆角矩形 - 用于Canvas2D渲染
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D上下文
   * @param {Number} x - X坐标
   * @param {Number} y - Y坐标
   * @param {Number} width - 宽度
   * @param {Number} height - 高度
   * @param {Number} radius - 圆角半径
   */
  drawRoundRect(ctx, x, y, width, height, radius) {
    if (!ctx) return;
    
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
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.closePath();
      return;
    }

    // 使用arcTo方法绘制圆角
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }
}

// 创建全局坐标系统实例，确保整个应用使用一致的坐标转换
const coordinateSystem = new CoordinateSystem();

// 导出
module.exports = {
  CoordinateSystem,
  coordinateSystem
}; 