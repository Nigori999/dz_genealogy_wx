// Canvas族谱树渲染器（优化版）
const WebGLRenderer = require('./renderers/webgl-renderer');
// 替换WASM引用为JS计算器
const { treeLayoutCalculator, pathCalculator, visibilityCalculator } = require('./services/calculators');
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

      // 检查Worker是否可用
      this._checkWorkerAvailability();
      
      // 直接初始化渲染策略
      wx.nextTick(async () => {
        try {
          // 初始化渲染策略
          const success = await RenderStrategies.init(this);
          if (success) {
            console.log('[族谱树] 渲染策略初始化成功');
            
            // 渲染策略初始化成功后，根据当前渲染模式初始化相应的Canvas
            if (this.data.webgl && this.data.webgl.enabled) {
              // 初始化WebGL渲染器
              this._initWebGLCanvas();
            } else {
              // 初始化Canvas 2D渲染器
              this._init2DCanvas();
            }
            
            // 更新UI状态
            this.setData({
              'optionMenuItems.useWebGL.disabled': !this.data.webgl.supported,
              'optionMenuItems.useWebGL.checked': this.data.webgl.enabled,
              'optionMenuItems.useSprites.disabled': !this.data.spriteSupport.supported
            });
          } else {
            console.warn('[族谱树] 渲染策略初始化失败，使用默认策略');
            // 默认使用Canvas 2D
            this._init2DCanvas();
          }
        } catch (error) {
          console.error('[族谱树] 渲染策略初始化错误:', error);
          // 出错时降级到Canvas 2D
          this._init2DCanvas();
        }
        
        console.log('[族谱树] 初始化流程完成');
      });
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
      try {
        // 初始化图像缓存
        this.imageCacheManager = new ImageCacheManager();
        
        // 初始化布局服务
        this.layoutService = new LayoutService({
          calculators: {
            treeLayout: treeLayoutCalculator,
            path: pathCalculator,
            visibility: visibilityCalculator
          }
        });
        
        // 初始化渲染服务
        this.rendererService = new RendererService({
          calculators: {
            treeLayout: treeLayoutCalculator,
            path: pathCalculator,
            visibility: visibilityCalculator
          }
        });
        
        console.log('[族谱树] 服务初始化完成');
      } catch (error) {
        console.error('[族谱树] 服务初始化失败:', error);
      }
    },

    /**
     * 检查Worker是否可用
     * @private
     */
    _checkWorkerAvailability() {
      try {
        // 检查微信小程序环境是否支持Worker
        if (typeof wx.createWorker !== 'function') {
          console.log('[族谱树] 当前环境不支持Worker');
          this.setData({
            workerAvailable: false
          });
          return false;
        }
        
        // 检查是否已启用Worker
        if (!this.data.workerEnabled) {
          console.log('[族谱树] Worker功能已禁用');
          this.setData({
            workerAvailable: false
          });
          return false;
        }
        
        // 初始化Worker - 如果布局服务已初始化，则尝试初始化Worker
        if (this.layoutService) {
          const success = this.layoutService.initWorker('workers/tree-layout-worker.js');
          this.setData({
            workerAvailable: success
          });
          
          console.log('[族谱树] Worker初始化', success ? '成功' : '失败');
          return success;
        } else {
          console.warn('[族谱树] 布局服务未初始化，无法创建Worker');
          this.setData({
            workerAvailable: false
          });
          return false;
        }
      } catch (error) {
        console.error('[族谱树] 检查Worker可用性失败:', error);
        this.setData({
          workerAvailable: false
        });
        return false;
      }
    },
    
    /**
     * 检查Canvas兼容性
     * @private
     */
    _checkCanvasCompatibility: ErrorHandler.wrap(function() {
        // 确保ctx存在
        if (!this.ctx) {
          console.warn('[族谱树] Canvas上下文未初始化，跳过兼容性检查');
          this.setData({
            hasRoundRectAPI: false
          });
          return;
        }
        
        // 检查是否支持圆角矩形绘制API
        const hasRoundRectAPI = typeof this.ctx.roundRect === 'function';
        
        this.setData({
          hasRoundRectAPI: hasRoundRectAPI
        });
        
        console.log('[族谱树] Canvas兼容性检查: 圆角矩形API', hasRoundRectAPI ? '支持' : '不支持');
    }, {
      operation: 'Canvas兼容性检查',
      onError(error) {
        console.error('[族谱树] Canvas兼容性检查失败:', error);
        this.setData({
          hasRoundRectAPI: false
        });
      }
    }),

    /**
     * 初始化Canvas共通部分
     * @param {String} canvasId - Canvas元素ID
     * @param {Boolean} isWebGL - 是否为WebGL模式
     * @returns {Promise} 包含Canvas节点的Promise
     * @private
     */
    _initCanvasBase: function(canvasId, isWebGL) {
      return new Promise((resolve, reject) => {
        try {
          // 查询Canvas节点
          const query = wx.createSelectorQuery().in(this);
          query.select(canvasId)
            .fields({ node: true, size: true })
            .exec((res) => {
              if (!res[0] || !res[0].node) {
                console.error(`[族谱树] 获取${isWebGL ? 'WebGL' : 'Canvas 2D'}节点失败`);
                reject(new Error(`获取${isWebGL ? 'WebGL' : 'Canvas 2D'}节点失败`));
                return;
              }
              
              // 获取Canvas节点
              const canvasNode = res[0].node;
              
              // 设置Canvas尺寸
              const width = this.properties.viewportWidth || res[0].width || 300;
              const height = this.properties.viewportHeight || res[0].height || 400;
              canvasNode.width = width;
              canvasNode.height = height;
              
              console.log(`[族谱树] ${isWebGL ? 'WebGL' : 'Canvas 2D'}尺寸设置为: ${width}x${height}`);
              
              resolve(canvasNode);
            });
        } catch (error) {
          console.error(`[族谱树] ${isWebGL ? 'WebGL' : 'Canvas 2D'}初始化基础操作失败:`, error.message);
          reject(error);
        }
      });
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
      
      // 根据新的渲染模式初始化对应的Canvas
      if (useWebGL) {
        console.log('[族谱树] 切换到WebGL渲染模式');
        this._initWebGLCanvas();
      } else {
        console.log('[族谱树] 切换到Canvas 2D渲染模式');
        this._init2DCanvas();
      }
      
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
        const webglSuccess = this._initWebGLCanvas();

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
     * 创建渲染器
     * @param {Object} canvasNode - Canvas节点
     * @param {Object} context - 渲染上下文
     * @param {Boolean} isWebGL - 是否为WebGL模式
     * @returns {Object} 渲染器
     * @private
     */
    _createRenderer: ErrorHandler.wrap(function(canvasNode, context, isWebGL) {
      // 使用RenderStrategies创建统一的渲染器
      const RenderStrategies = require('./strategies/render-strategies');
      console.log(`[族谱树] 开始创建${isWebGL ? 'WebGL' : 'Canvas2D'}渲染器`);
      
      const { renderer } = RenderStrategies.getRenderer({
        component: this,
        canvas: canvasNode,
        ctx: context
      });
      
      if (!renderer) {
        console.error(`[族谱树] ${isWebGL ? 'WebGL' : 'Canvas2D'}渲染器创建失败`);
        return null;
      }
      
      console.log(`[族谱树] ${isWebGL ? 'WebGL' : 'Canvas2D'}渲染器创建成功`);
      return renderer;
    }, {
      operation: '创建渲染器',
      defaultValue: null,
      onError(error) {
        console.error('[族谱树] 渲染器创建失败:', error.message);
      }
    }),

    /**
     * 初始化Canvas 2D
     * @private
     */
    _init2DCanvas: ErrorHandler.wrap(function () {
      console.log('[族谱树] 初始化Canvas 2D');

      try {
        this._initCanvasBase('#canvas2dFamilyTree', false)
          .then((canvasNode) => {
            // 保存Canvas 2D引用
            this.canvas2d = canvasNode;
            this.canvas = this.canvas2d; // 设置当前活动的canvas
            
            // 检查是否已存在上下文，如果存在且类型不是2D，需要先清除
            if (this.ctx) {
              console.log('[族谱树] 已存在上下文，类型:', typeof this.ctx);
              // 如果现有上下文不是2D上下文，需要先清除
              if (!(this.ctx instanceof CanvasRenderingContext2D)) {
                console.log('[族谱树] 清除已存在的非2D上下文');
                this.ctx = null;
              }
            }

            // 获取2D上下文
            try {
              this.ctx = this.canvas2d.getContext('2d');
              if (!this.ctx) {
                console.error('[族谱树] 无法获取Canvas 2D上下文');
                return;
              }
              console.log('[族谱树] 成功获取Canvas 2D上下文');
              
              // 更新Canvas兼容性标志
              this.setData({
                hasCanvas2D: true
              });
              
              // 兼容性检查
              this._checkCanvasCompatibility();
            } catch (error) {
              console.error('[族谱树] 获取Canvas 2D上下文失败:', error.message);
              return;
            }

            // 创建渲染器
            this.renderer = this._createRenderer(this.canvas2d, this.ctx, false);
            if (!this.renderer) {
              console.error('[族谱树] Canvas2D渲染器创建失败');
              return;
            }
            
            // 调整Canvas尺寸
            this._resizeCanvas();
            
            // 设置为当前渲染模式
            this.setData({
              'webgl.enabled': false
            });
            
            // 如果有树节点数据，尝试渲染
            if (this.properties.ready && this.properties.treeNodes && this.properties.treeNodes.length > 0) {
              this._render();
            }
          })
          .catch(error => {
            console.error('[族谱树] Canvas 2D初始化失败:', error.message);
            return false;
          });

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
     * @private
     */
    _initWebGLCanvas: ErrorHandler.wrap(function() {
        console.log('[族谱树] 开始初始化WebGL Canvas');
        
        this._initCanvasBase('#webglFamilyTree', true)
          .then((canvasNode) => {
            // 保存WebGL Canvas引用
            this.canvasWebGL = canvasNode;
            this.canvas = this.canvasWebGL; // 设置当前活动的canvas
            
            // 检查是否已存在上下文，如果存在且类型不是WebGL，需要先清除
            if (this.ctx) {
              console.log('[族谱树] 已存在上下文，类型:', typeof this.ctx);
              // 如果现有上下文不是WebGL上下文，需要先清除
              if (!(this.ctx instanceof WebGLRenderingContext)) {
                console.log('[族谱树] 清除已存在的非WebGL上下文');
                this.ctx = null;
              }
            }
            
            // 尝试获取WebGL上下文
            let webglContext = null;
            try {
              console.log('[族谱树] 尝试获取WebGL上下文');
              webglContext = this.canvasWebGL.getContext('webgl', {
                alpha: true,
                antialias: true,
                preserveDrawingBuffer: true,
                failIfMajorPerformanceCaveat: false, // 即使性能较低也尝试使用WebGL
                powerPreference: 'default'
              });
              
              if (!webglContext) {
                console.log('[族谱树] 首次尝试获取WebGL上下文失败，尝试其他参数组合');
                
                // 第二次尝试 - 使用更宽松的参数
                webglContext = this.canvasWebGL.getContext('webgl');
                
                if (!webglContext) {
                  console.warn('[族谱树] 第二次尝试也失败，检查Canvas类型是否正确');
                  
                  // 尝试获取experimental-webgl上下文
                  console.log('[族谱树] 尝试获取experimental-webgl上下文');
                  webglContext = this.canvasWebGL.getContext('experimental-webgl');
                  
                  if (!webglContext) {
                    console.error('[族谱树] 所有WebGL上下文获取尝试均失败');
                  } else {
                    console.log('[族谱树] 通过experimental-webgl获取了上下文');
                  }
                }
              }
            } catch (ctxError) {
              console.error('[族谱树] 获取WebGL上下文出错:', ctxError.message);
              webglContext = null;
            }
            
            if (!webglContext) {
              console.error('[族谱树] 无法获取WebGL上下文，可能是设备不支持或Canvas类型不匹配');
              
              // 检查Canvas元素类型
              if (this.canvasWebGL.type && this.canvasWebGL.type !== 'webgl') {
                console.warn(`[族谱树] Canvas类型不是webgl，而是 ${this.canvasWebGL.type}`);
              }
              
              this.setData({ 'webgl.supported': false, 'webgl.enabled': false });
              
              // 降级到2D模式
              console.log('[族谱树] WebGL不可用，降级到Canvas 2D模式');
              this._init2DCanvas();
              
              return;
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
            
            // 创建渲染器
            this.renderer = this._createRenderer(this.canvasWebGL, webglContext, true);
            if (!this.renderer) {
              console.error('[族谱树] WebGL渲染器创建失败');
              this.setData({ 'webgl.supported': false, 'webgl.enabled': false });
              
              // 降级到2D模式
              console.log('[族谱树] WebGL渲染器创建失败，降级到Canvas 2D模式');
              this._init2DCanvas();
              
              return;
            }
            
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
            
            // 调整Canvas尺寸
            this._resizeCanvas();
            
            // 如果有树节点数据，尝试渲染
            if (this.properties.ready && this.properties.treeNodes && this.properties.treeNodes.length > 0) {
              this._render();
            }
          })
          .catch(error => {
            console.error('[族谱树] WebGL Canvas初始化错误:', error.message);
            this.setData({ 'webgl.supported': false, 'webgl.enabled': false });
            
            // 降级到2D模式
            console.log('[族谱树] WebGL初始化失败，降级到Canvas 2D模式');
            this._init2DCanvas();
            
            return false;
          });
        
        return true;
    }, {
      operation: '初始化WebGL Canvas',
      defaultValue: false,
      onError(error) {
        console.error('[族谱树] WebGL Canvas初始化错误:', error.message, '\n堆栈:', error.stack);
        this.setData({ 'webgl.supported': false, 'webgl.enabled': false });
        
        // 降级到2D模式
        console.log('[族谱树] WebGL初始化出错，降级到Canvas 2D模式');
        this._init2DCanvas();
      }
    }),

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
    _resizeCanvas: ErrorHandler.wrap(function() {
        const viewportWidth = this.properties.viewportWidth;
        const viewportHeight = this.properties.viewportHeight;
        
        if (!viewportWidth || !viewportHeight) {
          console.warn('[族谱树] 视口尺寸无效，无法调整Canvas尺寸');
          return;
        }
        
        // 根据当前渲染模式决定调整哪个Canvas
        const useWebGL = this.data.webgl && this.data.webgl.enabled;
        
        if (useWebGL && this.canvasWebGL) {
          console.log('[族谱树] 调整WebGL Canvas尺寸');
          this.canvasWebGL.width = viewportWidth;
          this.canvasWebGL.height = viewportHeight;
        } else if (!useWebGL && this.canvas2d) {
          console.log('[族谱树] 调整Canvas 2D尺寸');
          this.canvas2d.width = viewportWidth;
          this.canvas2d.height = viewportHeight;
        }
        
        // 确保当前canvas引用是正确的
        this.canvas = useWebGL ? this.canvasWebGL : this.canvas2d;
        
        // 使用渲染服务调整Canvas尺寸
        if (this.rendererService) {
          this.rendererService.resizeCanvas(
            viewportWidth,
            viewportHeight,
            this.data.offsetX,
            this.data.offsetY,
            this.data.currentScale
          );
        }
        
        console.log('[族谱树] Canvas尺寸调整完成:', viewportWidth, 'x', viewportHeight);
    }, {
      operation: '调整Canvas尺寸',
      onError(error) {
        console.error('[族谱树] 调整Canvas尺寸出错:', error.message);
      }
    }),

    /**
     * 清理渲染器资源
     * @private
     */
    _cleanupRenderer: ErrorHandler.wrap(function() {
        // 释放渲染器资源
        if (this.renderer) {
          console.log('[族谱树] 释放渲染器资源');
          this.renderer.dispose();
          this.renderer = null;
        }

        // 重置上下文和Canvas引用
        this.ctx = null;
        this.canvas = null;
        
        console.log('[族谱树] 渲染器资源清理完成');
    }, {
      operation: '清理渲染器资源',
      onError(error) {
        console.error('[族谱树] 清理渲染器资源出错:', error.message);
      }
    }),

    /**
     * 释放所有资源
     * @private
     */
    _disposeResources: ErrorHandler.wrap(function() {
        // 清理渲染器资源
        this._cleanupRenderer();
        
        // 释放Canvas引用
        this.canvasWebGL = null;
        this.canvas2d = null;
        
        // 释放Worker资源
        if (this.layoutService) {
          this.layoutService.terminateWorker();
        }
        
        // 释放图像缓存
        if (this.imageCacheManager) {
          this.imageCacheManager.dispose();
          this.imageCacheManager = null;
        }
        
        // 释放其他服务资源
        this.rendererService = null;
        this.layoutService = null;
        
        console.log('[族谱树] 所有资源释放完成');
    }, {
      operation: '释放所有资源',
      onError(error) {
        console.error('[族谱树] 资源释放出错:', error);
      }
    }),

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
     * 获取当前活动的Canvas
     * @returns {Object} 当前活动的Canvas
     * @private
     */
    _getActiveCanvas: function() {
      const useWebGL = this.data.webgl && this.data.webgl.enabled;
      return useWebGL ? this.canvasWebGL : this.canvas2d;
    },

    /**
     * 检查渲染条件
     * @returns {Boolean} 是否满足渲染条件
     * @private
     */
    _checkRenderConditions: function() {
      // 检查视口尺寸
      if (this.properties.viewportWidth <= 0 || this.properties.viewportHeight <= 0) {
        console.warn('[族谱树] 视口尺寸无效，跳过渲染');
        return false;
      }

      // 检查节点数据
      if (!this.properties.treeNodes || this.properties.treeNodes.length === 0) {
        console.warn('[族谱树] 无树节点数据，跳过渲染');
        return false;
      }
      
      // 获取当前活动的canvas
      const canvas = this._getActiveCanvas();
      if (!canvas) {
        console.warn('[族谱树] Canvas未准备就绪，跳过渲染');
        return false;
      }

      // 更新当前活动的canvas引用
      this.canvas = canvas;
      
      // 检查渲染器是否准备就绪
      if (!this.renderer) {
        console.warn('[族谱树] 渲染器未准备就绪，跳过渲染');
        
        // 如果canvas对象存在但渲染器不存在，可能是初始化出了问题，尝试重新初始化
        if (this.canvas) {
          console.log('[族谱树] 画布对象存在但渲染器不存在，尝试重新初始化渲染器');
          
          // 重新尝试初始化渲染器
          const useWebGL = this.data.webgl && this.data.webgl.enabled;
          if (useWebGL) {
            // 尝试重新初始化WebGL
            setTimeout(() => {
              this._initWebGLCanvas();
            }, 50);
          } else {
            // 尝试重新初始化Canvas 2D
            setTimeout(() => {
              this._init2DCanvas();
            }, 50);
          }
        }
        
        return false;
      }
      
      return true;
    },

    /**
     * 渲染族谱树
     * @private
     */
    _render: ErrorHandler.wrap(function() {
        // 检查渲染条件
        if (!this._checkRenderConditions()) {
          return;
        }

        // 确定渲染模式
        const useWebGL = this.data.webgl && this.data.webgl.enabled;
        
        // 检查节点数据 - 确保每个节点有必要的属性
        const nodes = this.properties.treeNodes.map(node => {
          // 确保节点有宽高属性
          if (!node.width) node.width = 120;
          if (!node.height) node.height = 150;
          return node;
        });
        
        // 调试输出
        console.log('[族谱树] 节点总数:', nodes.length);
        if (nodes.length > 0) {
          console.log('[族谱树] 首个节点示例:', {
            id: nodes[0].id,
            x: nodes[0].x,
            y: nodes[0].y,
            width: nodes[0].width,
            height: nodes[0].height,
            name: nodes[0].name
          });
        }
        
        // 获取渲染数据
        const treeData = {
          nodes: nodes,
          connectors: this.properties.treeConnectors,
          offsetX: this.data.offsetX,
          offsetY: this.data.offsetY,
          scale: this.data.currentScale,
          currentMemberId: this.properties.currentMemberId,
          viewportWidth: this.properties.viewportWidth,
          viewportHeight: this.properties.viewportHeight
        };
        
        console.log('[族谱树] 开始渲染族谱树，节点数量:', treeData.nodes.length, 
                    '渲染模式:', useWebGL ? 'WebGL' : 'Canvas2D',
                    '变换:', {
                      offsetX: this.data.offsetX,
                      offsetY: this.data.offsetY,
                      scale: this.data.currentScale
                    });

        // 使用统一的渲染器接口执行渲染
        const renderSuccess = this.renderer.render(treeData);
        
        if (!renderSuccess) {
          console.error('[族谱树] 渲染族谱树失败');
        } else {
          console.log('[族谱树] 渲染族谱树完成');
        }
    }, {
      operation: '渲染族谱树',
      onError(error) {
        console.error('[族谱树] 族谱树渲染出错:', error.message);
        console.error('[族谱树] 错误堆栈:', error.stack);
      }
    }),
    
    /**
     * 计算树的边界
     * @private
     * @param {Array} nodes - 树节点数组
     * @returns {Object} 树的边界
     */
    _calculateTreeBounds(nodes) {
      if (!nodes || nodes.length === 0) return null;
      
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      // 遍历所有节点找出最小和最大坐标
      nodes.forEach(node => {
        if (typeof node.x !== 'undefined' && typeof node.y !== 'undefined') {
          minX = Math.min(minX, node.x);
          minY = Math.min(minY, node.y);
          maxX = Math.max(maxX, node.x + (node.width || 80));
          maxY = Math.max(maxY, node.y + (node.height || 100));
          
          // 考虑配偶节点
          if (node.spouses && node.spouses.length > 0) {
            node.spouses.forEach(spouse => {
              if (typeof spouse.x !== 'undefined' && typeof spouse.y !== 'undefined') {
                minX = Math.min(minX, spouse.x);
                minY = Math.min(minY, spouse.y);
                maxX = Math.max(maxX, spouse.x + (spouse.width || 80));
                maxY = Math.max(maxY, spouse.y + (spouse.height || 100));
              }
            });
          }
        }
      });
      
      // 构造并返回边界对象
      return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
      };
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
        devicePerformance: devicePerformance
      };
    },

    /**
     * 族谱树居中算法 - 7.0版本
     * 简单直接地将树居中显示在视口中
     * @param {Object} bounds - 树的边界信息
     * @private
     */
    _centerTree(bounds) {
      if (!bounds) {
        console.error('[族谱树] 边界信息不存在，无法居中');
        return;
      }
      
      console.log('[族谱树] 执行居中算法 7.0');
      
      // 验证边界信息是否有效
      if (
        bounds.minX === undefined || bounds.maxX === undefined ||
        bounds.minY === undefined || bounds.maxY === undefined ||
        (bounds.width === undefined && (bounds.maxX - bounds.minX <= 0)) ||
        (bounds.height === undefined && (bounds.maxY - bounds.minY <= 0))
      ) {
        console.error('[族谱树] 边界信息无效:', bounds);
        return;
      }
      
      // 计算族谱树的尺寸
      const treeWidth = bounds.width || (bounds.maxX - bounds.minX);
      const treeHeight = bounds.height || (bounds.maxY - bounds.minY);
      
      // 验证树的尺寸
      if (treeWidth <= 0 || treeHeight <= 0) {
        console.error('[族谱树] 树的尺寸无效:', {宽度: treeWidth, 高度: treeHeight});
        return;
      }
      
      // 记录树的尺寸和边界
      console.log('[族谱树] 树的尺寸和边界:', {
        宽度: treeWidth,
        高度: treeHeight,
        左边界: bounds.minX,
        右边界: bounds.maxX,
        上边界: bounds.minY,
        下边界: bounds.maxY
      });
      
      // 获取视口尺寸
      const viewportWidth = this.properties.viewportWidth;
      const viewportHeight = this.properties.viewportHeight;
      
      if (!viewportWidth || !viewportHeight || viewportWidth <= 0 || viewportHeight <= 0) {
        console.error('[族谱树] 视口尺寸无效:', {宽: viewportWidth, 高: viewportHeight});
        return;
      }
      
      // 计算合适的缩放比例以适应视口
      // 目标是使树宽度占据视口宽度的80%，或高度占据视口高度的80%
      const scaleX = (viewportWidth * 0.8) / treeWidth;
      const scaleY = (viewportHeight * 0.8) / treeHeight;
      
      // 选择较小的缩放比例，确保树完全可见
      let scale = Math.min(scaleX, scaleY);
      
      // 限制缩放范围，避免太大或太小
      scale = Math.min(1.5, Math.max(0.3, scale));
      
      // 计算树在视口中的中心位置
      const scaledTreeWidth = treeWidth * scale;
      const scaledTreeHeight = treeHeight * scale;
      
      // 计算族谱树的中心点(世界坐标)
      const treeCenterX = bounds.minX + treeWidth / 2;
      const treeCenterY = bounds.minY + treeHeight / 2;
      
      // 计算视口中心点(屏幕坐标)
      const viewportCenterX = viewportWidth / 2;
      const viewportCenterY = viewportHeight / 2;
      
      // 关键修复: 更正偏移量计算公式
      // 正确的偏移量 = 视口中心点 - 树中心点*缩放
      const offsetX = viewportCenterX - (treeCenterX * scale);
      const offsetY = viewportCenterY - (treeCenterY * scale);
      
      // 保护: 确保最终计算的偏移量是有效数字
      if (isNaN(offsetX) || isNaN(offsetY) || isNaN(scale)) {
        console.error('[族谱树] 居中计算出的值无效', {
          偏移X: offsetX,
          偏移Y: offsetY,
          缩放: scale,
          树中心点: {x: treeCenterX, y: treeCenterY},
          视口中心点: {x: viewportCenterX, y: viewportCenterY}
        });
        
        // 使用备用值
        this.setData({
          offsetX: viewportWidth / 2,
          offsetY: viewportHeight / 2,
          currentScale: 0.8,
          scalePercentage: 80
        });
        return;
      }
      
      console.log('[族谱树] 居中参数:', {
        树中心点: {x: treeCenterX.toFixed(2), y: treeCenterY.toFixed(2)},
        视口中心点: {x: viewportCenterX, y: viewportCenterY},
        缩放: scale.toFixed(3),
        偏移X: offsetX.toFixed(1),
        偏移Y: offsetY.toFixed(1)
      });
      
      // 边界检查: 计算经过变换后树的四个角坐标
      const transformedMinX = bounds.minX * scale + offsetX;
      const transformedMinY = bounds.minY * scale + offsetY;
      const transformedMaxX = bounds.maxX * scale + offsetX;
      const transformedMaxY = bounds.maxY * scale + offsetY;
      
      // 计算变换后的树尺寸
      const transformedWidth = transformedMaxX - transformedMinX;
      const transformedHeight = transformedMaxY - transformedMinY;
      
      // 确保变换后的族谱树合理大小
      if (transformedWidth < 20 || transformedHeight < 20) {
        console.warn('[族谱树] 变换后树太小，调整缩放比例');
        scale = Math.max(0.5, scale * 1.5);
      }
      
      // 应用计算结果
      this.setData({
        offsetX, 
        offsetY,
        currentScale: scale,
        scalePercentage: Math.round(scale * 100)
      });
      
      // 验证设置后的变换参数
      console.log('[族谱树] 居中后的变换参数已设置:', {
        偏移X: offsetX,
        偏移Y: offsetY,
        缩放: scale
      });
    },

    /**
     * 计算可视区域 - 新版简化算法
     * @private
     * @returns {Object} 可视区域对象
     */
    _calculateVisibleArea() {
      const scale = this.data.currentScale || 1;
      const offsetX = this.data.offsetX || 0;
      const offsetY = this.data.offsetY || 0;
      const width = this.properties.viewportWidth || 300;
      const height = this.properties.viewportHeight || 400;
      
      // 计算世界坐标中的可视区域，转换公式: 屏幕坐标 = 世界坐标*scale + offset
      // 因此世界坐标 = (屏幕坐标 - offset) / scale
      const visibleArea = {
        left: (0 - offsetX) / scale,
        top: (0 - offsetY) / scale,
        right: (width - offsetX) / scale,
        bottom: (height - offsetY) / scale,
        buffer: 100 / scale // 缓冲区随缩放变化
      };
      
      // 计算可视区域宽高
      visibleArea.width = visibleArea.right - visibleArea.left;
      visibleArea.height = visibleArea.bottom - visibleArea.top;
      
      console.log('[可视区域] 计算结果:', {
        屏幕尺寸: `${width}x${height}`,
        变换: {scale: scale.toFixed(2), offsetX, offsetY},
        世界范围: {
          左: visibleArea.left.toFixed(0),
          上: visibleArea.top.toFixed(0),
          右: visibleArea.right.toFixed(0),
          下: visibleArea.bottom.toFixed(0)
        }
      });
      
      return visibleArea;
    }
  }
});