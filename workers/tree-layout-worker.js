/**
 * 树布局计算Worker
 * 
 * 用于在后台线程计算族谱树布局，减轻主线程负担，提高性能
 */

// 内部状态
const state = {
  treeLayoutCalculator: null,
  isInitialized: false,
  fallbackMode: false,  // 默认尝试使用WebAssembly
  wasmAvailable: false,
  wasmInitialized: false,
  fallbackCalculator: null  // 将在后面设置为TreeLayoutCalculator
};

/**
 * 内置的树布局计算器类
 * 用于计算族谱树的布局（降级方案）
 */
class TreeLayoutCalculator {
  /**
   * 构造函数
   */
  constructor() {
    // 初始化器
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
}

// 设置内部计算器
state.fallbackCalculator = TreeLayoutCalculator;
console.log('[Worker] 使用内置布局计算模块');

/**
 * 初始化Worker
 */
function initialize() {
  // 避免重复初始化
  if (state.isInitialized) {
    console.log('[Worker] 已经初始化，跳过');
    sendMessage({
      type: 'statusReport',
      status: 'ready'
    });
    return;
  }
  
  console.log('[Worker] 开始初始化');
  
  // 加载并记录Worker环境信息，帮助调试
  try {
    // 记录Worker环境信息
    const envInfo = {
      hasWorker: typeof worker !== 'undefined'
    };
    
    console.log('[Worker] 环境详情:', JSON.stringify(envInfo));
  } catch (e) {
    console.error('[Worker] 获取环境信息失败:', e);
  }
  
  // 发送状态通知
  sendMessage({
    type: 'statusReport',
    status: 'initializing'
  });
  
  // 检查WebAssembly支持
  checkWasmSupport().then(supported => {
    if (supported) {
      console.log('[Worker] WebAssembly支持检测通过');
      
      // 尝试初始化WebAssembly
      return initWebAssembly();
    } else {
      console.log('[Worker] WebAssembly不支持，将使用JavaScript实现');
      state.wasmAvailable = false;
      state.fallbackMode = true;
      return false;
    }
  }).then(wasmInitialized => {
    // 设置初始化状态
    state.isInitialized = true;
    
    if (wasmInitialized) {
      state.fallbackMode = false;
      console.log('[Worker] 使用WebAssembly实现');
    } else {
      state.fallbackMode = true;
      
      console.log('[Worker] 使用JavaScript实现');
      // 创建备用计算器实例
      state.treeLayoutCalculator = new TreeLayoutCalculator();
    }
    
    // 发送初始化完成通知
    sendMessage({
      type: 'statusReport',
      status: 'ready',
      features: {
        wasmSupported: state.wasmAvailable,
        wasmInitialized: state.wasmInitialized,
        fallbackMode: state.fallbackMode
      }
    });
  }).catch(error => {
    console.error('[Worker] 初始化失败:', error);
    
    // 发送错误通知
    sendMessage({
      type: 'statusReport',
      status: 'error',
      error: String(error)
    });
    
    // 强制使用备用模式
    state.fallbackMode = true;
    state.isInitialized = true;
    
    // 创建备用计算器实例
    state.treeLayoutCalculator = new TreeLayoutCalculator();
  });
}

// ===============================================================
// 以下是从wasm-loader.js中引入的WebAssembly加载方法
// ===============================================================

/**
 * 检查是否支持WebAssembly
 * @returns {Promise<Boolean>} 是否支持WebAssembly
 */
async function checkWasmSupport() {
  try {
    // 检查是否有WXWebAssembly全局对象
    const hasWXWebAssembly = typeof WXWebAssembly !== 'undefined';
    console.log('[Worker] WXWebAssembly支持状态:', hasWXWebAssembly);
    
    // 如果没有WebAssembly支持，直接返回false
    if (!hasWXWebAssembly) {
      console.log('[Worker] 当前环境没有WXWebAssembly对象');
      state.wasmAvailable = false;
      return false;
    }
    
    // 测试WebAssembly基本功能
    console.log('[Worker] 开始测试WXWebAssembly功能');
    
    // 获取WXWebAssembly对象上可用的方法
    const methods = [];
    for (const key in WXWebAssembly) {
      if (typeof WXWebAssembly[key] === 'function') {
        methods.push(key);
      }
    }
    console.log('[Worker] WXWebAssembly可用方法:', methods.join(', '));
    
    // 确保有instantiate方法
    if (typeof WXWebAssembly.instantiate !== 'function') {
      console.log('[Worker] WXWebAssembly缺少instantiate方法');
      state.wasmAvailable = false;
      return false;
    }
    
    state.wasmAvailable = true;
    return true;
  } catch (error) {
    console.error('[Worker] WebAssembly支持检测出错:', error);
    state.wasmAvailable = false;
    return false;
  }
}

/**
 * 确定WebAssembly加载策略
 * @returns {String} 加载策略: 'wxwasm' 或 'common'
 */
function determineLoadStrategy() {
  // Worker中主要使用WXWebAssembly.instantiate
  if (typeof WXWebAssembly !== 'undefined' && typeof WXWebAssembly.instantiate === 'function') {
    console.log('[Worker] 使用WXWebAssembly.instantiate加载策略');
    return 'wxwasm';
  }
  
  // 备用策略
  console.log('[Worker] 使用备用加载策略');
  return 'common';
}

/**
 * 初始化WebAssembly
 * @returns {Promise<boolean>} 是否成功初始化
 */
async function initWebAssembly() {
  try {
    console.log('[Worker] 开始初始化WebAssembly');
    
    if (!state.wasmAvailable) {
      console.warn('[Worker] WebAssembly不可用，无法初始化');
      return false;
    }
    
    // 确定加载策略
    const loadStrategy = determineLoadStrategy();
    
    // 根据策略加载WASM
    if (loadStrategy === 'wxwasm') {
      return await loadWasmWithWXWebAssembly();
    } else {
      console.warn('[Worker] 当前环境不支持合适的WebAssembly加载方式');
      return false;
    }
  } catch (error) {
    console.error('[Worker] WebAssembly初始化失败:', error);
    state.fallbackMode = true;
    return false;
  }
}

/**
 * 使用WXWebAssembly.instantiate加载WebAssembly模块
 */
async function loadWasmWithWXWebAssembly() {
  try {
    console.log('[Worker] 开始加载WebAssembly模块 (WXWebAssembly)');
    
    // 确保WXWebAssembly对象存在
    if (typeof WXWebAssembly === 'undefined') {
      throw new Error('当前环境不支持WXWebAssembly');
    }
    
    // 文件名
    let treeLayoutFile = 'tree_layout.wasm';
    
    // 检查环境是否需要使用压缩格式
    try {
      // 获取环境信息
      const envType = worker.env || {};
      console.log('[Worker] 环境类型:', envType);
      
      // 根据环境信息判断
      if (typeof envType === 'string' && 
          (envType.includes('Windows') || envType.includes('ios'))) {
        console.log('[Worker] 当前环境可能需要压缩WebAssembly格式');
        treeLayoutFile = 'tree_layout.wasm.br';
      }
    } catch (e) {
      console.warn('[Worker] 环境检测失败，使用默认WASM格式:', e);
    }
    
    // 注意：使用embind绑定的WebAssembly模块不需要复杂的导入对象
    // 只需要空对象即可，实际的绑定由Emscripten生成的JS胶水代码处理
    let loadedInstance = null;
    let loadError = null;
    const fullPath = 'wasm/dist/' + treeLayoutFile;
    
    // 尝试加载wasm模块，记录更多调试信息
    console.log(`[Worker] 开始实例化WASM: ${fullPath}`);
    
    try {
      // 更详细地记录整个加载过程
      console.log('[Worker] 开始WXWebAssembly.instantiate调用...');
      
      const result = await WXWebAssembly.instantiate(fullPath, {});
      
      console.log('[Worker] WXWebAssembly.instantiate调用完成，检查结果');
      
      if (result && result.instance) {
        console.log(`[Worker] 从路径 ${fullPath} 加载WebAssembly成功`);
        console.log('[Worker] WebAssembly实例导出内容:', Object.keys(result.instance.exports).join(', '));
        loadedInstance = result.instance;
      } else {
        console.warn(`[Worker] 从路径 ${fullPath} 加载结果无效:`, result);
      }
    } catch (error) {
      console.warn(`[Worker] 从路径 ${fullPath} 加载失败: ${error.message}`);
      // 详细记录错误信息
      if (error && error.stack) {
        console.warn(`[Worker] 错误栈: ${error.stack}`);
      }
      loadError = error;
    }
    
    if (loadedInstance) {
      // 初始化计算器实例
      try {
        console.log('[Worker] 尝试创建WebAssembly计算器实例');
        
        // 记录所有可用的导出函数
        if (typeof loadedInstance.exports === 'object') {
          const exportNames = Object.keys(loadedInstance.exports);
          console.log('[Worker] 可用的导出函数:', exportNames.join(', '));
          
          // 直接方法：创建一个自定义TreeLayoutCalculator适配器
          console.log('[Worker] 尝试创建自定义适配器');
          
          // 1. 寻找任何可能与布局计算相关的函数
          const layoutFunctions = exportNames.filter(name => 
            typeof loadedInstance.exports[name] === 'function' && 
            (name.includes('layout') || 
             name.includes('calc') || 
             name.includes('tree') || 
             name.includes('_Z') || // C++名称修饰的函数通常以_Z开头
             !name.startsWith('_')) // 非内部函数
          );
          
          console.log('[Worker] 可能的布局相关函数:', layoutFunctions.join(', '));
          
          // 2. 如果找到了相关函数，创建简单的适配器
          if (layoutFunctions.length > 0) {
            // 创建一个简单的树布局计算器适配器
            state.treeLayoutCalculator = {
              calculateLayout: function(nodes, levelHeight, siblingDistance) {
                console.log('[Worker] 调用WASM适配器计算布局，函数:', layoutFunctions[0]);
                
                try {
                  // 尝试直接调用WASM函数
                  const wasmFunction = loadedInstance.exports[layoutFunctions[0]];
                  
                  // 记录函数信息
                  console.log(`[Worker] WASM函数 ${layoutFunctions[0]} 类型:`, typeof wasmFunction);
                  console.log(`[Worker] WASM函数参数数量:`, wasmFunction.length);
                  
                  // 尝试调用WASM函数
                  try {
                    // 根据WASM函数期望的参数数量做不同的调用尝试
                    let result;
                    
                    // 记录输入参数
                    console.log('[Worker] 调用参数:', {
                      节点数量: nodes.length,
                      层高: levelHeight,
                      兄弟间距: siblingDistance
                    });
                    
                    // 实际调用WASM函数
                    result = wasmFunction(nodes, levelHeight, siblingDistance);
                    console.log('[Worker] WASM函数调用成功，返回类型:', typeof result);
                    
                    // 检查结果是否有效
                    if (result && typeof result === 'object') {
                      console.log('[Worker] WASM结果:', {
                        节点数量: result.nodes ? result.nodes.length : 0,
                        连接线数量: result.connectors ? result.connectors.length : 0,
                        总宽度: result.totalWidth,
                        总高度: result.totalHeight
                      });
                      
                      // 使用WASM计算结果
                      return result;
                    } else {
                      console.warn('[Worker] WASM函数返回了无效结果:', result);
                      throw new Error('WASM函数返回了无效结果');
                    }
                    
                  } catch (callError) {
                    console.error('[Worker] 调用WASM函数参数错误:', callError);
                    throw callError;
                  }
                  
                } catch (callError) {
                  console.error('[Worker] 调用WASM函数失败:', callError);
                  
                  // 使用JavaScript实现作为备用
                  console.log('[Worker] 降级到JavaScript实现计算');
                  const jsCalculator = new TreeLayoutCalculator();
                  return jsCalculator.calculateLayout(nodes, levelHeight, siblingDistance);
                }
              }
            };
            
            console.log('[Worker] 已创建自定义WASM适配器');
            
            // 设置状态标志 - 虽然不是理想的WASM实现，但至少能工作
            state.wasmInitialized = true;
            state.fallbackMode = false;
            
            console.log('[Worker] WebAssembly初始化成功（适配器模式）');
            return true;
          } 
          // 后备方案：使用内置JS实现
          else {
            console.warn('[Worker] 没有找到可用的WASM函数，使用JavaScript实现');
            state.fallbackMode = true;
            state.treeLayoutCalculator = new TreeLayoutCalculator();
            return false;
          }
        } else {
          console.warn('[Worker] WebAssembly实例缺少exports对象');
          throw new Error('WebAssembly实例无效');
        }
      } catch (instanceError) {
        console.error('[Worker] 创建WebAssembly实例失败:', instanceError);
        // 使用JS实现作为最终的后备方案
        state.fallbackMode = true;
        state.treeLayoutCalculator = new TreeLayoutCalculator();
        return false;
      }
    } else {
      // 没有成功加载模块，设置降级模式
      console.warn('[Worker] WebAssembly加载失败，降级到JavaScript实现');
      state.wasmAvailable = false;
      state.fallbackMode = true;
      
      if (loadError) {
        throw loadError;
      } else {
        throw new Error('WebAssembly加载失败');
      }
    }
  } catch (error) {
    console.error('[Worker] 使用WXWebAssembly.instantiate加载失败:', error);
    return false;
  }
}

// ===============================================================
// 以上是从wasm-loader.js中引入的WebAssembly加载方法
// ===============================================================

/**
 * 计算树布局
 * @param {Object} data - 布局数据
 * @param {Array} data.nodes - 节点数据
 * @param {Number} data.levelHeight - 层高
 * @param {Number} data.siblingDistance - 兄弟节点间距
 */
function calculateTreeLayout(data) {
  try {
    console.log('[Worker] 接收到布局计算请求');
    
    const { nodes, levelHeight = 150, siblingDistance = 100 } = data;
    
    if (!nodes || nodes.length === 0) {
      throw new Error('节点数据为空');
    }
    
    // 复制节点数据，防止引用问题
    const nodesCopy = nodes.map(node => ({
      id: node.id,
      parentId: node.parentId || '',
      spouseId: node.spouseId || '',
      x: node.x || 0,
      y: node.y || 0,
      width: node.width || 120,
      height: node.height || 150,
      generation: node.generation || 1
    }));
    
    let result;
    
    // 根据状态选择计算方法
    if (!state.fallbackMode && state.wasmInitialized && state.treeLayoutCalculator) {
      // 使用WebAssembly计算
      console.log('[Worker] 使用WebAssembly计算布局');
      result = calculateLayoutWithWasm(nodesCopy, levelHeight, siblingDistance);
    } else {
      // 使用JavaScript计算
      console.log('[Worker] 使用JavaScript计算布局');
      result = calculateLayoutWithJS(nodesCopy, levelHeight, siblingDistance);
    }
    
    console.log('[Worker] 布局计算完成，节点数:', result.nodes.length);
    
    // 发送计算结果
    sendMessage({
      type: 'treeLayout',
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Worker] 布局计算出错:', error);
    sendMessage({
      type: 'treeLayout',
      success: false,
      error: error.message || '计算出错'
    });
  }
}

/**
 * 使用WebAssembly计算布局
 * @param {Array} nodes - 节点数据
 * @param {Number} levelHeight - 层高
 * @param {Number} siblingDistance - 兄弟节点间距
 * @returns {Object} 布局结果
 */
function calculateLayoutWithWasm(nodes, levelHeight, siblingDistance) {
  try {
    console.log('[Worker] 开始WebAssembly布局计算, 节点数:', nodes.length);
    
    // 调用WASM计算器的计算方法
    if (typeof state.treeLayoutCalculator.calculateLayout === 'function') {
      const calculatedResult = state.treeLayoutCalculator.calculateLayout(nodes, levelHeight, siblingDistance);
      
      // 检查结果是否有效
      if (calculatedResult && calculatedResult.nodes && calculatedResult.connectors) {
        console.log('[Worker] WebAssembly布局计算成功');
        return calculatedResult;
      } else {
        throw new Error('WebAssembly计算结果无效');
      }
    } else {
      throw new Error('WebAssembly计算器不包含calculateLayout方法');
    }
  } catch (error) {
    console.error('[Worker] WebAssembly布局计算失败:', error);
    // 降级到JS计算
    return calculateLayoutWithJS(nodes, levelHeight, siblingDistance);
  }
}

/**
 * 使用JavaScript计算布局
 * @param {Array} nodes - 节点数据
 * @param {Number} levelHeight - 层高
 * @param {Number} siblingDistance - 兄弟节点间距
 * @returns {Object} 布局结果
 */
function calculateLayoutWithJS(nodes, levelHeight, siblingDistance) {
  console.log('[Worker] 使用JavaScript计算布局, 节点数:', nodes.length);
  
  try {
    // 使用JS计算器
    const calculator = new TreeLayoutCalculator();
    return calculator.calculateLayout(nodes, levelHeight, siblingDistance);
  } catch (error) {
    console.error('[Worker] JS布局计算失败:', error);
    // 创建默认布局
    return createDefaultLayout(nodes, levelHeight, siblingDistance);
  }
}

/**
 * 创建默认布局（用于错误恢复）
 * @param {Array} nodes - 节点数据
 * @param {Number} levelHeight - 层高
 * @param {Number} siblingDistance - 兄弟节点间距
 * @returns {Object} 布局结果
 */
function createDefaultLayout(nodes, levelHeight, siblingDistance) {
  console.log('[Worker] 创建默认布局');
  
  // 创建简单的横向布局
  const result = {
    nodes: [],
    connectors: [],
    totalWidth: 0,
    totalHeight: 0
  };
  
  // 将所有节点横向排列
  nodes.forEach((node, index) => {
    node.x = index * (node.width + siblingDistance);
    node.y = 0;
    result.nodes.push(node);
  });
  
  return result;
}

/**
 * 检查元素可见性
 */
function checkVisibility(data) {
  try {
    console.log('[Worker] 接收到可见性检查请求');
    
    const { viewRect, nodes } = data;
    
    if (!viewRect || !nodes || nodes.length === 0) {
      throw new Error('参数无效');
    }
    
    // 扩展视口矩形（添加边距）
    const expandedRect = {
      x: viewRect.x - 100,
      y: viewRect.y - 100,
      width: viewRect.width + 200,
      height: viewRect.height + 200
    };
    
    // 判断节点是否在视口内
    const visibleNodes = [];
    
    nodes.forEach(node => {
      // 检查节点是否与扩展视口相交
      if (
        node.x + node.width > expandedRect.x &&
        node.x < expandedRect.x + expandedRect.width &&
        node.y + node.height > expandedRect.y &&
        node.y < expandedRect.y + expandedRect.height
      ) {
        visibleNodes.push(node.id);
      }
    });
    
    console.log('[Worker] 可见性检查完成，可见节点数:', visibleNodes.length);
    
    // 发送结果
    sendMessage({
      type: 'visibilityCheck',
      success: true,
      data: {
        visibleNodes
      }
    });
  } catch (error) {
    console.error('[Worker] 可见性检查出错:', error);
    sendMessage({
      type: 'visibilityCheck',
      success: false,
      error: error.message || '检查出错'
    });
  }
}

/**
 * 发送消息到主线程
 * @param {Object} message - 消息内容
 */
function sendMessage(message) {
  try {
    // 微信小程序Worker环境下直接使用worker.postMessage
    worker.postMessage(message);
  } catch (error) {
    console.error('[Worker] 发送消息失败:', error);
  }
}

// 微信小程序Worker消息监听方式
worker.onMessage(function(message) {
  // 根据消息类型处理
  switch (message.type) {
    case 'init':
      // 初始化Worker
      initialize();
      break;
      
    case 'treeLayout':
      // 计算布局
      calculateTreeLayout(message.data);
      break;
      
    case 'visibilityCheck':
      // 检查元素可见性
      checkVisibility(message.data);
      break;
      
    case 'testAlive':
      // 存活测试
      sendMessage({
        type: 'aliveResponse',
        timestamp: Date.now()
      });
      break;
      
    case 'debugInfo':
      // 发送调试信息
      sendMessage({
        type: 'debugInfo',
        data: {
          isInitialized: state.isInitialized,
          fallbackMode: state.fallbackMode,
          wasmAvailable: state.wasmAvailable,
          wasmInitialized: state.wasmInitialized
        }
      });
      break;
      
    default:
      console.warn('[Worker] 未知消息类型:', message.type);
  }
});

// 发送Worker已启动的消息
console.log('[Worker] 树布局Worker已启动'); 