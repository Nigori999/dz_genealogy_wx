/**
 * 渲染策略模块
 * 提供不同的渲染策略和设备能力检测
 */

/**
 * 基础渲染策略
 * 所有具体渲染策略的基类
 */
class BaseRenderStrategy {
  constructor(options = {}) {
    this.name = 'base';
    this.options = options;
  }
  
  render(component, params) {
    console.warn('渲染策略基类方法被调用，请实现具体策略');
    return false;
  }
  
  init(component) {
    return true;
  }
  
  dispose(component) {
    // 由子类实现具体资源释放
  }
}

/**
 * WebGL渲染策略
 * 使用WebGL进行高性能渲染
 */
class WebGLRenderStrategy extends BaseRenderStrategy {
  constructor(options = {}) {
    super(options);
    this.name = 'webgl';
  }
  
  render(component, params) {
    try {
      if (!component.renderer) {
        console.warn('[WebGL策略] 渲染器未初始化');
        return false;
      }
      
      // 计算可视区域
      const visibleArea = component._calculateVisibleArea();
      if (!visibleArea) {
        console.warn('[WebGL策略] 无法计算可视区域');
        return false;
      }
      
      // 获取节点纹理
      const nodeTextureMap = component.imageCacheManager.getTexturesForNodes(params.nodes);
      
      // 准备渲染参数
      const renderParams = {
        nodes: params.nodes,
        connectors: params.connectors,
        visibleArea: visibleArea,
        nodeTextureMap: nodeTextureMap,
        currentMemberId: component.properties.currentMemberId,
        transform: {
          offsetX: component.data.offsetX,
          offsetY: component.data.offsetY,
          scale: component.data.currentScale
        },
        layeredRendering: component.data.layeredRendering.enabled ? {
          enabled: true,
          currentLayer: component.data.layeredRendering.currentLayer,
          layerNodes: component.data.layeredRendering.layerNodes,
          layerConnectors: component.data.layeredRendering.layerConnectors,
          layerCount: component.data.layeredRendering.layerCount
        } : { enabled: false }
      };
      
      // 执行WebGL渲染
      return component.renderer.render(renderParams);
    } catch (error) {
      console.error('[WebGL策略] 渲染错误:', error.message);
      return false;
    }
  }
  
  init(component) {
    // WebGL初始化由组件的_initWebGLCanvas方法完成
    // 这里只进行状态检查
    const initialized = component.data.webgl.initialized;
    const supported = component.data.webgl.supported;
    
    console.log(`[WebGL策略] 初始化检查: initialized=${initialized}, supported=${supported}`);
    
    if (!initialized) {
      console.warn('[WebGL策略] WebGL尚未初始化');
    }
    
    if (!supported) {
      console.warn('[WebGL策略] 设备不支持WebGL');
    }
    
    return initialized && supported;
  }
  
  dispose(component) {
    if (component.renderer) {
      // 释放WebGL渲染器资源
      component.renderer.dispose();
      component.renderer = null;
    }
  }
}

/**
 * Canvas 2D渲染策略
 * 使用Canvas 2D API进行渲染
 */
class Canvas2DRenderStrategy extends BaseRenderStrategy {
  constructor(options = {}) {
    super(options);
    this.name = 'canvas2d';
  }
  
  render(component, params) {
    try {
      if (!component.ctx || !component.canvas) {
        console.warn('[Canvas2D策略] 上下文或Canvas未初始化');
        return false;
      }
      
      const ctx = component.ctx;
      const canvas = component.canvas;
      const scale = component.data.currentScale;
      const offsetX = component.data.offsetX;
      const offsetY = component.data.offsetY;
      
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 渲染连接线（简化版）
      this._renderConnectors(component, params.connectors);
      
      // 渲染节点（简化版）
      this._renderNodes(component, params.nodes);
      
      return true;
    } catch (error) {
      console.error('[Canvas2D策略] 渲染错误:', error.message);
      return false;
    }
  }
  
  _renderConnectors(component, connectors) {
    const ctx = component.ctx;
    const offsetX = component.data.offsetX;
    const offsetY = component.data.offsetY;
    const scale = component.data.currentScale;
    
    // 批量绘制连接线以提高性能
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.6)';
    ctx.lineWidth = 1 * scale;
    
    for (const conn of connectors) {
      ctx.moveTo(conn.fromX * scale + offsetX, conn.fromY * scale + offsetY);
      ctx.lineTo(conn.toX * scale + offsetX, conn.toY * scale + offsetY);
    }
    
    ctx.stroke();
  }
  
  _renderNodes(component, nodes) {
    const ctx = component.ctx;
    const offsetX = component.data.offsetX;
    const offsetY = component.data.offsetY;
    const scale = component.data.currentScale;
    const currentMemberId = component.properties.currentMemberId;
    
    for (const node of nodes) {
      const x = node.x * scale + offsetX;
      const y = node.y * scale + offsetY;
      const width = node.width * scale;
      const height = node.height * scale;
      const isCurrent = node.id === currentMemberId;
      
      // 简化的节点渲染
      ctx.fillStyle = isCurrent ? 'rgba(230, 247, 255, 0.8)' : 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = node.isRoot ? 'rgba(255, 128, 0, 0.8)' : 'rgba(204, 204, 204, 0.8)';
      ctx.strokeRect(x, y, width, height);
      
      // 绘制节点名称
      ctx.fillStyle = 'black';
      ctx.font = `${14 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(node.name || '', x + width / 2, y + height - 10 * scale);
    }
  }
  
  init(component) {
    // Canvas 2D初始化由组件的_init2DCanvas方法完成
    const hasCtx = !!component.ctx;
    const hasCanvas = !!component.canvas;
    
    console.log(`[Canvas2D策略] 初始化检查: hasCtx=${hasCtx}, hasCanvas=${hasCanvas}`);
    
    if (!hasCtx) {
      console.warn('[Canvas2D策略] Canvas 2D上下文尚未初始化');
    }
    
    if (!hasCanvas) {
      console.warn('[Canvas2D策略] Canvas节点尚未初始化');
    }
    
    return hasCtx && hasCanvas;
  }
  
  dispose(component) {
    // Canvas 2D资源释放较为简单
    component.ctx = null;
  }
}

/**
 * 渲染策略工厂
 * 根据设备能力和配置创建合适的渲染策略
 */
class RenderStrategyFactory {
  static createStrategy(options = {}) {
    const { useWebGL, webglSupported } = options;
    
    // 如果设置了使用WebGL且设备支持WebGL，则创建WebGL策略
    if (useWebGL && webglSupported) {
      return new WebGLRenderStrategy(options);
    }
    
    // 否则使用Canvas 2D策略
    return new Canvas2DRenderStrategy(options);
  }
  
  static getStrategy(webglState) {
    return this.createStrategy({
      useWebGL: webglState.enabled,
      webglSupported: webglState.supported
    });
  }
}

/**
 * 渲染策略管理器
 * 用于初始化和管理渲染策略
 */
const RenderStrategies = {
  // 兼容性信息
  compatibility: {
    webglSupported: true,  // 更积极的默认值
    canvas2dSupported: true,
    spriteSupported: false,
    wasmAvailable: false,
    roundRectSupported: false
  },
  
  // 设备性能信息
  devicePerformance: {
    score: 20,  // 默认值设置为中等
    level: 'medium'
  },
  
  // 当前策略实例
  currentStrategy: null,
  
  /**
   * 初始化
   * @param {Object} component - 组件实例
   * @returns {Promise<Boolean>} 初始化是否成功
   */
  async init(component) {
    try {
      console.log('[策略] 初始化渲染策略管理器');
      
      // 检查环境兼容性
      await this._checkCompatibility(component);
      
      // 评估设备性能
      this._evaluatePerformance();
      
      // 选择渲染策略
      this._selectRenderStrategy(component);
      
      // 初始化所选策略
      if (!this.currentStrategy) {
        console.error('[策略] 未成功创建渲染策略');
        return false;
      }
      
      // 确保策略初始化方法存在
      if (typeof this.currentStrategy.init !== 'function') {
        console.error('[策略] 渲染策略没有init方法');
        return false;
      }
      
      const result = this.currentStrategy.init(component);
      
      console.log('[策略] 渲染策略初始化完成:', result ? '成功' : '失败');
      return result;
    } catch (error) {
      console.error('[策略] 初始化出错:', error.message);
      
      // 创建默认策略
      this.currentStrategy = new Canvas2DRenderStrategy();
      
      return false;
    }
  },
  
  /**
   * 检查环境兼容性
   * @param {Object} component - 组件实例
   * @private
   */
  async _checkCompatibility(component) {
    console.log('[策略] 开始检查环境兼容性');
    
    try {
      // 使用推荐的新API替代已弃用的wx.getSystemInfoSync()
      const deviceInfo = wx.getDeviceInfo();
      const appBaseInfo = wx.getAppBaseInfo();
      
      console.log('[策略] 设备信息:', {
        benchmarkLevel: deviceInfo.benchmarkLevel,
        platform: appBaseInfo.platform,
        system: deviceInfo.system,
        SDKVersion: appBaseInfo.SDKVersion
      });
      
      // 更积极的WebGL支持判断 - 默认认为支持WebGL，除非有明确证据表明不支持
      // 移除benchmarkLevel最小值限制，允许任何设备尝试WebGL
      const platform = appBaseInfo.platform || '';
      const systemVersion = parseFloat(deviceInfo.system || '0');
      
      // 只有明确不支持的旧设备才禁用WebGL
      // Android 5.0以下版本可能不支持WebGL
      const webglNotSupported = (platform === 'android' && systemVersion < 5.0);
      
      this.compatibility.webglSupported = !webglNotSupported;
      
      // 简化版兼容性检查 - 更积极地启用功能
      this.compatibility.canvas2dSupported = true;
      // 默认启用精灵图支持
      this.compatibility.spriteSupported = true;
      this.compatibility.wasmAvailable = typeof WebAssembly === 'object';
      
      console.log('[策略] 兼容性检查结果:', this.compatibility);
    } catch (error) {
      console.error('[策略] 兼容性检查出错:', error.message);
      // 出错时依然保持积极的默认值
      this.compatibility.webglSupported = true;
      this.compatibility.canvas2dSupported = true;
      this.compatibility.spriteSupported = true;
    }
  },
  
  /**
   * 评估设备性能
   * @private
   */
  _evaluatePerformance() {
    try {
      // 使用推荐的新API
      const deviceInfo = wx.getDeviceInfo();
      const appBaseInfo = wx.getAppBaseInfo();
      
      // 基于设备性能综合评分
      let score = 0;
      
      if (deviceInfo && deviceInfo.benchmarkLevel) {
        score = deviceInfo.benchmarkLevel;
      } else {
        // 根据平台给予基础分
        const platform = (appBaseInfo && appBaseInfo.platform) || '';
        score += platform === 'ios' ? 15 : 10;
      }
      
      // 性能等级划分
      let level = 'low';
      if (score >= 30) {
        level = 'high';
      } else if (score >= 20) {
        level = 'medium';
      }
      
      this.devicePerformance = { score, level };
      
      console.log('[策略] 设备性能评估:', { score, level });
    } catch (error) {
      console.error('[策略] 性能评估出错:', error.message);
      // 出错时保持默认值
    }
  },
  
  /**
   * 选择渲染策略
   * @param {Object} component - 组件实例
   * @private
   */
  _selectRenderStrategy(component) {
    try {
      // 判断WebGL支持
      let webglSupported = this.compatibility.webglSupported;
      
      // 更积极的WebGL启用策略 - 几乎默认启用WebGL，只有明确不支持的设备才禁用
      const shouldUseWebGL = webglSupported;
      
      // 更新组件状态
      if (component) {
        component.setData({
          'webgl.supported': webglSupported,
          'webgl.enabled': shouldUseWebGL,
          'spriteSupport.supported': this.compatibility.spriteSupported,
          'spriteSupport.enabled': this.compatibility.spriteSupported // 默认启用精灵图
        });
      }
      
      // 创建策略实例
      this.currentStrategy = RenderStrategyFactory.createStrategy({
        useWebGL: shouldUseWebGL,
        webglSupported: webglSupported,
        context: component
      });
      
      console.log('[策略] 选择渲染策略:', this.currentStrategy.name, 
        shouldUseWebGL ? '(WebGL)' : '(Canvas 2D)');
    } catch (error) {
      console.error('[策略] 选择渲染策略出错:', error.message);
      
      // 出错时使用Canvas 2D策略
      this.currentStrategy = new Canvas2DRenderStrategy();
      
      // 更新组件状态
      if (component) {
        component.setData({
          'webgl.supported': false,
          'webgl.enabled': false
        });
      }
    }
  },
  
  /**
   * 应用渲染策略到组件
   * @param {Object} component - 组件实例
   * @param {Object} options - 策略选项
   */
  applyStrategiesToComponent(component, options = {}) {
    if (!component) {
      console.error('[策略] 应用策略失败: 组件实例为空');
      return false;
    }
    
    try {
      console.log('[策略] 应用优化策略:', options);
      
      // 保存当前渲染模式
      const currentWebGLEnabled = component.data.webgl.enabled;
      
      // 更新组件配置
      component.setData({
        'webgl.enabled': options.webgl !== undefined ? options.webgl : component.data.webgl.enabled,
        'spriteSupport.enabled': options.sprite !== undefined ? options.sprite : component.data.spriteSupport.enabled,
        'layeredRendering.enabled': options.layered !== undefined ? options.layered : component.data.layeredRendering.enabled
      });
      
      // 如果渲染模式发生变化，需要重新初始化
      if (options.webgl !== undefined && options.webgl !== currentWebGLEnabled) {
        console.log('[策略] 检测到渲染模式变更:', options.webgl ? 'WebGL' : 'Canvas 2D');
        
        // 调用组件的switchRenderMode方法切换渲染模式
        if (typeof component.switchRenderMode === 'function') {
          component.switchRenderMode(options.webgl);
        } else {
          console.warn('[策略] 组件未实现switchRenderMode方法，无法切换渲染模式');
          return false;
        }
      }
      
      // 创建新的策略实例
      this.currentStrategy = RenderStrategyFactory.getStrategy({
        enabled: component.data.webgl.enabled,
        supported: component.data.webgl.supported
      });
      
      console.log('[策略] 已应用新策略:', this.currentStrategy.name);
      return true;
    } catch (error) {
      console.error('[策略] 应用策略出错:', error.message, error.stack);
      
      // 出错时创建默认策略
      this.currentStrategy = new Canvas2DRenderStrategy();
      return false;
    }
  },
  
  /**
   * 获取当前渲染策略
   * @returns {BaseRenderStrategy} 当前渲染策略
   */
  getCurrentStrategy() {
    if (!this.currentStrategy) {
      console.warn('[策略] 当前没有活跃的渲染策略，创建默认策略');
      this.currentStrategy = new Canvas2DRenderStrategy();
    }
    return this.currentStrategy;
  },
  
  /**
   * 获取兼容性信息
   * @returns {Object} 兼容性信息
   */
  getCompatibility() {
    return { ...this.compatibility };
  },
  
  /**
   * 获取设备性能信息
   * @returns {Object} 设备性能信息
   */
  getDevicePerformance() {
    return { ...this.devicePerformance };
  },
  
  /**
   * 释放资源
   */
  dispose() {
    if (this.currentStrategy) {
      this.currentStrategy = null;
    }
  }
};

module.exports = RenderStrategies;
