/**
 * 布局服务
 * 负责处理树布局计算相关的功能
 */


class LayoutService {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Object} options.wasmLoader - WebAssembly加载器
   */
  constructor(options = {}) {
    this.wasmLoader = options.wasmLoader;
    this.worker = null;
    this.useWorker = false; // 实际使用状态，将在初始化后更新
    // 更积极的WASM使用策略 - 默认启用，只有在明确不支持时才禁用
    this.useWasm = typeof WebAssembly === 'object';
    console.log('[布局服务] WebAssembly支持检测:', this.useWasm ? '支持' : '不支持');
    this.callbacks = new Map();
  }

  /**
   * 初始化Worker
   * @param {String} workerPath - Worker文件路径
   * @returns {Boolean} 是否成功初始化
   */
  initWorker(workerPath) {
    try {
      // 检查Worker支持
      if (typeof wx.createWorker !== 'function') {
        console.log('当前环境不支持Worker');
        return false;
      }
      
      // 先终止已存在的Worker（微信小程序限制只能创建一个Worker）
      if (this.worker) {
        try {
          this.worker.terminate();
          console.log('终止旧Worker实例');
        } catch (e) {
          console.warn('终止旧Worker实例失败:', e);
        }
        this.worker = null;
      }
      
      // 规范化Worker路径 - 确保不以斜杠开头
      if (workerPath.startsWith('/')) {
        workerPath = workerPath.substring(1);
      }
      
      console.log('初始化树布局Worker，路径:', workerPath);
      
      // 创建Worker实例
      try {
        // 尝试创建Worker前先检查小程序版本
        const deviceInfo = wx.getDeviceInfo();
        const appBaseInfo = wx.getAppBaseInfo();
        
        // 获取设备信息
        const screenWidth = deviceInfo.screenWidth;
        const screenHeight = deviceInfo.screenHeight;
        const pixelRatio = deviceInfo.pixelRatio || 1;
        
        // 基础库版本过低可能不支持某些功能
        if (this._compareVersion(appBaseInfo.SDKVersion || '', '2.13.0') < 0) {
          console.warn('当前基础库版本低于2.13.0，可能不支持WebAssembly');
        }
        
        // 尝试创建Worker
        this.worker = wx.createWorker(workerPath);
        console.log('Worker实例创建成功');
      } catch (createError) {
        console.error('创建Worker实例失败:', createError);
        
        // 检查是否是模块加载错误
        if (createError && createError.message) {
          if (createError.message.includes('not support')) {
            console.warn('当前环境不支持Worker或WebAssembly，降级到主线程计算');
          } else if (createError.message.includes('module') && 
              (createError.message.includes('not defined') || 
               createError.message.includes('not found'))) {
            console.warn('Worker创建失败，可能是模块未找到，确保workers目录结构正确');
          }
        }
        
        this.useWorker = false;
        return false;
      }
      
      // 注册消息处理
      this.worker.onMessage(this._handleWorkerMessage.bind(this));
      
      // 注册错误处理
      this.worker.onError((error) => {
        console.error('树布局Worker错误:', error);
        // 详细记录错误信息，帮助排查问题
        if (error) {
          console.error('Worker错误详情:',
            'message:', error.message || 'unknown',
            'stack:', error.stack || 'unknown',
            'lineNumber:', error.lineNumber || 'unknown',
            'fileName:', error.fileName || 'unknown'
          );
          
          // 特殊处理"not support"错误
          if (error.message && error.message.includes('not support')) {
            console.warn('检测到Worker "not support"错误，这通常与WebAssembly支持有关');
            // 设置降级标志
            this.useWasm = false;
          }
        }
        
        // 出错时降级到主线程计算
        this.useWorker = false;
      });
      
      // Worker被系统回收时的处理
      if (typeof this.worker.onProcessKilled === 'function') {
        this.worker.onProcessKilled(() => {
          console.warn('Worker被系统回收');
          this.useWorker = false;
          this.worker = null;
        });
      }
      
      // 标记Worker可用
      this.useWorker = true;
      
      // 发送初始化消息到Worker
      try {
        // 首先发送一个测试消息确认Worker存活
        this.worker.postMessage({
          type: 'testAlive'
        });
        
        // 延迟一点时间再发送初始化消息，确保Worker已完全加载
        setTimeout(() => {
          this.worker.postMessage({
            type: 'init'
          });
          console.log('已发送初始化消息到Worker');
          
          // 再延迟一点时间请求调试信息
          setTimeout(() => {
            console.log('请求Worker调试信息');
            this.worker.postMessage({
              type: 'debugInfo'
            });
          }, 1000);
        }, 500);
      } catch (initError) {
        console.error('发送Worker初始化消息失败:', initError);
        this.useWorker = false;
        return false;
      }
      
      console.log('树布局Worker初始化成功');
      return true;
    } catch (error) {
      console.error('初始化Worker失败:', error);
      this.useWorker = false;
      return false;
    }
  }

  /**
   * 比较版本号
   * @param {String} v1 - 版本号1
   * @param {String} v2 - 版本号2
   * @returns {Number} 1:v1>v2, 0:v1=v2, -1:v1<v2
   * @private
   */
  _compareVersion(v1, v2) {
    const v1Parts = v1.split('.');
    const v2Parts = v2.split('.');
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = parseInt(v1Parts[i] || '0', 10);
      const v2Part = parseInt(v2Parts[i] || '0', 10);
      
      if (v1Part > v2Part) {
        return 1;
      } else if (v1Part < v2Part) {
        return -1;
      }
    }
    
    return 0;
  }

  /**
   * 处理Worker消息
   * @param {Object} result - Worker返回的结果
   * @private
   */
  _handleWorkerMessage(result) {
    if (!result || !result.type) return;
    
    switch (result.type) {
      case 'treeLayout':
        // 处理树布局结果
        this._processLayoutResult('treeLayout', result);
        break;
      
      case 'visibilityCheck':
        // 处理可见性检查结果
        this._processLayoutResult('visibilityCheck', result);
        break;
        
      case 'statusReport':
        // 处理Worker状态报告
        console.log('Worker状态:', result.status);
        // 如果Worker报告错误，尝试设置降级模式
        if (result.status === 'error') {
          console.warn('Worker报告错误:', result.error);
        }
        break;
        
      case 'error':
        // 处理Worker错误
        console.error('Worker报告错误:', result.error);
        break;
        
      case 'aliveResponse':
        // Worker存活测试响应
        console.log('Worker存活测试成功');
        break;
        
      case 'debugInfo':
        // 处理调试信息
        console.log('收到Worker调试信息:', result.data);
        // 根据调试信息调整状态
        if (result.data && !result.data.wasmAvailable) {
          console.warn('Worker报告WebAssembly不可用，禁用WebAssembly功能');
          this.useWasm = false;
        }
        break;
        
      default:
        console.warn('未知的Worker消息类型:', result.type);
    }
  }

  /**
   * 处理布局结果
   * @param {String} type - 结果类型
   * @param {Object} result - 结果数据
   * @private
   */
  _processLayoutResult(type, result) {
    // 查找注册的回调
    const callback = this.callbacks.get(type);
    
    if (typeof callback === 'function') {
      // 调用回调
      callback(result);
      
      // 移除一次性回调
      this.callbacks.delete(type);
    }
  }

  /**
   * 注册结果回调
   * @param {String} type - 结果类型
   * @param {Function} callback - 回调函数
   */
  registerCallback(type, callback) {
    if (typeof callback === 'function') {
      this.callbacks.set(type, callback);
    }
  }

  /**
   * 计算树布局
   * @param {Object} options - 计算选项
   * @param {Array} options.nodes - 节点数据
   * @param {Number} options.levelHeight - 层高
   * @param {Number} options.siblingDistance - 兄弟节点间距
   * @param {Function} callback - 结果回调
   * @returns {Promise} 计算结果Promise
   */
  calculateTreeLayout(options, callback) {
    const { nodes, levelHeight = 150, siblingDistance = 100 } = options;
    
    if (!nodes || nodes.length === 0) {
      return Promise.reject(new Error('节点数据为空'));
    }
    
    // 如果提供了回调，注册它
    if (typeof callback === 'function') {
      this.registerCallback('treeLayout', callback);
    }
    
    // 根据优先级选择计算方法
    if (this.useWorker && this.worker) {
      return this._calculateWithWorker(options);
    } else if (this.useWasm && this.wasmLoader && this.wasmLoader.isInitialized()) {
      return this._calculateWithWasm(options);
    } else {
      return this._calculateWithJS(options);
    }
  }

  /**
   * 使用Worker计算布局
   * @param {Object} options - 计算选项
   * @returns {Promise} 计算结果Promise
   * @private
   */
  _calculateWithWorker(options) {
    return new Promise((resolve, reject) => {
      try {
        // 发送计算请求到Worker
        this.worker.postMessage({
          type: 'calculateTreeLayout',
          data: options
        });
        
        // 注册一次性回调 - 使用Promise返回结果
        this.registerCallback('treeLayout', (result) => {
          if (result.success && result.data) {
            resolve(result.data);
          } else {
            reject(new Error(result.error || 'Worker计算失败'));
          }
        });
      } catch (error) {
        console.error('发送Worker请求失败:', error);
        
        // 降级
        this._calculateWithJS(options)
          .then(resolve)
          .catch(reject);
      }
    });
  }

  /**
   * 使用WebAssembly计算布局
   * @param {Object} options - 计算选项
   * @returns {Promise} 计算结果Promise
   * @private
   */
  _calculateWithWasm(options) {
    const { nodes, levelHeight, siblingDistance } = options;
    
    return new Promise((resolve, reject) => {
      try {
        console.log('使用WebAssembly计算树布局');
        
        // 获取WebAssembly实例
        const { treeLayoutCalculator } = this.wasmLoader.getInstances();
        
        if (!treeLayoutCalculator) {
          throw new Error('WebAssembly树布局计算器未初始化');
        }
        
        // 准备节点数据
        const processedResult = this._prepareAndProcessWasmData(nodes, levelHeight, siblingDistance, treeLayoutCalculator);
        
        // 返回结果
        resolve(processedResult);
      } catch (error) {
        console.error('WebAssembly布局计算失败:', error);
        
        // 降级到JavaScript实现
        this._calculateWithJS(options)
          .then(resolve)
          .catch(reject);
      }
    });
  }

  
  /**
   * 计算族谱树布局
   * @param {Array} inputNodes - 输入节点数组
   * @param {Number|Object} options - 层级高度或配置对象
   * @param {Number} siblingDistance - 兄弟节点间距
   * @returns {Object} 布局结果
   */
  calculateLayout(inputNodes, options, siblingDistance) {
    // 处理参数
    let levelHeight = 150;
    let siblingDist = 100;
    
    if (typeof options === 'number') {
      levelHeight = options;
      siblingDist = siblingDistance || 100;
    } else if (typeof options === 'object' && options !== null) {
      levelHeight = options.levelHeight || 150;
      siblingDist = options.siblingDistance || 100;
    }
    
    // 布局结果对象
    const result = {
      nodes: [],
      connectors: [],
      totalWidth: 0,
      totalHeight: 0
    };
    
    // 如果没有节点，返回空结果
    if (!inputNodes || inputNodes.length === 0) return result;
    
    // 创建节点的深拷贝
    const nodes = JSON.parse(JSON.stringify(inputNodes));
    
    // 1. 构建节点索引和子节点映射
    const nodeIndex = {};
    const childrenMap = {};
    
    for (const node of nodes) {
      nodeIndex[node.id] = node;
      
      if (node.parentId) {
        if (!childrenMap[node.parentId]) {
          childrenMap[node.parentId] = [];
        }
        childrenMap[node.parentId].push(node.id);
      }
    }
    
    // 2. 查找根节点
    const rootNodeIds = nodes.filter(node => !node.parentId).map(node => node.id);
    
    // 3. 执行布局计算
    let currentX = 0;
    let maxY = 0;
    
    // 逐个处理根节点
    for (const rootId of rootNodeIds) {
      const layoutInfo = this._layoutSubtree(rootId, 0, currentX, levelHeight, siblingDist, nodeIndex, childrenMap);
      currentX = layoutInfo.currentX;
      maxY = Math.max(maxY, layoutInfo.maxY);
    }
    
    // 4. 将计算结果转换回节点数组
    result.nodes = Object.values(nodeIndex);
    
    // 5. 生成连接线
    result.connectors = this._generateConnectors(nodeIndex);
    
    // 设置布局总尺寸
    result.totalWidth = currentX;
    result.totalHeight = maxY + levelHeight;
    
    return result;
  }

  /**
   * 递归布局子树
   * @private
   */
  _layoutSubtree(nodeId, level, startX, levelHeight, siblingDistance, nodeIndex, childrenMap) {
    const node = nodeIndex[nodeId];
    node.y = level * levelHeight;
    let currentX = startX;
    let maxY = node.y;
    
    // 检查是否有子节点
    const children = childrenMap[nodeId] || [];
    
    if (children.length === 0) {
      // 叶节点
      node.x = currentX;
      currentX += siblingDistance;
      return { currentX, maxY };
    }
    
    // 处理所有子节点
    const childStartX = currentX;
    const childrenCenters = [];
    
    for (const childId of children) {
      const result = this._layoutSubtree(childId, level + 1, currentX, levelHeight, siblingDistance, nodeIndex, childrenMap);
      currentX = result.currentX;
      maxY = Math.max(maxY, result.maxY);
      
      // 记录子节点中心位置
      const childNode = nodeIndex[childId];
      childrenCenters.push(childNode.x + childNode.width/2);
    }
    
    // 父节点位于所有子节点中心
    const leftMost = childrenCenters[0];
    const rightMost = childrenCenters[childrenCenters.length - 1];
    node.x = (leftMost + rightMost) / 2 - node.width/2;
    
    return { currentX, maxY };
  }

  /**
   * 生成连接线
   * @private
   */
  _generateConnectors(nodeIndex) {
    const connectors = [];
    
    // 生成父子关系连接线
    for (const nodeId in nodeIndex) {
      const node = nodeIndex[nodeId];
      if (node.parentId && nodeIndex[node.parentId]) {
        const parent = nodeIndex[node.parentId];
        
        connectors.push({
          type: 'parent-child',
          fromId: parent.id,
          toId: node.id,
          fromX: parent.x + parent.width/2,
          fromY: parent.y + parent.height,
          toX: node.x + node.width/2,
          toY: node.y
        });
      }
    }
    
    // 生成配偶关系连接线
    for (const nodeId in nodeIndex) {
      const node = nodeIndex[nodeId];
      if (node.spouseId && nodeIndex[node.spouseId]) {
        const spouse = nodeIndex[node.spouseId];
        
        // 避免重复添加
        if (node.id < spouse.id) {
          connectors.push({
            type: 'spouse',
            fromId: node.id,
            toId: spouse.id,
            fromX: node.x + node.width,
            fromY: node.y + node.height/2,
            toX: spouse.x,
            toY: spouse.y + spouse.height/2
          });
        }
      }
    }
    
    return connectors;
  }

  /**
   * 准备并处理WebAssembly数据
   * @param {Array} nodes - 节点数据
   * @param {Number} levelHeight - 层高
   * @param {Number} siblingDistance - 兄弟节点间距
   * @param {Object} calculator - WebAssembly计算器实例
   * @returns {Object} 处理后的结果
   * @private
   */
  _prepareAndProcessWasmData(nodes, levelHeight, siblingDistance, calculator) {
    // 将节点数据转换为WebAssembly可处理的格式
    const nodesBuffer = new Float64Array(nodes.length * 8); // 每个节点8个属性
    const idsBuffer = new Array(nodes.length);
    
    nodes.forEach((node, index) => {
      const offset = index * 8;
      nodesBuffer[offset] = index; // 节点索引
      nodesBuffer[offset + 1] = node.parentId ? nodes.findIndex(n => n.id === node.parentId) : -1; // 父节点索引
      nodesBuffer[offset + 2] = node.spouseId ? nodes.findIndex(n => n.id === node.spouseId) : -1; // 配偶节点索引
      nodesBuffer[offset + 3] = node.x || 0;
      nodesBuffer[offset + 4] = node.y || 0;
      nodesBuffer[offset + 5] = node.width || 120;
      nodesBuffer[offset + 6] = node.height || 150;
      nodesBuffer[offset + 7] = node.generation || 1;
      
      idsBuffer[index] = node.id;
    });
    
    // 调用WebAssembly计算布局
    const resultBuffer = calculator.calculateLayout(nodesBuffer, nodes.length, levelHeight, siblingDistance);
    
    if (!resultBuffer) {
      throw new Error('WebAssembly计算返回空结果');
    }
    
    // 解析计算结果
    const resultNodes = [];
    const resultConnectors = [];
    
    // 解析节点位置
    for (let i = 0; i < nodes.length; i++) {
      const nodeOffset = i * 3; // x, y, generation
      
      resultNodes.push({
        ...nodes[i],
        x: resultBuffer[nodeOffset],
        y: resultBuffer[nodeOffset + 1],
        generation: resultBuffer[nodeOffset + 2]
      });
    }
    
    // 解析连接线
    const connectorCount = resultBuffer[nodes.length * 3];
    const connectorOffset = nodes.length * 3 + 1;
    
    for (let i = 0; i < connectorCount; i++) {
      const offset = connectorOffset + i * 6; // fromId, toId, type, fromX, fromY, toX, toY
      
      resultConnectors.push({
        fromId: idsBuffer[resultBuffer[offset]],
        toId: idsBuffer[resultBuffer[offset + 1]],
        type: resultBuffer[offset + 2] === 1 ? 'spouse' : 'parent-child',
        fromX: resultBuffer[offset + 3],
        fromY: resultBuffer[offset + 4],
        toX: resultBuffer[offset + 5],
        toY: resultBuffer[offset + 6]
      });
    }
    
    return {
      nodes: resultNodes,
      connectors: resultConnectors
    };
  }

  /**
   * 使用JavaScript计算布局
   * @param {Object} options - 计算选项
   * @returns {Promise} 计算结果Promise
   * @private
   */
  _calculateWithJS(options) {
    const { nodes, levelHeight, siblingDistance } = options;
    
    return new Promise((resolve, reject) => {
      try {
        console.log('使用JavaScript计算树布局');
        
        // 直接调用内置函数
        const result = calculateTreeLayout(nodes, {
          levelHeight,
          siblingDistance
        });
        
        resolve(result);
      } catch (error) {
        console.error('JavaScript布局计算失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 终止Worker
   */
  terminateWorker() {
    if (this.worker) {
      try {
        console.log('正在终止Worker...');
        this.worker.terminate();
        console.log('树布局Worker已终止');
      } catch (error) {
        console.warn('终止Worker时出错:', error);
      }
      this.worker = null;
    }
    
    this.useWorker = false;
  }

  /**
   * 设置WebAssembly使用状态
   * @param {Boolean} useWasm - 是否使用WebAssembly
   */
  setWasmUsage(useWasm) {
    this.useWasm = !!useWasm;
  }

  /**
   * 释放资源
   */
  dispose() {
    this.terminateWorker();
    this.callbacks.clear();
    console.log('布局服务资源已释放');
  }
}

module.exports = LayoutService; 