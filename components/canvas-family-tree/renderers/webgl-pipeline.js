/**
 * 族谱树WebGL渲染管线
 * 将复杂的渲染逻辑拆分为管道式结构
 */

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
  execute(renderState) {
    // 处理当前阶段
    const updatedState = this.process(renderState);
    
    // 如果有下一阶段，继续执行
    if (this.next) {
      return this.next.execute(updatedState);
    }
    
    return updatedState;
  }
}

/**
 * 初始化阶段 - 准备渲染环境
 */
class InitStage extends BaseRenderStage {
  process(state) {
    try {
      const gl = this.gl;
      
      // 清除画布
      gl.clearColor(0.95, 0.95, 0.95, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      // 启用混合模式，支持透明度
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      // 禁用深度测试，使用画家算法进行渲染排序
      gl.disable(gl.DEPTH_TEST);
      
      // 设置视口尺寸
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      state.recordStageResult('init', {
        canvasSize: `${gl.canvas.width}x${gl.canvas.height}`,
        success: true
      });
      
      return state;
    } catch (error) {
      state.addError('init', error);
      console.error('[渲染管线:初始化] 错误:', error.message);
      return state;
    }
  }
}

/**
 * 可见性过滤阶段 - 筛选可见节点和连接线
 */
class VisibilityFilterStage extends BaseRenderStage {
  process(state) {
    try {
      if (!state.visibleArea) {
        state.recordStageResult('visibilityFilter', {
          message: '未提供可视区域，跳过过滤',
          success: false
        });
        return state;
      }
      
      // 过滤可见节点
      state.visibleNodes = this._filterVisibleNodes(state.nodes, state.visibleArea);
      
      // 过滤可见连接线
      state.visibleConnectors = this._filterVisibleConnectors(state.connectors, state.visibleArea);
      
      state.recordStageResult('visibilityFilter', {
        visibleNodes: state.visibleNodes.length,
        visibleConnectors: state.visibleConnectors.length,
        success: true
      });
      
      return state;
    } catch (error) {
      state.addError('visibilityFilter', error);
      console.error('[渲染管线:可见性过滤] 错误:', error.message);
      return state;
    }
  }
  
  /**
   * 过滤可见节点
   * @private
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
  constructor(context, program, buffers) {
    super(context);
    this.program = program;
    this.buffers = buffers;
  }
  
  process(state) {
    try {
      const connectors = state.visibleConnectors;
      if (!connectors || connectors.length === 0) {
        state.recordStageResult('connectorRender', {
          message: '没有可见连接线，跳过渲染',
          success: true
        });
        return state;
      }
      
      const gl = this.gl;
      
      // 使用着色器程序
      gl.useProgram(this.program);
      
      // 获取着色器中的属性位置
      const vertexPosition = gl.getAttribLocation(this.program, 'aVertexPosition');
      
      // 获取着色器中的统一变量位置
      const projectionMatrix = gl.getUniformLocation(this.program, 'uProjectionMatrix');
      const modelViewMatrix = gl.getUniformLocation(this.program, 'uModelViewMatrix');
      const uAlpha = gl.getUniformLocation(this.program, 'uAlpha');
      
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
      gl.uniform1f(uAlpha, state.alpha * 0.8); // 线条稍微透明一些
      
      // 创建模型视图矩阵 - 只应用全局变换
      const modelMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1  // 单位矩阵
      ]);
      
      // 设置模型视图矩阵
      gl.uniformMatrix4fv(modelViewMatrix, false, modelMatrix);
      
      // 设置线宽 - 注意：WebGL中线宽限制为1.0
      gl.lineWidth(1.0);
      
      // 渲染所有连接线
      let validCount = 0;
      
      for (let i = 0; i < connectors.length; i++) {
        const connector = connectors[i];
        
        // 验证连接线坐标
        const fromX = parseFloat(connector.fromX);
        const fromY = parseFloat(connector.fromY);
        const toX = parseFloat(connector.toX);
        const toY = parseFloat(connector.toY);
        
        if (isNaN(fromX) || isNaN(fromY) || isNaN(toX) || isNaN(toY)) continue;
        
        // 应用全局变换到连接线坐标
        const transformedFromX = (fromX + state.transform.offsetX) * state.transform.scale;
        const transformedFromY = (fromY + state.transform.offsetY) * state.transform.scale;
        const transformedToX = (toX + state.transform.offsetX) * state.transform.scale;
        const transformedToY = (toY + state.transform.offsetY) * state.transform.scale;
        
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
        
        validCount++;
      }
      
      state.recordStageResult('connectorRender', {
        renderedCount: validCount,
        success: true
      });
      
      return state;
    } catch (error) {
      state.addError('connectorRender', error);
      console.error('[渲染管线:连接线渲染] 错误:', error.message);
      return state;
    }
  }
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
  
  process(state) {
    try {
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
      
      // 生成默认纹理
      const defaultTexture = this._getDefaultTexture();
      
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
      
      // 渲染节点
      for (const node of nodes) {
        const nodeData = {
          id: node.id,
          memberId: node.memberId || (node.member ? node.member.id : node.id),
          x: parseFloat(node.x || 0),
          y: parseFloat(node.y || 0),
          width: parseFloat(node.width || 120),
          height: parseFloat(node.height || 150)
        };
        
        if (isNaN(nodeData.x) || isNaN(nodeData.y) || 
            isNaN(nodeData.width) || isNaN(nodeData.height)) {
          continue;
        }
        
        // 获取节点中心位置（应用全局偏移和缩放）
        const px = (nodeData.x + state.transform.offsetX) * state.transform.scale;
        const py = (nodeData.y + state.transform.offsetY) * state.transform.scale;
        
        // 应用全局缩放到节点大小
        const scaleWidth = nodeData.width * state.transform.scale;
        const scaleHeight = nodeData.height * state.transform.scale;
        
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
        const isHighlighted = nodeData.memberId === state.currentMemberId;
        const nodeAlpha = isHighlighted ? Math.min(1.0, state.alpha * 1.2) : state.alpha;
        
        // 设置透明度
        gl.uniform1f(uAlpha, nodeAlpha);
        
        // 绑定纹理
        let texture = null;
        // 先检查节点纹理映射
        if (state.nodeTextureMap && state.nodeTextureMap[nodeData.id]) {
          texture = state.nodeTextureMap[nodeData.id];
        } 
        // 再检查预加载纹理
        else if (this.textures && this.textures[nodeData.id]) {
          texture = this.textures[nodeData.id];
        }
        
        // 如果没有找到纹理，使用默认纹理
        if (!texture) {
          texture = defaultTexture;
        }
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // 绘制节点矩形（6个顶点 = 2个三角形）
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      }
      
      state.recordStageResult('nodeRender', {
        renderedCount: nodes.length,
        success: true
      });
      
      return state;
    } catch (error) {
      state.addError('nodeRender', error);
      console.error('[渲染管线:节点渲染] 错误:', error.message);
      return state;
    }
  }
  
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
  
  process(state) {
    try {
      // 根据layeredRendering决定使用哪个管线
      if (state.layeredRendering && state.layeredRendering.enabled) {
        state.recordStageResult('layerControl', {
          mode: 'layered',
          layerCount: state.layeredRendering.layerCount,
          currentLayer: state.layeredRendering.currentLayer,
          success: true
        });
        
        // 使用分层渲染管线
        return this.layeredPipeline.execute(state);
      } else {
        state.recordStageResult('layerControl', {
          mode: 'standard',
          success: true
        });
        
        // 使用标准渲染管线
        return this.standardPipeline.execute(state);
      }
    } catch (error) {
      state.addError('layerControl', error);
      console.error('[渲染管线:分层控制] 错误:', error.message);
      return state;
    }
  }
}

/**
 * 分层渲染阶段 - 处理分层数据
 */
class LayeredRenderStage extends BaseRenderStage {
  constructor(context, program, buffers, textures) {
    super(context);
    this.program = program;
    this.buffers = buffers;
    this.textures = textures;
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
      const connectorRenderer = new ConnectorRenderStage(this.gl, this.program, this.buffers);
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
  static createStandardPipeline(gl, options) {
    const initStage = new InitStage(gl);
    const visibilityStage = new VisibilityFilterStage(gl);
    const connectorStage = new ConnectorRenderStage(gl, options.program, options.buffers);
    const nodeStage = new NodeRenderStage(gl, options.program, options.buffers, options.textures);
    
    // 链接管线阶段
    initStage
      .setNext(visibilityStage)
      .setNext(connectorStage)
      .setNext(nodeStage);
    
    return initStage;
  }
  
  /**
   * 创建分层渲染管线
   * @param {WebGLRenderingContext} gl - WebGL上下文
   * @param {Object} options - 配置选项 
   * @returns {BaseRenderStage} 渲染管线入口阶段
   */
  static createLayeredPipeline(gl, options) {
    const initStage = new InitStage(gl);
    const layeredStage = new LayeredRenderStage(gl, options.program, options.buffers, options.textures);
    
    // 链接管线阶段
    initStage.setNext(layeredStage);
    
    return initStage;
  }
  
  /**
   * 创建完整渲染管线
   * @param {WebGLRenderingContext} gl - WebGL上下文
   * @param {Object} options - 配置选项
   * @returns {BaseRenderStage} 渲染管线入口阶段
   */
  static createMainPipeline(gl, options) {
    const standardPipeline = this.createStandardPipeline(gl, options);
    const layeredPipeline = this.createLayeredPipeline(gl, options);
    
    return new LayerControlStage(gl, standardPipeline, layeredPipeline);
  }
}

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
  RenderPipelineFactory
}; 