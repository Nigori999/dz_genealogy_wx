/**
 * WebGL渲染模块
 * 包含WebGL渲染器和WebGL树渲染器的实现
 */

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

    // 清除画布
    this.clear();

    // 设置着色器程序
    this.gl.useProgram(this.program);
    
    // 启用混合模式，支持透明度
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    
    // 禁用深度测试，使用画家算法进行渲染排序
    this.gl.disable(this.gl.DEPTH_TEST);
    
    // 设置视口尺寸
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // 分层渲染或标准渲染
    if (layeredRendering && layeredRendering.enabled) {
      this._renderLayers(params);
    } else {
      this._renderStandard(params);
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
    
    return true;
  }

  /**
   * 标准渲染（非分层）
   * @param {Object} params - 渲染参数
   * @private
   */
  _renderStandard(params) {
    const {
      nodes,
      connectors,
      visibleArea,
      currentMemberId
    } = params;

    if (!nodes || !connectors || !visibleArea) {
      console.error('[WebGL标准渲染] 渲染参数不完整:', {
        有节点数据: !!nodes,
        有连接线数据: !!connectors,
        有可视区域: !!visibleArea
      });
      return;
    }

    // 详细记录渲染参数
    console.log('[WebGL标准渲染] 渲染参数详情:', {
      节点数量: nodes.length,
      连接线数量: connectors.length,
      变换参数: {
        offsetX: this.transformUniforms.offsetX,
        offsetY: this.transformUniforms.offsetY,
        scale: this.transformUniforms.scale
      },
      可视区域: {
        left: visibleArea.left.toFixed(2),
        top: visibleArea.top.toFixed(2),
        right: visibleArea.right.toFixed(2),
        bottom: visibleArea.bottom.toFixed(2),
        buffer: visibleArea.buffer
      }
    });

    // 检查节点数据结构
    if (nodes.length > 0) {
      const sampleNode = nodes[0];
      console.log('[WebGL标准渲染] 节点数据样例:', {
        id: sampleNode.id,
        memberId: sampleNode.memberId,
        x: sampleNode.x,
        y: sampleNode.y,
        width: sampleNode.width,
        height: sampleNode.height,
        avatarUrl: sampleNode.avatarUrl ? '有头像' : '无头像'
      });
    }

    // 检查连接线数据结构
    if (connectors.length > 0) {
      const sampleConnector = connectors[0];
      console.log('[WebGL标准渲染] 连接线数据样例:', {
        type: sampleConnector.type,
        fromId: sampleConnector.fromId,
        toId: sampleConnector.toId,
        fromX: sampleConnector.fromX,
        fromY: sampleConnector.fromY,
        toX: sampleConnector.toX,
        toY: sampleConnector.toY
      });
    }

    // 过滤可见节点和连接线
    const visibleNodes = this._filterVisibleNodes(nodes, visibleArea);
    const visibleConnectors = this._filterVisibleConnectors(connectors, visibleArea);

    console.log('[WebGL标准渲染] 过滤后:', visibleNodes.length, '个可见节点,', visibleConnectors.length, '条可见连接线');

    // 先渲染连接线
    this._renderConnectors(visibleConnectors);
    
    // 再渲染节点
    this._renderNodes(visibleNodes, currentMemberId);
  }

  /**
   * 分层渲染
   * @param {Object} params - 渲染参数
   * @private
   */
  _renderLayers(params) {
    const {
      visibleArea,
      layeredRendering,
      currentMemberId
    } = params;
    const {
      layerCount,
      layerNodes,
      layerConnectors,
      currentLayer
    } = layeredRendering;

    if (layerCount === 0) return;

    console.log('WebGL分层渲染:', layerCount, '层, 当前层:', currentLayer);

    // 构建层级渲染顺序 - 按距离排序
    const renderOrder = [];
    for (let i = 0; i < layerCount; i++) {
      const distance = Math.abs(i - currentLayer);
      renderOrder.push({
        layer: i,
        distance: distance,
        isCurrent: i === currentLayer
      });
    }
    
    // 按距离排序，远的层先渲染
    renderOrder.sort((a, b) => {
      if (!a.isCurrent && !b.isCurrent) {
        return b.distance - a.distance;
      }
      // 当前层最后渲染（置于最上层）
      return a.isCurrent ? 1 : -1;
    });
    
    // 按顺序渲染各层
    for (const item of renderOrder) {
      const layer = item.layer;
      const isCurrentLayer = layer === currentLayer;
      
      // 跳过没有内容的层
      if (!layerNodes[layer] || !layerConnectors[layer]) continue;
      
      // 设置透明度 - 根据距离计算
      const alpha = isCurrentLayer ? 1.0 : Math.max(0.3, 1 - (item.distance * 0.15));
      
      // 渲染当前层的内容
      const nodes = this._filterVisibleNodes(layerNodes[layer] || [], visibleArea);
      const connectors = this._filterVisibleConnectors(layerConnectors[layer] || [], visibleArea);
      
      // 先渲染连接线
      this._renderConnectors(connectors, alpha);
      
      // 再渲染节点
      this._renderNodes(nodes, currentMemberId, alpha);
    }
  }

  /**
   * 过滤可见节点
   * @param {Array} nodes - 节点数组
   * @param {Object} visibleArea - 可视区域
   * @returns {Array} 可见节点数组
   * @private
   */
  _filterVisibleNodes(nodes, visibleArea) {
    if (!visibleArea) return [];
    
    return nodes.filter(node => {
      // 基本边界框检查
      const right = node.x + (node.width || 120);
      const bottom = node.y + (node.height || 150);
      
      return (
        right >= visibleArea.left - visibleArea.buffer &&
        node.x <= visibleArea.right + visibleArea.buffer &&
        bottom >= visibleArea.top - visibleArea.buffer &&
        node.y <= visibleArea.bottom + visibleArea.buffer
      );
    });
  }

  /**
   * 过滤可见连接线
   * @param {Array} connectors - 连接线数组
   * @param {Object} visibleArea - 可视区域
   * @returns {Array} 可见连接线数组
   * @private
   */
  _filterVisibleConnectors(connectors, visibleArea) {
    if (!visibleArea) return [];
    
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
   * 渲染节点
   * @param {Array} nodes - 节点数组
   * @param {String} currentMemberId - 当前成员ID
   * @param {Number} alpha - 透明度
   * @private
   */
  _renderNodes(nodes, currentMemberId, alpha = 1.0) {
    if (!nodes || nodes.length === 0 || !this.gl || !this.program) {
      console.warn('[WebGL节点渲染] 无法渲染节点:', {
        节点数量: nodes ? nodes.length : 0,
        GL上下文: !!this.gl,
        着色器程序: !!this.program
      });
      return;
    }
    
    // 记录渲染状态
    console.log('[WebGL节点渲染] 开始渲染节点:', {
      节点数量: nodes.length,
      Canvas尺寸: `${this.gl.canvas.width}x${this.gl.canvas.height}`,
      变换状态: {
        offsetX: this.transformUniforms.offsetX.toFixed(2),
        offsetY: this.transformUniforms.offsetY.toFixed(2),
        scale: this.transformUniforms.scale.toFixed(2)
      }
    });
    
    const gl = this.gl;
    
    try {
      // 使用着色器程序
      gl.useProgram(this.program);
      
      // 获取着色器中的属性位置
      const vertexPosition = gl.getAttribLocation(this.program, 'aVertexPosition');
      const textureCoord = gl.getAttribLocation(this.program, 'aTextureCoord');
      
      // 获取着色器中的统一变量位置
      const projectionMatrix = gl.getUniformLocation(this.program, 'uProjectionMatrix');
      const modelViewMatrix = gl.getUniformLocation(this.program, 'uModelViewMatrix');
      const uSampler = gl.getUniformLocation(this.program, 'uSampler');
      const uAlpha = gl.getUniformLocation(this.program, 'uAlpha');
      
      // 检查着色器变量
      if (vertexPosition === -1 || textureCoord === -1 || 
          !projectionMatrix || !modelViewMatrix || !uSampler || !uAlpha) {
        console.error('[WebGL节点渲染] 着色器变量获取失败:', {
          aVertexPosition: vertexPosition !== -1,
          aTextureCoord: textureCoord !== -1,
          uProjectionMatrix: !!projectionMatrix,
          uModelViewMatrix: !!modelViewMatrix,
          uSampler: !!uSampler,
          uAlpha: !!uAlpha
        });
      }
      
      // 创建正交投影矩阵
      // 使用像素坐标系统，原点在左上角
      const left = 0;
      const right = gl.canvas.width;
      const bottom = gl.canvas.height;
      const top = 0;
      const near = -1;
      const far = 1;
      
      // 记录投影参数
      console.log('[WebGL节点渲染] 投影参数:', {
        left, right, top, bottom, near, far
      });
      
      // 正交投影矩阵
      const projMatrix = new Float32Array([
        2/(right-left), 0, 0, 0,
        0, 2/(top-bottom), 0, 0,
        0, 0, 2/(near-far), 0,
        -(right+left)/(right-left), -(top+bottom)/(top-bottom), -(far+near)/(far-near), 1
      ]);
      
      // 设置投影矩阵
      gl.uniformMatrix4fv(projectionMatrix, false, projMatrix);
      
      // 生成默认纹理
      const defaultTexture = this._createDefaultTexture();
      
      // 检查缓冲区状态
      if (!this.buffers.position || !this.buffers.textureCoord || !this.buffers.indices) {
        console.error('[WebGL节点渲染] 缓冲区未正确初始化:', {
          position: !!this.buffers.position,
          textureCoord: !!this.buffers.textureCoord,
          indices: !!this.buffers.indices
        });
        return;
      }
      
      // 设置位置缓冲区
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
      gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexPosition);
      
      // 设置纹理坐标缓冲区
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.textureCoord);
      gl.vertexAttribPointer(textureCoord, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(textureCoord);
      
      // 设置索引缓冲区
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
      
      // 设置纹理活动单元
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(uSampler, 0);
      
      // 获取WebGL错误状态
      let glError = gl.getError();
      if (glError !== gl.NO_ERROR) {
        console.error('[WebGL节点渲染] 准备阶段WebGL错误:', glError);
      }
      
      // 遍历节点进行渲染
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        // 尝试从节点中获取成员数据
        let nodeData = {
          id: node.id,
          memberId: node.memberId || (node.member ? node.member.id : node.id),
          x: parseFloat(node.x || 0),
          y: parseFloat(node.y || 0),
          width: parseFloat(node.width || 120),
          height: parseFloat(node.height || 150)
        };
        
        // 检查坐标和尺寸是否是有效数字
        if (isNaN(nodeData.x) || isNaN(nodeData.y) || 
            isNaN(nodeData.width) || isNaN(nodeData.height)) {
          console.error(`[WebGL节点渲染] 节点[${i}]包含无效坐标或尺寸，跳过渲染`, node);
          continue;
        }
        
        // 获取节点中心位置（应用全局偏移和缩放）
        const px = (nodeData.x + this.transformUniforms.offsetX) * this.transformUniforms.scale;
        const py = (nodeData.y + this.transformUniforms.offsetY) * this.transformUniforms.scale;
        
        // 应用全局缩放到节点大小
        const scaleWidth = nodeData.width * this.transformUniforms.scale;
        const scaleHeight = nodeData.height * this.transformUniforms.scale;
        
        // 打印前几个节点的详细信息用于调试
        if (i < 2) {
          console.log(`[WebGL节点渲染] 节点[${i}] 渲染详情:`, {
            id: nodeData.id,
            memberId: nodeData.memberId,
            原始坐标: {x: nodeData.x, y: nodeData.y},
            变换后坐标: {x: px, y: py},
            原始尺寸: {width: nodeData.width, height: nodeData.height},
            变换后尺寸: {width: scaleWidth, height: scaleHeight}
          });
        }
        
        // 模型视图矩阵
        const modelMatrix = new Float32Array([
          scaleWidth, 0, 0, 0,
          0, scaleHeight, 0, 0,
          0, 0, 1, 0,
          px, py, 0, 1
        ]);
        
        // 设置模型视图矩阵
        gl.uniformMatrix4fv(modelViewMatrix, false, modelMatrix);
        
        // 检查节点是否需要高亮显示
        const isHighlighted = nodeData.memberId === currentMemberId;
        const nodeAlpha = isHighlighted ? Math.min(1.0, alpha * 1.2) : alpha;
        
        // 设置透明度
        gl.uniform1f(uAlpha, nodeAlpha);
        
                        // 绑定纹理 - 使用默认纹理或节点特定纹理        const avatarUrl = node.imageUrl || node.avatarUrl || (node.member ? node.member.avatar : null);                try {          let texture = null;                    // 首先检查是否存在预先加载的纹理映射          if (this.textures && this.textures[nodeData.id]) {            texture = this.textures[nodeData.id];            console.log(`[WebGL纹理] 节点[${nodeData.id}]使用缓存纹理`);          }           // 然后尝试加载新纹理          else if (avatarUrl && nodeData.id) {            texture = this._getNodeTexture(node);                        // 将新纹理保存到缓存中            if (texture && this.textures) {              this.textures[nodeData.id] = texture;            }          }                    // 如果有纹理使用它，否则使用默认纹理          if (texture) {            gl.bindTexture(gl.TEXTURE_2D, texture);          } else {            gl.bindTexture(gl.TEXTURE_2D, defaultTexture);          }        } catch (textureError) {          console.error(`[WebGL纹理] 节点[${nodeData.id}]纹理绑定错误:`, textureError.message);          gl.bindTexture(gl.TEXTURE_2D, defaultTexture);        }
        
        // 绘制节点矩形（6个顶点 = 2个三角形）
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        
        // 检查WebGL错误
        glError = gl.getError();
        if (glError !== gl.NO_ERROR && i < 2) {
          console.error(`[WebGL节点渲染] 节点[${i}]渲染错误:`, glError);
        }
      }
      
      console.log('[WebGL节点渲染] 节点渲染完成');
      
    } catch (error) {
      console.error('[WebGL节点渲染] 异常:', error.message, '\n堆栈:', error.stack);
    }
  }

  /**
   * 渲染连接线
   * @param {Array} connectors - 连接线数组
   * @param {Number} alpha - 透明度
   * @private
   */
  _renderConnectors(connectors, alpha = 1.0) {
    if (!connectors || connectors.length === 0 || !this.gl || !this.program) {
      console.warn('[WebGL连接线渲染] 无法渲染连接线:', {
        连接线数量: connectors ? connectors.length : 0,
        GL上下文: !!this.gl,
        着色器程序: !!this.program
      });
      return;
    }
    
    console.log('[WebGL连接线渲染] 开始渲染连接线:', {
      连接线数量: connectors.length,
      透明度: alpha
    });
    
    const gl = this.gl;
    
    try {
      // 使用着色器程序
      gl.useProgram(this.program);
      
      // 获取着色器中的属性位置
      const vertexPosition = gl.getAttribLocation(this.program, 'aVertexPosition');
      
      // 获取着色器中的统一变量位置
      const projectionMatrix = gl.getUniformLocation(this.program, 'uProjectionMatrix');
      const modelViewMatrix = gl.getUniformLocation(this.program, 'uModelViewMatrix');
      const uAlpha = gl.getUniformLocation(this.program, 'uAlpha');
      
      // 检查着色器变量
      if (vertexPosition === -1 || !projectionMatrix || !modelViewMatrix || !uAlpha) {
        console.error('[WebGL连接线渲染] 着色器变量获取失败:', {
          aVertexPosition: vertexPosition !== -1,
          uProjectionMatrix: !!projectionMatrix,
          uModelViewMatrix: !!modelViewMatrix,
          uAlpha: !!uAlpha
        });
        return;
      }
      
      // 创建正交投影矩阵
      const left = 0;
      const right = gl.canvas.width;
      const bottom = gl.canvas.height;
      const top = 0;
      const near = -1;
      const far = 1;
      
      const projMatrix = new Float32Array([
        2/(right-left), 0, 0, 0,
        0, 2/(top-bottom), 0, 0,
        0, 0, 2/(near-far), 0,
        -(right+left)/(right-left), -(top+bottom)/(top-bottom), -(far+near)/(far-near), 1
      ]);
      
      // 设置投影矩阵
      gl.uniformMatrix4fv(projectionMatrix, false, projMatrix);
      
      // 设置线条连接器的透明度
      gl.uniform1f(uAlpha, alpha * 0.8); // 线条稍微透明一些
      
      // 创建模型视图矩阵 - 只应用全局变换
      const modelMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1  // 单位矩阵
      ]);
      
      // 设置模型视图矩阵
      gl.uniformMatrix4fv(modelViewMatrix, false, modelMatrix);
      
      // 检查线条缓冲区
      if (!this.buffers.line) {
        console.error('[WebGL连接线渲染] 线条缓冲区未初始化');
        return;
      }
      
      // 设置线宽 - 注意：WebGL中线宽限制为1.0
      gl.lineWidth(1.0);
      
      // 获取WebGL错误状态
      let glError = gl.getError();
      if (glError !== gl.NO_ERROR) {
        console.error('[WebGL连接线渲染] 准备阶段WebGL错误:', glError);
      }
      
      // 跟踪有效和无效的连接线
      let validCount = 0;
      let invalidCount = 0;
      
      // 为每条连接线创建顶点数据
      for (let i = 0; i < connectors.length; i++) {
        const connector = connectors[i];
        
        // 验证连接线坐标
        const fromX = parseFloat(connector.fromX);
        const fromY = parseFloat(connector.fromY);
        const toX = parseFloat(connector.toX);
        const toY = parseFloat(connector.toY);
        
        // 检查坐标是否有效
        if (isNaN(fromX) || isNaN(fromY) || isNaN(toX) || isNaN(toY)) {
          invalidCount++;
          if (invalidCount < 5) {
            console.error(`[WebGL连接线渲染] 连接线[${i}]包含无效坐标，跳过渲染`, {
              fromX: connector.fromX,
              fromY: connector.fromY,
              toX: connector.toX,
              toY: connector.toY
            });
          }
          continue;
        }
        
        // 应用全局变换到连接线坐标
        const transformedFromX = (fromX + this.transformUniforms.offsetX) * this.transformUniforms.scale;
        const transformedFromY = (fromY + this.transformUniforms.offsetY) * this.transformUniforms.scale;
        const transformedToX = (toX + this.transformUniforms.offsetX) * this.transformUniforms.scale;
        const transformedToY = (toY + this.transformUniforms.offsetY) * this.transformUniforms.scale;
        
        // 打印前几条连接线的详细信息用于调试
        if (i < 2) {
          console.log(`[WebGL连接线渲染] 连接线[${i}] 渲染详情:`, {
            原始坐标: {
              fromX,
              fromY,
              toX,
              toY
            },
            变换后坐标: {
              fromX: transformedFromX,
              fromY: transformedFromY,
              toX: transformedToX,
              toY: transformedToY
            },
            类型: connector.type,
            fromId: connector.fromId,
            toId: connector.toId
          });
        }
        
        // 创建线条顶点数据
        const lineVertices = new Float32Array([
          transformedFromX, transformedFromY,
          transformedToX, transformedToY
        ]);
        
        // 使用预先创建的线条缓冲区
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.line);
        gl.bufferData(gl.ARRAY_BUFFER, lineVertices, gl.DYNAMIC_DRAW);
        
        // 设置顶点属性指针
        gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPosition);
        
        // 绘制线条
        gl.drawArrays(gl.LINES, 0, 2);
        
        // 计数有效连接线
        validCount++;
        
        // 检查WebGL错误
        glError = gl.getError();
        if (glError !== gl.NO_ERROR && i < 2) {
          console.error(`[WebGL连接线渲染] 连接线[${i}]渲染错误:`, glError);
        }
      }
      
      console.log('[WebGL连接线渲染] 连接线渲染完成:', {
        总计: connectors.length,
        有效: validCount,
        无效: invalidCount
      });
      
      // 重置线宽
      gl.lineWidth(1.0);
    } catch (error) {
      console.error('[WebGL连接线渲染] 异常:', error.message, '\n堆栈:', error.stack);
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

    if (!this.treeRenderer) return false;

    // 设置变换
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

    // 将纹理映射传递给树渲染器
    if (nodeTextureMap) {
      // 确保树渲染器有有效的textures对象
      this.treeRenderer.textures = this.treeRenderer.textures || {};
      
      // 合并传入的纹理映射
      Object.assign(this.treeRenderer.textures, nodeTextureMap);
    }

    // 执行渲染
    this.treeRenderer.render({
      nodes,
      connectors,
      visibleArea,
      layeredRendering,
      currentMemberId,
      nodeTextureMap
    });

    return true;
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