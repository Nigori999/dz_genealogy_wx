// 树连接线组件
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 连接线数据
    connector: {
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
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    type: ''
  },

  /**
   * 数据监听器
   */
  observers: {
    'connector': function(connector) {
      if (connector) {
        this._calculateCanvasPosition(connector);
        this.setData({
          type: connector.type || 'parent-child'
        });
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 计算画布位置和尺寸
     */
    _calculateCanvasPosition(connector) {
      if (!connector) return;
      
      const { fromX, fromY, toX, toY } = connector;
      
      // 计算最小和最大坐标，确定画布边界
      const minX = Math.min(fromX, toX);
      const minY = Math.min(fromY, toY);
      const maxX = Math.max(fromX, toX);
      const maxY = Math.max(fromY, toY);
      
      // 添加一点内边距，确保线条完全显示
      const padding = 2;
      
      // 设置画布位置和尺寸
      this.setData({
        left: minX - padding,
        top: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2
      });
      
      // 计算相对于画布左上角的坐标
      this.fromX = fromX - (minX - padding);
      this.fromY = fromY - (minY - padding);
      this.toX = toX - (minX - padding);
      this.toY = toY - (minY - padding);
      
      // 延迟一下绘制，确保画布已准备好
      setTimeout(() => {
        this._drawConnector();
      }, 50);
    },

    /**
     * 绘制连接线
     */
    _drawConnector() {
      const query = this.createSelectorQuery();
      query.select('#connector-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            console.error('Canvas is not ready');
            return;
          }
          
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 设置画布尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio;
          canvas.width = this.data.width * dpr;
          canvas.height = this.data.height * dpr;
          ctx.scale(dpr, dpr);
          
          // 清除画布
          ctx.clearRect(0, 0, this.data.width, this.data.height);
          
          // 设置线条样式
          if (this.data.type === 'spouse') {
            ctx.strokeStyle = '#FF7043'; // 配偶关系线颜色
            ctx.setLineDash([5, 3]); // 虚线样式
          } else {
            ctx.strokeStyle = '#8D6E63'; // 父子关系线颜色
          }
          ctx.lineWidth = 1.5;
          
          // 绘制路径
          ctx.beginPath();
          
          if (this.data.direction === 'vertical') {
            // 垂直树中绘制连接线
            if (this.data.type === 'spouse') {
              // 配偶关系：横向直线
              ctx.moveTo(this.fromX, this.fromY);
              ctx.lineTo(this.toX, this.toY);
            } else {
              // 父子关系：垂直线加水平连接
              const midY = (this.fromY + this.toY) / 2;
              
              ctx.moveTo(this.fromX, this.fromY);
              ctx.lineTo(this.fromX, midY);
              
              // 水平连接线
              if (this.fromX !== this.toX) {
                ctx.lineTo(this.toX, midY);
              }
              
              ctx.lineTo(this.toX, this.toY);
            }
          } else {
            // 水平树中绘制连接线
            if (this.data.type === 'spouse') {
              // 配偶关系：纵向直线
              ctx.moveTo(this.fromX, this.fromY);
              ctx.lineTo(this.toX, this.toY);
            } else {
              // 父子关系：水平线加垂直连接
              const midX = (this.fromX + this.toX) / 2;
              
              ctx.moveTo(this.fromX, this.fromY);
              ctx.lineTo(midX, this.fromY);
              
              // 垂直连接线
              if (this.fromY !== this.toY) {
                ctx.lineTo(midX, this.toY);
              }
              
              ctx.lineTo(this.toX, this.toY);
            }
          }
          
          ctx.stroke();
        });
    }
  }
});