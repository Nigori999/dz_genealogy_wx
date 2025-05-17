/**
 * Canvas管理器
 * 负责处理所有Canvas相关操作，包括初始化、调整大小和上下文管理
 */

const ErrorHandler = require('../../../utils/error-handler');

class CanvasManager {
  /**
   * 构造函数
   * @param {Object} options - 配置项
   * @param {Object} options.component - 组件实例引用
   * @param {Boolean} options.useWebGL - 是否使用WebGL
   * @param {Function} options.onCanvasReady - Canvas准备就绪回调
   * @param {Function} options.onCanvasError - Canvas错误回调
   */
  constructor(options = {}) {
    this.component = options.component;
    this.useWebGL = options.useWebGL || false;
    this.onCanvasReady = options.onCanvasReady || (() => {});
    this.onCanvasError = options.onCanvasError || (() => {});
    
    // Canvas引用
    this.canvas = null;
    this.ctx = null;
    
    // 设备信息
    this._dpr = wx.getSystemInfoSync().pixelRatio || 1;
    
    // 状态标志
    this._initialized = false;
    this._initializing = false;
    
    // 性能监控
    this._performanceStats = {
      lastFrameTime: 0,
      frameCount: 0,
      fps: 0,
      renderTime: []
    };
    
    // 兼容性信息
    this._compatibility = {
      hasCanvas2D: false,
      hasRoundRectAPI: false
    };
  }
  
  /**
   * 初始化Canvas
   * @returns {Promise} 初始化操作的Promise
   */
  init() {
    if (this._initialized) {
      console.log('[CanvasManager] Canvas已经初始化，跳过');
      return Promise.resolve(true);
    }
    
    if (this._initializing) {
      console.log('[CanvasManager] Canvas正在初始化，跳过');
      return Promise.resolve(false);
    }
    
    this._initializing = true;
    
    return new Promise((resolve, reject) => {
      try {
        console.log('[CanvasManager] 开始初始化Canvas，渲染模式:', this.useWebGL ? 'WebGL' : 'Canvas 2D');
        
        // 查询Canvas节点
        const query = this.component.createSelectorQuery();
        query.select('#canvasFamilyTree')
          .fields({
            node: true,
            size: true
          })
          .exec((res) => {
            try {
              if (!res || !res[0] || !res[0].node) {
                const error = new Error('Canvas节点获取失败');
                console.error('[CanvasManager] Canvas节点获取失败', error);
                this._initializing = false;
                this.onCanvasError(error);
                reject(error);
                return;
              }
              
              const canvasNode = res[0].node;
              console.log('[CanvasManager] Canvas节点获取成功, 类型:', canvasNode.type || '未知');
              
              // 根据渲染模式初始化相应的上下文
              if (this.useWebGL) {
                const success = this._initWebGLCanvas(canvasNode);
                if (!success) {
                  console.log('[CanvasManager] WebGL初始化失败，需要降级到Canvas 2D');
                  this._initializing = false;
                  resolve(false);
                  return;
                }
              } else {
                const success = this._init2DCanvas(canvasNode);
                if (!success) {
                  const error = new Error('Canvas 2D初始化失败');
                  console.error('[CanvasManager] Canvas 2D初始化失败', error);
                  this._initializing = false;
                  this.onCanvasError(error);
                  reject(error);
                  return;
                }
              }
              
              this._initialized = true;
              this._initializing = false;
              
              // 调用准备就绪回调
              this.onCanvasReady({
                canvas: this.canvas,
                ctx: this.ctx,
                useWebGL: this.useWebGL
              });
              
              resolve(true);
            } catch (error) {
              console.error('[CanvasManager] Canvas初始化处理异常', error);
              this._initializing = false;
              this.onCanvasError(error);
              reject(error);
            }
          });
      } catch (error) {
        console.error('[CanvasManager] Canvas查询异常', error);
        this._initializing = false;
        this.onCanvasError(error);
        reject(error);
      }
    });
  }
  
  /**
   * 初始化WebGL Canvas
   * @param {Object} canvasNode - Canvas节点
   * @returns {Boolean} 是否成功
   * @private
   */
  _initWebGLCanvas(canvasNode) {
    try {
      // 尝试获取WebGL上下文
      const gl = canvasNode.getContext('webgl');
      
      if (!gl) {
        console.error('[CanvasManager] 获取WebGL上下文失败');
        return false;
      }
      
      this.canvas = canvasNode;
      this.ctx = gl;
      
      // 调整Canvas尺寸
      this._resizeCanvas();
      
      return true;
    } catch (error) {
      console.error('[CanvasManager] 初始化WebGL异常:', error);
      return false;
    }
  }
  
  /**
   * 初始化Canvas 2D
   * @param {Object} canvasNode - Canvas节点
   * @returns {Boolean} 是否成功
   * @private
   */
  _init2DCanvas(canvasNode) {
    try {
      // 尝试获取2D上下文
      const ctx = canvasNode.getContext('2d');
      
      if (!ctx) {
        console.error('[CanvasManager] 获取2D上下文失败');
        return false;
      }
      
      this.canvas = canvasNode;
      this.ctx = ctx;
      
      // 调整Canvas尺寸
      this._resizeCanvas();
      
      // 检查API兼容性
      this._checkAPICompatibility(ctx);
      
      return true;
    } catch (error) {
      console.error('[CanvasManager] 初始化Canvas 2D异常:', error);
      return false;
    }
  }
  
  /**
   * 检查Canvas API兼容性
   * @param {CanvasRenderingContext2D} ctx - 2D上下文
   * @private
   */
  _checkAPICompatibility(ctx) {
    // 检查是否支持圆角矩形API
    this._compatibility.hasRoundRectAPI = typeof ctx.roundRect === 'function';
    console.log('[CanvasManager] 圆角矩形API支持:', this._compatibility.hasRoundRectAPI ? '支持' : '不支持');
    
    // 检查是否支持Canvas 2D的高级功能
    this._compatibility.hasCanvas2D = true;
    
    // 更新组件的兼容性状态
    if (this.component && this.component.setData) {
      this.component.setData({
        hasRoundRectAPI: this._compatibility.hasRoundRectAPI,
        hasCanvas2D: this._compatibility.hasCanvas2D
      });
    }
  }
  
  /**
   * 调整Canvas尺寸
   * @param {Number} width - 宽度(可选)，不传则使用组件属性
   * @param {Number} height - 高度(可选)，不传则使用组件属性
   */
  resizeCanvas(width, height) {
    if (!this.canvas) {
      console.warn('[CanvasManager] Canvas未初始化，无法调整尺寸');
      return false;
    }
    
    // 使用传入的尺寸或组件属性
    const viewportWidth = width || this.component.properties.viewportWidth || 0;
    const viewportHeight = height || this.component.properties.viewportHeight || 0;
    
    if (viewportWidth <= 0 || viewportHeight <= 0) {
      console.warn('[CanvasManager] 视口尺寸无效', viewportWidth, viewportHeight);
      return false;
    }
    
    // 应用设备像素比
    const canvasWidth = Math.floor(viewportWidth * this._dpr);
    const canvasHeight = Math.floor(viewportHeight * this._dpr);
    
    // 更新Canvas尺寸
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    
    console.log('[CanvasManager] Canvas尺寸调整为', canvasWidth, 'x', canvasHeight);
    
    return true;
  }
  
  /**
   * 内部调整Canvas尺寸方法
   * @private
   */
  _resizeCanvas() {
    this.resizeCanvas();
  }
  
  /**
   * 清除Canvas
   */
  clearCanvas() {
    if (!this.ctx || !this.canvas) return;
    
    if (this.useWebGL) {
      // WebGL清除
      const gl = this.ctx;
      gl.clearColor(0.96, 0.96, 0.96, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } else {
      // Canvas 2D清除
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
  
  /**
   * 获取性能统计信息
   * @returns {Object} 性能统计
   */
  getPerformanceStats() {
    return {...this._performanceStats};
  }
  
  /**
   * 记录渲染性能数据
   * @param {Number} renderTime - 渲染耗时(毫秒)
   */
  recordRenderPerformance(renderTime) {
    const now = Date.now();
    
    // 计算帧率
    if (this._performanceStats.lastFrameTime > 0) {
      const frameTime = now - this._performanceStats.lastFrameTime;
      
      // 添加渲染时间到队列(最多保存30个)
      this._performanceStats.renderTime.push(renderTime);
      if (this._performanceStats.renderTime.length > 30) {
        this._performanceStats.renderTime.shift();
      }
      
      // 计算平均渲染时间
      const avgRenderTime = this._performanceStats.renderTime.reduce((a, b) => a + b, 0) / 
        this._performanceStats.renderTime.length;
      
      // 更新FPS(1秒内采样)
      this._performanceStats.frameCount++;
      
      if (now - this._performanceStats.lastFpsUpdateTime > 1000) {
        this._performanceStats.fps = this._performanceStats.frameCount;
        this._performanceStats.frameCount = 0;
        this._performanceStats.lastFpsUpdateTime = now;
        this._performanceStats.avgRenderTime = avgRenderTime;
        
        // 输出性能日志(每秒一次)
        console.log(`[CanvasManager] 性能: ${this._performanceStats.fps}FPS, 平均渲染时间: ${avgRenderTime.toFixed(2)}ms`);
      }
    } else {
      this._performanceStats.lastFpsUpdateTime = now;
    }
    
    this._performanceStats.lastFrameTime = now;
  }
  
  /**
   * 释放资源
   */
  dispose() {
    if (this.ctx && this.useWebGL) {
      // WebGL上下文需要特殊处理
      const gl = this.ctx;
      const loseContextExt = gl.getExtension('WEBGL_lose_context');
      if (loseContextExt) {
        loseContextExt.loseContext();
      }
    }
    
    this.canvas = null;
    this.ctx = null;
    this._initialized = false;
  }
  
  /**
   * 获取Canvas兼容性信息
   * @returns {Object} 兼容性信息
   */
  getCompatibility() {
    return {...this._compatibility};
  }
  
  /**
   * 是否已初始化
   * @returns {Boolean} 是否已初始化
   */
  isInitialized() {
    return this._initialized;
  }
}

module.exports = CanvasManager; 