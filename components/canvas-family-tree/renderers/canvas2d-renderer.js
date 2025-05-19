/**
 * Canvas 2D渲染器
 * 负责Canvas 2D绘制相关的渲染逻辑
 */

// 导入坐标系统工具类
const { coordinateSystem, CoordinateSystem } = require('../services/coordinate-system');
// 导入错误处理工具
const ErrorHandler = require('../../../utils/error-handler');

// 定义样式常量
const COLORS = {
  MALE_BORDER: 'rgba(30, 144, 255, 0.9)',  // 男性节点边框 - 蓝色
  FEMALE_BORDER: 'rgba(255, 105, 180, 0.9)', // 女性节点边框 - 粉红色
  CURRENT_USER_BORDER: 'rgba(255, 204, 0, 0.9)', // 当前用户边框 - 杏黄色
  ROOT_BORDER: 'rgba(255, 128, 0, 0.8)', // 根节点边框 - 橙色
  DEFAULT_BORDER: 'rgba(204, 204, 204, 0.8)', // 默认边框 - 灰色
  PARENT_CHILD_LINE: 'rgba(150, 150, 150, 0.7)', // 父子关系连接线 - 中灰色
  SPOUSE_LINE: 'rgba(130, 130, 130, 0.7)' // 夫妻关系连接线 - 深灰色
};

/**
 * Canvas 2D树渲染器
 * 负责2D渲染的底层实现
 */
class Canvas2DTreeRenderer {
  /**
   * 构造函数
   * @param {Object} canvas - Canvas对象
   * @param {Object} ctx - 2D上下文
   */
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.transform = {
      offsetX: 0,
      offsetY: 0,
      scale: 1.0
    };
    
    // 使用新API获取设备像素比
    this._initDevicePixelRatio();
    
    // 初始化坐标系统
    this.coordSystem = new CoordinateSystem({
      canvasWidth: this.canvas ? this.canvas.width : 300,
      canvasHeight: this.canvas ? this.canvas.height : 400,
      devicePixelRatio: this._dpr,
      isYAxisDown: true
    });
  }

  /**
   * 初始化设备像素比
   * @private
   */
  _initDevicePixelRatio = ErrorHandler.wrap(function() {
    const deviceInfo = wx.getDeviceInfo();
    this._dpr = deviceInfo.pixelRatio || 1;
  }, {
    operation: '获取设备像素比',
    defaultValue: 1,
    onError(error) {
      console.warn('[Canvas 2D] 获取设备信息失败，使用默认像素比:', error.message);
      this._dpr = 1;
    }
  });

  /**
   * 清除画布
   */
  clear = ErrorHandler.wrap(function() {
    if (!this.ctx) return;
    
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }, {
    operation: '清除画布',
    onError(error) {
      console.error('[Canvas 2D] 清除画布失败:', error.message);
    }
  });

  /**
   * 更新视口尺寸
   * @param {Number} width - 宽度
   * @param {Number} height - 高度
   */
  updateViewport = ErrorHandler.wrap(function(width, height) {
    if (!this.canvas) return;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 更新坐标系统
    this.coordSystem.updateCanvasSize(width, height);
  }, {
    operation: '更新视口尺寸',
    onError(error) {
      console.error('[Canvas 2D] 更新视口尺寸失败:', error.message);
    }
  });

  /**
   * 设置变换参数
   * @param {Number} offsetX - X轴偏移
   * @param {Number} offsetY - Y轴偏移
   * @param {Number} scale - 缩放比例
   */
  setTransform = ErrorHandler.wrap(function(offsetX, offsetY, scale) {
    this.transform.offsetX = offsetX;
    this.transform.offsetY = offsetY;
    this.transform.scale = scale;
    
    // 更新坐标系统
    this.coordSystem.updateTransform(scale, offsetX, offsetY);
  }, {
    operation: '设置变换参数',
    onError(error) {
      console.error('[Canvas 2D] 设置变换参数失败:', error.message);
    }
  });

  /**
   * 渲染族谱树
   * @param {Object} params - 渲染参数
   * @returns {Boolean} 渲染是否成功
   */
  render = ErrorHandler.wrap(function(params) {
    if (!this.ctx || !this.canvas) {
      console.warn('[Canvas2D] 上下文或画布未初始化，无法渲染');
      return false;
    }

    const {
      nodes,
      connectors,
      transform,
      visibleArea,
      currentMemberId
    } = params;

    // 应用变换
    if (transform) {
      this.setTransform(
        transform.offsetX || 0,
        transform.offsetY || 0,
        transform.scale || 1.0
      );
    }

    // 清除画布
    this.clear();
    
    // 设置背景
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    // 设置变换
    this.ctx.save();
    this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
    this.ctx.scale(this.transform.scale, this.transform.scale);

    // 渲染连接线
    if (connectors && connectors.length) {
      this._renderConnectors(connectors, visibleArea);
    }

    // 渲染节点
    if (nodes && nodes.length) {
      this._renderNodes(nodes, visibleArea, currentMemberId);
    }

    // 恢复上下文
    this.ctx.restore();

    return true;
  }, {
    operation: '渲染族谱树',
    defaultValue: false,
    onError(error) {
      console.error('[Canvas2D] 渲染族谱树失败:', error.message);
      return false;
    }
  });

  /**
   * 渲染连接线
   * @param {Array} connectors - 连接线数组
   * @param {Object} visibleArea - 可视区域
   * @private
   */
  _renderConnectors = ErrorHandler.wrap(function(connectors, visibleArea) {
    if (!connectors || connectors.length === 0) return;
    
    // 按类型分组
    const parentChildConnectors = [];
    const spouseConnectors = [];
    
    // 分类连接线
    for (const conn of connectors) {
      // 快速可见性检查 - 如果可视区域存在，跳过不可见的连接线
      if (visibleArea && (
        conn.fromX > visibleArea.right + visibleArea.buffer ||
        conn.toX < visibleArea.left - visibleArea.buffer ||
        conn.fromY > visibleArea.bottom + visibleArea.buffer ||
        conn.toY < visibleArea.top - visibleArea.buffer
      )) {
        continue;
      }
      
      // 按类型归类
      if (conn.type === 'spouse') {
        spouseConnectors.push(conn);
      } else {
        parentChildConnectors.push(conn);
      }
    }
    
    // 1. 绘制父子关系连接线 - 贝塞尔曲线
    if (parentChildConnectors.length > 0) {
      this.ctx.strokeStyle = COLORS.PARENT_CHILD_LINE;
      this.ctx.lineWidth = 1;
      // 重置虚线模式，确保使用实线
      this.ctx.setLineDash([]);
      
      for (const conn of parentChildConnectors) {
        const startX = conn.fromX;
        const startY = conn.fromY;
        const endX = conn.toX;
        const endY = conn.toY;
        const yDistance = endY - startY;
        
        // 创建贝塞尔曲线控制点
        // 控制点在起点和终点的垂直中点
        const controlY = startY + yDistance / 2;
        
        // 绘制贝塞尔曲线
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.bezierCurveTo(
          startX, controlY, // 第一控制点
          endX, controlY,   // 第二控制点
          endX, endY        // 终点
        );
        this.ctx.stroke();
      }
    }
    
    // 2. 绘制夫妻关系连接线 - 虚线贝塞尔曲线
    if (spouseConnectors.length > 0) {
      this.ctx.strokeStyle = COLORS.SPOUSE_LINE;
      this.ctx.lineWidth = 1;
      // 设置虚线样式
      this.ctx.setLineDash([4, 3]);
      
      for (const conn of spouseConnectors) {
        const startX = conn.fromX;
        const startY = conn.fromY;
        const endX = conn.toX;
        const endY = conn.toY;
        const xDistance = endX - startX;
        
        // 绘制略带弧度的贝塞尔曲线
        // 水平夫妻关系连接线的控制点向下偏移一些，形成轻微的弧度
        const controlY = startY + 10; // 偏移10像素形成弧度
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(
          startX + xDistance / 2, controlY, // 控制点
          endX, endY                        // 终点
        );
        this.ctx.stroke();
      }
      
      // 重置虚线模式，避免影响其他绘制
      this.ctx.setLineDash([]);
    }
  }, {
    operation: '渲染连接线',
    onError(error) {
      console.error('[Canvas2D] 渲染连接线失败:', error.message);
    }
  });

  /**
   * 渲染节点
   * @param {Array} nodes - 节点数组
   * @param {Object} visibleArea - 可视区域
   * @param {String} currentMemberId - 当前成员ID
   * @private
   */
  _renderNodes(nodes, visibleArea, currentMemberId) {
    if (!nodes || nodes.length === 0) return;
    
    // 筛选可见节点
    let visibleNodes = nodes;
    if (visibleArea) {
      visibleNodes = nodes.filter(node => 
        node.x < visibleArea.right + visibleArea.buffer &&
        node.x + node.width > visibleArea.left - visibleArea.buffer &&
        node.y < visibleArea.bottom + visibleArea.buffer &&
        node.y + node.height > visibleArea.top - visibleArea.buffer
      );
    }
    
    // 绘制节点背景
    this._batchDrawNodeBackgrounds(visibleNodes);
    
    // 绘制节点边框和阴影
    this._batchDrawNodeBorders(visibleNodes, currentMemberId);
    
    // 绘制节点内容（名称、头像等）
    this._batchDrawNodeContents(visibleNodes, currentMemberId);
  }
  
  /**
   * 批量绘制节点背景
   * @param {Array} nodes - 节点数组
   * @private
   */
  _batchDrawNodeBackgrounds(nodes) {
    // 添加调试信息
    console.log('[Canvas2D] 绘制节点背景，节点数量:', nodes.length);
    if (nodes.length > 0) {
      console.log('[Canvas2D] 首个节点示例:', {
        id: nodes[0].id,
        x: nodes[0].x,
        y: nodes[0].y,
        width: nodes[0].width,
        height: nodes[0].height,
        name: nodes[0].name,
        gender: nodes[0].gender,
        member: nodes[0].member
      });
    }
    
    // 圆角半径
    const borderRadius = 8;
    
    // 修复节点尺寸
    for (const node of nodes) {
      // 确保节点有宽高
      if (!node.width) node.width = 120; // 提供默认宽度
      if (!node.height) node.height = 150; // 提供默认高度
      
      // 创建渐变背景
      const x = node.x;
      const y = node.y;
      const width = node.width;
      const height = node.height;
      const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
      
      // 默认背景颜色 - 当前用户节点不再使用特殊背景，而是使用其性别对应的背景
      if (node.isRoot) {
        // 根节点使用特殊背景 - 暖橙色渐变
        gradient.addColorStop(0, 'rgba(255, 248, 230, 0.95)');
        gradient.addColorStop(1, 'rgba(255, 235, 205, 0.9)');
      } else if (node.gender === 'male') {
        // 男性节点 - 蓝色渐变
        gradient.addColorStop(0, 'rgba(240, 248, 255, 0.95)');
        gradient.addColorStop(1, 'rgba(230, 240, 250, 0.9)');
      } else if (node.gender === 'female') {
        // 女性节点 - 粉色渐变
        gradient.addColorStop(0, 'rgba(255, 240, 245, 0.95)');
        gradient.addColorStop(1, 'rgba(250, 230, 240, 0.9)');
      } else {
        // 普通节点 - 灰白渐变
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(1, 'rgba(245, 245, 245, 0.9)');
      }
      
      this.ctx.fillStyle = gradient;
      
      // 绘制圆角矩形
      this.ctx.beginPath();
      this.ctx.moveTo(x + borderRadius, y);
      this.ctx.lineTo(x + width - borderRadius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
      this.ctx.lineTo(x + width, y + height - borderRadius);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height);
      this.ctx.lineTo(x + borderRadius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
      this.ctx.lineTo(x, y + borderRadius);
      this.ctx.quadraticCurveTo(x, y, x + borderRadius, y);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }
  
  /**
   * 批量绘制节点边框和阴影
   * @param {Array} nodes - 节点数组
   * @param {String} currentMemberId - 当前成员ID
   * @private
   */
  _batchDrawNodeBorders(nodes, currentMemberId) {
    // 圆角半径
    const borderRadius = 8;
    
    // 按类型分组，减少状态切换
    const maleNodes = [];
    const femaleNodes = [];
    const rootNodes = [];
    const currentNodes = [];
    const otherNodes = [];
    
    // 分类节点
    for (const node of nodes) {
      if (node.id === currentMemberId) {
        currentNodes.push(node);
      } else if (node.isRoot) {
        rootNodes.push(node);
      } else if (node.gender === 'male') {
        maleNodes.push(node);
      } else if (node.gender === 'female') {
        femaleNodes.push(node);
      } else {
        otherNodes.push(node);
      }
    }
    
    // 保存当前绘图状态
    this.ctx.save();
    
    // 添加阴影效果
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 2;
    this.ctx.shadowBlur = 5;
    
    // 绘制普通节点阴影
    if (otherNodes.length > 0) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      
      for (const node of otherNodes) {
        this._drawRoundedRect(node.x, node.y, node.width, node.height, borderRadius);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0)'; // 透明填充，只渲染阴影
        this.ctx.fill();
      }
    }
    
    // 绘制男性节点阴影 - 带淡蓝色调
    if (maleNodes.length > 0) {
      this.ctx.shadowColor = 'rgba(30, 144, 255, 0.3)';
      
      for (const node of maleNodes) {
        this._drawRoundedRect(node.x, node.y, node.width, node.height, borderRadius);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0)';
        this.ctx.fill();
      }
    }
    
    // 绘制女性节点阴影 - 带淡粉色调
    if (femaleNodes.length > 0) {
      this.ctx.shadowColor = 'rgba(255, 105, 180, 0.3)';
      
      for (const node of femaleNodes) {
        this._drawRoundedRect(node.x, node.y, node.width, node.height, borderRadius);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0)';
        this.ctx.fill();
      }
    }
    
    // 绘制根节点阴影 - 带橙色调
    if (rootNodes.length > 0) {
      this.ctx.shadowColor = 'rgba(255, 128, 0, 0.35)';
      this.ctx.shadowBlur = 6;
      
      for (const node of rootNodes) {
        this._drawRoundedRect(node.x, node.y, node.width, node.height, borderRadius);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0)';
        this.ctx.fill();
      }
    }
    
    // 绘制当前节点阴影和边框 - 使用更明显的黄色调
    if (currentNodes.length > 0) {
      // 绘制阴影
      this.ctx.shadowColor = 'rgba(255, 204, 0, 0.45)';
      this.ctx.shadowBlur = 7;
      
      for (const node of currentNodes) {
        this._drawRoundedRect(node.x, node.y, node.width, node.height, borderRadius);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0)';
        this.ctx.fill();
      }
      
      // 恢复绘图状态以绘制边框
      this.ctx.restore();
      
      // 为当前用户节点添加杏黄色边框
      this.ctx.strokeStyle = 'rgba(255, 204, 0, 0.9)'; // 杏黄色边框
      this.ctx.lineWidth = 2.5;
      
      for (const node of currentNodes) {
        this._drawRoundedRect(node.x, node.y, node.width, node.height, borderRadius);
        this.ctx.stroke();
      }
      
      // 防止函数末尾的this.ctx.restore()重复调用
      return;
    }
    
    // 恢复绘图状态
    this.ctx.restore();
  }
  
  /**
   * 绘制圆角矩形路径（不执行绘制）
   * @param {Number} x - 左上角x坐标
   * @param {Number} y - 左上角y坐标
   * @param {Number} width - 宽度
   * @param {Number} height - 高度
   * @param {Number} radius - 圆角半径
   * @private
   */
  _drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
  
  /**
   * 批量绘制节点内容
   * @param {Array} nodes - 节点数组
   * @param {String} currentMemberId - 当前成员ID
   * @private
   */
  _batchDrawNodeContents = ErrorHandler.wrap(function(nodes, currentMemberId) {
    // 保存当前的成员ID
    this.currentMemberId = currentMemberId;
    
    // 添加调试信息
    console.log('[Canvas2D] 绘制节点内容，节点数量:', nodes.length, '当前成员ID:', currentMemberId);
    if (nodes.length > 0) {
      console.log('[Canvas2D] 首个节点详细信息:', nodes[0]);
    }

    // 缓存图像加载状态，避免重复加载
    const loadedImages = this._imageCache || {};
    this._imageCache = loadedImages;
    
    // 设置字体和对齐方式
    this.ctx.textAlign = 'center';
    
    for (const node of nodes) {
      // 确保节点有基本属性
      if (!node.width) node.width = 120;
      if (!node.height) node.height = 150;
      
      const centerX = node.x + node.width / 2;
      const width = node.width;
      const height = node.height;
      
      // 获取成员完整信息
      const memberInfo = this._getMemberInfo(node);
      
      // 定义布局常量
      const padding = 10; // 增加内边距
      const contentWidth = width - (padding * 2); // 内容区宽度
      
      // 1. 绘制头像（如果有）
      const avatarUrl = memberInfo.avatar;
      if (avatarUrl) {
        // 恢复合适的头像尺寸
        const avatarSize = Math.min(width * 0.55, 55); // 适当调整头像尺寸
        const avatarY = node.y + 14; // 适当调整头像位置
        
        // 绘制头像背景圆形
        this.ctx.fillStyle = '#e0e0e0';
        this.ctx.beginPath();
        this.ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 尝试加载头像 - 使用微信小程序的方式加载图像
        if (avatarUrl && avatarUrl.length > 5) {
          if (loadedImages[avatarUrl]) {
            // 已加载图像
            this._drawAvatar(avatarUrl, centerX, avatarY, avatarSize);
          } else {
            // 加载新图像 - 使用微信API
            this._loadImage(avatarUrl, (success) => {
              if (success) {
                this._drawAvatar(avatarUrl, centerX, avatarY, avatarSize);
              }
            });
          }
        }
      }
      
      // 计算文本位置，确保布局舒适
      const hasAvatar = !!avatarUrl;
      // 如果有头像，从头像底部留出更多空间再开始文本
      const textStartY = hasAvatar ? node.y + (width * 0.55) + 28 : node.y + 25;
      let textY = textStartY;
      const textLineHeight = 17; // 增加文本行高
      
      // 2. 绘制姓名 (大号字体、加粗)
      if (memberInfo.name) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.font = 'bold 15px sans-serif'; // 调整姓名字号
        this.ctx.fillText(memberInfo.name, centerX, textY);
        textY += textLineHeight + 5; // 增加姓名与称呼之间的间距
      } else if ((node.id || '').length > 0) {
        // 没有姓名时显示占位符
        this.ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
        this.ctx.font = 'bold 15px sans-serif';
        this.ctx.fillText('未命名', centerX, textY);
        textY += textLineHeight + 5;
      }
      
      // 3. 绘制当前人与节点成员的称呼关系 (突出显示)
      if (memberInfo.relationToCurrentUser) {
        this.ctx.fillStyle = 'rgba(24, 144, 255, 0.9)'; // 蓝色突出显示
        this.ctx.font = 'bold 13px sans-serif'; // 调整称呼关系字号
        this.ctx.fillText(memberInfo.relationToCurrentUser, centerX, textY);
        textY += textLineHeight + 3; // 适当的行间距
      } else if (memberInfo.relation) {
        // 退化为显示基本关系
        this.ctx.fillStyle = 'rgba(102, 102, 102, 0.8)';
        this.ctx.font = '13px sans-serif';
        this.ctx.fillText(memberInfo.relation, centerX, textY);
        textY += textLineHeight + 3;
      }
      
      // 4. 绘制生卒年 (小号字体)
      if (memberInfo.yearRange) {
        this.ctx.fillStyle = 'rgba(102, 102, 102, 0.7)';
        this.ctx.font = '12px sans-serif';
        // 显示年份范围
        this.ctx.fillText(memberInfo.yearRange, centerX, textY);
      }
    }
  }, {
    operation: '绘制节点内容',
    onError(error) {
      console.error('[Canvas2D] 绘制节点内容失败:', error.message);
    }
  });
  
  /**
   * 获取成员完整信息
   * @param {Object} node - 节点数据
   * @returns {Object} 成员信息
   * @private
   */
  _getMemberInfo = function(node) {
    // 默认信息
    const info = {
      name: '',
      avatar: '',
      relation: '',             // 基本关系标签
      relationToCurrentUser: '', // 与当前用户的称呼关系
      yearRange: '',
      gender: ''
    };
    
    // 1. 尝试从节点直接获取
    if (node.name) info.name = node.name;
    if (node.avatar) info.avatar = node.avatar;
    if (node.avatarUrl) info.avatar = node.avatarUrl;
    if (node.relation) info.relation = node.relation;
    if (node.relationLabel) info.relation = node.relationLabel;
    if (node.relationToCurrentUser) info.relationToCurrentUser = node.relationToCurrentUser;
    if (node.gender) info.gender = node.gender;
    
    // 生成年份范围 - 优先从yearRange直接获取
    if (node.yearRange) {
      info.yearRange = node.yearRange;
    } else if (node.birthYear || node.deathYear) {
      // 直接从birthYear/deathYear获取
      const birth = node.birthYear || '';
      const death = node.deathYear || '';
      if (birth || death) {
        info.yearRange = `${birth || '?'} - ${death || ''}`;
      }
    } else if (node.birthDate || node.deathDate) {
      // 从birthDate/deathDate提取年份
      const birth = node.birthDate ? new Date(node.birthDate).getFullYear() : '';
      const death = node.deathDate ? new Date(node.deathDate).getFullYear() : '';
      if (birth || death) {
        info.yearRange = `${birth || '?'} - ${death || ''}`;
      }
    }
    
    // 2. 尝试从节点的member属性获取
    if (node.member) {
      if (!info.name && node.member.name) info.name = node.member.name;
      if (!info.avatar && node.member.avatar) info.avatar = node.member.avatar;
      if (!info.avatar && node.member.avatarUrl) info.avatar = node.member.avatarUrl;
      if (!info.relation && node.member.relation) info.relation = node.member.relation;
      if (!info.relationToCurrentUser && node.member.relationToCurrentUser) {
        info.relationToCurrentUser = node.member.relationToCurrentUser;
      }
      if (!info.gender && node.member.gender) info.gender = node.member.gender;
      
      // 生成年份范围 - 如果尚未设置
      if (!info.yearRange) {
        if (node.member.yearRange) {
          // 直接从成员yearRange获取
          info.yearRange = node.member.yearRange;
        } else if (node.member.birthYear || node.member.deathYear) {
          // 从成员birthYear/deathYear获取
          const birth = node.member.birthYear || '';
          const death = node.member.deathYear || '';
          if (birth || death) {
            info.yearRange = `${birth || '?'} - ${death || ''}`;
          }
        } else if (node.member.birthDate || node.member.deathDate) {
          // 从成员birthDate/deathDate提取年份
          const birth = node.member.birthDate ? new Date(node.member.birthDate).getFullYear() : '';
          const death = node.member.deathDate ? new Date(node.member.deathDate).getFullYear() : '';
          if (birth || death) {
            info.yearRange = `${birth || '?'} - ${death || ''}`;
          }
        }
      }
    }
    
    // 3. 尝试从其他可能的属性获取
    if (!info.name && node.memberName) info.name = node.memberName;
    if (!info.gender && node.sex) info.gender = node.sex === 'M' ? 'male' : (node.sex === 'F' ? 'female' : '');
    
    return info;
  };
  
  /**
   * 加载图像 - 适配微信小程序环境
   * @param {String} url - 图像URL
   * @param {Function} callback - 加载完成回调
   * @private
   */
  _loadImage = function(url, callback) {
    if (!url) {
      callback && callback(false);
      return;
    }
    
    // 检查是否已缓存
    if (this._imageCache && this._imageCache[url]) {
      callback && callback(true);
      return;
    }
    
    // 创建图片对象
    try {
      if (typeof wx !== 'undefined' && wx.createImage) {
        // 微信小程序环境
        const img = wx.createImage();
        img.onload = () => {
          if (this._imageCache) {
            this._imageCache[url] = img;
          }
          callback && callback(true);
        };
        img.onerror = () => {
          console.warn('[Canvas2D] 头像加载失败:', url);
          callback && callback(false);
        };
        img.src = url;
      } else if (typeof wx !== 'undefined' && wx.downloadFile) {
        // 另一种微信小程序环境
        wx.downloadFile({
          url: url,
          success: (res) => {
            if (res.statusCode === 200) {
              if (this._imageCache) {
                this._imageCache[url] = res.tempFilePath;
              }
              callback && callback(true);
            } else {
              console.warn('[Canvas2D] 头像下载失败:', res.statusCode);
              callback && callback(false);
            }
          },
          fail: (err) => {
            console.warn('[Canvas2D] 头像下载失败:', err);
            callback && callback(false);
          }
        });
      } else {
        // 通用环境 - 浏览器
        const img = new Image();
        img.onload = () => {
          if (this._imageCache) {
            this._imageCache[url] = img;
          }
          callback && callback(true);
        };
        img.onerror = () => {
          console.warn('[Canvas2D] 头像加载失败:', url);
          callback && callback(false);
        };
        img.src = url;
      }
    } catch (error) {
      console.error('[Canvas2D] 加载图像出错:', error);
      callback && callback(false);
    }
  };
  
  /**
   * 绘制头像
   * @param {String} url - 图像URL
   * @param {Number} centerX - 中心X坐标
   * @param {Number} y - Y坐标
   * @param {Number} size - 尺寸
   * @private
   */
  _drawAvatar = function(url, centerX, y, size) {
    if (!this._imageCache || !this._imageCache[url]) {
      return;
    }
    
    try {
      const x = centerX - size / 2;
      
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(centerX, y + size / 2, size / 2, 0, Math.PI * 2);
      this.ctx.clip();
      
      // 绘制图像
      const img = this._imageCache[url];
      this.ctx.drawImage(img, x, y, size, size);
      
      this.ctx.restore();
    } catch (error) {
      console.error('[Canvas2D] 绘制头像出错:', error);
    }
  };

  /**
   * 销毁资源
   */
  dispose = ErrorHandler.wrap(function() {
    // 清理资源
    this.canvas = null;
    this.ctx = null;
    this.coordSystem = null;
  }, {
    operation: '释放Canvas2D树渲染器资源',
    onError(error) {
      console.error('[Canvas2D] 释放资源失败:', error.message);
    }
  });
}

/**
 * Canvas 2D渲染器
 * 作为组件与Canvas 2D树渲染器的桥接层
 */
class Canvas2DRenderer {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Object} options.canvas - Canvas节点
   * @param {Object} options.ctx - 2D上下文
   * @param {Object} [options.component] - 组件实例
   */
  constructor(options) {
    // 支持直接传递组件或传递options对象
    if (options.component) {
      this.component = options.component;
      this.canvas = options.canvas || options.component.canvas;
      this.ctx = options.ctx || (this.canvas ? this.canvas.getContext('2d') : null);
    } else if (options.canvas) {
      this.canvas = options.canvas;
      this.ctx = options.ctx || (this.canvas ? this.canvas.getContext('2d') : null);
      this.component = null;
    } else {
      console.error('Canvas 2D渲染器初始化失败：未提供Canvas或组件实例');
      return;
    }

    // 初始化树渲染器
    this.treeRenderer = null;
    this._initTreeRenderer();
    
    // 精灵图相关属性
    this._spriteEnabled = false;
    this._spriteCache = null;
    this._avatarUrls = new Set(); // 用于收集需要的头像URL
    this._imageCache = {}; // 图像缓存
  }

  /**
   * 初始化树渲染器
   * @private
   */
  _initTreeRenderer = ErrorHandler.wrap(function() {
    if (!this.canvas || !this.ctx) {
      console.error('[Canvas2D] 无效的Canvas或上下文，无法初始化树渲染器');
      return;
    }

    // 创建树渲染器
    this.treeRenderer = new Canvas2DTreeRenderer(this.canvas, this.ctx);
  }, {
    operation: '初始化树渲染器',
    onError(error) {
      console.error('[Canvas2D] 初始化树渲染器失败:', error.message);
    }
  });

  /**
   * 检查是否可用
   * @returns {Boolean} 是否可用
   */
  canUse() {
    return !!this.ctx && !!this.canvas && !!this.treeRenderer;
  }

  /**
   * 清除画布
   */
  clear = ErrorHandler.wrap(function() {
    if (this.treeRenderer) {
      this.treeRenderer.clear();
    }
  }, {
    operation: '清除画布',
    onError(error) {
      console.error('[Canvas2D] 清除画布失败:', error.message);
    }
  });

  /**
   * 更新视口尺寸
   * @param {Number} width - 宽度
   * @param {Number} height - 高度
   */
  updateViewport = ErrorHandler.wrap(function(width, height) {
    if (this.treeRenderer) {
      this.treeRenderer.updateViewport(width, height);
    }
  }, {
    operation: '更新视口尺寸',
    onError(error) {
      console.error('[Canvas2D] 更新视口尺寸失败:', error.message);
    }
  });

  /**
   * 设置变换参数
   * @param {Number} offsetX - X轴偏移
   * @param {Number} offsetY - Y轴偏移
   * @param {Number} scale - 缩放比例
   */
  setTransform = ErrorHandler.wrap(function(offsetX, offsetY, scale) {
    if (this.treeRenderer) {
      this.treeRenderer.setTransform(offsetX, offsetY, scale);
    }
  }, {
    operation: '设置变换参数',
    onError(error) {
      console.error('[Canvas2D] 设置变换参数失败:', error.message);
    }
  });

  /**
   * 渲染族谱树
   * @param {Object} options - 渲染选项
   * @returns {Boolean} 渲染是否成功
   */
  render = ErrorHandler.wrap(function(options) {
    if (!this.treeRenderer) {
      console.warn('[Canvas2D] 树渲染器未初始化，无法渲染');
      return false;
    }

    const { 
      visibleArea, 
      nodes, 
      connectors, 
      currentMemberId, 
      layeredRendering, 
      spriteSupport 
    } = options;
    
    // 更新精灵图设置
    this._spriteEnabled = spriteSupport && spriteSupport.enabled;
    this._spriteCache = spriteSupport && spriteSupport.spriteCache;

    // 获取当前变换参数
    const transformOffsetX = options.offsetX !== undefined ? 
      options.offsetX : (this.component ? this.component.data.offsetX : 0);
    const transformOffsetY = options.offsetY !== undefined ? 
      options.offsetY : (this.component ? this.component.data.offsetY : 0);
    const transformScale = options.scale !== undefined ? 
      options.scale : (this.component ? this.component.data.currentScale : 1.0);

    // 按优化模式渲染
    if (this.component && this.component.data.layeredRendering && 
        this.component.data.layeredRendering.enabled && layeredRendering) {
      return this._renderLayers(layeredRendering, transformOffsetX, transformOffsetY, transformScale);
    } else {
      // 执行标准渲染
      return this.treeRenderer.render({
        nodes,
        connectors,
        visibleArea,
        currentMemberId,
        transform: {
          offsetX: transformOffsetX,
          offsetY: transformOffsetY,
          scale: transformScale
        }
      });
    }
  }, {
    operation: '渲染族谱树',
    defaultValue: false,
    onError(error) {
      console.error('[Canvas2D] 渲染出错:', error.message);
      return false;
    }
  });
  
  /**
   * 分层渲染
   * @param {Object} layeredData - 分层数据
   * @param {Number} offsetX - X轴偏移
   * @param {Number} offsetY - Y轴偏移
   * @param {Number} scale - 缩放比例
   * @returns {Boolean} 渲染是否成功
   * @private
   */
  _renderLayers = ErrorHandler.wrap(function(layeredData, offsetX, offsetY, scale) {
    const { layerCount, layerNodes, layerConnectors, currentLayer } = layeredData;
    
    if (layerCount === 0) return true;
    
    // 优化渲染顺序：使用距离排序算法
    const renderOrder = [];
    
    // 为所有层构建一个距离映射
    for (let i = 0; i < layerCount; i++) {
      const distance = Math.abs(i - currentLayer);
      renderOrder.push({ 
        layer: i, 
        distance,
        isCurrent: i === currentLayer
      });
    }
    
    // 按距离排序，远的层先渲染（背景），再渲染近的层（前景）
    renderOrder.sort((a, b) => {
      // 非当前层按距离排序
      if (!a.isCurrent && !b.isCurrent) {
        return b.distance - a.distance;
      }
      // 当前层始终最后渲染（置于最上层）
      return a.isCurrent ? 1 : -1;
    });
    
    // 清除画布
    this.clear();
    
    // 设置背景
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    
    // 按顺序渲染各层
    for (const item of renderOrder) {
      const layer = item.layer;
      const isCurrentLayer = layer === currentLayer;
      
      // 跳过没有内容的层，减少不必要的状态切换
      const hasConnectors = layerConnectors[layer] && layerConnectors[layer].length > 0;
      const hasNodes = layerNodes[layer] && layerNodes[layer].length > 0;
      
      if (!hasConnectors && !hasNodes) continue;
      
      // 设置层的透明度 - 按距离计算渐变透明度，增强层次感
      const alpha = isCurrentLayer ? 1.0 : Math.max(0.6, 1 - (item.distance * 0.1));
      this.ctx.globalAlpha = alpha;
      
      // 渲染当前层
      this.treeRenderer.render({
        nodes: hasNodes ? layerNodes[layer] : [],
        connectors: hasConnectors ? layerConnectors[layer] : [],
        visibleArea: null, // 分层渲染时不进行可见性筛选
        currentMemberId: this.component ? this.component.properties.currentMemberId : null,
        transform: {
          offsetX,
          offsetY,
          scale
        }
      });
    }
    
    // 恢复默认状态
    this.ctx.globalAlpha = 1.0;
    
    return true;
  }, {
    operation: '分层渲染',
    defaultValue: false,
    onError(error) {
      console.error('[Canvas2D] 分层渲染失败:', error.message);
      return false;
    }
  });

  /**
   * 销毁资源
   */
  dispose = ErrorHandler.wrap(function() {
    if (this.treeRenderer) {
      this.treeRenderer.dispose();
      this.treeRenderer = null;
    }
    
    this.canvas = null;
    this.ctx = null;
    this._spriteCache = null;
    this._avatarUrls.clear();
  }, {
    operation: '释放Canvas2D渲染器资源',
    onError(error) {
      console.error('[Canvas2D] 释放资源失败:', error.message);
    }
  });
}

module.exports = {
  Canvas2DRenderer
}; 