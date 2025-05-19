/**
 * 布局服务
 * 负责处理树布局计算相关的功能
 */


class LayoutService {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Object} options.calculators - JS计算器对象
   */
  constructor(options = {}) {
    this.calculators = options.calculators || {};
    this.worker = null;
    this.useWorker = false;
    this.callbacks = new Map();
    
    console.log('[布局服务] 布局服务已初始化');
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
      
      // 先终止已存在的Worker
      if (this.worker) {
        try {
          this.worker.terminate();
        } catch (e) {
          console.warn('终止旧Worker实例失败:', e);
        }
        this.worker = null;
      }
      
      // 规范化Worker路径
      if (workerPath.startsWith('/')) {
        workerPath = workerPath.substring(1);
      }
      
      // 创建Worker实例
      try {
        this.worker = wx.createWorker(workerPath);
      } catch (createError) {
        console.error('创建Worker实例失败:', createError);
        this.useWorker = false;
        return false;
      }
      
      // 注册消息处理
      this.worker.onMessage(this._handleWorkerMessage.bind(this));
      
      // 注册错误处理
      this.worker.onError((error) => {
        console.error('树布局Worker错误:', error);
        this.useWorker = false;
      });
      
      // 标记Worker可用
      this.useWorker = true;
      
      // 发送初始化消息到Worker
      try {
        // 发送初始化消息
        setTimeout(() => {
          this.worker.postMessage({
            type: 'init'
          });
        }, 100);
      } catch (initError) {
        console.error('发送Worker初始化消息失败:', initError);
        this.useWorker = false;
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('初始化Worker失败:', error);
      this.useWorker = false;
      return false;
    }
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
        break;
        
      case 'error':
        // 处理Worker错误
        console.error('Worker报告错误:', result.error);
        break;
    }
  }

  /**
   * 处理布局结果
   * @param {String} type - 结果类型
   * @param {Object} result - 处理结果
   * @private
   */
  _processLayoutResult(type, result) {
    // 查找对应的回调函数
    const callback = this.callbacks.get(type);
    if (callback && typeof callback === 'function') {
      callback(result);
    }
    
    // 只保留最近的3个回调，防止内存泄漏
    if (this.callbacks.size > 3) {
      const oldestKey = this.callbacks.keys().next().value;
      this.callbacks.delete(oldestKey);
    }
  }

  /**
   * 注册回调函数
   * @param {String} type - 回调类型
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
   * @param {Function} callback - 结果回调函数
   */
  async calculateTreeLayout(options, callback) {
    // 注册回调
    if (callback) {
      this.registerCallback('treeLayout', callback);
    }
    
    // 根据配置选择计算方式
    try {
      let result;
      
      if (this.useWorker && this.worker) {
        // 使用Worker异步计算
        result = await this._calculateWithWorker(options);
      } else {
        // 使用JS计算
        result = await this._calculateWithJS(options);
      }
      
      return result;
    } catch (error) {
      console.error('树布局计算失败:', error);
      return null;
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
        const postSuccess = this.worker.postMessage({
          type: 'treeLayout',
          data: options
        });
        
        if (!postSuccess) {
          reject(new Error('向Worker发送消息失败'));
          return;
        }
        
        this.registerCallback('treeLayout', (result) => {
          if (result.success) {
            resolve(result.data);
          } else {
            reject(new Error(result.error || '计算失败'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 使用JavaScript计算布局
   * @param {Object} options - 计算选项
   * @returns {Promise} 计算结果Promise
   * @private
   */
  async _calculateWithJS(options) {
    try {
      const { nodes, levelHeight = 150, siblingDistance = 60 } = options;
      
      if (!nodes || nodes.length === 0) {
        console.warn('节点数据为空，无法计算布局');
        return null;
      }
      
      // 直接调用JS计算器
      if (this.calculators.treeLayout) {
        return this.calculators.treeLayout.calculateLayout(nodes, levelHeight, siblingDistance);
      } 
      
      // 备用实现
      return this._createSimpleLayout(nodes, levelHeight, siblingDistance);
    } catch (error) {
      console.error('JS布局计算失败:', error);
      // 使用备用简单布局
      return this._createSimpleLayout(options.nodes, options.levelHeight, options.siblingDistance);
    }
  }

  /**
   * 创建简单布局（最终备用方案）
   * @param {Array} nodes - 节点数组
   * @param {Number} levelHeight - 层级高度
   * @param {Number} siblingDistance - 兄弟节点间距
   * @returns {Object} 布局结果
   * @private
   */
  _createSimpleLayout(nodes, levelHeight = 150, siblingDistance = 60) {
    console.log('[布局服务] 使用简单布局方案');
    
    // 简单布局：按顺序横向排列
    const layoutNodes = nodes.map((node, index) => ({
      ...node,
      x: index * (node.width + siblingDistance),
      y: (node.generation || 1) * levelHeight
    }));
    
    // 找出布局的最大范围
    const maxX = Math.max(...layoutNodes.map(node => node.x + node.width));
    const maxY = Math.max(...layoutNodes.map(node => node.y + node.height));
    
    // 返回布局结果
    return {
      nodes: layoutNodes,
      totalWidth: maxX + siblingDistance,
      totalHeight: maxY + levelHeight,
      connectors: [] // 简单布局不生成连接线
    };
  }

  /**
   * 检查可见性
   * @param {Object} options - 检查选项
   * @returns {Array} 可见元素ID数组
   */
  checkVisibility(options) {
    try {
      if (!options || !options.elements || !options.area) {
        return [];
      }
      
      // 直接使用JS计算器
      if (this.calculators.visibility) {
        return this.calculators.visibility.checkVisibility(options);
      }
      
      // 备用方案：简单实现
      return this._simpleVisibilityCheck(options);
    } catch (error) {
      console.error('可见性检查失败:', error);
      return [];
    }
  }
  
  /**
   * 简单可见性检查（备用方案）
   * @param {Object} options - 检查选项
   * @returns {Array} 可见元素ID数组
   * @private
   */
  _simpleVisibilityCheck(options) {
    const { elements, area } = options;
    const visibleIds = [];
    
    for (const element of elements) {
      if (this._isElementVisible(element, area)) {
        visibleIds.push(element.id);
      }
    }
    
    return visibleIds;
  }
  
  /**
   * 判断元素是否可见
   * @private
   */
  _isElementVisible(rect, area) {
    return !(rect.x > area.right + area.buffer || 
             rect.x + rect.width < area.left - area.buffer || 
             rect.y > area.bottom + area.buffer || 
             rect.y + rect.height < area.top - area.buffer);
  }

  /**
   * 终止Worker
   */
  terminateWorker() {
    if (this.worker) {
      try {
        this.worker.terminate();
        console.log('布局Worker已终止');
      } catch (error) {
        console.warn('终止布局Worker失败:', error);
      }
      this.worker = null;
      this.useWorker = false;
    }
  }

  /**
   * 释放资源
   */
  dispose() {
    // 终止Worker
    this.terminateWorker();
    
    // 清空回调
    this.callbacks.clear();
    
    console.log('[布局服务] 资源已释放');
  }
}

module.exports = LayoutService; 