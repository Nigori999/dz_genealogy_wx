/**
 * 图像缓存管理器
 * 管理族谱树中的图像纹理和缓存
 */

class ImageCacheManager {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Number} options.maxCacheSize - 最大缓存数量
   * @param {Function} options.onImageLoaded - 图像加载完成回调
   */
  constructor(options = {}) {
    this.maxCacheSize = options.maxCacheSize || 100;
    this.onImageLoaded = options.onImageLoaded || (() => {});
    
    // 图像缓存
    this.imageCache = {};
    // 纹理缓存
    this.textureCache = {};
    // 加载队列
    this.loadQueue = [];
    // 优先加载队列 - 新增优先队列提高关键图像的加载优先级
    this.priorityQueue = [];
    // 是否正在加载
    this.isLoading = false;
    // WebGL上下文
    this.gl = null;
    // Canvas元素
    this.canvas = null;
    
    // 加载统计
    this._stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      loads: 0,
      evictions: 0,
      priority: 0
    };
    
    // 标志位
    this._isProcessing = false;
    this._initialized = false;
    
    // 绑定方法
    this._processQueue = this._processQueue.bind(this);
    
    // 精灵图支持
    this._sprite = {
      enabled: false,
      map: {},
      textures: {}
    };
  }
  
  /**
   * 初始化
   * @param {Object} canvas - Canvas元素
   */
  init(canvas) {
    if (this._initialized) return;
    
    this.canvas = canvas;
    this._initialized = true;
    console.log('[ImageCacheManager] 初始化完成');
    
    // 尝试获取WebGL上下文
    try {
      this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    } catch (e) {
      console.warn('[图像缓存] 获取WebGL上下文失败:', e.message);
    }
  }
  
  /**
   * 队列加载图像
   * @param {String} src - 图像URL
   * @param {Boolean} isRequired - 是否必需
   * @param {Boolean} isSprite - 是否是精灵图
   */
  queueImageLoad(src, isRequired = false, isSprite = false) {
    if (!src) return;
    
    // 图像已在缓存中，无需重新加载
    if (this.imageCache[src]) {
      this._stats.hits++;
      return;
    }
    
    this._stats.misses++;
    
    // 添加到加载队列
    const queue = isRequired ? this.priorityQueue : this.loadQueue;
    if (!queue.some(item => item.src === src)) {
      queue.push({
        src,
        isRequired,
        isSprite,
        timestamp: Date.now()
      });
      
      // 如果当前没有加载任务，开始加载
      if (!this.isLoading) {
        this._processQueue();
      }
    }
  }
  
  /**
   * 处理加载队列
   * @private
   */
  _processQueue() {
    // 优先处理优先队列中的项目
    const queue = this.priorityQueue.length > 0 ? this.priorityQueue : this.loadQueue;
    
    if (queue.length === 0) {
      // 两个队列都为空
      if (this.priorityQueue.length === 0 && this.loadQueue.length === 0) {
        this.isLoading = false;
        return;
      }
      
      // 优先队列为空，但普通队列有内容
      this._processQueue();
      return;
    }
    
    this.isLoading = true;
    const item = queue.shift();
    
    if (item.isRequired) {
      this._stats.priority++;
    }
    
    wx.getImageInfo({
      src: item.src,
      success: (res) => {
        // 缓存图像信息
        this.imageCache[item.src] = res;
        this._stats.loads++;
        
        // 如果是WebGL模式且有上下文，创建纹理
        if (this.gl && !this.textureCache[item.src]) {
          this._createTexture(item.src, res);
        }
        
        // 回调通知
        this.onImageLoaded(item.src, res);
        
        // 继续处理队列
        this._processQueue();
      },
      fail: (err) => {
        console.warn(`[图像缓存] 加载图像失败: ${item.src}`, err);
        this._stats.errors++;
        // 继续处理队列
        this._processQueue();
      }
    });
  }
  
  /**
   * 创建WebGL纹理
   * @param {String} key - 缓存键
   * @param {Object} imageInfo - 图像信息
   * @private
   */
  _createTexture(key, imageInfo) {
    if (!this.gl) return;
    
    try {
      const gl = this.gl;
      const texture = gl.createTexture();
      
      // 创建离屏Canvas并绘制图像
      const tempCanvas = wx.createOffscreenCanvas({
        type: '2d',
        width: imageInfo.width,
        height: imageInfo.height
      });
      
      const tempCtx = tempCanvas.getContext('2d');
      const img = tempCanvas.createImage();
      
      img.onload = () => {
        tempCtx.drawImage(img, 0, 0, imageInfo.width, imageInfo.height);
        
        // 绑定纹理
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tempCanvas);
        
        // 设置纹理参数
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        // 缓存纹理
        this.textureCache[key] = texture;
      };
      
      img.src = imageInfo.path;
    } catch (error) {
      console.error('[图像缓存] 创建纹理失败:', error.message);
    }
  }
  
  /**
   * 获取节点纹理集合
   * @param {Array} nodes - 节点数组
   * @returns {Object} 节点ID到纹理的映射
   */
  getTexturesForNodes(nodes) {
    // 如果没有WebGL上下文，返回空映射
    if (!this.gl) {
      return {};
    }
    
    // 提前预加载节点图像，提高渲染质量
    nodes.forEach(node => {
      if (node.imageUrl && !this.textureCache[node.imageUrl]) {
        // 立即加入优先队列，确保关键节点图像优先加载
        this.queueImageLoad(node.imageUrl, true);
      }
    });
    
    // 构建节点ID到纹理的映射
    const nodeTextureMap = {};
    
    nodes.forEach(node => {
      if (node.imageUrl) {
        // 尝试获取现有纹理
        const texture = this._getOrCreateTexture(node.imageUrl, node.gender);
        if (texture) {
          nodeTextureMap[node.id] = texture;
        } else {
          // 如果没有纹理，使用默认纹理
          nodeTextureMap[node.id] = this._getDefaultTexture(node.gender);
        }
      } else {
        // 没有图像URL的节点使用默认纹理
        nodeTextureMap[node.id] = this._getDefaultTexture(node.gender);
      }
    });
    
    return nodeTextureMap;
  }
  
  /**
   * 获取或创建纹理
   * @param {String} url - 图像URL
   * @param {String} gender - 性别
   * @returns {WebGLTexture} 纹理对象
   * @private
   */
  _getOrCreateTexture(url, gender) {
    if (this.textureCache[url]) {
      return this.textureCache[url];
    }
    
    // 如果是精灵图中的一部分，使用精灵图纹理
    if (this._sprite.enabled && this._sprite.map[url]) {
      const spriteInfo = this._sprite.map[url];
      return this._sprite.textures[spriteInfo.spriteId] || null;
    }
    
    // 启动加载
    this.queueImageLoad(url, true);
    
    // 返回默认纹理
    return this._getDefaultTexture(gender);
  }
  
  /**
   * 创建默认纹理
   * @param {String} gender - 性别
   * @returns {WebGLTexture} 纹理对象
   * @private
   */
  _createDefaultTexture(gender) {
    if (!this.gl) return null;
    
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) return null;
    
    // 根据性别选择默认颜色
    const color = gender === 'male' ? [100, 149, 237, 255] : 
                 (gender === 'female' ? [255, 182, 193, 255] : [200, 200, 200, 255]);
    
    // 绑定纹理
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array(color)
    );
    
    // 设置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    return texture;
  }
  
  /**
   * 获取默认纹理
   * @param {String} gender - 性别
   * @returns {WebGLTexture} 纹理对象
   * @private
   */
  _getDefaultTexture(gender) {
    // 使用性别作为缓存键
    const key = `default_${gender || 'unknown'}`;
    
    // 如果已存在相应性别的默认纹理，则直接返回
    if (this.textureCache[key]) {
      return this.textureCache[key];
    }
    
    // 创建新的默认纹理
    const texture = this._createDefaultTexture(gender);
    
    // 缓存并返回
    if (texture) {
      this.textureCache[key] = texture;
    }
    
    return texture;
  }
  
  /**
   * 预加载节点图像
   * @param {Array} nodes - 节点数组
   * @param {Number} [batchSize=10] - 批处理大小
   * @returns {Promise<Number>} 预加载的图像数量
   */
  async preloadNodeImages(nodes, batchSize = 10) {
    if (!nodes || !nodes.length) return 0;
    
    // 收集需要预加载的URL
    const urls = nodes
      .filter(node => node.imageUrl && !this.imageCache[node.imageUrl])
      .map(node => node.imageUrl);
    
    if (!urls.length) return 0;
    
    // 分批预加载
    const batches = [];
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }
    
    let loadedCount = 0;
    
    // 顺序加载批次，避免并发加载过多导致微信小程序网络请求限制
    for (const batch of batches) {
      // 创建批次中所有图像的加载Promise
      const loadPromises = batch.map(url => 
        new Promise(resolve => {
          this.queueImageLoad(url, true);
          // 标记为已处理，不需要等待实际加载完成
          resolve();
          loadedCount++;
        })
      );
      
      // 等待当前批次完成
      await Promise.all(loadPromises);
      
      // 添加小延迟，避免请求过于密集
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return loadedCount;
  }
  
  /**
   * 注册精灵图
   * @param {String} spriteUrl - 精灵图URL
   * @param {Object} spriteMap - 精灵图映射信息
   */
  registerSprite(spriteUrl, spriteMap = {}) {
    if (!spriteUrl) return;
    
    this._sprite.enabled = true;
    this._sprite.map = { ...this._sprite.map, ...spriteMap };
    
    // 加载精灵图
    this.queueImageLoad(spriteUrl, true, true);
  }
  
  /**
   * 预加载精灵图
   * @param {String} spriteUrl - 精灵图URL
   * @returns {Promise<Boolean>} 加载是否成功
   */
  async preloadSprite(spriteUrl) {
    return new Promise(resolve => {
      if (!spriteUrl) {
        resolve(false);
        return;
      }
      
      // 如果已存在，直接返回成功
      if (this.imageCache[spriteUrl]) {
        resolve(true);
        return;
      }
      
      // 设置回调以检测加载完成
      const originalCallback = this.onImageLoaded;
      
      // 临时替换回调
      this.onImageLoaded = (url, info) => {
        // 调用原始回调
        if (originalCallback) originalCallback(url, info);
        
        // 如果当前加载的是目标精灵图，完成Promise
        if (url === spriteUrl) {
          // 恢复原始回调
          this.onImageLoaded = originalCallback;
          resolve(true);
        }
      };
      
      // 启动加载
      this.queueImageLoad(spriteUrl, true, true);
    });
  }
  
  /**
   * 清理缓存
   * 当缓存超出最大容量时，删除最老的项目
   * @private
   */
  _cleanCache() {
    // 检查是否超出缓存限制
    const cacheSize = Object.keys(this.imageCache).length;
    if (cacheSize <= this.maxCacheSize) return;
    
    // 超出限制，清理一部分缓存
    const keysToRemove = Object.keys(this.imageCache)
      .filter(key => !key.startsWith('default_')) // 不清理默认纹理
      .sort((a, b) => {
        // 按最后访问时间排序
        const timeA = this.imageCache[a].lastAccessed || 0;
        const timeB = this.imageCache[b].lastAccessed || 0;
        return timeA - timeB;
      })
      .slice(0, Math.ceil(cacheSize * 0.2)); // 删除最老的20%缓存
    
    // 移除选定的缓存项
    keysToRemove.forEach(key => {
      delete this.imageCache[key];
      
      // 如果有纹理，也释放它
      if (this.textureCache[key] && this.gl) {
        this.gl.deleteTexture(this.textureCache[key]);
        delete this.textureCache[key];
      }
      
      this._stats.evictions++;
    });
    
    console.log(`[图像缓存] 清理完成，移除了${keysToRemove.length}个项目`);
  }
  
  /**
   * 获取图像
   * @param {String} url - 图像URL
   * @returns {Object} 图像信息
   */
  get(url) {
    if (!url) return null;
    
    // 如果有缓存，更新最后访问时间并返回
    if (this.imageCache[url]) {
      this.imageCache[url].lastAccessed = Date.now();
      this._stats.hits++;
      return this.imageCache[url];
    }
    
    // 如果没有找到，加入加载队列
    this._stats.misses++;
    this.queueImageLoad(url, false);
    return null;
  }
  
  /**
   * 获取图像
   * @param {String} url - 图像URL
   * @returns {Object} 图像信息
   */
  getImage(url) {
    return this.get(url);
  }
  
  /**
   * 清除缓存
   * @param {Boolean} clearAll - 是否清除所有缓存，包括默认纹理
   */
  clear(clearAll = false) {
    // 清除图像缓存
    const keysToRemove = Object.keys(this.imageCache).filter(key => 
      clearAll || !key.startsWith('default_')
    );
    
    keysToRemove.forEach(key => {
      delete this.imageCache[key];
    });
    
    // 如果有WebGL上下文，清除纹理
    if (this.gl) {
      Object.keys(this.textureCache)
        .filter(key => clearAll || !key.startsWith('default_'))
        .forEach(key => {
          this.gl.deleteTexture(this.textureCache[key]);
          delete this.textureCache[key];
        });
    }
    
    console.log(`[图像缓存] 清除完成，移除了${keysToRemove.length}个缓存项`);
  }
  
  /**
   * 释放资源
   */
  dispose() {
    // 清除图像缓存
    this.clear(true);
    
    // 重置队列
    this.loadQueue = [];
    this.priorityQueue = [];
    this.isLoading = false;
    
    // 重置标志位
    this._isProcessing = false;
    this._initialized = false;
    
    // 解除引用
    this.canvas = null;
    this.gl = null;
    
    console.log('[图像缓存] 资源已释放');
  }
  
  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return { 
      ...this._stats,
      cacheSize: Object.keys(this.imageCache).length,
      textureSize: Object.keys(this.textureCache).length,
      queueSize: this.loadQueue.length,
      priorityQueueSize: this.priorityQueue.length
    };
  }
}

module.exports = ImageCacheManager; 