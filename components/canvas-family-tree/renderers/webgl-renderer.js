/**
 * WebGL渲染模块
 * 包含WebGL渲染器和WebGL树渲染器的实现
 */

// 导入渲染管线模块
const {
  RenderState,
  RenderPipelineFactory
} = require('./webgl-pipeline');

// 导入错误处理工具
const ErrorHandler = require('../../../utils/error-handler');

/**
 * WebGL树渲染器
 * 负责WebGL渲染的底层实现
 */
class WebGLTreeRenderer {
  /**
   * 构造函数
   * @param {Object} canvas - Canvas对象
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.buffers = {};
    this.textures = {};
    this.shaders = {
      vertex: null,
      fragment: null
    };
    this.transformUniforms = {
      offsetX: 0,
      offsetY: 0,
      scale: 1.0
    };
    this.currentLayer = 0;
  }

  /**
   * 初始化WebGL上下文
   * @returns {Boolean} 是否初始化成功
   */
  init = ErrorHandler.wrap(function() {
    // 检查canvas是否存在
    if (!this.canvas) {
      console.error('[WebGL诊断] Canvas对象未定义，无法初始化WebGL上下文');
      return false;
    }

    // 检查canvas尺寸
    if (!this.canvas.width || !this.canvas.height) {
      console.warn('[WebGL诊断] Canvas尺寸无效，尝试设置默认尺寸');
      this.canvas.width = this.canvas.width || 300;
      this.canvas.height = this.canvas.height || 300;
    }

    // 如果gl上下文已经存在，不再尝试获取上下文
    if (!this.gl) {
      // 微信小程序中获取WebGL上下文的正确方式
      try {
        console.log('[WebGL诊断] 尝试获取WebGL上下文(微信小程序方式)');
        this.gl = this.canvas.getContext('webgl', {
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true
        });
      } catch (err) {
        console.warn('[WebGL诊断] 微信小程序WebGL上下文获取失败:', err.message);
        this.gl = null;
      }
    } else {
      console.log('[WebGL诊断] 使用已存在的WebGL上下文');
    }

    // 进行WebGL功能检测
    try {
      const maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
      const maxViewportDims = this.gl.getParameter(this.gl.MAX_VIEWPORT_DIMS);

      console.log('[WebGL诊断] 设备支持的最大纹理尺寸:', maxTextureSize);
      console.log('[WebGL诊断] 设备支持的最大视口尺寸:', maxViewportDims);
    } catch (err) {
      console.warn('[WebGL诊断] WebGL参数获取失败:', err.message);
    }

    // 初始化着色器
    const shadersResult = this._initShaders();
    if (!shadersResult) {
      console.error('[WebGL诊断] 着色器初始化失败');
      return false;
    }

    // 初始化缓冲区
    const buffersResult = this._initBuffers();
    if (!buffersResult) {
      console.error('[WebGL诊断] 缓冲区初始化失败');
      return false;
    }

    // 设置初始视口
    this.updateViewport(this.canvas.width, this.canvas.height);

    console.log('[WebGL诊断] WebGL初始化成功');
    return true;
  }, {
    operation: 'WebGL上下文初始化',
    defaultValue: false,
    onError(error) {
      console.error('[WebGL诊断] 初始化WebGL渲染器失败:', error.message);
      console.error('[WebGL诊断] 错误堆栈:', error.stack);
      return false;
    }
  });

  /**
   * 初始化着色器
   * @private
   * @returns {Boolean} 是否初始化成功
   */
  _initShaders = ErrorHandler.wrap(function() {
    try {
      // 定义顶点着色器代码 - 使用一致的属性名"aVertexPosition"
      const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoord;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        varying highp vec2 vTextureCoord;
        
        void main() {
          // 加入额外的精度保护，避免浮点数精度问题
          highp vec4 position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
          gl_Position = position;
          vTextureCoord = aTextureCoord;
        }
      `;

      // 定义片段着色器代码  
      const fsSource = `
        varying highp vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform highp float uAlpha;
        
        void main() {
          highp vec4 color = texture2D(uSampler, vTextureCoord);
          // 确保透明度正确应用
          gl_FragColor = vec4(color.rgb, color.a * uAlpha);
        }
      `;
      
      // 添加连接线顶点着色器 - 使用相同的属性名"aVertexPosition"
      const lineVsSource = `
        attribute vec4 aVertexPosition;
        uniform mat4 u_matrix;
        
        void main() {
          gl_Position = u_matrix * aVertexPosition;
        }
      `;
      
      // 连接线片段着色器 - 使用统一的颜色
      const lineFsSource = `
        precision mediump float;
        uniform vec4 u_color;
        
        void main() {
          gl_FragColor = u_color;
        }
      `;

      // 添加调试日志
      console.log('[WebGL诊断] 着色器初始化', {着色器类型: '增强版标准着色器'});

      // 创建着色器程序
      const vertexShader = this._createShader(this.gl.VERTEX_SHADER, vsSource);
      if (!vertexShader) {
        console.error('[WebGL诊断] 顶点着色器创建失败');
        return false;
      }

      const fragmentShader = this._createShader(this.gl.FRAGMENT_SHADER, fsSource);
      if (!fragmentShader) {
        console.error('[WebGL诊断] 片段着色器创建失败');
        return false;
      }

      this.program = this.gl.createProgram();
      this.gl.attachShader(this.program, vertexShader);
      this.gl.attachShader(this.program, fragmentShader);
      this.gl.linkProgram(this.program);

      if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
        const info = this.gl.getProgramInfoLog(this.program);
        console.error('[WebGL诊断] 无法链接着色器程序:', info);
        return false;
      }
      
      // 创建连接线着色器程序
      const lineVertexShader = this._createShader(this.gl.VERTEX_SHADER, lineVsSource);
      const lineFragmentShader = this._createShader(this.gl.FRAGMENT_SHADER, lineFsSource);
      
      if (!lineVertexShader || !lineFragmentShader) {
        console.error('[WebGL诊断] 连接线着色器创建失败');
        // 不返回失败，因为我们仍然可以使用主着色器程序
      } else {
        // 创建连接线程序
        this.lineProgram = this.gl.createProgram();
        this.gl.attachShader(this.lineProgram, lineVertexShader);
        this.gl.attachShader(this.lineProgram, lineFragmentShader);
        this.gl.linkProgram(this.lineProgram);
        
        if (!this.gl.getProgramParameter(this.lineProgram, this.gl.LINK_STATUS)) {
          console.error('[WebGL诊断] 连接线着色器程序链接失败:', 
            this.gl.getProgramInfoLog(this.lineProgram));
          this.lineProgram = null; // 清除引用
        } else {
          console.log('[WebGL诊断] 连接线着色器程序创建成功');
        }
      }

      this.shaders.vertex = vertexShader;
      this.shaders.fragment = fragmentShader;

      return true;
    } catch (error) {
      console.error('[WebGL诊断] 着色器初始化错误:', error.message);
      return false;
    }
  }, {
    operation: '着色器初始化',
    defaultValue: false,
    onError(error) {
      console.error('[WebGL诊断] 着色器初始化错误:', error.message);
      return false;
    }
  });

  /**
   * 创建着色器
   * @param {Number} type - 着色器类型
   * @param {String} source - 着色器源代码
   * @returns {WebGLShader} 着色器对象
   * @private
   */
  _createShader = ErrorHandler.wrap(function(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('着色器编译错误:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }, {
    operation: '创建着色器',
    defaultValue: null,
    onError(error) {
      console.error('[WebGL诊断] 创建着色器失败:', error.message);
      return null;
    }
  });

  /**
   * 初始化缓冲区
   * @private
   * @returns {Boolean} 是否初始化成功
   */
  _initBuffers = ErrorHandler.wrap(function() {
    // 位置缓冲区 - 用于节点的矩形
    const positionBuffer = this.gl.createBuffer();
    if (!positionBuffer) {
      console.error('[WebGL诊断] 无法创建位置缓冲区');
      return false;
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

    // 为节点创建位置缓冲区数据
    // 定义一个规范化的单位正方形 (-1,-1) 到 (1,1)
    // 实际渲染时会通过矩阵变换调整大小和位置
    const positions = [
      -0.5, -0.5,  // 左下角
      0.5, -0.5,   // 右下角
      0.5, 0.5,    // 右上角
      -0.5, 0.5    // 左上角
    ];

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(positions),
      this.gl.STATIC_DRAW
    );

    // 纹理坐标缓冲区
    const textureCoordBuffer = this.gl.createBuffer();
    if (!textureCoordBuffer) {
      console.error('[WebGL诊断] 无法创建纹理坐标缓冲区');
      return false;
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);

    // 定义纹理坐标 - 从(0,0)到(1,1)
    const textureCoordinates = [
      0.0, 1.0,  // 左下角
      1.0, 1.0,  // 右下角
      1.0, 0.0,  // 右上角
      0.0, 0.0   // 左上角
    ];

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(textureCoordinates),
      this.gl.STATIC_DRAW
    );

    // 索引缓冲区
    const indexBuffer = this.gl.createBuffer();
    if (!indexBuffer) {
      console.error('[WebGL诊断] 无法创建索引缓冲区');
      return false;
    }
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // 定义两个三角形组成一个矩形
    // 注意这里的顶点顺序是逆时针的，这对于面剔除很重要
    const indices = [
      0, 1, 2,    // 第一个三角形：左下、右下、右上
      0, 2, 3     // 第二个三角形：左下、右上、左上
    ];

    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      this.gl.STATIC_DRAW
    );

    // 线条缓冲区（用于测试）
    const lineBuffer = this.gl.createBuffer();
    if (!lineBuffer) {
      console.error('[WebGL诊断] 无法创建线条缓冲区');
      return false;
    }
    
    // 保存缓冲区引用
    this.buffers = {
      position: positionBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer,
      line: lineBuffer
    };

    console.log('[WebGL诊断] 缓冲区初始化成功');
    return true;
  }, {
    operation: '缓冲区初始化',
    defaultValue: false,
    onError(error) {
      console.error('[WebGL诊断] 缓冲区初始化错误:', error.message);
      return false;
    }
  });

  /**
   * 更新视口尺寸
   * @param {Number} width - 视口宽度
   * @param {Number} height - 视口高度
   */
  updateViewport = ErrorHandler.wrap(function(width, height) {
    if (!this.gl) return;

    // 获取设备信息
    const systemInfo = wx.getWindowInfo();
    const dpr = systemInfo.pixelRatio || 1;
    const screenWidth = systemInfo.screenWidth;
    const screenHeight = systemInfo.screenHeight;
    
    console.log(`[WebGL视口] 设备信息: 像素比(${dpr}), 屏幕尺寸(${screenWidth}x${screenHeight})`);

    // 计算物理像素尺寸 - 考虑设备像素比
    const physicalWidth = Math.floor(width * dpr);
    const physicalHeight = Math.floor(height * dpr);

    // 更新Canvas物理尺寸(像素)
    if (this.canvas && (this.canvas.width !== physicalWidth || this.canvas.height !== physicalHeight)) {
      console.log(`[WebGL视口] 更新Canvas尺寸从 ${this.canvas.width}x${this.canvas.height} 到 ${physicalWidth}x${physicalHeight}`);
      this.canvas.width = physicalWidth;
      this.canvas.height = physicalHeight;
    }

    // 设置视口尺寸 - 与Canvas物理像素尺寸一致
    // 这一步非常关键，确保WebGL视口与Canvas物理尺寸匹配
    this.gl.viewport(0, 0, physicalWidth, physicalHeight);
    
    // 测试视口尺寸是否设置成功
    const viewport = this.gl.getParameter(this.gl.VIEWPORT);
    console.log(`[WebGL视口] 设置后的视口参数: 宽=${viewport[2]}, 高=${viewport[3]}, 起点=(${viewport[0]},${viewport[1]})`);
    
    // 验证视口设置是否与预期一致
    if (viewport[2] !== physicalWidth || viewport[3] !== physicalHeight) {
      console.warn(`[WebGL视口] 视口尺寸设置不一致! 预期: ${physicalWidth}x${physicalHeight}, 实际: ${viewport[2]}x${viewport[3]}`);
      
      // 尝试强制再次设置视口
      console.log('[WebGL视口] 尝试强制再设置视口尺寸');
      this.gl.viewport(0, 0, physicalWidth, physicalHeight);
      
      // 再次验证
      const newViewport = this.gl.getParameter(this.gl.VIEWPORT);
      console.log(`[WebGL视口] 强制设置后: ${newViewport[2]}x${newViewport[3]}`);
    }

    // 清除画布 - 确保每次视口更新后画布都是干净的
    this.gl.clearColor(0.95, 0.95, 0.95, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    console.log(`[WebGL视口] 视口更新完成:
      - 物理尺寸=${physicalWidth}x${physicalHeight}
      - 逻辑尺寸=${width}x${height}
      - 设备像素比=${dpr}
      - 视口实际配置=${viewport[2]}x${viewport[3]}`);
    
    return true;
  }, {
    operation: '更新视口尺寸',
    defaultValue: false,
    onError(error) {
      console.error('[WebGL视口] 视口更新失败:', error.message);
      return false;
    }
  });

  /**
   * 设置变换参数
   * @param {Number} offsetX - X轴偏移
   * @param {Number} offsetY - Y轴偏移
   * @param {Number} scale - 缩放比例
   */
  setTransform = ErrorHandler.wrap(function(offsetX, offsetY, scale) {
    // 验证输入参数
    if (isNaN(offsetX) || isNaN(offsetY) || isNaN(scale)) {
      console.error('[WebGL] 无效的变换参数:', {
        offsetX, offsetY, scale
      });
      return;
    }
    
    // 确保缩放不为0
    if (scale === 0) {
      console.error('[WebGL] 缩放值不能为0，已设为默认值0.5');
      scale = 0.5;
    }
    
    // 记录变换参数变化
    const hasChanged = (
      this.transformUniforms.offsetX !== offsetX ||
      this.transformUniforms.offsetY !== offsetY ||
      this.transformUniforms.scale !== scale
    );
    
    if (hasChanged) {
      console.log('[WebGL变换] 参数变化:', {
        从: {
          offsetX: this.transformUniforms.offsetX.toFixed(1),
          offsetY: this.transformUniforms.offsetY.toFixed(1),
          scale: this.transformUniforms.scale.toFixed(3)
        },
        到: {
          offsetX: offsetX.toFixed(1),
          offsetY: offsetY.toFixed(1),
          scale: scale.toFixed(3)
        }
      });
    }
    
    // 更新变换参数
    this.transformUniforms.offsetX = offsetX;
    this.transformUniforms.offsetY = offsetY;
    this.transformUniforms.scale = scale;
  }, {
    operation: '设置变换参数',
    onError(error) {
      console.error('[WebGL变换] 设置变换参数失败:', error.message);
    }
  });

  /**
   * 设置当前渲染层
   * @param {Number} layer - 层索引
   */
  setCurrentLayer = ErrorHandler.wrap(function(layer) {
    if (isNaN(layer)) {
      console.warn('[WebGL层管理] 无效的层索引:', layer);
      layer = 0; // 使用默认值
    }
    this.currentLayer = layer;
  }, {
    operation: '设置渲染层',
    onError(error) {
      console.error('[WebGL层管理] 设置当前渲染层失败:', error.message);
    }
  });

  /**
   * 渲染族谱树
   * @param {Object} params - 渲染参数
   * @param {Array} params.nodes - 节点数组
   * @param {Array} params.connectors - 连接线数组
   * @param {Object} params.visibleArea - 可视区域
   * @param {Object} params.layeredRendering - 分层渲染信息
   * @param {String} params.currentMemberId - 当前成员ID
   * @param {Object} params.nodeTextureMap - 节点纹理映射
   * @returns {Boolean} 渲染是否成功
   */
  render = ErrorHandler.wrap(function(params) {
    // 从传入的参数中提取渲染数据
    const { 
      nodes, 
      connectors, 
      visibleArea, 
      currentMemberId, 
      layeredRendering
    } = params;
    
    // 如果不可用，则返回失败
    if (!this.gl || !this.program) {
      console.warn('[WebGL诊断] WebGL上下文或程序未初始化，无法渲染');
      return false;
    }
    
    // 将参数记录到调试控制台
    console.log('[WebGL树渲染器] 准备渲染:', {
      节点数量: nodes?.length || 0,
      连接线数量: connectors?.length || 0,
      带可视区域: !!visibleArea,
      缩放: this.transformUniforms.scale.toFixed(2),
      偏移: `X=${this.transformUniforms.offsetX.toFixed(0)}, Y=${this.transformUniforms.offsetY.toFixed(0)}`,
      当前成员ID: currentMemberId || '无'
    });
    
    // 检查是否有节点数据需要渲染
    if (!nodes || nodes.length === 0) {
      console.log('[WebGL树渲染器] 没有节点需要渲染，跳过渲染过程');
      this.clear();
      return true; // 没有数据也是正常完成
    }
    
    // 使用渲染管线执行渲染 - 使用管线模式提高可维护性
    try {
      const renderState = new RenderState({
        nodes,
        connectors,
        visibleArea,
        currentMemberId,
        transform: {
          offsetX: this.transformUniforms.offsetX,
          offsetY: this.transformUniforms.offsetY,
          scale: this.transformUniforms.scale
        },
        canvasWidth: this.canvas.width,
        canvasHeight: this.canvas.height,
        layeredRendering,
        nodeTextureMap: this.textures
      });
      
      // 创建渲染管线
      const renderPipeline = RenderPipelineFactory.createMainPipeline(this.gl, {
        program: this.program,
        lineProgram: this.lineProgram,
        buffers: this.buffers,
        textures: this.textures
      });
      
      // 执行管线
      const finalState = renderPipeline.execute(renderState);
      
      // 检查管线执行结果
      const success = finalState && finalState.errors.length === 0;
      
      if (!success) {
        console.error('[WebGL树渲染器] 渲染管线执行失败:', finalState?.errors);
      }
      
      // 总是返回渲染结果
      return success;
    } catch (error) {
      console.error('[WebGL树渲染器] 渲染管线执行出错:', error.message);
      console.error('[WebGL树渲染器] 错误堆栈:', error.stack);
      return false;
    }
  }, {
    operation: 'WebGL树渲染',
    defaultValue: false,
    onError(error) {
      console.error('[WebGL树渲染器] 渲染族谱树失败:', error.message);
      return false;
    }
  });

  /**
   * 清除画布
   */
  clear = ErrorHandler.wrap(function() {
    if (!this.gl) return;
    
    this.gl.clearColor(0.95, 0.95, 0.95, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }, {
    operation: '清除画布',
    onError(error) {
      console.error('[WebGL树渲染器] 清除画布失败:', error.message);
    }
  });

  /**
   * 销毁资源
   */
  dispose = ErrorHandler.wrap(function() {
    if (!this.gl) return;
    
    // 删除着色器和程序
    if (this.program) {
      if (this.shaders.vertex) {
        this.gl.detachShader(this.program, this.shaders.vertex);
        this.gl.deleteShader(this.shaders.vertex);
      }
      
      if (this.shaders.fragment) {
        this.gl.detachShader(this.program, this.shaders.fragment);
        this.gl.deleteShader(this.shaders.fragment);
      }
      
      this.gl.deleteProgram(this.program);
    }
    
    // 删除连接线程序
    if (this.lineProgram) {
      this.gl.deleteProgram(this.lineProgram);
    }
    
    // 删除缓冲区
    for (const key in this.buffers) {
      if (this.buffers[key]) {
        this.gl.deleteBuffer(this.buffers[key]);
      }
    }
    
    // 删除纹理
    for (const key in this.textures) {
      if (this.textures[key]) {
        this.gl.deleteTexture(this.textures[key]);
      }
    }
    
    // 清除引用
    this.shaders = { vertex: null, fragment: null };
    this.program = null;
    this.lineProgram = null;
    this.buffers = {};
    this.textures = {};
    this.gl = null;
    this.canvas = null;
    
    console.log('[WebGL树渲染器] 资源已释放');
  }, {
    operation: '销毁资源',
    onError(error) {
      console.error('[WebGL树渲染器] 释放资源失败:', error.message);
    }
  });
}

/**
 * WebGL渲染器
 * 负责WebGL绘制相关的渲染逻辑，作为组件与WebGL树渲染器的桥接层
 */
class WebGLRenderer {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Object} options.canvas - Canvas节点
   * @param {Object} [options.gl] - WebGL上下文
   * @param {Object} [options.ctx] - WebGL上下文(兼容新接口)
   * @param {Object} [options.component] - 组件实例
   */
  constructor(options) {
    // 支持直接传递组件或传递options对象
    if (options.component) {
      this.component = options.component;
      this.canvas = options.component.canvas;
    } else if (options.canvas) {
      this.canvas = options.canvas;
      this.component = null;
    } else {
      console.error('WebGL渲染器初始化失败：未提供Canvas或组件实例');
      return;
    }

    // 获取WebGL上下文 - 支持通过gl或ctx参数传入
    const gl = options.gl || options.ctx;
    if (gl) {
      this.gl = gl;
    } else if (this.canvas) {
      try {
        this.gl = this.canvas.getContext('webgl');
      } catch (e) {
        console.error('获取WebGL上下文失败:', e.message);
        this.gl = null;
      }
    }

    if (!this.gl) {
      console.error('WebGL渲染器初始化失败：无法获取WebGL上下文');
      return;
    }

    // 初始化树渲染器
    this.treeRenderer = null;
    this._initTreeRenderer();
  }

  /**
   * 初始化树渲染器
   * @private
   */
  _initTreeRenderer = ErrorHandler.wrap(function() {
    // 检查canvas有效性
    if (!this.canvas) {
      console.error('[WebGL诊断] 无效的Canvas对象，WebGL渲染器初始化失败');
      return false;
    }

    // 检查WebGL上下文有效性
    if (!this.gl) {
      console.error('[WebGL诊断] 无效的WebGL上下文，WebGL渲染器初始化失败');
      return false;
    }

    // 记录Canvas属性
    console.log(`[WebGL诊断] Canvas尺寸: ${this.canvas.width}x${this.canvas.height}`);
    console.log(`[WebGL诊断] Canvas类型: ${this.canvas.constructor.name}`);

    // 创建WebGL树渲染器
    this.treeRenderer = new WebGLTreeRenderer(this.canvas);
    
    // 设置WebGL上下文
    this.treeRenderer.gl = this.gl;

    // 尝试初始化 - 但不再重复获取上下文
    // 因为我们已经有了上下文this.gl
    const initSuccess = this.treeRenderer.init();

    if (initSuccess) {
      // 初始化成功
      if (this.component) {
        // 如果有组件引用，更新组件状态但不存储渲染器
        // 避免循环引用
        this.component.setData({
          'webgl.initialized': true
        });
      }
      console.log('[WebGL诊断] WebGL树渲染器初始化成功');
      return true;
    } else {
      console.error('[WebGL诊断] WebGL树渲染器初始化失败');
      return false;
    }
  }, {
    operation: '初始化WebGL树渲染器',
    defaultValue: false,
    onError(error) {
      console.error('[WebGL诊断] 创建WebGL树渲染器时发生错误:', error.message);
      return false;
    }
  });

  /**
   * 检查是否可用
   * @returns {Boolean} 是否可用
   */
  canUse = ErrorHandler.wrap(function() {
    // 如果有组件，检查组件状态
    if (this.component) {
      const { webgl } = this.component.data;
      
      // 收集详细的状态信息用于调试
      const status = {
        enabled: webgl.enabled,
        supported: webgl.supported,
        hasCanvas: !!this.canvas,
        hasTreeRenderer: !!this.treeRenderer,
        canvasType: this.canvas ? (this.canvas.type || '未知') : '无Canvas',
        canvasSize: this.canvas ? `${this.canvas.width}x${this.canvas.height}` : '无尺寸',
        treeRendererInitialized: this.treeRenderer ? 'true' : 'false',
        componentState: {
          webglEnabled: webgl.enabled,
          webglSupported: webgl.supported,
          webglInitialized: webgl.initialized
        }
      };
      
      const canUseResult = webgl.enabled && 
        webgl.supported && 
        !!this.canvas && 
        !!this.treeRenderer;
      
      console.log(`[WebGL] canUse检查结果: ${canUseResult ? '可用' : '不可用'}`, status);
      
      return canUseResult;
    }

    // 如果没有组件，只检查canvas和treeRenderer
    const simpleStatus = {
      hasCanvas: !!this.canvas,
      hasTreeRenderer: !!this.treeRenderer,
      canvasType: this.canvas ? (this.canvas.type || '未知') : '无Canvas'
    };
    
    const simpleResult = !!this.canvas && !!this.treeRenderer;
    console.log(`[WebGL] 简单canUse检查结果: ${simpleResult ? '可用' : '不可用'}`, simpleStatus);
    
    return simpleResult;
  }, {
    operation: '检查WebGL可用性',
    defaultValue: false,
    onError(error) {
      console.error('[WebGL] 检查可用性时出错:', error.message);
      return false;
    }
  });

  /**
   * 执行渲染
   * @param {Object} options - 渲染选项
   * @param {Object} options.visibleArea - 可视区域
   * @param {Array} options.nodes - 节点数组
   * @param {Array} options.connectors - 连接线数组
   * @param {Object} options.layeredRendering - 分层渲染信息
   * @param {String} options.currentMemberId - 当前成员ID
   * @param {Number} [options.offsetX] - X偏移（无组件时使用）
   * @param {Number} [options.offsetY] - Y偏移（无组件时使用）
   * @param {Number} [options.scale] - 缩放值（无组件时使用）
   * @returns {Boolean} 渲染是否成功
   */
  render = ErrorHandler.wrap(function(options) {
    const {
      visibleArea,
      nodes,
      connectors,
      layeredRendering,
      currentMemberId,
      offsetX,
      offsetY,
      scale,
      nodeTextureMap
    } = options;

    if (!this.treeRenderer) {
      console.warn('[WebGL渲染器] 无法渲染：树渲染器未初始化');
      return false;
    }
    
    // 添加详细的连接线调试信息
    console.log('[WebGL渲染器调试] 连接线数据:', {
      总数量: connectors?.length || 0,
      示例连接线: connectors && connectors.length > 0 ? [
        {
          id: connectors[0].id,
          type: connectors[0].type,
          from: {x: connectors[0].fromX, y: connectors[0].fromY},
          to: {x: connectors[0].toX, y: connectors[0].toY}
        },
        connectors.length > 1 ? {
          id: connectors[1].id,
          type: connectors[1].type,
          from: {x: connectors[1].fromX, y: connectors[1].fromY},
          to: {x: connectors[1].toX, y: connectors[1].toY}
        } : null
      ].filter(Boolean) : []
    });
    
    try {
      // 获取当前变换参数
      const transformOffsetX = offsetX !== undefined ? 
        offsetX : (this.component ? this.component.data.offsetX : 0);
      const transformOffsetY = offsetY !== undefined ? 
        offsetY : (this.component ? this.component.data.offsetY : 0);
      const transformScale = scale !== undefined ? 
        scale : (this.component ? this.component.data.currentScale : 1.0);
      
      // 设置变换参数
      this.treeRenderer.setTransform(transformOffsetX, transformOffsetY, transformScale);
      
      // 执行渲染
      return this.treeRenderer.render({
        nodes,
        connectors,
        visibleArea,
        currentMemberId,
        layeredRendering,
        nodeTextureMap
      });
    } catch (error) {
      console.error('[WebGL渲染器] 渲染出错:', error.message);
      return false;
    }
  }, {
    operation: 'WebGL渲染',
    defaultValue: false,
    onError(error) {
      console.error('[WebGL渲染器] 渲染出错:', error.message);
      return false;
    }
  });

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
      console.error('[WebGL渲染器] 清除画布失败:', error.message);
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
      console.error('[WebGL渲染器] 更新视口尺寸失败:', error.message);
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
      console.error('[WebGL渲染器] 设置变换参数失败:', error.message);
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
    this.gl = null;
  }, {
    operation: '销毁资源',
    onError(error) {
      console.error('[WebGL渲染器] 释放资源失败:', error.message);
    }
  });
}

// 导出渲染器类
module.exports = {
  WebGLRenderer
};