// 加载状态组件
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 加载类型：default, spinner, dots
    type: {
      type: String,
      value: 'default'
    },
    // 加载文本
    text: {
      type: String,
      value: '加载中...'
    },
    // 对齐方式：center, top, bottom
    align: {
      type: String,
      value: 'center'
    },
    // 是否全屏显示
    fullScreen: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 数据监听器
   */
  observers: {
    'fullScreen': function(fullScreen) {
      if (fullScreen) {
        wx.createSelectorQuery()
          .in(this)
          .select('.loading-container')
          .fields({
            node: true,
            size: true
          }, function(res) {
            if (res && res.node) {
              res.node.style.position = 'fixed';
              res.node.style.top = '0';
              res.node.style.left = '0';
              res.node.style.right = '0';
              res.node.style.bottom = '0';
              res.node.style.zIndex = '9999';
              res.node.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            }
          })
          .exec();
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
});