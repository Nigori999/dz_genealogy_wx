// 事件卡片组件
const dateUtil = require('../../utils/date-util');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 事件数据
    event: {
      type: Object,
      value: {}
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
    },
    // 是否是最后一个事件
    isLastEvent: {
      type: Boolean,
      value: false
    },
    // 相关成员数据
    relatedMembers: {
      type: Array,
      value: []
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
    'event': function(event) {
      if (event) {
        this._formatDate(event);
        this._formatEventType(event);
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
    _formatDate(event) {
      if (event.date) {
        const date = dateUtil.parseDate(event.date);
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
    _formatEventType(event) {
      const typeMap = {
        'birth': { text: '出生', class: 'birth' },
        'death': { text: '去世', class: 'death' },
        'wedding': { text: '婚礼', class: 'wedding' },
        'career': { text: '职业', class: 'career' },
        'education': { text: '教育', class: 'education' },
        'achievement': { text: '成就', class: 'achievement' },
        'other': { text: '其他', class: '' }
      };

      const type = event.type || 'other';
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
      const { event } = this.properties;
      
      if (event.media && event.media.length > 0) {
        wx.previewImage({
          current: event.media[index],
          urls: event.media
        });
      }
    },

    /**
     * 点击成员
     */
    onMemberTap(e) {
      const { id } = e.currentTarget.dataset;
      this.triggerEvent('membertap', { memberId: id });
    },

    /**
     * 查看详情
     */
    onDetail() {
      const { event } = this.properties;
      this.triggerEvent('detail', { event });
    },

    /**
     * 编辑事件
     */
    onEdit() {
      const { event } = this.properties;
      this.triggerEvent('edit', { event });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      const { event } = this.properties;
      if (event) {
        this._formatDate(event);
        this._formatEventType(event);
      }

      // 设置最后一个事件特殊样式
      if (this.properties.isLastEvent) {
        this.createSelectorQuery()
          .select('.event-card')
          .addClass('last-event')
          .exec();
      }
    }
  }
});