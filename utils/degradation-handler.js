/**
 * 降级处理工具
 * 用于统一处理功能降级逻辑，减少重复代码
 */

const DegradationHandler = {
  /**
   * 执行功能并自动降级
   * @param {Object} options - 配置选项
   * @param {Function} options.mainImpl - 主要实现函数
   * @param {Function} options.fallbackImpl - 降级实现函数
   * @param {Function} options.conditionCheck - 条件检查函数
   * @param {String} options.featureName - 功能名称（用于日志）
   * @param {Object} options.context - 执行上下文（this）
   * @returns {*} 执行结果
   */
  execute(options) {
    const { mainImpl, fallbackImpl, conditionCheck, featureName, context } = options;
    
    try {
      // 检查条件是否满足
      if (conditionCheck && conditionCheck.call(context)) {
        return mainImpl.apply(context, Array.prototype.slice.call(arguments, 1));
      } else {
        console.log(`${featureName}条件不满足，使用降级实现`);
        return fallbackImpl.apply(context, Array.prototype.slice.call(arguments, 1));
      }
    } catch (error) {
      console.error(`${featureName}执行失败:`, error);
      return fallbackImpl.apply(context, Array.prototype.slice.call(arguments, 1));
    }
  },

  /**
   * 创建一个带有降级能力的函数
   * @param {Object} options - 配置选项
   * @param {Function} options.mainImpl - 主要实现函数
   * @param {Function} options.fallbackImpl - 降级实现函数 
   * @param {Function} options.conditionCheck - 条件检查函数
   * @param {String} options.featureName - 功能名称
   * @returns {Function} 带有降级能力的函数
   */
  createDegradableFunction(options) {
    const { mainImpl, fallbackImpl, conditionCheck, featureName } = options;
    
    return function() {
      return DegradationHandler.execute({
        mainImpl,
        fallbackImpl,
        conditionCheck,
        featureName,
        context: this
      }, ...arguments);
    };
  }
};

module.exports = DegradationHandler; 