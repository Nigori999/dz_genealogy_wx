/**
 * WebAssembly模块加载器
 * 用于加载和管理族谱树渲染优化的WebAssembly模块
 */

// 定义模块实例变量
let treeLayoutInstance = null;
let visibilityInstance = null;
let pathInstance = null;

/**
 * WebAssembly模块加载器
 */
class WasmLoader {
  constructor() {
    this.instances = {
      treeLayoutCalculator: null,
      visibilityCalculator: null,
      pathCalculator: null
    };
    
    this.initialized = false;
    this.initPromise = null;
    
    // 状态标志
    this.wasmSupported = this._checkWasmSupport();
    this.loadStrategy = this._determineLoadStrategy();
  }
  
  /**
   * 检查是否支持WebAssembly
   * @returns {Boolean} 是否支持WebAssembly
   * @private
   */
  _checkWasmSupport() {
    try {
      // 检查是否存在WXWebAssembly对象
      const hasWXWebAssembly = typeof WXWebAssembly !== 'undefined';
      
      if (!hasWXWebAssembly) {
        // 检查基础库版本
        const systemInfo = wx.getSystemInfoSync();
        const baseLibVersion = systemInfo.SDKVersion || '';
        
        // 基础库2.13.0以上版本支持WXWebAssembly
        const supportVersion = '2.13.0';
        const compareResult = this._compareVersion(baseLibVersion, supportVersion);
        
        return compareResult >= 0;
      }
      
      return true;
    } catch (e) {
      console.error('检测WebAssembly支持失败:', e);
      return false;
    }
  }
  
  /**
   * 确定WebAssembly加载策略
   * @returns {String} 加载策略: 'wx', 'dynamic', 'common'
   * @private
   */
  _determineLoadStrategy() {
    // 策略1: 使用wx.loadWXWebAssembly API（最新版本）
    if (typeof wx.loadWXWebAssembly === 'function') {
      console.log('使用wx.loadWXWebAssembly加载策略');
      return 'wx';
    }
    
    // 策略2: 使用动态import()（新版本）
    if (typeof WXWebAssembly !== 'undefined') {
      console.log('使用WXWebAssembly.instantiate加载策略');
      return 'wxwasm';
    }
    
    // 策略3: 使用CommonJS方式（兼容方式）
    console.log('使用备用加载策略');
    return 'common';
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
   * 使用wx.loadWXWebAssembly API加载WebAssembly模块
   * @private
   */
  async _loadWasmWithWxAPI() {
    try {
      console.log('使用wx.loadWXWebAssembly加载WebAssembly模块');
      
      // 使用wx.loadWXWebAssembly API加载wasm模块
      const treeModule = await wx.loadWXWebAssembly({
        wasmPath: 'wasm/dist/tree_layout.wasm'
      });
      
      const visibilityModule = await wx.loadWXWebAssembly({
        wasmPath: 'wasm/dist/visibility_calculator.wasm'
      });
      
      const pathModule = await wx.loadWXWebAssembly({
        wasmPath: 'wasm/dist/path_calculator.wasm'
      });
      
      // 保存模块实例
      treeLayoutInstance = treeModule;
      visibilityInstance = visibilityModule;
      pathInstance = pathModule;
      
      // 创建计算实例
      this.instances.treeLayoutCalculator = new treeLayoutInstance.exports.TreeLayoutCalculator();
      this.instances.visibilityCalculator = new visibilityInstance.exports.VisibilityCalculator();
      this.instances.pathCalculator = new pathInstance.exports.PathCalculator();
      
      console.log('WebAssembly模块加载成功 (wx.loadWXWebAssembly)');
      return true;
    } catch (error) {
      console.error('使用wx.loadWXWebAssembly加载失败:', error);
      return false;
    }
  }
  
  /**
   * 使用WXWebAssembly.instantiate加载WebAssembly模块
   * @private
   */
  async _loadWasmWithWXWebAssembly() {
    try {
      console.log('开始加载WebAssembly模块 (WXWebAssembly)');
      
      // 确保WXWebAssembly对象存在
      if (typeof WXWebAssembly === 'undefined') {
        throw new Error('当前环境不支持WXWebAssembly');
      }
      
      // 需要加载的文件
      const files = [
        { name: 'treeLayout', file: 'tree_layout.wasm' },
        { name: 'visibility', file: 'visibility_calculator.wasm' },
        { name: 'path', file: 'path_calculator.wasm' }
      ];
      
      // 根据微信环境确定适当的文件后缀
      // 某些微信版本只支持.wasm.br文件
      try {
        const systemInfo = wx.getSystemInfoSync();
        const envInfo = `${systemInfo.platform || ''},mp,${systemInfo.version || ''}`;
        console.log('微信环境信息:', envInfo);
        
        // 检查是否需要使用压缩格式
        const needCompressedFormat = 
          envInfo.includes('Windows') || 
          envInfo.includes('iOS') || 
          systemInfo.platform === 'ios' || 
          systemInfo.platform === 'windows';
          
        if (needCompressedFormat) {
          console.log('当前环境可能需要压缩格式的WebAssembly文件');
          
          // 修改文件名后缀为.wasm.br
          files.forEach(file => {
            file.file = file.file + '.br';
            console.log(`调整文件名为: ${file.file}`);
          });
        }
      } catch (e) {
        console.warn('获取系统信息失败，使用默认WASM格式:', e);
      }
      
      
      // 创建所有模块的加载Promise
      const loadPromises = files.map(file => {
        const fullPath = 'wasm/dist/' + file.file;
        console.log(`加载WebAssembly模块: ${fullPath}`);
        
        // 注意：使用embind绑定的WebAssembly模块不需要复杂的导入对象
        // 只需要空对象即可，实际的绑定由Emscripten生成的js胶水代码处理
        return WXWebAssembly.instantiate(fullPath, {})
          .then(result => {
            console.log(`模块 ${file.name} 加载成功`);
            return { name: file.name, instance: result.instance };
          })
          .catch(error => {
            console.error(`加载 ${file.name} 失败: ${error.message}`);
            throw error;
          });
      });
      
      // 尝试加载所有模块
      let loadedModules = await Promise.all(loadPromises);
      // 从加载结果中提取模块实例
      for (const module of loadedModules) {
        if (module.name === 'treeLayout') {
          treeLayoutInstance = module.instance;
        } else if (module.name === 'visibility') {
          visibilityInstance = module.instance;
        } else if (module.name === 'path') {
          pathInstance = module.instance;
        }
      }
      
      // 创建计算实例
      this.instances.treeLayoutCalculator = new treeLayoutInstance.exports.TreeLayoutCalculator();
      this.instances.visibilityCalculator = new visibilityInstance.exports.VisibilityCalculator();
      this.instances.pathCalculator = new pathInstance.exports.PathCalculator();
      
      console.log('WebAssembly模块加载成功 (WXWebAssembly)');
      return true;
    } catch (error) {
      console.error('使用WXWebAssembly.instantiate加载失败:', error);
      return false;
    }
  }
  
  /**
   * 使用动态import()加载WebAssembly模块
   * @private
   */
  async _loadWasmWithDynamicImport() {
    try {
      console.log('尝试使用动态import()加载WebAssembly模块');
      
      // 使用动态import加载JS胶水代码
      const [treeModule, visibilityModule, pathModule] = await Promise.all([
        import('../../wasm/dist/tree_layout.js'),
        import('../../wasm/dist/visibility_calculator.js'),
        import('../../wasm/dist/path_calculator.js')
      ]);
      
      // 初始化模块
      const treeLayoutPromise = treeModule.default();
      const visibilityPromise = visibilityModule.default();
      const pathPromise = pathModule.default();
      
      // 等待所有模块初始化完成
      const [treeLayout, visibility, path] = await Promise.all([
        treeLayoutPromise,
        visibilityPromise,
        pathPromise
      ]);
      
      // 创建计算实例
      this.instances.treeLayoutCalculator = new treeLayout.exports.TreeLayoutCalculator();
      this.instances.visibilityCalculator = new visibility.exports.VisibilityCalculator();
      this.instances.pathCalculator = new path.exports.PathCalculator();
      
      console.log('WebAssembly模块加载成功 (动态import)');
      return true;
    } catch (error) {
      console.error('使用动态import加载失败:', error);
      return false;
    }
  }
  
  /**
   * 使用备用方式加载WebAssembly模块
   * @private
   */
  async _loadWasmWithFallback() {
    try {
      console.log('尝试使用备用方式加载WebAssembly模块');
      
      // 尝试使用require加载
      const TreeLayoutCalculator = require('../../wasm/dist/tree_layout.js');
      const VisibilityCalculator = require('../../wasm/dist/visibility_calculator.js');
      const PathCalculator = require('../../wasm/dist/path_calculator.js');
      
      // 创建计算实例
      this.instances.treeLayoutCalculator = new TreeLayoutCalculator();
      this.instances.visibilityCalculator = new VisibilityCalculator();
      this.instances.pathCalculator = new PathCalculator();
      
      console.log('WebAssembly模块加载成功 (备用方式)');
      return true;
    } catch (error) {
      console.error('使用备用方式加载失败:', error);
      return false;
    }
  }
  
  /**
   * 加载WebAssembly模块
   * @returns {Promise<boolean>} 是否成功加载
   * @private
   */
  async _loadWasmModules() {
    console.log('开始加载WebAssembly模块，使用策略:', this.loadStrategy);
    
    try {
      // 根据不同策略加载模块
      if (this.loadStrategy === 'wx') {
        return await this._loadWasmWithWxAPI();
      } else if (this.loadStrategy === 'wxwasm') {
        return await this._loadWasmWithWXWebAssembly();
      } else if (this.loadStrategy === 'dynamic') {
        return await this._loadWasmWithDynamicImport();
      } else {
        return await this._loadWasmWithFallback();
      }
    } catch (error) {
      console.error('所有WebAssembly加载策略均失败:', error);
      return false;
    }
  }
  
  /**
   * 初始化所有WebAssembly模块
   * @returns {Promise<boolean>} 是否成功初始化
   */
  async init() {
    // 如果已初始化或正在初始化，直接返回
    if (this.initialized || this.initPromise) {
      return this.initPromise || Promise.resolve(this.initialized);
    }
    
    // 如果不支持WebAssembly，直接返回失败
    if (!this.wasmSupported) {
      console.warn('当前环境不支持WebAssembly，将使用JavaScript回退实现');
      return Promise.resolve(false);
    }
    
    // 创建初始化Promise
    this.initPromise = (async () => {
      try {
        // 加载WebAssembly模块
        const loadResult = await this._loadWasmModules();
        
        if (!loadResult) {
          console.error('WebAssembly模块加载失败');
          this.initialized = false;
          return false;
        }
        
        // 标记为已初始化
        this.initialized = true;
        
        console.log('WebAssembly初始化成功');
        return true;
      } catch (error) {
        console.error('WebAssembly初始化失败，将使用JavaScript回退实现:', error);
        this.initialized = false;
        return false;
      }
    })();
    
    return this.initPromise;
  }
  
  /**
   * 获取初始化后的WebAssembly实例
   * @returns {Object} WebAssembly实例对象
   */
  getInstances() {
    if (!this.initialized) {
      throw new Error('WebAssembly模块尚未初始化');
    }
    
    // 检查实例是否完整
    const instancesAvailable = 
      this.instances.treeLayoutCalculator !== null &&
      this.instances.visibilityCalculator !== null &&
      this.instances.pathCalculator !== null;
      
    // 返回实例对象
    if (instancesAvailable) {
      return { ...this.instances };
    }
    
    // 检查缺少哪些实例
    const missingInstances = [];
    if (!this.instances.treeLayoutCalculator) missingInstances.push('treeLayoutCalculator');
    if (!this.instances.visibilityCalculator) missingInstances.push('visibilityCalculator');
    if (!this.instances.pathCalculator) missingInstances.push('pathCalculator');
    
    if (missingInstances.length > 0) {
      throw new Error(`缺少WebAssembly实例: ${missingInstances.join(', ')}`);
    }
    
    // 如果以上检查都通过但仍无法获取实例，则抛出一般错误
    throw new Error('WebAssembly实例不完整或不可用');
  }
  
  /**
   * 释放资源
   */
  dispose() {
    if (!this.initialized) return;
    
    if (this.instances.treeLayoutCalculator) {
      this.instances.treeLayoutCalculator.delete();
    }
    
    if (this.instances.visibilityCalculator) {
      this.instances.visibilityCalculator.delete();
    }
    
    if (this.instances.pathCalculator) {
      this.instances.pathCalculator.delete();
    }
    
    this.instances = {
      treeLayoutCalculator: null,
      visibilityCalculator: null,
      pathCalculator: null
    };
    
    treeLayoutInstance = null;
    visibilityInstance = null;
    pathInstance = null;
    
    this.initialized = false;
    this.initPromise = null;
  }
  
  /**
   * 检查WebAssembly模块是否已完全初始化
   * @returns {Boolean} 是否已初始化
   */
  isInitialized() {
    try {
      // 检查初始化标志
      if (!this.initialized) {
        return false;
      }
      
      // 检查实例是否存在
      if (!this.instances.treeLayoutCalculator || 
          !this.instances.visibilityCalculator || 
          !this.instances.pathCalculator) {
        return false;
      }
      
      // 尝试访问一个方法，检查实例是否可用
      if (typeof this.instances.pathCalculator.roundRectPath !== 'function') {
        return false;
      }
      
      return true;
    } catch (e) {
      console.warn('wasmLoader.isInitialized检查失败:', e);
      return false;
    }
  }
  
  /**
   * 检查WebAssembly是否可用
   * @returns {Boolean} WebAssembly是否可用
   */
  isWasmSupported() {
    return this.wasmSupported;
  }
}

// 创建单例
const wasmLoader = new WasmLoader();

module.exports = wasmLoader; 