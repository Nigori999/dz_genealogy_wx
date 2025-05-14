// 成员卡片组件
const dateUtil = require('../../utils/date-util');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 成员数据
    member: {
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
    // 是否是最后一代
    isLatestGen: {
      type: Boolean,
      value: false
    },
    // 是否是根祖先
    isRootMember: {
      type: Boolean,
      value: false
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
    'member': function(member) {
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
     * 预览头像
     */
    previewAvatar() {
      const { member } = this.properties;
      if (member.avatar) {
        wx.previewImage({
          current: member.avatar,
          urls: [member.avatar]
        });
      }
    },

    /**
     * 查看详情
     */
    onDetail() {
      const { member } = this.properties;
      this.triggerEvent('detail', { member });
    },

    /**
     * 编辑成员
     */
    onEdit() {
      const { member } = this.properties;
      this.triggerEvent('edit', { member });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      const { member } = this.properties;
      if (member) {
        this._formatDates(member);

        // 设置卡片样式
        const classList = [];
        if (member.gender === 'male') {
          classList.push('male');
        } else {
          classList.push('female');
        }

        if (this.properties.isLatestGen) {
          classList.push('latest-gen');
        }

        if (this.properties.isRootMember) {
          classList.push('root-member');
        }

        if (classList.length > 0) {
          this.createSelectorQuery()
            .select('.member-card-inner')
            .fields({ node: true, size: true }, function (res) {
              res.node.classList.add(...classList);
            })
            .exec();
        }
      }
    }
  }
});