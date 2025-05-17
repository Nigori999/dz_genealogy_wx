/**
 * WebGL渲染模块
 * 包含WebGL渲染器和WebGL树渲染器的实现
 */

// 导入渲染管线模块
const {
  RenderState,
  RenderPipelineFactory
} = require('./webgl-pipeline');

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
  init() {
    try {
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
    } catch (error) {
      console.error('[WebGL诊断] 初始化WebGL渲染器失败:', error.message);
      console.error('[WebGL诊断] 错误堆栈:', error.stack);
      return false;
    }
  }

  /**
   * 初始化着色器
   * @private
   * @returns {Boolean} 是否初始化成功
   */
  _initShaders() {
    try {
      // 顶点着色器代码
      const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoord;
        
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        
        varying highp vec2 vTextureCoord;
        
        void main() {
          gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
          vTextureCoord = aTextureCoord;
        }
      `;

      // 片段着色器代码
      const fsSource = `
        varying highp vec2 vTextureCoord;
        
        uniform sampler2D uSampler;
        uniform highp float uAlpha;
        
        void main() {
          highp vec4 color = texture2D(uSampler, vTextureCoord);
          gl_FragColor = vec4(color.rgb, color.a * uAlpha);
        }
      `;

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

      this.shaders.vertex = vertexShader;
      this.shaders.fragment = fragmentShader;

      return true;
    } catch (error) {
      console.error('[WebGL诊断] 着色器初始化错误:', error.message);
      return false;
    }
  }

  /**
   * 创建着色器
   * @param {Number} type - 着色器类型
   * @param {String} source - 着色器源代码
   * @returns {WebGLShader} 着色器对象
   * @private
   */
  _createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('着色器编译错误:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * 初始化缓冲区
   * @private
   * @returns {Boolean} 是否初始化成功
   */
  _initBuffers() {
    try {
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
    } catch (error) {
      console.error('[WebGL诊断] 缓冲区初始化错误:', error.message);
      return false;
    }
  }

  /**
   * 更新视口尺寸
   * @param {Number} width - 宽度
   * @param {Number} height - 高度
   */
  updateViewport(width, height) {
    if (!this.gl) return;

    // 设置视口尺寸
    this.gl.viewport(0, 0, width, height);

    // 清除画布
    this.gl.clearColor(0.95, 0.95, 0.95, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /**
   * 设置变换参数
   * @param {Number} offsetX - X偏移
   * @param {Number} offsetY - Y偏移
   * @param {Number} scale - 缩放
   */
  setTransform(offsetX, offsetY, scale) {
    this.transformUniforms.offsetX = offsetX;
    this.transformUniforms.offsetY = offsetY;
    this.transformUniforms.scale = scale;
  }

  /**
   * 设置当前渲染层
   * @param {Number} layer - 层索引
   */
  setCurrentLayer(layer) {
    this.currentLayer = layer;
  }

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
  render(params) {
    if (!this.gl || !this.program) {
      console.warn('[WebGL] 渲染器未初始化，无法渲染');
      return false;
    }

    const {
      nodes,
      connectors,
      visibleArea,
      layeredRendering,
      currentMemberId,
      nodeTextureMap
    } = params;

    // 记录接收的纹理映射信息
    if (nodeTextureMap) {
      console.log('[WebGL树渲染器] 收到纹理映射，数量:', Object.keys(nodeTextureMap).length);
      
      // 确保纹理存储对象存在
      this.textures = this.textures || {};
      
      // 合并纹理映射
      Object.assign(this.textures, nodeTextureMap);
    }

    try {
      // 创建渲染管线选项
      const pipelineOptions = {
        program: this.program,
        buffers: this.buffers,
        textures: this.textures || {}
      };
      
      // 创建渲染状态
      const renderState = new RenderState({
        nodes: nodes || [],
        connectors: connectors || [],
        visibleArea: visibleArea,
        transform: {
          offsetX: this.transformUniforms.offsetX,
          offsetY: this.transformUniforms.offsetY,
          scale: this.transformUniforms.scale
        },
        currentMemberId: currentMemberId,
        layeredRendering: layeredRendering,
        nodeTextureMap: this.textures
      });
      
      // 使用渲染管线工厂创建适合的渲染管线
      const renderPipeline = RenderPipelineFactory.createMainPipeline(
        this.gl, 
        pipelineOptions
      );
      
      // 执行渲染管线
      const finalState = renderPipeline.execute(renderState);
      
      // 处理渲染结果和错误
      if (finalState.errors.length > 0) {
        console.warn(`[WebGL渲染] 渲染过程中出现${finalState.errors.length}个错误`);
        finalState.errors.forEach((error, index) => {
          if (index < 3) { // 只显示前3个错误
            console.error(`[WebGL渲染] 错误 #${index+1} (${error.stage}): ${error.message}`);
          }
        });
      }
      
      // 如果使用的是离屏Canvas，需要将结果复制到主Canvas
      if (this._isUsingOffscreenCanvas && this._offscreenCanvas) {
        try {
          // 完成渲染后将离屏Canvas内容绘制到主Canvas上
          const ctx = this.canvas.getContext('2d');
          if (ctx) {
            console.log('[WebGL渲染] 从离屏Canvas复制到主Canvas');
            ctx.drawImage(this._offscreenCanvas, 0, 0);
          } else {
            console.warn('[WebGL渲染] 无法获取2D上下文复制离屏内容');
          }
        } catch (err) {
          console.error('[WebGL渲染] 从离屏Canvas复制到主Canvas失败:', err.message);
          return false;
        }
      }
      
      return finalState.errors.length === 0;
    } catch (error) {
      console.error('[WebGL渲染] 渲染过程中发生未捕获异常:', error.message);
      console.error('[WebGL渲染] 错误堆栈:', error.stack);
      return false;
    }
  }

  /**
   * 为节点创建或获取纹理
   * @param {Object} node - 节点对象
   * @returns {WebGLTexture} 纹理对象
   * @private
   */
  _getNodeTexture(node) {
    // 如果没有节点ID，无法缓存纹理，返回null
    if (!node || !node.id) {
      console.warn('[WebGL] 无效的节点，无法获取纹理');
      return null;
    }
    
    // 如果已经为此节点创建了纹理，则直接返回
    if (this.textures[node.id]) {
      return this.textures[node.id];
    }
    
    // 创建新纹理
    const gl = this.gl;
    if (!gl) {
      console.error('[WebGL] GL上下文不可用，无法创建纹理');
      return null;
    }
    
    try {
      const texture = gl.createTexture();
      if (!texture) {
        console.error('[WebGL] 创建纹理失败');
        return null;
      }
      
      gl.bindTexture(gl.TEXTURE_2D, texture);
      
      // 填充纹理为默认颜色
      const defaultColor = this._getDefaultColorForNode(node);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, defaultColor
      );
      
      // 设置纹理参数
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      
      // 缓存纹理
      this.textures[node.id] = texture;
      
      // 尝试加载头像
      const avatarUrl = node.avatarUrl || (node.member ? node.member.avatar : null);
      if (avatarUrl) {
        this._loadTextureForNode(avatarUrl, node.id, node.gender);
      }
      
      return texture;
    } catch (error) {
      console.error('[WebGL] 创建节点纹理失败:', error.message);
      return null;
    }
  }

  /**
   * 根据节点属性获取默认颜色
   * @param {Object} node - 节点对象
   * @returns {Uint8Array} 颜色数组 
   * @private
   */
  _getDefaultColorForNode(node) {
    // 根据性别设置不同的默认颜色
    const gender = node.gender || (node.member ? node.member.gender : 'unknown');
    
    if (gender === 'male') {
      // 男性：蓝色系
      return new Uint8Array([200, 230, 255, 255]); // 淡蓝色
    } else if (gender === 'female') {
      // 女性：粉色系
      return new Uint8Array([255, 220, 230, 255]); // 淡粉色
    } else {
      // 未知或其他：灰色系
      return new Uint8Array([230, 230, 230, 255]); // 淡灰色
    }
  }

  /**
   * 加载节点头像纹理
   * @param {String} url - 头像URL
   * @param {String} nodeId - 节点ID
   * @param {String} gender - 性别
   * @private
   */
  _loadTextureForNode(url, nodeId, gender) {
    // 检查参数有效性
    if (!url || !nodeId || !this.gl) {
      console.warn('[WebGL] 头像加载参数无效');
      return;
    }
    
    // 检查纹理是否存在
    const texture = this.textures[nodeId];
    if (!texture) {
      console.warn('[WebGL] 节点纹理不存在，无法加载头像');
      return;
    }
    
    // 处理URL
    let imageUrl = url;
    
    // 添加基础路径，如果URL是相对路径
    if (url.startsWith('/')) {
      // 在微信小程序环境中，相对路径需要转换
      imageUrl = url.substring(1); // 移除开头的斜杠
    }
    
    console.log(`[WebGL] 开始加载节点 ${nodeId} 的头像: ${imageUrl}`);
    
    // 使用微信小程序的图片加载API
    wx.getImageInfo({
      src: imageUrl,
      success: (res) => {
        console.log(`[WebGL] 成功获取图片信息: ${res.width}x${res.height}`);
        
        try {
          // 创建离屏Canvas用于图像处理
          const offscreenCanvas = wx.createOffscreenCanvas({
            type: '2d',
            width: 128,
            height: 128
          });
          
          const ctx = offscreenCanvas.getContext('2d');
          if (!ctx) {
            console.error(`[WebGL] 为节点 ${nodeId} 获取离屏Canvas上下文失败`);
            return;
          }
          
          // 创建并加载图片
          const img = offscreenCanvas.createImage();
          
          img.onload = () => {
            try {
              // 清除Canvas
              ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
              
              // 绘制圆形头像
              ctx.save();
              ctx.beginPath();
              const radius = Math.min(offscreenCanvas.width, offscreenCanvas.height) / 2;
              ctx.arc(
                offscreenCanvas.width / 2, 
                offscreenCanvas.height / 2, 
                radius, 
                0, 
                Math.PI * 2
              );
              ctx.closePath();
              ctx.clip();
              
              // 计算如何填充圆形区域
              const scale = Math.max(
                offscreenCanvas.width / img.width,
                offscreenCanvas.height / img.height
              );
              
              const scaledWidth = img.width * scale;
              const scaledHeight = img.height * scale;
              
              const x = (offscreenCanvas.width - scaledWidth) / 2;
              const y = (offscreenCanvas.height - scaledHeight) / 2;
              
              // 绘制图像
              ctx.drawImage(
                img, 
                x, y, 
                scaledWidth, scaledHeight
              );
              
              // 添加性别相关的颜色边框
              ctx.restore();
              ctx.beginPath();
              ctx.lineWidth = 4;
              
              // 性别相关颜色
              if (gender === 'male') {
                ctx.strokeStyle = 'rgba(0, 122, 255, 0.8)'; // 男性蓝色
              } else if (gender === 'female') {
                ctx.strokeStyle = 'rgba(255, 45, 85, 0.8)'; // 女性粉色
              } else {
                ctx.strokeStyle = 'rgba(142, 142, 147, 0.8)'; // 未知灰色
              }
              
              ctx.arc(
                offscreenCanvas.width / 2, 
                offscreenCanvas.height / 2, 
                radius - ctx.lineWidth / 2, 
                0, 
                Math.PI * 2
              );
              ctx.stroke();
              
              // 将Canvas内容转换为WebGL纹理
              try {
                // 绑定纹理
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                
                // 将Canvas内容作为纹理
                this.gl.texImage2D(
                  this.gl.TEXTURE_2D, 
                  0, 
                  this.gl.RGBA, 
                  this.gl.RGBA, 
                  this.gl.UNSIGNED_BYTE, 
                  offscreenCanvas
                );
                
                // 设置纹理参数
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
                
                console.log(`[WebGL] 成功更新节点 ${nodeId} 的纹理`);
              } catch (texError) {
                console.error(`[WebGL] 纹理更新失败:`, texError);
                this._setDefaultNodeTexture(texture, gender);
              }
            } catch (drawError) {
              console.error(`[WebGL] 绘制头像失败:`, drawError);
              this._setDefaultNodeTexture(texture, gender);
            }
          };
          
          img.onerror = (e) => {
            console.error(`[WebGL] 加载头像图片失败:`, e);
            this._setDefaultNodeTexture(texture, gender);
          };
          
          // 设置图片源，使用微信获取到的本地路径
          img.src = res.path;
        } catch (canvasError) {
          console.error(`[WebGL] 处理Canvas错误:`, canvasError);
          this._setDefaultNodeTexture(texture, gender);
        }
      },
      fail: (error) => {
        console.error(`[WebGL] 获取图片信息失败:`, error);
        this._setDefaultNodeTexture(texture, gender);
      }
    });
  }

  /**
   * 设置默认节点纹理
   * @param {WebGLTexture} texture - 纹理对象
   * @param {String} gender - 性别
   * @private
   */
  _setDefaultNodeTexture(texture, gender) {
    if (!this.gl || !texture) return;
    
    try {
      // 绑定纹理
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      
      // 根据性别设置颜色
      let defaultColor;
      if (gender === 'male') {
        defaultColor = new Uint8Array([200, 230, 255, 255]); // 淡蓝色
      } else if (gender === 'female') {
        defaultColor = new Uint8Array([255, 220, 230, 255]); // 淡粉色
      } else {
        defaultColor = new Uint8Array([230, 230, 230, 255]); // 淡灰色
      }
      
      // 填充默认颜色
      this.gl.texImage2D(
        this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0,
        this.gl.RGBA, this.gl.UNSIGNED_BYTE, defaultColor
      );
      
      // 设置纹理参数
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    } catch (error) {
      console.error('[WebGL] 设置默认纹理失败:', error);
    }
  }

  /**
   * 创建默认纹理
   * @returns {WebGLTexture} 默认纹理
   * @private
   */
  _createDefaultTexture() {
    const gl = this.gl;
    
    // 如果已经创建了默认纹理，直接返回
    if (this.textures['default']) {
      return this.textures['default'];
    }
    
    // 创建新纹理
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // 创建一个64x64的默认纹理
    const size = 64;
    const data = new Uint8Array(size * size * 4);
    
    // 填充为简单的渐变色
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 4;
        data[idx] = 180 + i * 0.5; // R
        data[idx + 1] = 200 + j * 0.5; // G
        data[idx + 2] = 220; // B
        data[idx + 3] = 255; // A
      }
    }
    
    // 设置纹理数据
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, data
    );
    
    // 设置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // 缓存默认纹理
    this.textures['default'] = texture;
    
    return texture;
  }

  /**
   * 清除画布
   */
  clear() {
    if (!this.gl) return;

    this.gl.clearColor(0.95, 0.95, 0.95, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  /**
   * 销毁渲染器资源
   */
  dispose() {
    if (!this.gl) return;

    // 删除着色器
    if (this.shaders.vertex) {
      this.gl.deleteShader(this.shaders.vertex);
    }

    if (this.shaders.fragment) {
      this.gl.deleteShader(this.shaders.fragment);
    }

    // 删除程序
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }

    // 删除缓冲区
    if (this.buffers.position) {
      this.gl.deleteBuffer(this.buffers.position);
    }

    if (this.buffers.textureCoord) {
      this.gl.deleteBuffer(this.buffers.textureCoord);
    }

    if (this.buffers.indices) {
      this.gl.deleteBuffer(this.buffers.indices);
    }

    // 删除纹理
    Object.values(this.textures).forEach(texture => {
      if (texture) {
        this.gl.deleteTexture(texture);
      }
    });

    // 清空引用
    this.gl = null;
    this.program = null;
    this.buffers = {};
    this.textures = {};
    this.shaders = {
      vertex: null,
      fragment: null
    };
  }
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

    // 初始化树渲染器
    this.treeRenderer = null;
    this._initTreeRenderer();
  }

  /**
   * 初始化树渲染器
   * @private
   */
  _initTreeRenderer() {
    // 检查canvas有效性
    if (!this.canvas) {
      console.error('[WebGL诊断] 无效的Canvas对象，WebGL渲染器初始化失败');
      return false;
    }

    // 记录Canvas属性
    console.log(`[WebGL诊断] Canvas尺寸: ${this.canvas.width}x${this.canvas.height}`);
    console.log(`[WebGL诊断] Canvas类型: ${this.canvas.constructor.name}`);

    try {
      // 创建WebGL树渲染器
      this.treeRenderer = new WebGLTreeRenderer(this.canvas);

      // 尝试初始化
      const initSuccess = this.treeRenderer.init();

      if (initSuccess) {
        // 初始化成功
        if (this.component) {
          // 如果有组件引用，更新组件状态
          this.component.setData({
            'webgl.renderer': this.treeRenderer,
            'webgl.initialized': true
          });
        }
        console.log('[WebGL诊断] WebGL树渲染器初始化成功');
        return true;
      } else {
        // 初始化失败，尝试其他修复措施
        console.warn('[WebGL诊断] WebGL树渲染器初始化失败，尝试修复');

        // 尝试修复1：确保Canvas已经完全准备好
        if (this.canvas && (!this.canvas.width || !this.canvas.height)) {
          console.log('[WebGL诊断] Canvas尺寸无效，设置默认尺寸');
          this.canvas.width = this.canvas.width || 300;
          this.canvas.height = this.canvas.height || 300;

          // 重新尝试初始化
          console.log('[WebGL诊断] 重新尝试初始化WebGL渲染器');
          this.treeRenderer = new WebGLTreeRenderer(this.canvas);
          if (this.treeRenderer.init()) {
            console.log('[WebGL诊断] 修复后WebGL初始化成功');
            if (this.component) {
              this.component.setData({
                'webgl.renderer': this.treeRenderer,
                'webgl.initialized': true
              });
            }
            return true;
          }
        }

        // 尝试修复2：确认Canvas API一致性
        if (this.canvas && typeof this.canvas.getContext !== 'function') {
          console.error('[WebGL诊断] Canvas对象没有getContext方法，可能不是有效的Canvas节点');
          return false;
        }

        // 如果所有修复尝试都失败了
        console.error('[WebGL诊断] WebGL初始化修复尝试失败，请检查硬件兼容性');
        return false;
      }
    } catch (error) {
      console.error('[WebGL诊断] 创建WebGL树渲染器失败:', error.message);
      console.error('[WebGL诊断] 错误堆栈:', error.stack);
      return false;
    }
  }

  /**
   * 检查是否可用
   * @returns {Boolean} 是否可用
   */
  canUse() {
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
  }

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
  render(options) {
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

    try {
      // 设置变换参数
      if (this.component) {
        // 从组件获取变换参数
        this.treeRenderer.setTransform(
          this.component.data.offsetX,
          this.component.data.offsetY,
          this.component.data.currentScale
        );
      } else if (offsetX !== undefined && offsetY !== undefined && scale !== undefined) {
        // 使用传入的变换参数
        this.treeRenderer.setTransform(offsetX, offsetY, scale);
      }

      // 设置当前层级（如果启用分层渲染）
      if (layeredRendering && layeredRendering.enabled) {
        this.treeRenderer.setCurrentLayer(layeredRendering.currentLayer);
      }

      // 记录渲染参数
      console.log('[WebGL渲染器] 渲染参数:', {
        节点数量: nodes?.length || 0,
        连接线数量: connectors?.length || 0,
        纹理数量: nodeTextureMap ? Object.keys(nodeTextureMap).length : 0,
        当前成员ID: currentMemberId || '未指定'
      });

      // 使用渲染管线执行渲染
      const renderResult = this.treeRenderer.render({
        nodes,
        connectors,
        visibleArea,
        layeredRendering,
        currentMemberId,
        nodeTextureMap
      });

      return renderResult;
    } catch (error) {
      console.error('[WebGL渲染器] 渲染过程中发生错误:', error.message);
      console.error('[WebGL渲染器] 错误堆栈:', error.stack);
      return false;
    }
  }

  /**
   * 清除画布
   */
  clear() {
    if (this.treeRenderer) {
      this.treeRenderer.clear();
    }
  }

  /**
   * 更新视口尺寸
   * @param {Number} width - 宽度
   * @param {Number} height - 高度
   */
  updateViewport(width, height) {
    if (this.treeRenderer) {
      this.treeRenderer.updateViewport(width, height);
    }
  }

  /**
   * 设置变换参数
   * @param {Number} offsetX - X偏移
   * @param {Number} offsetY - Y偏移
   * @param {Number} scale - 缩放值
   */
  setTransform(offsetX, offsetY, scale) {
    if (this.treeRenderer) {
      this.treeRenderer.setTransform(offsetX, offsetY, scale);
    } else {
      console.warn('[WebGL渲染器] 无法设置变换参数：树渲染器未初始化');
    }
  }

  /**
   * 销毁渲染器资源
   */
  dispose() {
    if (this.treeRenderer) {
      this.treeRenderer.dispose();
      this.treeRenderer = null;
    }
  }
}

module.exports = WebGLRenderer;