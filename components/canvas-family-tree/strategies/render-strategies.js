/**
 * 渲染策略模块
 * 提供不同的渲染策略和设备能力检测
 */

// 导入错误处理工具
const ErrorHandler = require('../../../utils/error-handler');

/**
 * 基础渲染策略
 * 所有具体渲染策略的基类
 */
class BaseRenderStrategy {
  constructor(options = {}) {
    this.name = 'base';
    this.options = options;
  }
  
  render = ErrorHandler.wrap(function(component, params) {
    console.warn('渲染策略基类方法被调用，请实现具体策略');
    return false;
  }, {
    operation: '基础渲染',
    defaultValue: false,
    onError(error) {
      console.error('[基础策略] 渲染错误:', error.message);
      return false;
    }
  });
  
  init = ErrorHandler.wrap(function(component) {
    return true;
  }, {
    operation: '初始化基础策略',
    defaultValue: true,
    onError(error) {
      console.error('[基础策略] 初始化错误:', error.message);
      return true;
    }
  });
  
  dispose = ErrorHandler.wrap(function(component) {
    // 由子类实现具体资源释放
  }, {
    operation: '释放基础策略资源',
    onError(error) {
      console.error('[基础策略] 资源释放错误:', error.message);
    }
  });
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
  
  render = ErrorHandler.wrap(function(component, params) {
    if (!component.renderer) {
      console.error('[WebGL策略] 渲染器未初始化');
      return;
    }
    
    // 如果Canvas或上下文未初始化，将渲染请求排队
    if (!component.canvas || !component.ctx) {
      console.warn('[WebGL策略] Canvas或上下文未初始化，将渲染请求排队');
      
      // 创建一个属性来存储待渲染的参数
      if (!component._pendingRenderParams) {
        component._pendingRenderParams = [];
      }
      
      // 存储当前渲染参数
      component._pendingRenderParams.push({
        strategy: 'webgl',
        params: params,
        timestamp: Date.now()
      });
      
      // 确保不存储太多挂起的渲染请求
      if (component._pendingRenderParams.length > 5) {
        component._pendingRenderParams.shift(); // 移除最旧的请求
      }
      
      // 检查Canvas初始化状态的方法
      if (!component._checkPendingRenders) {
        component._checkPendingRenders = () => {
          if (component.canvas && component.ctx && component._pendingRenderParams && component._pendingRenderParams.length > 0) {
            console.log('[WebGL策略] Canvas已初始化，处理挂起的渲染请求');
            
            // 获取最新的一个渲染请求
            const latestRender = component._pendingRenderParams.pop();
            
            // 清空其他请求
            component._pendingRenderParams = [];
            
            // 执行渲染
            if (latestRender.strategy === 'webgl' && component.renderer) {
              this.render(component, latestRender.params);
            }
          }
        };
      }
      
      return;
    }
    
    // 添加关键调试信息 - 检查节点X坐标是否有负值
    const minX = Math.min(...params.nodes.map(node => node.x));
    const maxX = Math.max(...params.nodes.map(node => node.x + node.width));
    
    // 记录节点X坐标范围
    console.log('[WebGL策略] 节点X坐标范围:', {
      最小X: minX.toFixed(1),
      最大X: maxX.toFixed(1),
       负X坐标节点数: params.nodes.filter(node => node.x < 0).length,
       总节点数: params.nodes.length
    });
    
    // 若发现负X坐标，发出警告
    if (minX < 0) {
      console.warn('[WebGL策略] 检测到负X坐标，这可能导致渲染问题。布局算法应确保所有X坐标为正值。');
    }
    
    // 记录边界信息
    if (params.bounds) {
      console.log('[WebGL策略] 布局边界信息:', {
        minX: params.bounds.minX.toFixed(1),
        maxX: params.bounds.maxX.toFixed(1),
        宽度: params.bounds.width.toFixed(1),
        高度: params.bounds.height.toFixed(1),
        中心点: {
          x: (params.bounds.minX + params.bounds.width/2).toFixed(1),
          y: (params.bounds.minY + params.bounds.height/2).toFixed(1)
        }
      });
    }
    
    // 创建可视区域对象
    const visibleArea = component._calculateVisibleArea();
    if (!visibleArea) {
      console.error('[WebGL策略] 无法计算可视区域');
      return;
    }
    
    // 记录当前视图变换信息
    console.log('[WebGL策略] 视图变换参数:', {
      缩放: component.data.currentScale.toFixed(3),
      偏移X: component.data.offsetX.toFixed(1),
      偏移Y: component.data.offsetY.toFixed(1),
       视口: `${component.properties.viewportWidth}x${component.properties.viewportHeight}`,
       可视区域: {
         左: visibleArea.left.toFixed(1),
         右: visibleArea.right.toFixed(1), 
         上: visibleArea.top.toFixed(1),
         下: visibleArea.bottom.toFixed(1),
         世界宽度: visibleArea.width.toFixed(1),
         世界高度: visibleArea.height.toFixed(1)
       },
       计算验证: {
         左边缘转回偏移: (visibleArea.left * component.data.currentScale + component.data.offsetX).toFixed(1),
         右边缘转回偏移: (visibleArea.right * component.data.currentScale + component.data.offsetX).toFixed(1)
       }
    });
    
    // 渲染族谱树
    component.renderer.render({
      nodes: params.nodes,
      connectors: params.connectors,
      transform: {
        offsetX: component.data.offsetX,
        offsetY: component.data.offsetY,
        scale: component.data.currentScale
      },
      visibleArea,
      currentMemberId: component.properties.currentMemberId
    });
    
    // 更新节点映射用于点击检测
    component._updateNodesMap();
  }, {
    operation: 'WebGL渲染',
    onError(error) {
      console.error('[WebGL策略] 渲染错误:', error.message);
    }
  });
  
  init = ErrorHandler.wrap(function(component) {
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
    
    // 即使未初始化，也返回true允许组件后续再初始化WebGL
    return supported;
  }, {
    operation: 'WebGL策略初始化',
    defaultValue: false,
    onError(error) {
      console.error('[WebGL策略] 初始化错误:', error.message);
      return false;
    }
  });
  
  dispose = ErrorHandler.wrap(function(component) {
    if (component.renderer) {
      // 释放WebGL渲染器资源
      component.renderer.dispose();
      component.renderer = null;
    }
  }, {
    operation: '释放WebGL策略资源',
    onError(error) {
      console.error('[WebGL策略] 资源释放错误:', error.message);
    }
  });
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
  
  render = ErrorHandler.wrap(function(component, params) {
    if (!component.ctx || !component.canvas) {
      console.warn('[Canvas2D策略] 上下文或Canvas未初始化，将渲染请求排队');
      
      // 创建一个属性来存储待渲染的参数
      if (!component._pendingRenderParams) {
        component._pendingRenderParams = [];
      }
      
      // 存储当前渲染参数
      component._pendingRenderParams.push({
        strategy: 'canvas2d',
        params: params,
        timestamp: Date.now()
      });
      
      // 确保不存储太多挂起的渲染请求
      if (component._pendingRenderParams.length > 5) {
        component._pendingRenderParams.shift(); // 移除最旧的请求
      }
      
      // 检查Canvas初始化状态的方法
      if (!component._checkPendingRenders) {
        component._checkPendingRenders = () => {
          if (component.canvas && component.ctx && component._pendingRenderParams && component._pendingRenderParams.length > 0) {
            console.log('[Canvas2D策略] Canvas已初始化，处理挂起的渲染请求');
            
            // 获取最新的一个渲染请求
            const latestRender = component._pendingRenderParams.pop();
            
            // 清空其他请求
            component._pendingRenderParams = [];
            
            // 执行渲染
            if (latestRender.strategy === 'canvas2d') {
              this.render(component, latestRender.params);
            }
          }
        };
      }
      
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
  }, {
    operation: 'Canvas2D渲染',
    defaultValue: false,
    onError(error) {
      console.error('[Canvas2D策略] 渲染错误:', error.message);
      return false;
    }
  });
  
  _renderConnectors = ErrorHandler.wrap(function(component, connectors) {
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
  }, {
    operation: '渲染连接线',
    onError(error) {
      console.error('[Canvas2D策略] 渲染连接线错误:', error.message);
    }
  });
  
  _renderNodes = ErrorHandler.wrap(function(component, nodes) {
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
  }, {
    operation: '渲染节点',
    onError(error) {
      console.error('[Canvas2D策略] 渲染节点错误:', error.message);
    }
  });
  
  init = ErrorHandler.wrap(function(component) {
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
    
    // 即使Canvas和ctx未初始化也返回true，允许组件后续再初始化
    return true;
  }, {
    operation: 'Canvas2D策略初始化',
    defaultValue: true,
    onError(error) {
      console.error('[Canvas2D策略] 初始化错误:', error.message);
      return true;
    }
  });
  
  dispose = ErrorHandler.wrap(function(component) {
    // Canvas 2D资源释放较为简单
    component.ctx = null;
  }, {
    operation: '释放Canvas2D策略资源',
    onError(error) {
      console.error('[Canvas2D策略] 资源释放错误:', error.message);
    }
  });
}

/**
 * 渲染策略工厂
 * 根据设备能力和配置创建合适的渲染策略
 */
class RenderStrategyFactory {
  static createStrategy = ErrorHandler.wrap(function(options = {}) {
    const { useWebGL, webglSupported } = options;
    
    // 如果设置了使用WebGL且设备支持WebGL，则创建WebGL策略
    if (useWebGL && webglSupported) {
      return new WebGLRenderStrategy(options);
    }
    
    // 否则使用Canvas 2D策略
    return new Canvas2DRenderStrategy(options);
  }, {
    operation: '创建渲染策略',
    defaultValue: null,
    onError(error) {
      console.error('[策略工厂] 创建策略失败:', error.message);
      // 出错时返回Canvas 2D策略
      return new Canvas2DRenderStrategy();
    }
  });
  
  static getStrategy = ErrorHandler.wrap(function(webglState) {
    return this.createStrategy({
      useWebGL: webglState.enabled,
      webglSupported: webglState.supported
    });
  }, {
    operation: '获取渲染策略',
    defaultValue: null,
    onError(error) {
      console.error('[策略工厂] 获取策略失败:', error.message);
      return new Canvas2DRenderStrategy();
    }
  });
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
    return ErrorHandler.handleAsync(async () => {
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
      
      // 如果Canvas或渲染上下文未初始化，设置监听器等待初始化完成
      if (!component.canvas || !component.ctx) {
        console.warn('[策略] Canvas或上下文未初始化，将等待初始化完成');
        
        // 在组件上设置waitingForCanvasInit标志
        component._waitingForCanvasInit = true;
        
        // 创建一个方法供组件在Canvas初始化后调用
        component._checkAndInitStrategy = () => {
          if (component.canvas && component.ctx) {
            console.log('[策略] Canvas已初始化，继续策略初始化');
            component._waitingForCanvasInit = false;
            // 初始化策略
            if (this.currentStrategy) {
              const result = this.currentStrategy.init(component);
              console.log('[策略] 延迟渲染策略初始化完成:', result ? '成功' : '失败');
            }
          }
        };
        
        // 返回true表示初始化流程已启动，但需要等待Canvas初始化
        return true;
      }
      
      const result = this.currentStrategy.init(component);
      
      console.log('[策略] 渲染策略初始化完成:', result ? '成功' : '失败');
      return result;
    }, {
      operation: '初始化渲染策略',
      defaultValue: false,
      onError: (error) => {
        console.error('[策略] 初始化出错:', error.message);
        
        // 创建默认策略
        this.currentStrategy = new Canvas2DRenderStrategy();
        
        return false;
      }
    });
  },
  
  /**
   * 比较版本号
   * @param {String} v1 第一个版本号
   * @param {String} v2 第二个版本号
   * @returns {Number} 如果v1>v2返回1，v1=v2返回0，v1<v2返回-1
   * @private
   */
  _compareVersion(v1, v2) {
    return ErrorHandler.wrap(() => {
      const v1Parts = v1.split('.').map(Number);
      const v2Parts = v2.split('.').map(Number);
      
      for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;
        
        if (v1Part > v2Part) return 1;
        if (v1Part < v2Part) return -1;
      }
      
      return 0;
    }, {
      operation: '比较版本号',
      defaultValue: 0,
      onError: (error) => {
        console.error('[策略] 版本比较失败:', error.message);
        return 0;
      }
    })();
  },
  
  /**
   * 检查设备性能
   * @returns {Object} 设备性能信息
   */
  _detectDevicePerformance() {
    return ErrorHandler.wrap(() => {
      // 获取设备信息
      const deviceInfo = wx.getDeviceInfo();
      const appBaseInfo = wx.getAppBaseInfo();
      // 创建性能评级
      const performance = {
        tier: 'medium',  // 默认中等性能
        gpuClass: 'unknown',
        platform: deviceInfo.platform || 'unknown',
        deviceModel: deviceInfo.model || 'unknown',
        benchmarkScore: 0,
        sdkVersion: appBaseInfo.SDKVersion || '0.0.0'
      };
      
      // 尝试获取更详细的设备信息（不是所有平台都支持）
      try {
        // 计算一个简单的基准测试分数
        const startTime = Date.now();
        let counter = 0;
        
        // 进行一些数学计算作为基准测试
        for (let i = 0; i < 100000; i++) {
          counter += Math.sqrt(i) * Math.log(i + 1);
        }
        
        const benchmarkTime = Date.now() - startTime;
        performance.benchmarkScore = Math.round(1000 / benchmarkTime * 100);
        
        console.log('[性能检测] 基准分数:', performance.benchmarkScore);
        
        // 根据基准分数和设备型号确定性能等级
        if (performance.benchmarkScore > 80) {
          performance.tier = 'high';
        } else if (performance.benchmarkScore < 30) {
          performance.tier = 'low';
        }
        
        // 针对特定设备的优化
        const deviceModel = deviceInfo.model || '';
        if (deviceModel.includes('iPhone')) {
          if (parseInt(deviceModel.replace(/[^0-9]/g, '')) >= 11) {
            performance.tier = 'high';
            performance.gpuClass = 'apple';
          }
        } else if (deviceModel.includes('iPad')) {
          performance.tier = 'high';
          performance.gpuClass = 'apple';
        }
        
        // 检查是否是低端Android设备
        else if (deviceInfo.platform === 'android') {
          // 检查内存情况
          if (deviceInfo.memorySize && deviceInfo.memorySize < 2048) {
            performance.tier = 'low';
          }
        }
      } catch (perfError) {
        console.warn('[性能检测] 详细性能检测失败:', perfError);
      }
      
      console.log('[性能检测] 性能等级:', performance.tier);
      
      return performance;
    }, {
      operation: '检测设备性能',
      defaultValue: {
        tier: 'medium',
        platform: 'unknown',
        deviceModel: 'unknown',
        benchmarkScore: 0
      },
      onError: (error) => {
        console.error('[性能检测] 设备性能检测失败:', error);
        return {
          tier: 'medium',
          platform: 'unknown',
          deviceModel: 'unknown',
          benchmarkScore: 0
        };
      }
    })();
  },
  
  /**
   * 检查环境兼容性
   * @returns {Object} 兼容性信息
   */
  _checkCompatibility() {
    return ErrorHandler.wrap(() => {
      // 获取系统信息
      const deviceInfo = wx.getDeviceInfo();
      const appBaseInfo = wx.getAppBaseInfo();
      
      // 创建兼容性对象
      const compatibility = {
        webglSupported: false,
        canvas2dSupported: false,
        spriteSupported: false,
        apiVersion: appBaseInfo.SDKVersion || '0.0.0',
        platform: deviceInfo.platform || 'unknown'
      };
      
      // 检查WebGL支持
      try {
        // 首先检查基础库版本是否支持WebGL (需要2.7.0及以上)
        const minWebGLVersion = '2.7.0';
        compatibility.webglSupported = this._compareVersion(appBaseInfo.SDKVersion, minWebGLVersion) >= 0;
        
        console.log('[兼容性] WebGL支持:', compatibility.webglSupported);
      } catch (webglError) {
        console.warn('[兼容性] WebGL检测失败:', webglError);
      }
      
      // 检查Canvas 2D支持
      try {
        // 所有基础库版本都支持Canvas 2D
        compatibility.canvas2dSupported = true;
      } catch (canvasError) {
        console.warn('[兼容性] Canvas检测失败:', canvasError);
      }
      
      // 检查Sprite支持（精灵图）
      try {
        // 所有2.9.0及以上版本都支持离屏Canvas，可用于精灵图
        const minSpriteVersion = '2.9.0';
        compatibility.spriteSupported = this._compareVersion(appBaseInfo.SDKVersion, minSpriteVersion) >= 0;
        
        console.log('[兼容性] 精灵图支持:', compatibility.spriteSupported);
      } catch (spriteError) {
        console.warn('[兼容性] 精灵图支持检测失败:', spriteError);
      }
      
      console.log('[兼容性] 环境兼容性:', compatibility);
      
      return compatibility;
    }, {
      operation: '检查环境兼容性',
      defaultValue: {
        webglSupported: false,
        canvas2dSupported: true,
        spriteSupported: false,
        apiVersion: '0.0.0',
        platform: 'unknown'
      },
      onError: (error) => {
        console.error('[兼容性] 兼容性检测失败:', error);
        return {
          webglSupported: false,
          canvas2dSupported: true,
          spriteSupported: false,
          apiVersion: '0.0.0',
          platform: 'unknown'
        };
      }
    })();
  },
  
  /**
   * 评估设备性能
   * @private
   */
  _evaluatePerformance() {
    return ErrorHandler.wrap(() => {
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
    }, {
      operation: '评估设备性能',
      onError: (error) => {
        console.error('[策略] 性能评估出错:', error.message);
        // 出错时保持默认值
      }
    })();
  },
  
  /**
   * 获取合适的渲染器和策略
   * 融合了渲染策略选择和渲染器创建的逻辑
   * @param {Object} options - 配置选项
   * @param {Object} options.component - 组件实例
   * @param {Object} [options.canvas] - Canvas对象（可选）
   * @param {Object} [options.ctx] - 渲染上下文（可选）
   * @returns {Object} 包含renderer和strategy的对象
   */
  getRenderer(options) {
    return ErrorHandler.wrap(() => {
      const { component, canvas, ctx } = options;
      let renderer = null;
      let strategy = null;
      
      if (!component) {
        console.error('[策略] 无效的组件实例');
        strategy = new Canvas2DRenderStrategy();
        return { renderer, strategy };
      }
      
      // 判断WebGL支持
      let webglSupported = this.compatibility.webglSupported;
      
      // 更积极的WebGL启用策略 - 几乎默认启用WebGL，只有明确不支持的设备才禁用
      const shouldUseWebGL = webglSupported;
      
      // 更新组件状态
      component.setData({
        'webgl.supported': webglSupported,
        'webgl.enabled': shouldUseWebGL,
        'spriteSupport.supported': this.compatibility.spriteSupported,
        'spriteSupport.enabled': this.compatibility.spriteSupported // 默认启用精灵图
      });
      
      // 创建策略实例
      strategy = RenderStrategyFactory.createStrategy({
        useWebGL: shouldUseWebGL,
        webglSupported: webglSupported,
        context: component
      });
      
      console.log('[策略] 选择渲染策略:', strategy.name, 
        shouldUseWebGL ? '(WebGL)' : '(Canvas 2D)');
      
      // 如果没有提供Canvas，只返回策略
      if (!canvas) {
        return { renderer, strategy };
      }
      
      // 创建对应的渲染器
      if (shouldUseWebGL) {
        // 如果没有提供上下文，需要进行警告
        if (!ctx) {
          console.warn('[策略] 未提供WebGL上下文，无法创建渲染器');
          return { renderer, strategy };
        }
        
        // 检查是否为有效的WebGL上下文
        // 注意：在小程序环境中，instanceof检查可能不准确
        // 改为功能检测方式判断是否为WebGL上下文
        const isWebGLContext = ctx && 
          typeof ctx.createTexture === 'function' && 
          typeof ctx.viewport === 'function' && 
          typeof ctx.getParameter === 'function';
          
        if (!isWebGLContext) {
          console.error('[策略] 当前上下文不包含WebGL方法，但渲染模式为WebGL');
          return { renderer, strategy };
        }
        
        // 导入WebGL渲染器
        const { WebGLRenderer } = require('../renderers/webgl-renderer');
        
        // 创建WebGL渲染器
        console.log('[策略] 创建WebGL渲染器');
        renderer = new WebGLRenderer({
          canvas: canvas,
          gl: ctx,
          component: component
        });
      } else {
        // 如果没有提供上下文，需要进行警告
        if (!ctx) {
          console.warn('[策略] 未提供Canvas 2D上下文，无法创建渲染器');
          return { renderer, strategy };
        }
        
        // 检查是否为有效的2D上下文
        const is2DContext = ctx instanceof CanvasRenderingContext2D;
        if (!is2DContext) {
          console.error('[策略] 当前上下文不是Canvas 2D上下文，但渲染模式为Canvas 2D');
          return { renderer, strategy };
        }
        
        // 导入Canvas 2D渲染器
        const { Canvas2DRenderer } = require('../renderers/canvas2d-renderer');
        
        // 创建Canvas 2D渲染器
        console.log('[策略] 创建Canvas 2D渲染器');
        renderer = new Canvas2DRenderer({
          canvas: canvas,
          ctx: ctx,
          component: component
        });
      }
      
      return { renderer, strategy };
    }, {
      operation: '获取渲染器和策略',
      defaultValue: { renderer: null, strategy: new Canvas2DRenderStrategy() },
      onError: (error) => {
        console.error('[策略] 创建渲染器失败:', error.message);
        console.error('[策略] 错误堆栈:', error.stack);
        
        // 出错时使用Canvas 2D策略
        const strategy = new Canvas2DRenderStrategy();
        return { renderer: null, strategy };
      }
    })();
  },
  
  /**
   * 选择渲染策略
   * @param {Object} component - 组件实例
   * @private
   */
  _selectRenderStrategy(component) {
    return ErrorHandler.wrap(() => {
      // 直接调用getRenderer方法获取策略
      const result = this.getRenderer({ component });
      this.currentStrategy = result.strategy;
    }, {
      operation: '选择渲染策略',
      onError: (error) => {
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
    })();
  },
  
  /**
   * 获取当前渲染策略
   * @returns {BaseRenderStrategy} 当前渲染策略
   */
  getCurrentStrategy() {
    return ErrorHandler.wrap(() => {
      if (!this.currentStrategy) {
        console.warn('[策略] 当前没有活跃的渲染策略，创建默认策略');
        this.currentStrategy = new Canvas2DRenderStrategy();
      }
      return this.currentStrategy;
    }, {
      operation: '获取当前策略',
      defaultValue: null,
      onError: (error) => {
        console.error('[策略] 获取当前策略失败:', error.message);
        return new Canvas2DRenderStrategy();
      }
    })();
  },
  
  /**
   * 获取兼容性信息
   * @returns {Object} 兼容性信息
   */
  getCompatibility() {
    return ErrorHandler.wrap(() => {
      return { ...this.compatibility };
    }, {
      operation: '获取兼容性信息',
      defaultValue: {
        webglSupported: false,
        canvas2dSupported: true,
        spriteSupported: false,
        apiVersion: '0.0.0',
        platform: 'unknown'
      },
      onError: (error) => {
        console.error('[策略] 获取兼容性信息失败:', error.message);
        return {
          webglSupported: false,
          canvas2dSupported: true,
          spriteSupported: false,
          apiVersion: '0.0.0',
          platform: 'unknown'
        };
      }
    })();
  },
  
  /**
   * 获取设备性能信息
   * @returns {Object} 设备性能信息
   */
  getDevicePerformance() {
    return ErrorHandler.wrap(() => {
      return { ...this.devicePerformance };
    }, {
      operation: '获取性能信息',
      defaultValue: { score: 20, level: 'medium' },
      onError: (error) => {
        console.error('[策略] 获取性能信息失败:', error.message);
        return { score: 20, level: 'medium' };
      }
    })();
  },
  
  /**
   * 释放资源
   */
  dispose() {
    return ErrorHandler.wrap(() => {
      if (this.currentStrategy) {
        this.currentStrategy = null;
      }
    }, {
      operation: '释放策略资源',
      onError: (error) => {
        console.error('[策略] 释放资源失败:', error.message);
      }
    })();
  },
  
  /**
   * 应用渲染策略到组件
   * @param {Object} component - 组件实例
   * @param {Object} options - 策略选项
   * @returns {Boolean} 应用是否成功
   */
  applyStrategiesToComponent(component, options = {}) {
    return ErrorHandler.wrap(() => {
      if (!component) {
        console.error('[策略] 应用策略失败: 组件实例为空');
        return false;
      }
      
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
          
          // 等待一段时间后再更新策略，确保渲染器已初始化
          setTimeout(() => {
            // 检查Canvas和上下文是否已初始化
            if (!component.canvas || !component.ctx) {
              console.warn('[策略] Canvas或上下文尚未初始化，待初始化完成后再更新策略');
              return;
            }
            
            // 获取新的渲染策略
            const { strategy } = this.getRenderer({ component });
            
            // 更新当前策略
            this.currentStrategy = strategy;
            
            // 初始化新策略
            if (this.currentStrategy) {
              this.currentStrategy.init(component);
            }
            
            console.log('[策略] 已应用新策略:', this.currentStrategy ? this.currentStrategy.name : '无');
          }, 300);
          
          return true;
        } else {
          console.warn('[策略] 组件未实现switchRenderMode方法，无法切换渲染模式');
          return false;
        }
      } else {
        // 渲染模式未变化，仅更新参数
        // 获取新的渲染策略
        const { strategy } = this.getRenderer({ component });
        
        // 更新当前策略
        this.currentStrategy = strategy;
        
        console.log('[策略] 已应用新策略:', this.currentStrategy.name);
        return true;
      }
    }, {
      operation: '应用渲染策略',
      defaultValue: false,
      onError: (error) => {
        console.error('[策略] 应用策略出错:', error.message, error.stack);
        
        // 出错时创建默认策略
        this.currentStrategy = new Canvas2DRenderStrategy();
        
        return false;
      }
    })();
  },
};

module.exports = RenderStrategies;
