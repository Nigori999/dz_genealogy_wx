// 家族卡片组件
const dateUtil = require('../../utils/date-util');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 族谱数据
    genealogy: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    formatUpdateTime: ''
  },

  /**
   * 数据监听器
   */
  observers: {
    'genealogy': function(genealogy) {
      if (genealogy && genealogy.updatedAt) {
        this._formatUpdateTime(genealogy.updatedAt);
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 格式化更新时间
     */
    _formatUpdateTime(updatedAt) {
      if (!updatedAt) return;

      const date = dateUtil.parseDate(updatedAt);
      if (date) {
        // 如果是当前年份，只显示月日
        const now = new Date();
        if (date.getFullYear() === now.getFullYear()) {
          this.setData({
            formatUpdateTime: dateUtil.formatDate(date, 'MM月DD日')
          });
        } else {
          this.setData({
            formatUpdateTime: dateUtil.formatDate(date, 'YYYY年MM月DD日')
          });
        }
      }
    },

    /**
     * 点击卡片
     */
    onTapCard() {
      const { genealogy } = this.properties;
      this.triggerEvent('select', { genealogy });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      const { genealogy } = this.properties;
      if (genealogy && genealogy.updatedAt) {
        this._formatUpdateTime(genealogy.updatedAt);
      }
    }
  }
});