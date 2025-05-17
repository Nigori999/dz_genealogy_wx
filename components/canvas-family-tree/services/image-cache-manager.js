/**
 * 图像缓存管理器
 * 负责图像加载、缓存和管理
 */

class ImageCacheManager {
  /**
   * 构造函数
   * @param {Object} options - 配置项
   * @param {Number} options.maxCacheSize - 最大缓存数量
   * @param {Function} options.onImageLoaded - 图像加载完成回调
   */
  constructor(options = {}) {
    // 配置选项
    this.maxCacheSize = options.maxCacheSize || 100;
    this.onImageLoaded = options.onImageLoaded || (() => {});
    
    // 图像缓存
    this._cache = new Map();
    // 加载队列
    this._loadQueue = [];
    // 正在加载的URL集合
    this._loadingUrls = new Set();
    // 缓存使用计数
    this._usageCount = new Map();
    // 加载失败计数
    this._failureCount = new Map();
    // 加载失败阈值
    this.maxFailures = 3;
    // Canvas实例（用于创建Image对象）
    this._canvas = null;
    
    // 精灵图缓存
    this._spriteCache = new Map();
    // 精灵图URL集合
    this._spriteUrls = new Set();
    
    // 加载统计
    this._stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      loads: 0,
      evictions: 0
    };
    
    // 标志位
    this._isProcessing = false;
    this._initialized = false;
    
    // 绑定方法
    this._processQueue = this._processQueue.bind(this);
  }
  
  /**
   * 初始化
   * @param {Object} canvas - Canvas实例
   */
  init(canvas) {
    if (this._initialized) return;
    
    this._canvas = canvas;
    this._initialized = true;
    console.log('[ImageCacheManager] 初始化完成');
  }
  
  /**
   * 将图像加入加载队列
   * @param {String} url - 图像URL
   * @param {Boolean} isPriority - 是否优先加载
   * @param {Boolean} isSprite - 是否为精灵图
   */
  queueImageLoad(url, isPriority = false, isSprite = false) {
    if (!url) return;
    
    // 已缓存或正在加载，不重复处理
    if (this._cache.has(url) || this._loadingUrls.has(url)) {
      // 更新使用计数
      this._updateUsageCount(url);
      return;
    }
    
    // 检查失败计数，超过阈值则不再尝试加载
    if (this._failureCount.has(url) && this._failureCount.get(url) >= this.maxFailures) {
      return;
    }
    
    // 添加加载项
    const loadItem = { url, isPriority, isSprite };
    
    // 根据优先级加入队列
    if (isPriority) {
      // 优先加载项添加到队列头部
      this._loadQueue.unshift(loadItem);
    } else {
      // 普通加载项添加到队列尾部
      this._loadQueue.push(loadItem);
    }
    
    // 如果未在加载中，启动加载过程
    if (!this._isProcessing) {
      this._processQueue();
    }
  }
  
  /**
   * 批量添加图像到加载队列
   * @param {Array<String>} urls - 图像URL数组
   * @param {Boolean} isPriority - 是否优先加载
   * @param {Boolean} isSprite - 是否为精灵图
   */
  queueBatchLoad(urls, isPriority = false, isSprite = false) {
    if (!urls || !urls.length) return;
    
    // 遍历URLs，添加到队列
    urls.forEach(url => {
      this.queueImageLoad(url, isPriority, isSprite);
    });
  }
  
  /**
   * 处理加载队列
   * @private
   */
  _processQueue() {
    if (this._loadQueue.length === 0) {
      this._isProcessing = false;
      return;
    }
    
    this._isProcessing = true;
    
    // 同时处理多个加载请求（最多4个）
    const batchSize = 4;
    const batch = [];
    
    // 从队列中取出最多batchSize个加载项
    while (batch.length < batchSize && this._loadQueue.length > 0) {
      const item = this._loadQueue.shift();
      
      // 如果URL不在加载中，则添加到批次
      if (!this._loadingUrls.has(item.url)) {
        batch.push(item);
        this._loadingUrls.add(item.url);
      }
    }
    
    // 批量加载
    batch.forEach(item => {
      this._loadImage(item.url, item.isSprite);
    });
  }
  
  /**
   * 加载图像
   * @param {String} url - 图像URL
   * @param {Boolean} isSprite - 是否为精灵图
   * @private
   */
  _loadImage(url, isSprite = false) {
    if (!this._canvas || !this._initialized) {
      console.warn('[ImageCacheManager] 尚未初始化，无法加载图像');
      this._loadingUrls.delete(url);
      return;
    }
    
    try {
      // 创建Image对象
      const img = this._canvas.createImage();
      
      // 加载成功处理
      img.onload = () => {
        // 将图像添加到缓存
        this._cache.set(url, img);
        
        // 更新使用计数
        this._updateUsageCount(url);
        
        // 如果是精灵图，设置特殊标记
        if (isSprite) {
          this._spriteCache.set(url, true);
        }
        
        // 清除加载中标志
        this._loadingUrls.delete(url);
        
        // 更新统计数据
        this._stats.loads++;
        
        // 执行回调
        this.onImageLoaded(url, img, isSprite);
        
        // 检查缓存大小并清理
        this._checkAndCleanCache();
        
        // 继续处理队列
        this._processQueue();
      };
      
      // 加载失败处理
      img.onerror = (err) => {
        console.error('[ImageCacheManager] 图像加载失败:', url, err);
        
        // 更新失败计数
        if (!this._failureCount.has(url)) {
          this._failureCount.set(url, 1);
        } else {
          this._failureCount.set(url, this._failureCount.get(url) + 1);
        }
        
        // 清除加载中标志
        this._loadingUrls.delete(url);
        
        // 更新统计数据
        this._stats.errors++;
        
        // 继续处理队列
        this._processQueue();
      };
      
      // 开始加载图像
      img.src = url;
    } catch (error) {
      console.error('[ImageCacheManager] 创建图像对象失败:', url, error);
      
      // 清除加载中标志
      this._loadingUrls.delete(url);
      
      // 更新统计数据
      this._stats.errors++;
      
      // 继续处理队列
      this._processQueue();
    }
  }
  
  /**
   * 更新使用计数
   * @param {String} url - 图像URL
   * @private
   */
  _updateUsageCount(url) {
    if (!this._usageCount.has(url)) {
      this._usageCount.set(url, 1);
    } else {
      this._usageCount.set(url, this._usageCount.get(url) + 1);
    }
  }
  
  /**
   * 检查并清理缓存
   * @private
   */
  _checkAndCleanCache() {
    // 如果缓存大小未超过限制，不需要清理
    if (this._cache.size <= this.maxCacheSize) {
      return;
    }
    
    // 计算需要清除的数量
    const toRemove = this._cache.size - this.maxCacheSize;
    
    // 将缓存项按使用计数排序，移除使用频率最低的项
    const items = [];
    this._cache.forEach((value, key) => {
      // 精灵图不参与清理
      if (this._spriteCache.has(key)) {
        return;
      }
      
      items.push({
        url: key,
        count: this._usageCount.get(key) || 0
      });
    });
    
    // 按使用计数升序排序
    items.sort((a, b) => a.count - b.count);
    
    // 移除使用频率最低的项
    for (let i = 0; i < toRemove && i < items.length; i++) {
      const item = items[i];
      this._cache.delete(item.url);
      this._usageCount.delete(item.url);
      
      // 更新统计数据
      this._stats.evictions++;
    }
    
    console.log(`[ImageCacheManager] 缓存清理：移除了${toRemove}项，当前缓存大小：${this._cache.size}`);
  }
  
  /**
   * 获取缓存的图像
   * @param {String} url - 图像URL
   * @returns {Image|null} 图像对象
   */
  get(url) {
    if (!url) return null;
    
    if (this._cache.has(url)) {
      // 更新使用计数
      this._updateUsageCount(url);
      // 更新命中率统计
      this._stats.hits++;
      return this._cache.get(url);
    }
    
    // 未命中，尝试加入加载队列
    this._stats.misses++;
    this.queueImageLoad(url);
    return null;
  }
  
  /**
   * 预加载图像集合
   * @param {Array<String>} urls - 图像URL数组
   * @param {Boolean} isPriority - 是否优先加载
   */
  preload(urls, isPriority = false) {
    if (!urls || !urls.length) return;
    
    // 批量添加到加载队列
    this.queueBatchLoad(urls, isPriority);
  }
  
  /**
   * 预加载精灵图
   * @param {String} url - 精灵图URL
   */
  preloadSprite(url) {
    if (!url) return;
    
    // 精灵图优先级最高
    this.queueImageLoad(url, true, true);
  }
  
  /**
   * 清除特定URL的缓存
   * @param {String} url - 图像URL
   */
  invalidate(url) {
    if (!url) return;
    
    this._cache.delete(url);
    this._usageCount.delete(url);
    this._failureCount.delete(url);
    
    // 如果是精灵图，也清除精灵图缓存
    if (this._spriteCache.has(url)) {
      this._spriteCache.delete(url);
    }
  }
  
  /**
   * 清空全部缓存
   */
  clear() {
    this._cache.clear();
    this._usageCount.clear();
    this._failureCount.clear();
    this._loadQueue = [];
    this._loadingUrls.clear();
    
    // 保留精灵图缓存标记，但清除实际图像
    const spriteUrls = Array.from(this._spriteCache.keys());
    this._spriteCache.clear();
    
    // 重置统计数据
    this._stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      loads: 0,
      evictions: 0
    };
    
    console.log('[ImageCacheManager] 缓存已清空');
  }
  
  /**
   * 检查URL是否为精灵图
   * @param {String} url - 图像URL
   * @returns {Boolean} 是否为精灵图
   */
  isSprite(url) {
    return this._spriteCache.has(url);
  }
  
  /**
   * 注册精灵图URL
   * @param {String} url - 精灵图URL 
   */
  registerSprite(url) {
    if (!url) return;
    
    this._spriteCache.set(url, true);
    
    // 如果已经在缓存中，确保不会被清理
    if (this._cache.has(url)) {
      // 设置极高的使用计数以防被清理
      this._usageCount.set(url, Number.MAX_SAFE_INTEGER);
    } else {
      // 不在缓存中，优先加载
      this.queueImageLoad(url, true, true);
    }
  }
  
  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  getStats() {
    const hitRate = this._stats.hits + this._stats.misses > 0 
      ? (this._stats.hits / (this._stats.hits + this._stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this._stats,
      cacheSize: this._cache.size,
      queueSize: this._loadQueue.length,
      loading: this._loadingUrls.size,
      spriteCount: this._spriteCache.size,
      hitRate: `${hitRate}%`
    };
  }
  
  /**
   * 释放资源
   */
  dispose() {
    this.clear();
    this._canvas = null;
    this._initialized = false;
  }
}

module.exports = ImageCacheManager; 