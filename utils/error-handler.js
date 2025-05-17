/**
 * 错误处理工具
 * 统一处理错误，减少重复代码
 */

const ErrorHandler = {
  /**
   * 包装执行函数并处理错误
   * @param {Function} fn - 要执行的函数
   * @param {Object} options - 选项
   * @param {String} options.operation - 操作名称
   * @param {Function} options.onError - 错误处理回调
   * @param {*} options.defaultValue - 错误时的默认返回值
   * @returns {Function} 包装后的函数
   */
  wrap(fn, options = {}) {
    return function() {
      try {
        return fn.apply(this, arguments);
      } catch (error) {
        const { operation = '操作', onError, defaultValue } = options;
        
        console.error(`${operation}失败:`, error);
        
        if (typeof onError === 'function') {
          onError.call(this, error);
        }
        
        return defaultValue;
      }
    };
  },

  /**
   * 异步操作错误处理
   * @param {Promise} promise - 要处理的Promise
   * @param {Object} options - 选项
   * @param {String} options.operation - 操作名称
   * @param {Function} options.onError - 错误处理回调
   * @param {*} options.defaultValue - 错误时的默认返回值
   * @returns {Promise} 处理错误后的Promise
   */
  async handleAsync(promise, options = {}) {
    try {
      return await promise;
    } catch (error) {
      const { operation = '异步操作', onError, defaultValue } = options;
      
      console.error(`${operation}失败:`, error);
      
      if (typeof onError === 'function') {
        onError(error);
      }
      
      return defaultValue;
    }
  },

  /**
   * 记录错误但不中断执行
   * @param {Function} fn - 要执行的函数
   * @param {String} operation - 操作名称
   * @returns {*} 执行结果或undefined（如果发生错误）
   */
  logError(fn, operation = '操作') {
    try {
      return fn();
    } catch (error) {
      console.error(`${operation}错误（已忽略）:`, error);
      return undefined;
    }
  }
};

module.exports = ErrorHandler; 