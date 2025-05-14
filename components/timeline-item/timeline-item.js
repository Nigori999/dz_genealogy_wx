// 时间轴项目组件
const dateUtil = require('../../utils/date-util');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 项目数据
    item: {
      type: Object,
      value: {}
    },
    // 是否是第一个项目
    isFirst: {
      type: Boolean,
      value: false
    },
    // 是否是最后一个项目
    isLast: {
      type: Boolean,
      value: false
    },
    // 是否显示操作按钮
    showActions: {
      type: Boolean,
      value: true
    },
    // 是否可编辑
    editable: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    formatYear: '',
    formatMonthDay: '',
    eventTypeText: '',
    eventTypeClass: ''
  },

  /**
   * 数据监听器
   */
  observers: {
    'item': function(item) {
      if (item) {
        this._formatDate(item);
        this._formatEventType(item);
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
    _formatDate(item) {
      if (item.date) {
        const date = dateUtil.parseDate(item.date);
        if (date) {
          this.setData({
            formatYear: date.getFullYear(),
            formatMonthDay: `${date.getMonth() + 1}月${date.getDate()}日`
          });
        }
      }
    },

    /**
     * 格式化事件类型
     */
    _formatEventType(item) {
      const typeMap = {
        'birth': { text: '出生', class: 'birth' },
        'death': { text: '去世', class: 'death' },
        'wedding': { text: '婚礼', class: 'wedding' },
        'career': { text: '职业', class: 'career' },
        'education': { text: '教育', class: 'education' },
        'achievement': { text: '成就', class: 'achievement' },
        'other': { text: '其他', class: '' }
      };

      const type = item.type || 'other';
      const typeInfo = typeMap[type] || typeMap.other;

      this.setData({
        eventTypeText: typeInfo.text,
        eventTypeClass: typeInfo.class
      });
    },

    /**
     * 预览媒体
     */
    previewMedia(e) {
      const { index } = e.currentTarget.dataset;
      const { item } = this.properties;
      
      if (item.media && item.media.length > 0) {
        wx.previewImage({
          current: item.media[index],
          urls: item.media
        });
      }
    },

    /**
     * 查看详情
     */
    onDetail() {
      const { item } = this.properties;
      this.triggerEvent('detail', { item });
    },

    /**
     * 编辑事件
     */
    onEdit() {
      const { item } = this.properties;
      this.triggerEvent('edit', { item });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      const { item } = this.properties;
      if (item) {
        this._formatDate(item);
        this._formatEventType(item);
      }
    }
  }
});