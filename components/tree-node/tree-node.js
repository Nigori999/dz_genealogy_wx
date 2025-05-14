// 树节点组件
const dateUtil = require('../../utils/date-util');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 节点数据
    node: {
      type: Object,
      value: {}
    },
    // 方向：vertical 或 horizontal
    direction: {
      type: String,
      value: 'vertical'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    formatBirthYear: '',
    formatDeathYear: ''
  },

  /**
   * 数据监听器
   */
  observers: {
    'node.member': function(member) {
      if (member) {
        this._formatDates(member);
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 格式化日期
     */
    _formatDates(member) {
      if (member.birthDate) {
        const birthDate = dateUtil.parseDate(member.birthDate);
        if (birthDate) {
          this.setData({
            formatBirthYear: birthDate.getFullYear()
          });
        }
      }

      if (member.deathDate) {
        const deathDate = dateUtil.parseDate(member.deathDate);
        if (deathDate) {
          this.setData({
            formatDeathYear: deathDate.getFullYear()
          });
        }
      }
    },

    /**
     * 点击节点
     */
    onNodeTap() {
      const { node } = this.properties;
      if (node && node.member) {
        this.triggerEvent('select', { memberId: node.member.id });
      }
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      const { node } = this.properties;
      if (node && node.member) {
        this._formatDates(node.member);
      }
    }
  }
});