/**
 * 渲染策略
 * 使用策略模式处理不同渲染方式的选择逻辑
 */

// 导入渲染器
const Canvas2DRenderer = require('../renderers/canvas2d-renderer');
const WebGLRenderer = require('../renderers/webgl-renderer');
// 导入精灵图工具
const spriteUtil = require('../../../utils/sprite-util');

/**
 * 渲染策略管理器
 */
const RenderStrategies = {
  // 精灵图相关状态和缓存
  _spriteCache: {},
  _spriteSupported: false,
  _spritesInitialized: false,
  
  // 渲染器实例
  _webglRenderer: null,
  _canvas2dRenderer: null,
  
  // 性能监控
  _performanceStats: {
    lastRenderTime: 0,
    fps: 0,
    frameCount: 0,
    lastFpsTime: 0
  },
  
  // 设备性能评估结果
  _devicePerformance: {
    score: 0,
    deviceInfo: null,
    strategy: null
  },
  
  // 设备兼容性
  _compatibility: {
    hasCanvas2D: false,
    hasRoundRectAPI: false,
    webglSupported: false,
    spriteSupported: false,
    wasmAvailable: false,
    sdkVersion: '0.0.0'
  },
  
  /**
   * 初始化策略管理器
   * @param {Object} component - 组件实例引用
   * @returns {Promise} 初始化完成的Promise
   */
  init(component) {
    // 检查系统和API兼容性
    this._checkCompatibility();
    
    // 检测设备性能并确定最优渲染策略
    return this._detectPerformanceAndSetStrategy(component);
  },
  
  /**
   * 检查API兼容性
   * @private
   */
  _checkCompatibility() {
    try {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      const sdkVersion = systemInfo.SDKVersion || '0.0.0';
      
      console.log('[RenderStrategies] 当前基础库版本：', sdkVersion);
      
      // 检查Canvas 2D支持（2.9.0以上版本支持）
      const hasCanvas2D = this._compareVersion(sdkVersion, '2.9.0') >= 0;
      
      // 检查roundRect API支持（2.14.0以上版本支持）
      const hasRoundRectAPI = this._compareVersion(sdkVersion, '2.14.0') >= 0;
      
      // 检查WebGL支持（2.7.0以上版本支持）
      const webglSupported = this._compareVersion(sdkVersion, '2.7.0') >= 0;
      
      // 检查WebAssembly支持
      const wasmAvailable = typeof WebAssembly !== 'undefined';
      
      // 检查精灵图支持
      const spriteSupported = this.initSpriteSupport();
      
      // 更新兼容性信息
      this._compatibility = {
        hasCanvas2D,
        hasRoundRectAPI,
        webglSupported,
        spriteSupported,
        wasmAvailable,
        sdkVersion
      };
      
      console.log('[RenderStrategies] 兼容性检查结果:', this._compatibility);
      
      return this._compatibility;
    } catch (error) {
      console.error('[RenderStrategies] 兼容性检查失败:', error);
      return this._compatibility;
    }
  },
  
  /**
   * 比较版本号大小
   * @param {String} v1 - 版本号1
   * @param {String} v2 - 版本号2
   * @returns {Number} -1: v1<v2, 0: v1=v2, 1: v1>v2
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
  },
  
  /**
   * 检测设备性能并选择最优渲染策略
   * @param {Object} component - 组件实例
   * @returns {Promise} 策略确定后的Promise
   * @private
   */
  async _detectPerformanceAndSetStrategy(component) {
    try {
      console.log('[RenderStrategies] 开始检测设备性能...');

      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      console.log('[RenderStrategies] 设备信息:', systemInfo.brand, systemInfo.model, systemInfo.platform);

      // 创建性能得分
      let performanceScore = this._calculatePerformanceScore(systemInfo);

      console.log('[RenderStrategies] 设备性能评估得分:', performanceScore, '/ 100');

      // 设置渲染策略
      const optimizationSettings = this._determineOptimizationStrategy(performanceScore);

      // 保存性能评估结果
      this._devicePerformance = {
        score: performanceScore,
        deviceInfo: {
          brand: systemInfo.brand,
          model: systemInfo.model,
          platform: systemInfo.platform,
          system: systemInfo.system,
          sdkVersion: systemInfo.SDKVersion
        },
        strategy: optimizationSettings
      };

      console.log('[RenderStrategies] 性能检测完成，已选择最优渲染策略');
      
      // 将策略应用到组件
      if (component && component.setData) {
        this.applyStrategiesToComponent(component, optimizationSettings);
      }
      
      return optimizationSettings;
    } catch (error) {
      console.error('[RenderStrategies] 性能检测失败，使用保守渲染策略:', error);

      // 出错时使用保守策略
      const defaultStrategy = {
        webgl: false,
        sprite: true,
        layered: true
      };
      
      // 将保守策略应用到组件
      if (component && component.setData) {
        this.applyStrategiesToComponent(component, defaultStrategy);
      }
      
      return defaultStrategy;
    }
  },
  
  /**
   * 将优化策略应用到组件
   * @param {Object} component - 组件实例
   * @param {Object} options - 优化选项
   */
  applyStrategiesToComponent(component, options) {
    if (!component || !component.setData) return;
    
    const updateData = {};

    // 更新WebGL设置
    if (options.webgl !== undefined) {
      updateData['webgl.enabled'] = options.webgl && this._compatibility.webglSupported;
    }

    // 更新精灵图设置
    if (options.sprite !== undefined) {
      updateData['spriteSupport.enabled'] = options.sprite;
      updateData['spriteSupport.supported'] = this._compatibility.spriteSupported;
    }

    // 更新分层渲染设置
    if (options.layered !== undefined) {
      updateData['layeredRendering.enabled'] = options.layered;
    }
    
    // 更新兼容性设置
    updateData['hasCanvas2D'] = this._compatibility.hasCanvas2D;
    updateData['hasRoundRectAPI'] = this._compatibility.hasRoundRectAPI;
    updateData['webgl.supported'] = this._compatibility.webglSupported;

    // 应用更新
    if (Object.keys(updateData).length > 0) {
      component.setData(updateData);
      console.log('[RenderStrategies] 已应用优化设置:', updateData);
    }
  },
  
  /**
   * 计算设备性能得分
   * @param {Object} systemInfo - 系统信息
   * @returns {Number} 性能得分（0-100）
   * @private
   */
  _calculatePerformanceScore(systemInfo) {
    let performanceScore = 0;

    // 1. 评估设备型号 (0-30分)
    const highEndDevices = ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15',
      'iPad Pro', 'iPad Air', 'MI 10', 'MI 11', 'MI 12',
      'HUAWEI P40', 'HUAWEI P50', 'HUAWEI Mate', 'HUAWEI Nova',
      'HONOR', 'vivo X', 'OPPO Find', 'OPPO Reno', 'Samsung S20', 'Samsung S21', 'Samsung S22'
    ];

    const midEndDevices = ['iPhone X', 'iPhone XR', 'iPhone 8', 'iPad',
      'HUAWEI P30', 'HUAWEI P20', 'MI 8', 'MI 9', 'OPPO A', 'vivo Y', 'Redmi'
    ];

    // 检查设备型号
    const model = systemInfo.model || '';
    if (highEndDevices.some(device => model.includes(device))) {
      performanceScore += 30;
    } else if (midEndDevices.some(device => model.includes(device))) {
      performanceScore += 15;
    } else {
      performanceScore += 5;
    }

    // 2. 评估内存大小 (0-20分)
    if (systemInfo.memory) {
      const memory = parseInt(systemInfo.memory);
      if (memory >= 4096) {
        performanceScore += 20;
      } else if (memory >= 2048) {
        performanceScore += 10;
      } else {
        performanceScore += 5;
      }
    } else {
      // 如果无法获取内存信息，给予中等分数
      performanceScore += 10;
    }

    // 3. 评估系统平台 (0-20分)
    if (systemInfo.platform === 'ios') {
      performanceScore += 20; // iOS通常优化更好
    } else if (systemInfo.platform === 'android') {
      performanceScore += 15;
    } else {
      performanceScore += 10;
    }

    // 4. 评估基础库版本 (0-15分)
    const baseLibVersion = systemInfo.SDKVersion || '';
    if (this._compareVersion(baseLibVersion, '2.14.0') >= 0) {
      performanceScore += 15;
    } else if (this._compareVersion(baseLibVersion, '2.9.0') >= 0) {
      performanceScore += 10;
    } else {
      performanceScore += 5;
    }

    // 5. 检查WebGL支持 (0-15分)
    if (this._compatibility.webglSupported) {
      performanceScore += 15;
    }

    return performanceScore;
  },
  
  /**
   * 根据性能得分确定优化策略
   * @param {Number} performanceScore - 性能得分
   * @returns {Object} 优化策略配置
   * @private
   */
  _determineOptimizationStrategy(performanceScore) {
    let optimizationSettings = {
      webgl: this._compatibility.webglSupported, // 默认根据支持情况决定
      sprite: true,
      layered: true
    };

    // 根据性能评分调整渲染策略
    if (performanceScore >= 80) {
      console.log('[RenderStrategies] 检测到高性能设备，启用高级渲染优化（优先WebGL）');
      // 高性能设备优先尝试WebGL
      optimizationSettings.webgl = this._compatibility.webglSupported;
    } else if (performanceScore >= 50) {
      console.log('[RenderStrategies] 检测到中性能设备，启用部分渲染优化（优先2D）');
      // 中性能设备可以尝试WebGL，但可能优先考虑2D性能
      optimizationSettings.webgl = this._compatibility.webglSupported &&
        performanceScore >= 70;
    } else {
      // 低性能设备直接使用2D渲染
      console.log('[RenderStrategies] 检测到低性能设备，使用基础渲染模式（强制2D）');
      optimizationSettings.webgl = false;
      optimizationSettings.layered = false; // 禁用分层渲染以提高性能
    }

    // 如果不支持WebGL，确保它关闭
    if (!this._compatibility.webglSupported) {
      optimizationSettings.webgl = false;
    }

    console.log('[RenderStrategies] 渲染策略设置:',
      'WebGL:', optimizationSettings.webgl ? '启用' : '禁用',
      '精灵图:', optimizationSettings.sprite ? '启用' : '禁用',
      '分层渲染:', optimizationSettings.layered ? '启用' : '禁用');

    return optimizationSettings;
  },
  
  /**
   * 获取系统兼容性信息
   * @returns {Object} 兼容性信息
   */
  getCompatibility() {
    return {...this._compatibility};
  },
  
  /**
   * 获取设备性能评估结果
   * @returns {Object} 性能评估结果
   */
  getDevicePerformance() {
    return {...this._devicePerformance};
  },
  
  /**
   * 初始化精灵图支持
   * @returns {Boolean} 是否支持精灵图
   */
  initSpriteSupport() {
    // 检查是否支持精灵图
    this._spriteSupported = spriteUtil.isSpriteSupported();
    console.log('[RenderStrategies] 精灵图支持状态:', this._spriteSupported ? '支持' : '不支持');
    this._spritesInitialized = true;
    return this._spriteSupported;
  },
  
  /**
   * 检查精灵图支持状态
   * @returns {Boolean} 是否支持精灵图
   */
  isSpriteSupported() {
    // 如果未初始化，则先初始化
    if (!this._spritesInitialized) {
      this.initSpriteSupport();
    }
    return this._spriteSupported;
  },
  
  /**
   * 生成并获取头像精灵图
   * @param {Array} avatarUrls - 头像URL数组
   * @param {Function} callback - 回调函数
   */
  getAvatarSprite(avatarUrls, callback) {
    if (!this._spriteSupported || !avatarUrls || avatarUrls.length === 0) {
      callback(null);
      return;
    }
    
    // 创建缓存键
    const cacheKey = avatarUrls.sort().join('|');
    
    // 检查缓存
    if (this._spriteCache[cacheKey]) {
      callback(this._spriteCache[cacheKey]);
      return;
    }
    
    // 生成新的精灵图
    spriteUtil.createAvatarSprite(avatarUrls, (spriteInfo) => {
      if (spriteInfo) {
        // 缓存精灵图信息
        this._spriteCache[cacheKey] = spriteInfo;
        console.log(`[RenderStrategies] 生成精灵图成功，包含${avatarUrls.length}个头像，尺寸：${spriteInfo.width}x${spriteInfo.height}`);
      } else {
        console.error('[RenderStrategies] 生成精灵图失败');
      }
      callback(spriteInfo);
    });
  },
  
  /**
   * 清理精灵图缓存
   */
  clearSpriteCache() {
    this._spriteCache = {};
  },
  
  /**
   * 获取性能统计
   * @returns {Object} 性能统计数据
   */
  getPerformanceStats() {
    return {...this._performanceStats};
  },
  
  /**
   * 记录渲染性能
   * @param {Number} renderTime - 渲染耗时（毫秒）
   */
  recordPerformance(renderTime) {
    const now = Date.now();
    
    // 记录渲染时间
    this._performanceStats.lastRenderTime = renderTime;
    
    // 计算FPS
    this._performanceStats.frameCount++;
    
    if (now - this._performanceStats.lastFpsTime >= 1000) {
      this._performanceStats.fps = this._performanceStats.frameCount;
      this._performanceStats.frameCount = 0;
      this._performanceStats.lastFpsTime = now;
    }
  },

  /**
   * 获取WebGL渲染策略
   * @param {Object} component - 组件实例
   * @returns {Object} WebGL渲染策略
   */
  getWebGLStrategy(component) {
    // 延迟创建WebGL渲染器实例
    if (!this._webglRenderer) {
      this._webglRenderer = new WebGLRenderer(component);
    }
    
    return {
      name: 'webgl',
      renderer: this._webglRenderer,
      canUse: function() {
        // 检查WebGL特性是否启用且支持
        const { webgl } = component.data;
        return webgl.enabled && webgl.supported && this.renderer.canUse();
      },
      render: function(component, visibleArea) {
        const startTime = Date.now();
        
        // 执行渲染
        const result = this.renderer.render({
          visibleArea: visibleArea, 
          nodes: component.properties.treeNodes,
          connectors: component.properties.treeConnectors,
          currentMemberId: component.properties.currentMemberId,
          layeredRendering: component.data.layeredRendering.enabled ? 
            component.data.layeredRendering : null,
          spriteSupport: component.data.spriteSupport.enabled && 
            RenderStrategies.isSpriteSupported() ? {
              enabled: true,
              spriteCache: RenderStrategies._spriteCache
            } : { enabled: false }
        });
        
        // 记录性能
        const renderTime = Date.now() - startTime;
        RenderStrategies.recordPerformance(renderTime);
        
        return result;
      }
    };
  },
  
  /**
   * 获取Canvas 2D渲染策略
   * @param {Object} component - 组件实例
   * @returns {Object} Canvas 2D渲染策略
   */
  getCanvas2DStrategy(component) {
    // 延迟创建Canvas2D渲染器实例
    if (!this._canvas2dRenderer) {
      this._canvas2dRenderer = new Canvas2DRenderer(component);
    }
    
    return {
      name: 'canvas2d',
      renderer: this._canvas2dRenderer,
      canUse: function() {
        return this.renderer.canUse();
      },
      render: function(component, visibleArea) {
        const startTime = Date.now();
        
        // 执行渲染
        const result = this.renderer.render({
          visibleArea: visibleArea,
          nodes: component.properties.treeNodes,
          connectors: component.properties.treeConnectors,
          currentMemberId: component.properties.currentMemberId,
          layeredRendering: component.data.layeredRendering.enabled ? 
            component.data.layeredRendering : null,
          spriteSupport: component.data.spriteSupport.enabled && 
            RenderStrategies.isSpriteSupported() ? {
              enabled: true,
              spriteCache: RenderStrategies._spriteCache
            } : { enabled: false }
        });
        
        // 记录性能
        const renderTime = Date.now() - startTime;
        RenderStrategies.recordPerformance(renderTime);
        
        return result;
      }
    };
  },
  
  /**
   * 选择最适合的渲染策略
   * @param {Object} component - 组件实例
   * @returns {Object} 渲染策略
   */
  chooseStrategy(component) {
    // 重置渲染器实例，防止组件实例不同导致的问题
    this._webglRenderer = null;
    this._canvas2dRenderer = null;
    
    // 检查精灵图支持
    if (!this._spritesInitialized) {
      const spriteSupported = this.initSpriteSupport();
      // 更新组件数据
      if (component.setData) {
        component.setData({
          'spriteSupport.supported': spriteSupported
        });
      }
    }
    
    // 按优先级顺序尝试策略
    const strategies = [];
    
    // 根据组件配置决定策略顺序
    if (component.data.webgl.enabled) {
      strategies.push(this.getWebGLStrategy(component));
    }
    
    // Canvas2D始终作为备选
    strategies.push(this.getCanvas2DStrategy(component));
    
    for (const strategy of strategies) {
      if (strategy.canUse()) {
        console.log(`[RenderStrategies] 使用${strategy.name}渲染策略`);
        return strategy;
      }
    }
    
    // 兜底返回Canvas 2D策略
    console.warn('[RenderStrategies] 所有渲染策略都不可用，使用Canvas 2D回退策略');
    return this.getCanvas2DStrategy(component);
  },
  
  /**
   * 获取可用的渲染策略列表
   * @param {Object} component - 组件实例
   * @returns {Array} 可用策略列表
   */
  getAvailableStrategies(component) {
    const available = [];
    
    // 检查WebGL是否可用
    const webglStrategy = this.getWebGLStrategy(component);
    if (webglStrategy.canUse()) {
      available.push({
        name: 'webgl',
        label: 'WebGL渲染',
        description: '使用GPU加速，适合复杂视图'
      });
    }
    
    // Canvas 2D始终可用
    available.push({
      name: 'canvas2d',
      label: 'Canvas 2D渲染',
      description: '兼容性好，适合简单视图'
    });
    
    return available;
  },
  
  /**
   * 清除所有渲染器资源
   */
  dispose() {
    if (this._webglRenderer) {
      this._webglRenderer.dispose();
      this._webglRenderer = null;
    }
    
    if (this._canvas2dRenderer) {
      this._canvas2dRenderer.dispose();
      this._canvas2dRenderer = null;
    }
    
    // 清理精灵图缓存
    this.clearSpriteCache();
    
    // 重置性能统计
    this._performanceStats = {
      lastRenderTime: 0,
      fps: 0,
      frameCount: 0,
      lastFpsTime: 0
    };
  }
};

module.exports = RenderStrategies; 