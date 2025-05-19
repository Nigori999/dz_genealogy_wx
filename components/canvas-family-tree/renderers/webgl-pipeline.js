/**
 * 族谱树WebGL渲染管线
 * 将复杂的渲染逻辑拆分为管道式结构
 */

// 导入坐标系统工具类
const { coordinateSystem, CoordinateSystem } = require('../services/coordinate-system');
// 导入错误处理工具
const ErrorHandler = require('../../../utils/error-handler');

/**
 * 渲染状态类 - 在管线各阶段之间传递
 */
class RenderState {
  constructor(options = {}) {
    this.nodes = options.nodes || [];
    this.connectors = options.connectors || [];
    this.visibleArea = options.visibleArea || null;
    this.transform = options.transform || { offsetX: 0, offsetY: 0, scale: 1.0 };
    this.currentMemberId = options.currentMemberId || null;
    this.alpha = options.alpha || 1.0;
    this.layeredRendering = options.layeredRendering || { enabled: false };
    this.nodeTextureMap = options.nodeTextureMap || {};
    this.visibleNodes = [];
    this.visibleConnectors = [];
    this.errors = [];
    this.stats = {
      startTime: Date.now(),
      nodeCount: 0,
      connectorCount: 0,
      stageResults: {}
    };
    
    // 初始化坐标系统
    this.coordSystem = new CoordinateSystem({
      canvasWidth: options.canvasWidth || 300,
      canvasHeight: options.canvasHeight || 400,
      scale: this.transform.scale,
      offsetX: this.transform.offsetX,
      offsetY: this.transform.offsetY,
      isYAxisDown: true // 微信小程序WebGL中Y轴向下为正
    });
  }

  /**
   * 记录阶段结果
   * @param {String} stageName - 阶段名称
   * @param {Object} result - 阶段结果
   */
  recordStageResult(stageName, result) {
    this.stats.stageResults[stageName] = {
      ...result,
      timeStamp: Date.now() - this.stats.startTime
    };
  }

  /**
   * 添加错误信息
   * @param {String} stageName - 阶段名称
   * @param {Error} error - 错误对象
   */
  addError(stageName, error) {
    this.errors.push({
      stage: stageName,
      message: error.message,
      stack: error.stack,
      timeStamp: Date.now() - this.stats.startTime
    });
  }
}

/**
 * 渲染管线基类
 * 定义渲染阶段接口和通用功能
 */
class BaseRenderStage {
  constructor(context) {
    this.gl = context;
    this.next = null;
  }

  /**
   * 设置下一个渲染阶段
   * @param {BaseRenderStage} nextStage - 下一个渲染阶段
   * @returns {BaseRenderStage} 链式调用返回下一阶段
   */
  setNext(nextStage) {
    this.next = nextStage;
    return nextStage;
  }

  /**
   * 执行渲染阶段并传递到下一阶段
   * @param {Object} renderState - 渲染状态对象
   * @returns {Object} 更新后的渲染状态
   */
  process(renderState) {
    // 子类必须实现此方法
    throw new Error('子类必须实现process方法');
  }

  /**
   * 执行整个管线
   * @param {Object} renderState - 渲染状态对象
   * @returns {Object} 最终渲染状态
   */
  execute = ErrorHandler.wrap(function(renderState) {
    // 处理当前阶段
    const updatedState = this.process(renderState);
    
    // 如果有下一阶段，继续执行
    if (this.next) {
      return this.next.execute(updatedState);
    }
    
    return updatedState;
  }, {
    operation: '执行渲染管线',
    onError(error) {
      console.error('[渲染管线] 执行错误:', error.message);
      return renderState;
    }
  });
}

/**
 * 初始化阶段 - 准备渲染环境
 */
class InitStage extends BaseRenderStage {
  process = ErrorHandler.wrap(function(state) {
    const gl = this.gl;
    
    // 清除画布
    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // 启用混合模式，支持透明度
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // 禁用深度测试，使用画家算法进行渲染排序
    gl.disable(gl.DEPTH_TEST);
    
    // 获取Canvas的实际尺寸
    const canvasWidth = gl.canvas.width;
    const canvasHeight = gl.canvas.height;
    
    // 设置视口尺寸 - 确保视口尺寸与Canvas物理尺寸一致
    gl.viewport(0, 0, canvasWidth, canvasHeight);
    
    // 验证视口设置结果
    const viewport = gl.getParameter(gl.VIEWPORT);
    const viewportCorrect = viewport[2] === canvasWidth && viewport[3] === canvasHeight;
    
    // 记录详细信息
    console.log('[渲染管线] 初始化阶段:', {
      Canvas尺寸: `${canvasWidth}x${canvasHeight}`,
      视口尺寸: `${viewport[2]}x${viewport[3]}`,
      尺寸一致: viewportCorrect ? '是' : '否'
    });
    
    // 如果视口尺寸不匹配，尝试强制更新
    if (!viewportCorrect) {
      console.warn('[渲染管线] 视口尺寸与Canvas尺寸不匹配，尝试强制更新');
      gl.viewport(0, 0, canvasWidth, canvasHeight);
    }
    
    state.recordStageResult('init', {
      canvasSize: `${canvasWidth}x${canvasHeight}`,
      viewport: `${viewport[2]}x${viewport[3]}`,
      success: true
    });
    
    return state;
  }, {
    operation: '渲染管线初始化',
    onError(error) {
      state.addError('init', error);
      console.error('[渲染管线:初始化] 错误:', error.message);
      return state;
    }
  });
}

/**
 * 可见性过滤阶段 - 筛选可见节点和连接线
 */
class VisibilityFilterStage extends BaseRenderStage {
  process = ErrorHandler.wrap(function(state) {
    if (!state.visibleArea) {
      state.recordStageResult('visibilityFilter', {
        message: '未提供可视区域，跳过过滤',
        success: false
      });
      return state;
    }
    
    // 过滤可见节点 - 使用坐标系统工具类
    state.visibleNodes = state.coordSystem.filterVisibleNodes(state.nodes, state.visibleArea);
    
    // 过滤可见连接线 - 使用坐标系统工具类
    state.visibleConnectors = state.coordSystem.filterVisibleConnectors(state.connectors, state.visibleArea);
    
    state.recordStageResult('visibilityFilter', {
      visibleNodes: state.visibleNodes.length,
      visibleConnectors: state.visibleConnectors.length,
      success: true
    });
    
    return state;
  }, {
    operation: '可见性过滤',
    onError(error) {
      state.addError('visibilityFilter', error);
      console.error('[渲染管线:可见性过滤] 错误:', error.message);
      return state;
    }
  });
  
  /**
   * 过滤可见节点
   * @private
   * @deprecated 使用coordSystem.filterVisibleNodes代替
   */
  _filterVisibleNodes(nodes, visibleArea) {
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
   * @private
   * @deprecated 使用coordSystem.filterVisibleConnectors代替
   */
  _filterVisibleConnectors(connectors, visibleArea) {
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
}

/**
 * 连接线渲染阶段 - 负责渲染连接线
 */
class ConnectorRenderStage extends BaseRenderStage {
  constructor(context, program, buffers, lineProgram = null) {
    super(context);
    this.program = program;
    this.lineProgram = lineProgram; // 使用专用的连接线程序
    this.buffers = buffers;
  }
  
  process = ErrorHandler.wrap(function(state) {
    const connectors = state.visibleConnectors;
    if (!connectors || connectors.length === 0) {
      state.recordStageResult('connectorRender', {
        message: '没有可见连接线，跳过渲染',
        count: 0,
        success: true
      });
      return state;
    }
    
    const gl = this.gl;
    
    // 优先使用专用的连接线程序
    const programToUse = this.lineProgram || this.program;
    
    // 使用连接线着色器程序
    gl.useProgram(programToUse);
    
    // 获取着色器中的位置属性和颜色统一变量
    let matrixLocation, colorLocation, positionAttributeLocation;
    
    if (this.lineProgram) {
      // 使用连接线程序的属性名称
      matrixLocation = gl.getUniformLocation(programToUse, "u_matrix");
      colorLocation = gl.getUniformLocation(programToUse, "u_color");
      positionAttributeLocation = gl.getAttribLocation(programToUse, "aVertexPosition");
    } else {
      // 回退到主程序
      matrixLocation = gl.getUniformLocation(programToUse, "uProjectionMatrix");
      colorLocation = gl.getUniformLocation(programToUse, "uAlpha"); // 不完全匹配，但可用于测试
      positionAttributeLocation = gl.getAttribLocation(programToUse, "aVertexPosition");
    }
    
    // 记录属性位置，便于调试
    console.log('[WebGL连接线渲染] 着色器属性位置:', {
      matrixLocation: matrixLocation !== null ? '有效' : '无效',
      colorLocation: colorLocation !== null ? '有效' : '无效',
      positionAttributeLocation: positionAttributeLocation,
      使用连接线程序: !!this.lineProgram
    });
    
    // 设置画布尺寸
    const canvasWidth = gl.canvas.width;
    const canvasHeight = gl.canvas.height;
    
    // 更新坐标系统的画布尺寸
    state.coordSystem.updateCanvasSize(canvasWidth, canvasHeight);
    state.coordSystem.updateTransform(
      state.transform.scale,
      state.transform.offsetX,
      state.transform.offsetY
    );
    
    // 创建正射投影矩阵
    const projectionMatrix = state.coordSystem.createOrthographicMatrix();
    
    // 设置投影矩阵
    gl.uniformMatrix4fv(matrixLocation, false, projectionMatrix);
    
    // 获取画布视口尺寸
    const viewport = gl.getParameter(gl.VIEWPORT);
    
    // 添加渲染前的调试信息
    console.log('[WebGL连接线渲染] 关键参数:', {
      视口: viewport ? `${viewport[2]}x${viewport[3]}` : '未知',
      缩放: state.transform.scale.toFixed(2),
      偏移: `X=${state.transform.offsetX.toFixed(0)}, Y=${state.transform.offsetY.toFixed(0)}`,
      连接线数量: connectors.length
    });
    
    // 记录连接线坐标范围，方便调试
    const connectorXValues = [];
    const connectorYValues = [];
    connectors.forEach(conn => {
      connectorXValues.push(conn.fromX, conn.toX);
      connectorYValues.push(conn.fromY, conn.toY);
    });
    
    const connMinX = Math.min(...connectorXValues);
    const connMaxX = Math.max(...connectorXValues);
    const connMinY = Math.min(...connectorYValues);
    const connMaxY = Math.max(...connectorYValues);
    
    console.log('[连接线坐标检查]', {
      X范围: `${connMinX.toFixed(1)}~${connMaxX.toFixed(1)}`, 
      Y范围: `${connMinY.toFixed(1)}~${connMaxY.toFixed(1)}`,
      连接线数量: connectors.length
    });
    
    // 渲染所有连接线
    for (let i = 0; i < connectors.length; i++) {
      const connector = connectors[i];
      const {
        fromX, fromY, toX, toY, highlighted, type
      } = connector;
      
      // 使用坐标系统工具类进行世界坐标到屏幕坐标的转换
      const fromScreen = state.coordSystem.worldToScreen(fromX, fromY);
      const toScreen = state.coordSystem.worldToScreen(toX, toY);
      
      const screenFromX = fromScreen.x;
      const screenFromY = fromScreen.y;
      const screenToX = toScreen.x;
      const screenToY = toScreen.y;
      
      // 验证坐标有效性
      if (isNaN(screenFromX) || isNaN(screenFromY) || 
          isNaN(screenToX) || isNaN(screenToY)) {
        console.error(`[坐标转换错误] 连接线 #${i} 坐标无效:`, {
          原始: {from: {x: fromX, y: fromY}, to: {x: toX, y: toY}},
          变换: {scale: state.transform.scale, offsetX: state.transform.offsetX, offsetY: state.transform.offsetY}
        });
        continue;
      }
      
      // 记录连接线坐标变换，便于调试
      if (i === 0 || Math.random() < 0.05) {
        console.log(`[连接线坐标变换] #${i}:`, {
          原始: {
            从: {x: fromX.toFixed(1), y: fromY.toFixed(1)},
            到: {x: toX.toFixed(1), y: toY.toFixed(1)}
          },
          屏幕: {
            从: {x: screenFromX.toFixed(1), y: screenFromY.toFixed(1)},
            到: {x: screenToX.toFixed(1), y: screenToY.toFixed(1)}
          },
          类型: type || '标准'
        });
      }
      
      // 设置连接线颜色 - 根据类型和是否高亮调整
      let lineColor = [0.7, 0.7, 0.7, 0.8]; // 默认灰色，半透明
      
      if (highlighted) {
        lineColor = [0.2, 0.6, 1.0, 0.9]; // 高亮为亮蓝色
      } else if (type === 'spouse') {
        lineColor = [0.8, 0.2, 0.8, 0.8]; // 配偶关系为紫色
      } else if (type === 'parent-child') {
        lineColor = [0.3, 0.3, 0.8, 0.8]; // 父子关系为蓝色
      }
      
      // 设置线条颜色
      gl.uniform4fv(colorLocation, lineColor);
      
      // 使用新的坐标系统工具类的归一化方法将屏幕坐标转为WebGL坐标
      const fromWebGL = state.coordSystem.normalizeToWebGLCoords(screenFromX, screenFromY);
      const toWebGL = state.coordSystem.normalizeToWebGLCoords(screenToX, screenToY);
      
      // 准备顶点数据（两点）- 使用WebGL归一化坐标
      const vertices = new Float32Array([
        fromWebGL.x, fromWebGL.y,
        toWebGL.x, toWebGL.y
      ]);
      
      // 绑定和填充顶点缓冲区
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
      // 启用顶点属性 - 修复：使用正确的属性名"aVertexPosition"
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
      
      // 绘制线段
      gl.drawArrays(gl.LINES, 0, 2);
    }
    
    state.recordStageResult('connectorRender', {
      count: connectors.length,
      success: true
    });
    
    return state;
  }, {
    operation: '连接线渲染',
    onError(error) {
      state.addError('connectorRender', error);
      console.error('[渲染管线:连接线渲染] 错误:', error.message);
      return state;
    }
  });
}

/**
 * 节点渲染阶段 - 负责渲染节点
 */
class NodeRenderStage extends BaseRenderStage {
  constructor(context, program, buffers, textures) {
    super(context);
    this.program = program;
    this.buffers = buffers;
    this.textures = textures;
  }
  
  process = ErrorHandler.wrap(function(state) {
    const nodes = state.visibleNodes;
    if (!nodes || nodes.length === 0) {
      state.recordStageResult('nodeRender', {
        message: '没有可见节点，跳过渲染',
        success: true
      });
      return state;
    }
    
    const gl = this.gl;
    
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
    
    // 获取Canvas尺寸
    const canvasWidth = gl.canvas.width;
    const canvasHeight = gl.canvas.height;
    
    // 更新坐标系统
    state.coordSystem.updateCanvasSize(canvasWidth, canvasHeight);
    state.coordSystem.updateTransform(
      state.transform.scale,
      state.transform.offsetX,
      state.transform.offsetY
    );
    
    // 创建投影矩阵
    const projMatrix = state.coordSystem.createOrthographicMatrix();
    
    // 设置投影矩阵
    gl.uniformMatrix4fv(projectionMatrix, false, projMatrix);
    
    // 获取当前视口设置
    const viewport = gl.getParameter(gl.VIEWPORT);
    
    // 记录渲染信息
    console.log('[WebGL节点渲染] 准备渲染节点:', {
      节点数量: nodes.length,
      画布尺寸: `${canvasWidth}x${canvasHeight}`,
      视口尺寸: viewport ? `${viewport[2]}x${viewport[3]}` : '未知',
      变换: {
        缩放: state.transform.scale.toFixed(3),
        偏移X: state.transform.offsetX.toFixed(1),
        偏移Y: state.transform.offsetY.toFixed(1)
      }
    });
    
    // 设置缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.textureCoord);
    gl.vertexAttribPointer(textureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(textureCoord);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    
    // 设置纹理
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uSampler, 0);
    
    // 生成默认纹理
    const defaultTexture = this._getDefaultTexture();
    
    // 渲染节点
    let renderedCount = 0;
    
    // 检查渲染范围
    const nodeXValues = nodes.map(node => node.x);
    const nodeYValues = nodes.map(node => node.y);
    const minX = Math.min(...nodeXValues);
    const maxX = Math.max(...nodeXValues);
    const minY = Math.min(...nodeYValues);
    const maxY = Math.max(...nodeYValues);
    
    console.log('[节点范围检查]', {
      X范围: `${minX.toFixed(1)} ~ ${maxX.toFixed(1)}`,
      Y范围: `${minY.toFixed(1)} ~ ${maxY.toFixed(1)}`
    });
    
    for (const node of nodes) {
      // 提取节点数据
      const x = node.x;
      const y = node.y;
      const width = node.width || 120;
      const height = node.height || 150;
      
      // 使用坐标系统进行坐标转换 - 世界坐标到屏幕坐标
      const screenPos = state.coordSystem.worldToScreen(x, y);
      const screenX = screenPos.x;
      const screenY = screenPos.y;
      const screenWidth = width * state.transform.scale;
      const screenHeight = height * state.transform.scale;
      
      // 记录部分节点的坐标转换过程，帮助调试
      if (node.isRoot || Math.random() < 0.02) {
        console.log(`[节点渲染] ${node.name || node.id}:`, {
          世界坐标: {
            x, 
            y, 
            width, 
            height
          },
          屏幕坐标: {
            x: screenX.toFixed(1), 
            y: screenY.toFixed(1),
            width: screenWidth.toFixed(1),
            height: screenHeight.toFixed(1)
          }
        });
      }
      
      // 使用坐标系统工具类创建变换矩阵
      // 特别注意：对于节点渲染，我们需要使用适当的坐标转换方法
      // 1. 获取节点左上角的WebGL归一化坐标
      const nodeTopLeft = state.coordSystem.normalizeToWebGLCoords(screenX, screenY);
      
      // 添加详细调试信息
      if (node.isRoot || Math.random() < 0.02) {
        console.log(`[WebGL坐标转换] ${node.name || node.id}:`, {
          屏幕坐标: {x: screenX.toFixed(1), y: screenY.toFixed(1)},
          WebGL坐标: {x: nodeTopLeft.x.toFixed(4), y: nodeTopLeft.y.toFixed(4)},
          Y轴朝下: state.coordSystem.isYAxisDown
        });
      }
      
      // 2. 计算节点宽高相对于画布的比例
      const normWidth = screenWidth / canvasWidth * 2; // WebGL坐标范围是-1到1，所以宽度是2
      const normHeight = screenHeight / canvasHeight * 2;
      
      // 3. 创建适合WebGL的变换矩阵
      const nodeMatrix = new Float32Array([
        normWidth, 0, 0, 0,
        0, normHeight, 0, 0,
        0, 0, 1, 0,
        nodeTopLeft.x, nodeTopLeft.y, 0, 1
      ]);
      
      // 设置模型视图矩阵
      gl.uniformMatrix4fv(modelViewMatrix, false, nodeMatrix);
      
      // 设置节点透明度
      const isHighlighted = node.id === state.currentMemberId;
      const alpha = isHighlighted ? 1.0 : 0.9;
      gl.uniform1f(uAlpha, alpha);
      
      // 获取节点纹理
      let texture = this.textures[node.id] || defaultTexture;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      
      // 绘制节点 (6个顶点 = 2个三角形)
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      
      renderedCount++;
    }
    
    console.log(`[节点渲染] 完成，渲染了 ${renderedCount} 个节点`);
    
    state.recordStageResult('nodeRender', {
      renderedCount,
      success: true
    });
    
    return state;
  }, {
    operation: '节点渲染',
    onError(error) {
      state.addError('nodeRender', error);
      console.error('[渲染管线:节点渲染] 错误:', error.message);
      return state;
    }
  });
  
  /**
   * 获取默认纹理
   * @private
   */
  _getDefaultTexture() {
    if (this.textures && this.textures['default']) {
      return this.textures['default'];
    }
    
    const gl = this.gl;
    
    // 创建新纹理
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // 创建一个默认纹理
    const data = new Uint8Array([220, 220, 220, 255]);
    
    // 设置纹理数据
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, data
    );
    
    // 设置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // 缓存默认纹理
    if (this.textures) {
      this.textures['default'] = texture;
    }
    
    return texture;
  }
}

/**
 * 分层渲染控制阶段 - 决定使用哪种渲染策略
 */
class LayerControlStage extends BaseRenderStage {
  constructor(context, standardPipeline, layeredPipeline) {
    super(context);
    this.standardPipeline = standardPipeline;
    this.layeredPipeline = layeredPipeline;
  }
  
  process = ErrorHandler.wrap(function(state) {
    if (state.layeredRendering && state.layeredRendering.enabled) {
      return this.layeredPipeline.execute(state);
    }
    return this.standardPipeline.execute(state);
  }, {
    operation: '层控制',
    onError(error) {
      state.addError('layerControl', error);
      console.error('[渲染管线:层控制] 错误:', error.message);
      return state;
    }
  });
}

/**
 * 分层渲染阶段 - 处理分层数据
 */
class LayeredRenderStage extends BaseRenderStage {
  /**
   * 构造函数
   * @param {WebGLRenderingContext} context - WebGL上下文
   * @param {WebGLProgram} program - 主着色器程序
   * @param {Object} buffers - 缓冲区对象
   * @param {Object} textures - 纹理对象
   * @param {WebGLProgram} [lineProgram] - 可选的连接线着色器程序
   */
  constructor(context, program, buffers, textures, lineProgram = null) {
    super(context);
    this.program = program;
    this.buffers = buffers;
    this.textures = textures;
    this.lineProgram = lineProgram;
  }
  
  process(state) {
    try {
      const { layeredRendering } = state;
      if (!layeredRendering || !layeredRendering.enabled) {
        state.recordStageResult('layeredRender', {
          message: '分层渲染未启用',
          success: false
        });
        return state;
      }
      
      const {
        layerCount,
        layerNodes,
        layerConnectors,
        currentLayer
      } = layeredRendering;
      
      if (layerCount === 0) {
        state.recordStageResult('layeredRender', {
          message: '没有层数据',
          success: false
        });
        return state;
      }
      
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
      
      // 创建节点渲染器和连接线渲染器
      const connectorRenderer = new ConnectorRenderStage(this.gl, this.program, this.buffers, this.lineProgram);
      const nodeRenderer = new NodeRenderStage(this.gl, this.program, this.buffers, this.textures);
      
      // 按顺序渲染各层
      for (const item of renderOrder) {
        const layer = item.layer;
        const isCurrentLayer = layer === currentLayer;
        
        // 跳过没有内容的层
        if (!layerNodes[layer] || !layerConnectors[layer]) continue;
        
        // 设置透明度 - 根据距离计算
        const alpha = isCurrentLayer ? 1.0 : Math.max(0.3, 1 - (item.distance * 0.15));
        
        // 创建层渲染状态
        const layerState = new RenderState({
          nodes: layerNodes[layer] || [],
          connectors: layerConnectors[layer] || [],
          visibleArea: state.visibleArea,
          transform: state.transform,
          currentMemberId: state.currentMemberId,
          alpha: alpha,
          nodeTextureMap: state.nodeTextureMap
        });
        
        // 过滤可见元素
        const visibilityFilter = new VisibilityFilterStage(this.gl);
        const filteredState = visibilityFilter.process(layerState);
        
        // 渲染连接线
        connectorRenderer.process(filteredState);
        
        // 渲染节点
        nodeRenderer.process(filteredState);
      }
      
      state.recordStageResult('layeredRender', {
        renderedLayers: renderOrder.length,
        currentLayer: currentLayer,
        success: true
      });
      
      return state;
    } catch (error) {
      state.addError('layeredRender', error);
      console.error('[渲染管线:分层渲染] 错误:', error.message);
      return state;
    }
  }
}

/**
 * 渲染管线工厂 - 创建完整渲染管线
 */
class RenderPipelineFactory {
  /**
   * 创建标准渲染管线
   * @param {WebGLRenderingContext} gl - WebGL上下文
   * @param {Object} options - 配置选项
   * @returns {BaseRenderStage} 渲染管线入口阶段
   */
  static createStandardPipeline = ErrorHandler.wrap(function(gl, options) {
    // 检查程序和缓冲区是否可用
    if (!gl || !options.program || !options.buffers) {
      console.error('[渲染管线] 创建标准渲染管线失败：缺少必要参数');
      return null;
    }
    
    // 确保程序已链接成功
    if (!gl.getProgramParameter(options.program, gl.LINK_STATUS)) {
      console.error('[渲染管线] 着色器程序未正确链接，可能导致属性查询失败');
    }
    
    // 记录可用的属性，便于调试
    const attributes = [];
    const numAttribs = gl.getProgramParameter(options.program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttribs; i++) {
      const info = gl.getActiveAttrib(options.program, i);
      if (info) {
        attributes.push({
          name: info.name,
          type: info.type,
          size: info.size,
          location: gl.getAttribLocation(options.program, info.name)
        });
      }
    }
    console.log('[渲染管线] 着色器程序可用属性:', attributes);
    
    const initStage = new InitStage(gl);
    const visibilityStage = new VisibilityFilterStage(gl);
    const connectorStage = new ConnectorRenderStage(gl, options.program, options.buffers, options.lineProgram);
    const nodeStage = new NodeRenderStage(gl, options.program, options.buffers, options.textures);
    
    // 链接管线阶段
    initStage
      .setNext(visibilityStage)
      .setNext(connectorStage)
      .setNext(nodeStage);
    
    return initStage;
  }, {
    operation: '创建标准渲染管线',
    onError(error) {
      console.error('[渲染管线工厂] 创建标准渲染管线失败:', error.message);
      return null;
    }
  });
  
  /**
   * 创建分层渲染管线
   * @param {WebGLRenderingContext} gl - WebGL上下文
   * @param {Object} options - 配置选项 
   * @returns {BaseRenderStage} 渲染管线入口阶段
   */
  static createLayeredPipeline = ErrorHandler.wrap(function(gl, options) {
    const initStage = new InitStage(gl);
    const layeredStage = new LayeredRenderStage(gl, options.program, options.buffers, options.textures, options.lineProgram);
    
    // 链接管线阶段
    initStage.setNext(layeredStage);
    
    return initStage;
  }, {
    operation: '创建分层渲染管线',
    onError(error) {
      console.error('[渲染管线工厂] 创建分层渲染管线失败:', error.message);
      return null;
    }
  });
  
  /**
   * 创建完整渲染管线
   * @param {WebGLRenderingContext} gl - WebGL上下文
   * @param {Object} options - 配置选项
   * @returns {BaseRenderStage} 渲染管线入口阶段
   */
  static createMainPipeline = ErrorHandler.wrap(function(gl, options) {
    const standardPipeline = this.createStandardPipeline(gl, options);
    const layeredPipeline = this.createLayeredPipeline(gl, options);
    
    return new LayerControlStage(gl, standardPipeline, layeredPipeline);
  }, {
    operation: '创建主渲染管线',
    onError(error) {
      console.error('[渲染管线工厂] 创建主渲染管线失败:', error.message);
      return null;
    }
  });
}

/**
 * 辅助函数 - 创建正射投影矩阵
 * 将世界坐标系映射到WebGL的标准化设备坐标系(-1到1)
 * @param {Number} width - Canvas宽度
 * @param {Number} height - Canvas高度
 * @returns {Float32Array} 投影矩阵
 */
const createOrthographicMatrix = ErrorHandler.wrap(function(width, height) {
  // 创建标准正交投影矩阵
  return new Float32Array([
    2 / width, 0, 0, 0,
    0, -2 / height, 0, 0,
    0, 0, 1, 0,
    -1, 1, 0, 1  // 将原点转换到左上角
  ]);
}, {
  operation: '创建正射投影矩阵',
  onError(error) {
    console.error('[渲染管线] 创建正射投影矩阵失败:', error.message);
    return null;
  }
});

/**
 * 创建变换矩阵
 * @param {Number} x - X坐标
 * @param {Number} y - Y坐标
 * @param {Number} width - 宽度
 * @param {Number} height - 高度
 * @returns {Float32Array} 变换矩阵
 */
const createTransformMatrix = ErrorHandler.wrap(function(x, y, width, height) {
  // 创建变换矩阵
  return new Float32Array([
    width, 0, 0, 0,
    0, height, 0, 0,
    0, 0, 1, 0,
    x, y, 0, 1
  ]);
}, {
  operation: '创建变换矩阵',
  onError(error) {
    console.error('[渲染管线] 创建变换矩阵失败:', error.message);
    return null;
  }
});

// 导出所有类
module.exports = {
  RenderState,
  BaseRenderStage,
  InitStage,
  VisibilityFilterStage,
  ConnectorRenderStage,
  NodeRenderStage,
  LayerControlStage,
  LayeredRenderStage,
  RenderPipelineFactory,
  createOrthographicMatrix,
  createTransformMatrix
}; 