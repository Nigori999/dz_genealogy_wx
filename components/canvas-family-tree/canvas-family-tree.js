// Canvas族谱树渲染器（优化版）
const WebGLRenderer = require('./renderers/webgl-renderer');
const wasmLoader = require('../../utils/wasm-loader');
// 导入优化工具
const ErrorHandler = require('../../utils/error-handler');

// 导入模块化组件
const EventHandlers = require('./handlers/event-handlers');
const RenderStrategies = require('./strategies/render-strategies');
const RendererService = require('./services/renderer-service');
const LayoutService = require('./services/layout-service');
// 导入新的图像缓存管理器
const ImageCacheManager = require('./services/image-cache-manager');

Component({
  /**
   * 组件属性
   */
  properties: {
    // 节点数据
    treeNodes: {
      type: Array,
      value: []
    },
    // 连接线数据
    treeConnectors: {
      type: Array,
      value: []
    },
    // 当前用户成员ID
    currentMemberId: {
      type: String,
      value: ''
    },
    // 所有成员
    allMembers: {
      type: Array,
      value: []
    },
    // 缩放值
    scale: {
      type: Number,
      value: 1,
      observer: '_handleScaleChange'
    },
    // 是否准备好渲染
    ready: {
      type: Boolean,
      value: false
    },
    // 视口宽度
    viewportWidth: {
      type: Number,
      value: 0
    },
    // 视口高度
    viewportHeight: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件数据
   */
  data: {
    // 偏移量
    offsetX: 0,
    offsetY: 0,
    // 上次触摸位置
    lastX: 0,
    lastY: 0,
    // 是否正在拖动
    isDragging: false,
    // 内部缩放值
    currentScale: 1,
    // 双指触摸起始距离
    initialDistance: 0,
    // 双指触摸起始缩放值
    initialScale: 1,
    // 是否显示缩放指示器
    showScaleIndicator: false,
    // 缩放百分比
    scalePercentage: 100,
    // 节点映射数据，用于点击检测
    nodesMap: [],
    // API兼容性标志
    hasRoundRectAPI: false,
    hasCanvas2D: false,
    // 性能监控指标
    renderStats: {
      totalRenders: 0,
      lastRenderTime: 0,
      skippedRenders: 0
    },
    // 节流控制
    throttleDelay: 30, // 基础节流延迟，单位毫秒
    inFastMovement: false, // 是否在快速移动

    // 精灵图支持
    spriteSupport: {
      enabled: true, // 默认启用精灵图，在设备不支持时才降级
      supported: false, // 设备是否支持精灵图，将通过检测更新
      batchSize: 20 // 每批处理的头像数量
    },

    // 分层渲染配置
    layeredRendering: {
      enabled: true, // 是否启用分层渲染
      currentLayer: 0, // 当前关注的层级
      layerCount: 0, // 总层数
      layerNodes: [], // 按层存储的节点
      layerConnectors: [] // 按层存储的连接线
    },

    // WebGL支持
    webgl: {
      enabled: true, // 默认启用WebGL，在设备不支持时才降级
      supported: true, // 默认认为设备支持WebGL，只有在检测不支持时才更新为false
      renderer: null, // WebGL渲染器实例
      initialized: false, // 是否已初始化
      initializing: false // 是否正在初始化
    },

    // WebAssembly相关状态
    wasm: {
      available: false,
      initialized: false,
      initError: null,
      enabled: true // 默认启用WebAssembly
    },

    // Worker相关状态
    workerAvailable: false,
    workerEnabled: true // 默认启用Worker
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    async attached() {
      console.log('组件挂载 - 开始初始化流程');

      // 初始化服务
      this._initServices();

      // 先初始化Canvas和资源
      await this._initResources();
      
      // 然后再初始化渲染策略（确保Canvas已准备就绪）
      const success = await RenderStrategies.init(this);
      if (success) {
        console.log('[族谱树] 渲染策略初始化成功');
        
        // 渲染策略初始化成功后，更新UI状态
        this.setData({
          'optionMenuItems.useWebGL.disabled': !this.data.webgl.supported,
          'optionMenuItems.useWebGL.checked': this.data.webgl.enabled,
          'optionMenuItems.useSprites.disabled': !this.data.spriteSupport.supported
        });
      } else {
        console.warn('[族谱树] 渲染策略初始化失败，使用默认策略');
      }
      
      console.log('[族谱树] 初始化流程完成');
    },

    detached() {
      // 释放资源
      this._disposeResources();
    }
  },

  /**
   * 组件观察者
   */
  observers: {
    'treeNodes, treeConnectors': function (treeNodes, treeConnectors) {
      if (treeNodes && treeConnectors) {
        // 当节点和连接线数据变化时，执行分层处理
        this._divideNodesIntoLayers();
      }
    },

    'ready': function (ready) {
      // 当组件准备就绪时，尝试渲染
      if (ready && this.ctx && this.canvas && this.properties.treeNodes && this.properties.treeNodes.length > 0) {
        this._render();
      }
    }
  },

  /**
   * 组件方法
   */
  methods: {
    /**
     * 初始化服务
     * @private
     */
    _initServices() {
      // 初始化渲染服务
      this.rendererService = new RendererService({
        wasmLoader: wasmLoader,
        treeRenderer: WebGLRenderer
      });

      // 初始化布局服务 - TreeLayoutCalculator已内置到LayoutService中
      this.layoutService = new LayoutService({
        wasmLoader: wasmLoader
      });
      
      // 初始化图像缓存管理器
      this.imageCacheManager = new ImageCacheManager({
        maxCacheSize: 100,
        onImageLoaded: () => {
          // 图像加载完成后重新渲染
          this._render();
        }
      });
      
      console.log('[族谱树] 服务初始化完成');
    },

    /**
     * 初始化资源
     * @private
     */
    async _initResources() {
      try {
        // 初始化Canvas
        this._initCanvas();

        // 初始化图像缓存
        this._initImageCache();

        // 初始化WebAssembly - 默认尝试初始化，不支持时降级
        await this._initWebAssembly();

        // 初始化Worker - 默认尝试初始化，不支持时才降级
        if (this.data.workerEnabled) {
          try {
            console.log('[族谱树] 尝试初始化Worker');
            let workerInitialized = this.layoutService.initWorker('workers/tree-layout-worker.js');

            if (workerInitialized) {
              console.log('[族谱树] Worker初始化成功');
              // 如果WebAssembly已初始化，设置Worker使用WebAssembly
              this.layoutService.setWasmUsage(this.data.wasm.initialized);
              this.setData({
                workerAvailable: true
              });
            } else {
              console.warn('[族谱树] Worker初始化失败，降级到主线程计算');
              this.setData({
                workerAvailable: false
              });
            }
          } catch (error) {
            console.error('[族谱树] Worker初始化出错:', error.message);
            // 降级到主线程计算
            this.setData({
              workerAvailable: false
            });
          }
        } else {
          console.log('[族谱树] Worker已禁用');
          this.setData({
            workerAvailable: false
          });
        }
      } catch (error) {
        console.error('[族谱树] 初始化资源失败:', error.message);
      }
    },

    /**
     * 初始化Canvas
     * @private
     */
    _initCanvas: ErrorHandler.wrap(function () {
      try {
        console.log('[族谱树] 开始初始化Canvas');

        // 确保WebGL默认启用，除非明确设置为false
        if (this.data.webgl.enabled === undefined) {
          console.log('[族谱树] 明确设置WebGL为启用状态');
          this.setData({
            'webgl.enabled': true,
            'webgl.supported': true
          });
        }

        // 使用当前状态
        const useWebGL = this.data.webgl.enabled;

        console.log('[族谱树] 渲染模式决策:', useWebGL ? 'WebGL' : 'Canvas 2D');
        console.log('[族谱树] WebGL支持状态:', this.data.webgl.supported ? '支持' : '不支持');
        console.log('[族谱树] 当前WebGL完整状态:', JSON.stringify(this.data.webgl));

        // 重要：使用setData的回调确保DOM已更新再进行查询
        // 这样可以确保Canvas的type属性已经完成更新
        this.setData({
          'webgl.initializing': useWebGL
        }, () => {
          // 在setData回调中执行查询，确保DOM已更新后再获取Canvas节点
          console.log('[族谱树] DOM更新后开始查询Canvas节点，渲染模式:',
            this.data.webgl.enabled ? 'WebGL' : 'Canvas 2D');
          const query = this.createSelectorQuery();
          query.select('#canvasFamilyTree')
            .fields({
              node: true,
              size: true
            })
            .exec(this._handleCanvasReady.bind(this));

          console.log('[族谱树] Canvas查询已发送');
        });
      } catch (error) {
        console.error('[族谱树] 初始化Canvas查询失败:', error.message);
        throw new Error('初始化Canvas查询失败: ' + error.message);
      }
    }, {
      operation: '初始化Canvas',
      onError(error) {
        console.error('[族谱树] Canvas初始化失败，组件将无法正常工作:', error);
        // 出错时降级到2D模式
        this.setData({
          'webgl.enabled': false,
          'webgl.initializing': false
        });
      }
    }),

    /**
     * 切换渲染模式（WebGL/Canvas2D）
     * @param {Boolean} useWebGL - 是否使用WebGL渲染
     */
    switchRenderMode: function(useWebGL) {
      console.log('[族谱树] 切换渲染模式:', useWebGL ? 'WebGL' : 'Canvas 2D');
      
      if (useWebGL === this.data.webgl.enabled) {
        console.log('[族谱树] 渲染模式未改变');
        return;
      }
      
      // 释放当前渲染器资源
      this._cleanupRenderer();
      
      // 更新渲染模式
      this.setData({
        'webgl.enabled': useWebGL
      });
      
      // 重新初始化Canvas
      if (useWebGL) {
        this._initWebGLCanvas();
      } else {
        this._init2DCanvas();
      }
      
      // 更新渲染
      this._render();
      
      // 触发渲染模式变更事件
      this.triggerEvent('renderModeChange', {
        webgl: useWebGL
      });
    },

    /**
     * 处理Canvas准备完毕
     * @private
     */
    _handleCanvasReady: ErrorHandler.wrap(function (res) {
      if (!res || !res[0] || !res[0].node) {
        console.error('[族谱树] Canvas节点获取失败，请检查选择器和DOM结构', {
          res: res ? JSON.stringify(res) : '无结果',
          组件ID: this.id
        });
        throw new Error('Canvas节点获取失败');
      }

      const canvasNode = res[0].node;
      console.log('[族谱树] Canvas节点获取成功, 类型:', canvasNode.constructor.name, 
        'Canvas类型:', canvasNode.type || '未知',
        'Canvas尺寸:', canvasNode.width, 'x', canvasNode.height);
      
      // 检查Canvas节点的关键属性和方法
      const canvasCheck = {
        有type属性: !!canvasNode.type,
        有width属性: canvasNode.width !== undefined,
        有height属性: canvasNode.height !== undefined,
        有getContext方法: typeof canvasNode.getContext === 'function',
        有toDataURL方法: typeof canvasNode.toDataURL === 'function'
      };
      console.log('[族谱树] Canvas节点检查:', canvasCheck);

      // 记录当前组件的WebGL状态
      console.log('[族谱树] 当前WebGL状态:', {
        enabled: this.data.webgl.enabled,
        supported: this.data.webgl.supported,
        initialized: this.data.webgl.initialized,
        initializing: this.data.webgl.initializing
      });

      // 根据已设置的渲染模式初始化相应的渲染器
      if (this.data.webgl.enabled) {
        console.log('[族谱树] 初始化WebGL渲染器');
        const webglSuccess = this._initWebGLCanvas(canvasNode);

        if (!webglSuccess) {
          console.log('[族谱树] WebGL初始化失败，需要重新创建Canvas 2D');
          // WebGL初始化失败，需要重新创建正确类型的Canvas
          this.setData({
            'webgl.enabled': false,
            'webgl.initializing': false
          }, () => {
            // 在DOM更新完成后再次尝试初始化，确保Canvas类型已更新为2d
            console.log('[族谱树] 降级到Canvas 2D模式，重新初始化');
            setTimeout(() => {
              this._initCanvas();
            }, 100);
          });
        } else {
          console.log('[族谱树] WebGL渲染器初始化成功');
          
          // 初始化图像缓存管理器
          this.imageCacheManager.init(canvasNode);
        }
      } else {
        // 直接使用Canvas 2D
        console.log('[族谱树] 使用Canvas 2D初始化');
        const init2DSuccess = this._init2DCanvas(canvasNode);
        console.log('[族谱树] Canvas 2D初始化结果:', init2DSuccess ? '成功' : '失败');
        
        if (init2DSuccess) {
          // 初始化图像缓存管理器
          this.imageCacheManager.init(canvasNode);
        }
      }
    }, {
      operation: '处理Canvas准备',
      onError(error) {
        console.error('[族谱树] Canvas准备失败:', error.message);
        // 出错时降级到2D模式
        this.setData({
          'webgl.enabled': false,
          'webgl.initializing': false
        });
      }
    }),

    /**
     * 初始化Canvas 2D
     * @param {Object} canvasNode - Canvas节点
     * @private
     */
    _init2DCanvas: ErrorHandler.wrap(function (canvasNode) {
      console.log('[族谱树] 初始化Canvas 2D');

      try {
        // 保存Canvas引用
        this.canvas = canvasNode;

        // 设置Canvas尺寸
        this.canvas.width = this.properties.viewportWidth;
        this.canvas.height = this.properties.viewportHeight;

        // 获取2D上下文
        try {
          this.ctx = this.canvas.getContext('2d');
          if (!this.ctx) {
            console.error('[族谱树] 无法获取Canvas 2D上下文');
            return false;
          }
          console.log('[族谱树] 成功获取Canvas 2D上下文');
        } catch (error) {
          console.error('[族谱树] 获取Canvas 2D上下文失败:', error.message);
          return false;
        }

        // 使用渲染服务初始化Canvas
        const result = this.rendererService.initCanvas(
          this.canvas,
          this.properties.viewportWidth,
          this.properties.viewportHeight
        );

        if (!result) {
          console.error('[族谱树] 渲染服务初始化Canvas 2D失败');
          return false;
        }

        console.log('[族谱树] Canvas 2D初始化成功');

        // 调整Canvas尺寸
        this._resizeCanvas();

        return true;
      } catch (error) {
        console.error('[族谱树] Canvas 2D初始化失败:', error.message);
        return false;
      }
    }, {
      operation: '初始化Canvas 2D',
      defaultValue: false,
      onError(error) {
        console.error('[族谱树] Canvas 2D初始化错误:', error.message);
      }
    }),

    /**
     * 初始化WebGL Canvas
     * @param {Object} canvasNode - Canvas节点
     * @private
     */
    _initWebGLCanvas: function(canvasNode) {
      try {
        console.log('[族谱树] 开始初始化WebGL Canvas');
        
        // 保存Canvas引用并设置尺寸
        this.canvas = canvasNode;
        this.canvas.width = this.properties.viewportWidth;
        this.canvas.height = this.properties.viewportHeight;
        
        // 详细记录Canvas属性
        console.log('[族谱树] Canvas详情:', {
          type: this.canvas.type || '未知',
          width: this.canvas.width,
          height: this.canvas.height,
          constructor: this.canvas.constructor ? this.canvas.constructor.name : '未知'
        });
        
        // 尝试获取WebGL上下文 - 使用更多参数提高兼容性
        let webglContext = null;
        try {
          console.log('[族谱树] 尝试获取WebGL上下文');
          webglContext = this.canvas.getContext('webgl', {
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true,
            failIfMajorPerformanceCaveat: false, // 即使性能较低也尝试使用WebGL
            powerPreference: 'default'
          });
          
          if (!webglContext) {
            console.log('[族谱树] 首次尝试获取WebGL上下文失败，尝试其他参数组合');
            
            // 第二次尝试 - 使用更宽松的参数
            webglContext = this.canvas.getContext('webgl');
          }
        } catch (ctxError) {
          console.error('[族谱树] 获取WebGL上下文出错:', ctxError.message);
          webglContext = null;
        }
        
        if (!webglContext) {
          console.error('[族谱树] 无法获取WebGL上下文，可能是设备不支持或Canvas类型不匹配');
          
          // 检查Canvas元素类型
          if (this.canvas.type && this.canvas.type !== 'webgl') {
            console.warn(`[族谱树] Canvas类型不是webgl，而是 ${this.canvas.type}`);
            console.log('[族谱树] 需要在WXML中设置canvas的type="webgl"');
          }
          
          this.setData({ 'webgl.supported': false, 'webgl.enabled': false });
          return false;
        }
        
        console.log('[族谱树] 成功获取WebGL上下文');
        this.ctx = webglContext;
        
        // 显示WebGL信息
        try {
          const debugInfo = webglContext.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const vendor = webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            console.log('[族谱树] WebGL信息:', {
              vendor: vendor,
              renderer: renderer,
              version: webglContext.getParameter(webglContext.VERSION),
              shadingLanguageVersion: webglContext.getParameter(webglContext.SHADING_LANGUAGE_VERSION)
            });
          }
        } catch (infoError) {
          console.warn('[族谱树] 获取WebGL详细信息失败:', infoError.message);
        }
        
        // 初始化渲染器
        try {
          console.log('[族谱树] 开始创建WebGL渲染器');
          this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            gl: webglContext,
            width: this.canvas.width,
            height: this.canvas.height
          });
          
          // 初始化纹理容器
          if (!this.renderer.textures) {
            this.renderer.textures = {};
          }
          
          // 设置组件状态
          this.setData({
            'webgl.initialized': true,
            'webgl.initializing': false,
            'webgl.supported': true, // 明确标记为支持
            'webgl.enabled': true    // 明确启用
          });
          
          console.log('[族谱树] WebGL渲染器创建成功');
          
          // 调整Canvas尺寸
          this._resizeCanvas();
          
          return true;
        } catch (error) {
          console.error('[族谱树] 创建WebGL渲染器失败:', error.message, '\n堆栈:', error.stack);
          this.setData({ 'webgl.supported': false, 'webgl.enabled': false });
          return false;
        }
      } catch (error) {
        console.error('[族谱树] WebGL Canvas初始化错误:', error.message, '\n堆栈:', error.stack);
        this.setData({ 'webgl.supported': false, 'webgl.enabled': false });
        return false;
      }
    },

    /**
     * 检查是否可以使用WebGL渲染
     * @returns {Boolean} 是否可以使用WebGL渲染
     * @private
     */
    _canRenderWithWebGL: function() {
      return this.properties.ready && 
             this.canvas && 
             this.data.webgl.enabled && 
             this.data.webgl.initialized && 
             this.renderer;
    },
    
    /**
     * 调整Canvas尺寸
     * @private
     */
    _resizeCanvas: function() {
      // 使用渲染服务调整Canvas尺寸
      this.rendererService.resizeCanvas(
        this.properties.viewportWidth,
        this.properties.viewportHeight,
        this.data.offsetX,
        this.data.offsetY,
        this.data.currentScale
      );
    },

    /**
     * 初始化WebAssembly
     * @private
     */
    _initWebAssembly: async function() {
      try {
        // 检查是否已经初始化
        if (this.data.wasm.initialized) {
          console.log('[族谱树] WebAssembly已经初始化');
          return true;
        }

        // 检查WebAssembly是否在环境中可用
        if (typeof WebAssembly !== 'object') {
          console.warn('[族谱树] 当前环境不支持WebAssembly，降级到JS实现');
          this.setData({
            'wasm.available': false,
            'wasm.initialized': false,
            'wasm.initError': '环境不支持WebAssembly'
          });
          return false;
        }

        // 设置WebAssembly可用
        this.setData({
          'wasm.available': true
        });

        // 仅在启用WebAssembly时尝试初始化
        if (!this.data.wasm.enabled) {
          console.log('[族谱树] WebAssembly功能已禁用');
          return false;
        }

        console.log('[族谱树] 开始初始化WebAssembly模块');

        // 调用wasmLoader进行初始化
        const initResult = await wasmLoader.init();

        if (!initResult.success) {
          console.warn('[族谱树] WebAssembly初始化失败:', initResult.error);
          this.setData({
            'wasm.initialized': false,
            'wasm.initError': initResult.error || '初始化失败'
          });
          return false;
        }

        console.log('[族谱树] WebAssembly初始化成功');
        this.setData({
          'wasm.initialized': true
        });
        return true;
      } catch (error) {
        console.error('[族谱树] WebAssembly初始化错误:', error.message);
        this.setData({
          'wasm.initialized': false,
          'wasm.initError': error.message || '未知错误'
        });
        return false;
      }
    },

    /**
     * 释放资源
     * @private
     */
    _disposeResources: function() {
      // 清理定时器
      if (this._scaleIndicatorTimer) {
        clearTimeout(this._scaleIndicatorTimer);
      }
      if (this._renderTimer) {
        clearTimeout(this._renderTimer);
      }

      // 释放渲染服务
      if (this.rendererService) {
        this.rendererService.dispose();
      }

      // 释放布局服务
      if (this.layoutService) {
        this.layoutService.dispose();
      }
      
      // 释放图像缓存管理器
      if (this.imageCacheManager) {
        this.imageCacheManager.dispose();
      }

      // 释放渲染策略资源
      if (RenderStrategies && typeof RenderStrategies.dispose === 'function') {
        RenderStrategies.dispose();
      }

      // 释放WebAssembly资源
      if (this.data.wasm && this.data.wasm.initialized) {
        try {
          wasmLoader.dispose();
        } catch (error) {
          console.warn('释放WebAssembly资源时出错:', error);
        }
      }

      // 清除引用
      this.canvas = null;
      this.ctx = null;
    },

    /**
     * 将节点分成多层
     * @private
     */
    _divideNodesIntoLayers: function() {
      const nodes = this.properties.treeNodes;
      const connectors = this.properties.treeConnectors;

      if (!nodes || !nodes.length) {
        return;
      }

      // 根据节点的generation属性分组
      const layerNodes = [];
      const maxGeneration = nodes.reduce((max, node) => {
        const gen = node.generation || 1;
        return Math.max(max, gen);
      }, 0);

      // 创建层数组
      for (let i = 0; i < maxGeneration; i++) {
        layerNodes[i] = [];
      }

      // 将节点分配到对应层
      nodes.forEach(node => {
        const gen = (node.generation || 1) - 1;
        if (gen >= 0 && gen < maxGeneration) {
          layerNodes[gen].push(node);
        }
      });

      // 处理连接线
      const layerConnectors = [];

      // 初始化连接线层数组
      for (let i = 0; i < maxGeneration; i++) {
        layerConnectors[i] = [];
      }

      // 分配连接线
      connectors.forEach(conn => {
        // 查找连接线对应的节点
        const fromNode = nodes.find(n => n.id === conn.fromId);
        const toNode = nodes.find(n => n.id === conn.toId);

        if (fromNode && toNode) {
          const fromGen = (fromNode.generation || 1) - 1;
          const toGen = (toNode.generation || 1) - 1;

          // 确定连接线所属层级 - 选择较低的层级
          const connLayer = Math.min(fromGen, toGen);

          if (connLayer >= 0 && connLayer < maxGeneration) {
            layerConnectors[connLayer].push(conn);
          }
        }
      });

      // 更新分层数据
      this.setData({
        'layeredRendering.layerNodes': layerNodes,
        'layeredRendering.layerConnectors': layerConnectors,
        'layeredRendering.layerCount': maxGeneration,
        'layeredRendering.currentLayer': Math.min(
          this.data.layeredRendering.currentLayer,
          maxGeneration - 1
        )
      });
    },

    /**
     * 初始化图像缓存
     * @private
     */
    _initImageCache: function() {
      // 使用图像缓存管理器
      if (!this.imageCacheManager) {
        console.warn('[族谱树] 图像缓存管理器未初始化');
        return;
      }
      
      // 图像缓存已在创建管理器时初始化，这里不需要额外操作
      console.log('[族谱树] 图像缓存已初始化');
    },

    /**
     * 队列加载图像 - 调用图像缓存管理器
     * @param {String} src - 图像URL
     * @param {Boolean} isRequired - 是否必需
     * @param {Boolean} isSprite - 是否是精灵图
     * @private
     */
    _queueImageLoad: function(src, isRequired = false, isSprite = false) {
      if (!this.imageCacheManager) {
        console.warn('[族谱树] 图像缓存管理器未初始化');
        return;
      }
      
      this.imageCacheManager.queueImageLoad(src, isRequired, isSprite);
    },

    /**
     * 渲染族谱树
     * @private
     */
    _render: function() {
      try {
        // 当组件未就绪时，不执行渲染
        if (!this.properties.ready || !this.canvas) {
          if (this.ctx && this.canvas) {
            // 清除画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          }
          return;
        }
        
        // 处理并验证渲染数据
        const { nodes, connectors } = this._processRenderData();
        if (!nodes.length) {
          console.warn('[渲染] 没有有效节点数据可渲染');
          if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          }
          return;
        }
        
        // 获取当前渲染策略
        const renderStrategy = RenderStrategies.getCurrentStrategy();
        if (!renderStrategy) {
          console.warn('[渲染] 未找到有效的渲染策略');
          return;
        }
        
        // 执行渲染
        renderStrategy.render(this, { 
          nodes, 
          connectors 
        });
        
        // 更新渲染计数
        this._renderCount++;
        
        // 更新最后渲染时间
        this._lastRenderTime = Date.now();
        
        // 触发渲染完成事件
        this.triggerEvent('renderComplete', {
          count: this._renderCount,
          time: this._lastRenderTime,
          strategy: renderStrategy.name
        });
      } catch (error) {
        console.error('[渲染] 渲染过程出错:', error.message);
      }
    },
    
    /**
     * 使用WebGL渲染族谱树（优化版）
     * @param {Array} nodes - 节点数据
     * @param {Array} connectors - 连接线数据
     * @private
     * @deprecated 已由RenderStrategy替代
     */
    _renderWithWebGL: function(nodes, connectors) {
      // 该方法已被渲染策略模式替代
      console.warn('[渲染] _renderWithWebGL方法已弃用，请使用渲染策略');
    },
    
    /**
     * 使用Canvas 2D渲染族谱树
     * @param {Array} nodes - 节点数据
     * @param {Array} connectors - 连接线数据
     * @private
     * @deprecated 已由RenderStrategy替代
     */
    _renderWith2D: function(nodes, connectors) {
      // 该方法已被渲染策略模式替代
      console.warn('[渲染] _renderWith2D方法已弃用，请使用渲染策略');
    },
    
    /**
     * 获取节点的纹理
     * @param {Object} node - 节点数据
     * @returns {Object} 纹理对象
     * @private
     * @deprecated 已由ImageCacheManager.getTexturesForNodes替代
     */
    _getNodeTexture: function(node) {
      // 该方法已被ImageCacheManager.getTexturesForNodes替代
      console.warn('[渲染] _getNodeTexture方法已弃用，请使用ImageCacheManager');
      return null;
    },
    
    /**
     * 处理加载的图像为纹理
     * @param {Object} res - 图像信息
     * @param {String} nodeId - 节点ID
     * @param {String} gender - 性别
     * @param {Object} existingTexture - 已存在的纹理
     * @private
     * @deprecated 已由ImageCacheManager替代
     */
    _processLoadedImage: function(res, nodeId, gender, existingTexture) {
      // 该方法已被ImageCacheManager替代
      console.warn('[渲染] _processLoadedImage方法已弃用，请使用ImageCacheManager');
    },
    
    /**
     * 创建默认纹理
     * @param {String} gender - 性别
     * @returns {Object} 纹理对象
     * @private
     * @deprecated 已由ImageCacheManager._createDefaultTexture替代
     */
    _createDefaultTexture: function(gender) {
      // 该方法已被ImageCacheManager._createDefaultTexture替代
      console.warn('[渲染] _createDefaultTexture方法已弃用，请使用ImageCacheManager');
      return null;
    },

    /**
     * 处理缩放变化
     * @param {Number} newScale - 新的缩放值
     * @private
     */
    _handleScaleChange: function(newScale) {
      this.setData({
        currentScale: newScale,
        scalePercentage: Math.round(newScale * 100),
        showScaleIndicator: true
      });

      // 隐藏缩放指示器的定时器
      if (this._scaleIndicatorTimer) {
        clearTimeout(this._scaleIndicatorTimer);
      }

      this._scaleIndicatorTimer = setTimeout(() => {
        this.setData({
          showScaleIndicator: false
        });
      }, 1500);

      // 更新画布
      this._render();

      // 确保在缩放变化后更新节点映射
      setTimeout(() => {
        this._updateNodesMap();
      }, 50);
    },

    /**
     * 处理渲染数据，使其适合WebGL渲染
     * @private
     */
    _processRenderData: function() {
      try {
        console.log('[渲染诊断] 开始处理渲染数据');
        const nodes = this.properties.treeNodes || [];
        const connectors = this.properties.treeConnectors || [];
        
        if (!nodes.length) {
          console.warn('[渲染诊断] 没有节点数据可渲染');
          return { nodes: [], connectors: [] };
        }
        
        // 标准化节点数据
        const processedNodes = nodes.map(node => {
          // 确保所有必要属性存在且类型正确
          return {
            ...node,
            id: String(node.id || ''),
            x: Number(node.x || 0),
            y: Number(node.y || 0),
            width: Number(node.width || 80),
            height: Number(node.height || 100),
            gender: String(node.gender || '').toLowerCase(), // 标准化性别为小写
            imageUrl: node.imageUrl || '',
            name: String(node.name || ''),
            isRoot: Boolean(node.isRoot),
            isCurrent: node.id === this.properties.currentMemberId
          };
        });
        
        // 标准化连接线数据
        const processedConnectors = connectors.map(connector => {
          // 确保所有必要属性存在且类型正确
          return {
            ...connector,
            id: String(connector.id || ''),
            fromId: String(connector.fromId || ''),
            toId: String(connector.toId || ''),
            fromX: Number(connector.fromX || 0),
            fromY: Number(connector.fromY || 0),
            toX: Number(connector.toX || 0),
            toY: Number(connector.toY || 0),
            type: String(connector.type || 'direct'),
            highlighted: Boolean(connector.highlighted)
          };
        });
        
        console.log(`[渲染诊断] 数据处理完成: ${processedNodes.length}个节点, ${processedConnectors.length}个连接线`);
        
        // 验证数据合法性
        const invalidNodes = processedNodes.filter(node => 
          isNaN(node.x) || isNaN(node.y) || 
          isNaN(node.width) || isNaN(node.height));
          
        const invalidConnectors = processedConnectors.filter(conn => 
          isNaN(conn.fromX) || isNaN(conn.fromY) || 
          isNaN(conn.toX) || isNaN(conn.toY));
        
        if (invalidNodes.length) {
          console.warn(`[渲染诊断] 发现${invalidNodes.length}个无效节点数据`);
        }
        
        if (invalidConnectors.length) {
          console.warn(`[渲染诊断] 发现${invalidConnectors.length}个无效连接线数据`);
        }
        
        return {
          nodes: processedNodes.filter(node => 
            !isNaN(node.x) && !isNaN(node.y) && 
            !isNaN(node.width) && !isNaN(node.height)
          ),
          connectors: processedConnectors.filter(conn => 
            !isNaN(conn.fromX) || !isNaN(conn.fromY) || 
            !isNaN(conn.toX) || !isNaN(conn.toY)
          )
        };
      } catch (error) {
        console.error('[渲染诊断] 处理渲染数据出错:', error.message);
        return { nodes: [], connectors: [] };
      }
    },
    
    /**
     * 计算当前可视区域
     * @returns {Object} 可视区域边界参数
     * @private
     */
    _calculateVisibleArea: function() {
      if (!this.canvas) return null;

      const {
        viewportWidth,
        viewportHeight
      } = this.properties;
      const {
        offsetX,
        offsetY,
        currentScale
      } = this.data;

      if (!viewportWidth || !viewportHeight) {
        console.warn('视口尺寸未设置，无法计算可视区域');
        return null;
      }

      // 计算世界坐标系中的可视区域边界
      const left = -offsetX / currentScale;
      const top = -offsetY / currentScale;
      const right = (viewportWidth - offsetX) / currentScale;
      const bottom = (viewportHeight - offsetY) / currentScale;

      // 添加缓冲区域，确保边缘元素能够正确渲染
      const buffer = 200 / currentScale; // 缓冲区大小随缩放变化

      return {
        left,
        top,
        right,
        bottom,
        buffer,
        // 视口中心点（世界坐标）
        centerX: (left + right) / 2,
        centerY: (top + bottom) / 2,
        // 视口尺寸（世界坐标）
        width: right - left,
        height: bottom - top,
        // 屏幕尺寸
        screenWidth: viewportWidth,
        screenHeight: viewportHeight
      };
    },
    
    /**
     * 更新节点映射（用于点击检测）
     * @private
     */
    _updateNodesMap: function() {
      if (!this.properties.treeNodes || !this.properties.treeNodes.length) {
        return;
      }

      // 计算节点在屏幕坐标系中的边界，考虑当前缩放和偏移
      const { currentScale, offsetX, offsetY } = this.data;
      
      // 更新节点映射
      const nodesMap = this.properties.treeNodes.map(node => ({
        id: node.id,
        memberId: node.memberId,
        // 计算屏幕坐标位置
        screenX: node.x * currentScale + offsetX,
        screenY: node.y * currentScale + offsetY,
        // 计算屏幕坐标尺寸
        screenWidth: (node.width || 120) * currentScale,
        screenHeight: (node.height || 150) * currentScale,
        // 保留原始世界坐标
        x: node.x,
        y: node.y,
        width: node.width || 120,
        height: node.height || 150,
        generation: node.generation
      }));

      this.setData({
        nodesMap
      });
      
      console.log('[族谱树] 更新节点映射，共', nodesMap.length, '个节点');
    },

    /**
     * 触摸开始事件处理
     * @param {Object} e - 事件对象
     * @private
     */
    _onTouchStart: function(e) {
      EventHandlers.onTouchStart(this, e);
    },

    /**
     * 触摸移动事件处理
     * @param {Object} e - 事件对象
     * @private
     */
    _onTouchMove: function(e) {
      EventHandlers.onTouchMove(this, e);
    },

    /**
     * 触摸结束事件处理
     * @private
     */
    _onTouchEnd: function() {
      EventHandlers.onTouchEnd(this);
    },

    /**
     * 画布点击事件处理
     * @param {Object} e - 事件对象
     * @private
     */
    _onCanvasTap: function(e) {
      EventHandlers.onCanvasTap(this, e);
    },

    /**
     * 设置优化模式
     * @param {Object} options - 优化选项
     * @param {Boolean} options.webgl - 是否启用WebGL
     * @param {Boolean} options.sprite - 是否启用精灵图
     * @param {Boolean} options.layered - 是否启用分层渲染
     */
    setOptimizationModes: function(options) {
      // 直接委托给RenderStrategies处理
      RenderStrategies.applyStrategiesToComponent(this, options);
    },

    /**
     * 获取优化状态
     * @returns {Object} 当前优化状态
     */
    getOptimizationStatus: function() {
      const compatibility = RenderStrategies.getCompatibility();
      const devicePerformance = RenderStrategies.getDevicePerformance();
      
      return {
        webgl: {
          enabled: this.data.webgl.enabled,
          supported: compatibility.webglSupported,
          initialized: this.data.webgl.initialized
        },
        spriteSupport: {
          enabled: this.data.spriteSupport.enabled,
          supported: compatibility.spriteSupported
        },
        layeredRendering: {
          enabled: this.data.layeredRendering.enabled,
          layerCount: this.data.layeredRendering.layerCount,
          currentLayer: this.data.layeredRendering.currentLayer
        },
        wasm: {
          available: compatibility.wasmAvailable,
          initialized: this.data.wasm.initialized
        },
        devicePerformance: devicePerformance
      };
    }
  }
});