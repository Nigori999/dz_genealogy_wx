/**
 * 渲染服务
 * 用于处理各种渲染方式的初始化和管理
 */

class RendererService {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Object} options.wasmLoader - WebAssembly加载器
   * @param {Function} options.treeRenderer - 树渲染器类
   */
  constructor(options = {}) {
    this.wasmLoader = options.wasmLoader;
    this.treeRenderer = options.treeRenderer;
    this.canvas = null;
    this.ctx = null;
    this.webglRenderer = null;
  }

  /**
   * 初始化Canvas
   * @param {Object} canvas - Canvas节点
   * @param {Number} width - 宽度
   * @param {Number} height - 高度
   * @returns {Object} - 包含canvas和ctx的对象
   */
  initCanvas(canvas, width, height) {
    if (!canvas) {
      console.error('[渲染服务] 无效的Canvas节点');
      return null;
    }
    
    try {
      console.log('[渲染服务] 初始化Canvas，类型:', canvas.type || '未知');
      
      // 保存引用
      this.canvas = canvas;
      
      // 设置尺寸
      if (width && height) {
        canvas.width = width;
        canvas.height = height;
      }
      
      // 获取上下文 - 尊重已有的ctx对象
      // 如果canvas已经有ctx，优先使用已有ctx
      if (!this.ctx) {
        try {
          // 根据canvas类型获取对应的上下文
          if (canvas.type === 'webgl') {
            this.ctx = canvas.getContext('webgl');
            console.log('[渲染服务] 使用WebGL上下文');
          } else {
            this.ctx = canvas.getContext('2d');
            console.log('[渲染服务] 使用Canvas 2D上下文');
          }
        } catch (ctxError) {
          console.error('[渲染服务] 获取Canvas上下文失败:', ctxError.message);
          return null;
        }
      }
      
      if (!this.ctx) {
        console.error('[渲染服务] 获取Canvas上下文失败');
        return null;
      }
      
      return {
        canvas: this.canvas,
        ctx: this.ctx
      };
    } catch (error) {
      console.error('[渲染服务] 初始化Canvas失败:', error.message);
      console.error('[渲染服务] 错误堆栈:', error.stack);
      return null;
    }
  }

  /**
   * 检查WebGL支持
   * @returns {Boolean} 是否支持WebGL
   */
  checkWebGLSupport() {
    try {
      console.log('[WebGL服务] 开始检测WebGL支持');
      
      // 检查系统信息
      const deviceInfo = wx.getDeviceInfo();
      const appBaseInfo = wx.getAppBaseInfo();
      
      // 使用新API获取设备信息
      const pixelRatio = deviceInfo.pixelRatio || 1;
      const platform = appBaseInfo.platform || '';
      
      console.log(`[渲染服务] 设备像素比: ${pixelRatio}, 平台: ${platform}`);
      
      // 检查基础库版本是否支持WebGL (需要2.7.0及以上版本)
      const minVersion = '2.7.0';
      if (this._compareVersion(appBaseInfo.SDKVersion, minVersion) < 0) {
        console.log(`[WebGL服务] 基础库版本(${appBaseInfo.SDKVersion})低于最低要求(${minVersion})，不支持WebGL`);
        return false;
      }
      
      // 极少数设备明确不支持WebGL (可以添加已知不支持的设备列表)
      const unsupportedDevices = [
        // 可以添加已知不支持WebGL的设备型号
      ];
      
      if (unsupportedDevices.some(device => 
          platform.toLowerCase().includes(device.toLowerCase()))) {
        console.log(`[WebGL服务] 设备${platform}在已知不支持WebGL的列表中`);
        return false;
      }
      
      // 默认返回true，让系统尝试使用WebGL
      // 真正的兼容性会在后续获取上下文时验证
      console.log('[WebGL服务] 设备基本条件满足，默认允许尝试WebGL');
      return true;
    } catch (error) {
      console.error('[WebGL服务] 检测WebGL支持过程中出错:', error);
      // 出错时也默认尝试，让实际上下文获取来验证
      return true;
    }
  }

  /**
   * 比较版本号
   * @param {String} v1 第一个版本号
   * @param {String} v2 第二个版本号
   * @returns {Number} 如果v1>v2返回1，v1=v2返回0，v1<v2返回-1
   * @private
   */
  _compareVersion(v1, v2) {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  /**
   * 初始化WebGL渲染器
   * @returns {Object|null} WebGL渲染器或null
   */
  initWebGL() {
    console.log('[WebGL服务] 开始初始化WebGL渲染器');
    
    if (!this.canvas) {
      console.error('[WebGL服务] Canvas元素未定义，无法初始化WebGL');
      return null;
    }
    
    try {
      // 检查Canvas类型
      console.log('[WebGL服务] Canvas类型:', this.canvas.type || '未设置');
      
      // 获取WebGL上下文
      let ctx = null;
      try {
        // 尝试获取已存在的上下文
        ctx = this.canvas.getContext('webgl', {
          alpha: true,
          antialias: true,
          depth: true,
          failIfMajorPerformanceCaveat: false,
          premultipliedAlpha: true,
          preserveDrawingBuffer: false,
          stencil: false
        });
        
        if (!ctx) {
          console.error('[WebGL服务] WebGL上下文获取失败，canvas类型可能不是webgl或设备不支持');
          
          // 检查DOM状态
          if (typeof this.canvas.getBoundingClientRect === 'function') {
            const rect = this.canvas.getBoundingClientRect();
            console.log('[WebGL服务] Canvas尺寸:', rect.width, 'x', rect.height);
          }
          
          return null;
        }
        
        console.log('[WebGL服务] 成功获取WebGL上下文');
      } catch (error) {
        console.error('[WebGL服务] 获取WebGL上下文出错:', error.message);
        
        // 特别处理WebGL权限错误
        if (error.message && (
            error.message.includes('getPermissionBytes:fail') || 
            error.message.includes('not support') ||
            error.message.includes('permission denied'))) {
          console.error('[WebGL服务] 检测到WebGL权限错误，该设备可能不支持或禁用了WebGL');
        }
        
        if (error.stack) {
          console.error('[WebGL服务] 错误堆栈:', error.stack);
        }
        return null;
      }
      
      // 创建WebGL渲染器
      if (this.treeRenderer) {
        try {
          console.log('[WebGL服务] 创建WebGL树渲染器');
          
          // 创建渲染器前检查上下文状态
          if (!ctx || ctx.isContextLost()) {
            console.error('[WebGL服务] WebGL上下文已丢失或无效');
            return null;
          }
          
          // 创建渲染器
          this.webglRenderer = new this.treeRenderer(ctx, this.canvas);
          console.log('[WebGL服务] WebGL渲染器创建成功');
          return this.webglRenderer;
        } catch (error) {
          console.error('[WebGL服务] 创建WebGL渲染器失败:', error.message);
          
          // 特别处理WebGL权限或资源错误
          if (error.message && (
              error.message.includes('getPermissionBytes:fail') || 
              error.message.includes('not support') ||
              error.message.includes('permission denied') ||
              error.message.includes('out of memory'))) {
            console.error('[WebGL服务] 检测到WebGL权限或资源错误');
          }
          
          if (error.stack) {
            console.error('[WebGL服务] 错误堆栈:', error.stack);
          }
        }
      } else {
        console.error('[WebGL服务] 未提供WebGL渲染器实现类');
      }
    } catch (error) {
      console.error('[WebGL服务] 初始化WebGL失败:', error.message);
      
      // 特别处理WebGL错误
      if (error.message && (
          error.message.includes('getPermissionBytes:fail') || 
          error.message.includes('not support') ||
          error.message.includes('permission denied'))) {
        console.error('[WebGL服务] 检测到WebGL相关错误');
      }
      
      if (error.stack) {
        console.error('[WebGL服务] 错误堆栈:', error.stack);
      }
    }
    
    return null;
  }

  /**
   * 调整Canvas尺寸
   * @param {Number} width - 逻辑宽度
   * @param {Number} height - 逻辑高度
   * @param {Number} offsetX - X偏移
   * @param {Number} offsetY - Y偏移
   * @param {Number} scale - 缩放比例
   * @returns {Object} 尺寸信息
   */
  resizeCanvas(width, height, offsetX, offsetY, scale) {
    if (!this.canvas) return null;
    
    try {
      // 获取设备像素比，确保不为0
      const deviceInfo = wx.getDeviceInfo();
      const dpr = deviceInfo.pixelRatio || 1;
      
      console.log(`[渲染服务] 设备像素比: ${dpr}`);
      
      // 设置物理像素大小 - 使用floor避免小数点引起的渲染问题
      const physicalWidth = Math.floor(width * dpr);
      const physicalHeight = Math.floor(height * dpr);
      
      console.log('[渲染服务] 设置Canvas尺寸:', 
                  '物理尺寸:', physicalWidth, 'x', physicalHeight, 
                  '逻辑尺寸:', width, 'x', height, 
                  'DPR:', dpr);
      
      // 设置Canvas元素尺寸 - 这是物理像素
      this.canvas.width = physicalWidth;
      this.canvas.height = physicalHeight;
      
      // 尺寸信息
      const dimensions = {
        dpr,
        physicalWidth,
        physicalHeight,
        logicalWidth: width,
        logicalHeight: height
      };
      
      // 如果使用WebGL，更新WebGL渲染器
      if (this.webglRenderer) {
        try {
          // 检查方法是否存在
          if (typeof this.webglRenderer.updateViewport === 'function') {
            // 更新WebGL渲染器的视口尺寸
            this.webglRenderer.updateViewport(width, height);
          } else {
            console.warn('[渲染服务] WebGL渲染器缺少updateViewport方法');
          }
          
          // 检查方法是否存在
          if (typeof this.webglRenderer.setTransform === 'function') {
            // 更新变换
            this.webglRenderer.setTransform(offsetX, offsetY, scale);
          } else {
            console.warn('[渲染服务] WebGL渲染器缺少setTransform方法');
          }
        } catch (error) {
          console.error('[渲染服务] 更新WebGL渲染器参数失败:', error.message);
        }
      } else if (this.ctx) {
        // 初始缩放以适应设备像素比
        this.ctx.scale(dpr, dpr);
        
        // 初始清除画布
        this.clearCanvas();
      }
      
      return dimensions;
    } catch (error) {
      console.error('[渲染服务] 调整Canvas尺寸失败:', error.message);
      console.error('[渲染服务] 错误堆栈:', error.stack);
      return null;
    }
  }

  /**
   * 清除画布
   */
  clearCanvas() {
    if (!this.ctx || !this.canvas) return;
    
    try {
      // 保存当前变换状态
      this.ctx.save();
      
      // 重置为单位矩阵
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // 获取画布的物理尺寸
      const width = this.canvas.width;
      const height = this.canvas.height;
      
      // 使用物理尺寸清除整个画布
      this.ctx.clearRect(0, 0, width, height);
      
      // 用背景色填充
      this.ctx.fillStyle = '#f5f5f5';
      this.ctx.fillRect(0, 0, width, height);
      
      // 恢复之前的变换状态
      this.ctx.restore();
    } catch (error) {
      console.error('[渲染服务] 清除画布失败:', error.message);
    }
  }

  /**
   * 销毁渲染器资源
   */
  dispose() {
    // 清理WebGL资源
    if (this.webglRenderer) {
      try {
        this.webglRenderer.dispose();
      } catch (error) {
        console.warn('清理WebGL资源时出错:', error);
      }
      this.webglRenderer = null;
    }
    
    // 清除引用
    this.canvas = null;
    this.ctx = null;
  }
}

module.exports = RendererService; 