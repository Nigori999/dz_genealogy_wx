// 家族树页面
const app = getApp();
const api = require('../../services/api');
const treeUtil = require('../../utils/tree-util');

// 树节点布局常量
const LAYOUT_CONFIG = {
  nodeWidth: 120,
  nodeHeight: 150,
  horizontalGap: 60,
  verticalGap: 80,
  edgePadding: 100,
  // 添加左侧边距，确保最左侧节点完全可见
  leftPadding: 20
};

// 缩放步长
const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    currentGenealogy: null,
    currentUser: null,
    allMembers: [],
    familyTree: null,
    allTreeNodes: [],         // 所有树节点（完整树）
    allTreeConnectors: [],    // 所有连接线（完整树）
    treeWidth: 1000,
    treeHeight: 1000,
    treeViewHeight: 500,
    treeViewWidth: 0,         // 视图宽度
    listViewHeight: 500,
    viewMode: 'tree',         // tree 或 list
    direction: 'vertical',    // vertical 或 horizontal
    generations: [],          // 所有世代数
    selectedGeneration: 0,    // 0 表示全部
    filteredMembers: [],
    maxGeneration: 0,
    zoomScale: 1,             // 缩放比例
    zoomLevel: 100,           // 缩放百分比
    currentUserNodeInfo: null, // 当前用户在树图中的节点信息
    isControlsExpanded: false, // 控制按钮组是否展开
    centerNodeGeneration: null, // 屏幕中央节点的世代
    MIN_ZOOM: MIN_ZOOM,       // 最小缩放值
    MAX_ZOOM: MAX_ZOOM,       // 最大缩放值
    isHistoryPopupVisible: false, // 家族史弹窗是否可见
    isGuidePopupVisible: false,   // 操作指引弹窗是否可见
    genealogyHistory: '',     // 家族史内容
    // 性能优化设置 - 默认全部启用，系统会自动根据设备能力降级
    optimization: {
      sprite: true,      // 是否启用精灵图
      layered: true,     // 是否启用分层渲染
      webgl: true,       // 是否启用WebGL渲染
      autoMode: true     // 自动模式，根据设备能力自动调整
    },
    // 设备能力检测结果
    deviceCapabilities: {
      hasCanvas2D: false,
      hasWebGL: false,
      hasOffscreenCanvas: false
    }
  },

  // 用于缓存的成员Map
  _membersMap: null,
  
  // 用于存储节点Map，提高查找速度
  _nodesMap: null,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 检查登录状态
    if (!app.globalData.isLogin) {
      app.checkLogin(false);
      return;
    }
    
    this._initViewHeights();
    this._detectDeviceCapabilities();
    this._loadUserAndGenealogy();
    
    // 延迟初始化Canvas组件引用
    wx.nextTick(() => {
      this.treeCanvas = this.selectComponent('#canvasFamilyTree');
    });
  },

  /**
   * 初始化视图高度
   */
  _initViewHeights: function() {
    const systemInfo = wx.getSystemInfoSync();
    const windowHeight = systemInfo.windowHeight;
    const windowWidth = systemInfo.windowWidth;
    
    // 计算视图高度（减去顶部区域高度）
    const genealogyInfoHeight = 100; // 族谱信息高度
    const controlsHeight = 60; // 控制面板高度
    const headerHeight = genealogyInfoHeight + controlsHeight; // 总头部高度
    
    // 计算可用高度
    const availableHeight = windowHeight - headerHeight;
    
    console.log('窗口高度:', windowHeight, '可用高度:', availableHeight);
    
    this.setData({
      treeViewHeight: availableHeight,
      treeViewWidth: windowWidth,
      listViewHeight: availableHeight - 50 // 减去世代筛选器高度
    });
    
    // 延迟更新Canvas视图大小，确保DOM已渲染
    setTimeout(() => {
      const canvasFamilyTree = this.selectComponent('#canvasFamilyTree');
      if (canvasFamilyTree) {
        console.log('更新Canvas视图大小');
        canvasFamilyTree._resizeCanvas && canvasFamilyTree._resizeCanvas();
      }
    }, 300);
  },

  /**
   * 检测设备能力
   */
  _detectDeviceCapabilities: function() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      const sdkVersion = systemInfo.SDKVersion;
      
      // 检查基础库版本, Canvas 2D API需要2.9.0+
      const hasCanvas2D = this._compareVersion(sdkVersion, '2.9.0') >= 0;
      
      // 检查是否支持WebGL
      let hasWebGL = false;
      try {
        const testCanvas = wx.createOffscreenCanvas({ type: 'webgl' });
        hasWebGL = !!testCanvas.getContext('webgl');
      } catch (e) {
        console.warn('WebGL不受支持:', e);
      }
      
      // 检查是否支持离屏Canvas (用于精灵图)
      let hasOffscreenCanvas = false;
      try {
        const offCanvas = wx.createOffscreenCanvas({ type: '2d' });
        hasOffscreenCanvas = !!offCanvas && !!offCanvas.getContext('2d');
      } catch (e) {
        console.warn('离屏Canvas不受支持:', e);
      }
      
      // 设置设备能力检测结果
      this.setData({
        deviceCapabilities: {
          hasCanvas2D,
          hasWebGL,
          hasOffscreenCanvas
        }
      });
      
      console.log('设备能力检测结果:', {
        基础库版本: sdkVersion,
        Canvas2D: hasCanvas2D ? '支持' : '不支持',
        WebGL: hasWebGL ? '支持' : '不支持',
        离屏Canvas: hasOffscreenCanvas ? '支持' : '不支持'
      });
      
    } catch (e) {
      console.error('设备能力检测失败:', e);
    }
  },
  
  /**
   * 比较版本号
   */
  _compareVersion: function(v1, v2) {
    const v1Parts = v1.split('.');
    const v2Parts = v2.split('.');
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = parseInt(v1Parts[i] || 0);
      const v2Part = parseInt(v2Parts[i] || 0);
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  },

  /**
   * 加载用户和族谱数据
   */
  _loadUserAndGenealogy: function() {
    // 并行加载用户信息和族谱信息
    Promise.all([
      this._getUserInfo(),
      this._getGenealogy()
    ]).catch(error => {
      console.error('初始化数据失败:', error);
    });
  },

  /**
   * 获取当前用户信息
   */
  _getUserInfo: function() {
    return api.userAPI.getUserInfo()
      .then(user => {
        this.setData({ currentUser: user });
        return user;
      })
      .catch(error => {
        console.error('获取用户信息失败:', error);
        return null;
      });
  },

  /**
   * 获取当前族谱
   */
  _getGenealogy: function() {
    const currentGenealogy = app.getCurrentGenealogy();
    
    if (currentGenealogy) {
      this.setData({
        currentGenealogy,
        isLoading: true
      });
      
      // 加载族谱数据
      return this._loadGenealogyData(currentGenealogy.id);
    } else {
      // 跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
      return Promise.reject('无当前族谱');
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 检查登录状态
    if (!app.globalData.isLogin) {
      app.checkLogin(false);
      return;
    }
    
    // 如果有更新，重新加载数据
    if (this.data.currentGenealogy && this.needRefresh) {
      this._loadGenealogyData(this.data.currentGenealogy.id);
      this.needRefresh = false;
    }
    
    // 确保组件引用存在，若不存在则重新获取
    if (!this.treeCanvas) {
      this.treeCanvas = this.selectComponent('#canvasFamilyTree');
    }
    
    if (this.treeCanvas) {
      // 应用优化模式设置
      this._applyAutoOptimizations();
    }
  },

  /**
   * 监听页面尺寸变化
   */
  onResize: function(e) {
    this._initViewHeights();
  },

  /**
   * 加载族谱数据
   */
  _loadGenealogyData: function (genealogyId) {
    if (!genealogyId) return Promise.reject('无族谱ID');
    
    this.setData({ isLoading: true });
    
    return api.memberAPI.getMembers(genealogyId)
      .then(members => {
        // 数据验证和调试
        if (!members || members.length === 0) {
          this.setData({
            allMembers: [],
            familyTree: null,
            isLoading: false
          });
          return null;
        }
        
        // 创建成员Map，提高后续查找效率
        this._createMembersMap(members);
        
        // 处理成员数据，一次性设置多个相关数据，减少setData调用次数
        const generations = [...new Set(members.map(m => m.generation).filter(Boolean))].sort((a, b) => a - b);
        const maxGeneration = generations.length > 0 ? Math.max(...generations) : 0;
        
        this.setData({
          allMembers: members,
          generations,
          maxGeneration,
          filteredMembers: members
        });
        
        // 获取当前族谱
        const currentGenealogy = this.data.currentGenealogy;
        if (!currentGenealogy) {
          this.setData({ isLoading: false });
          return null;
        }
        
        // 确定根成员ID
        let rootMemberId = currentGenealogy.rootMemberId;
        if (!rootMemberId && members.length > 0) {
          rootMemberId = members[0].id;
        }
        
        // 加载族谱历史
        this._loadGenealogyHistory(genealogyId);
        
        // 构建族谱树
        return this._buildFamilyTree(members, rootMemberId);
      })
      .catch(error => {
        console.error('Load members failed:', error);
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
        
        return null;
      });
  },

  /**
   * 创建成员Map，用于快速查找
   */
  _createMembersMap: function(members) {
    if (!members || members.length === 0) {
      this._membersMap = new Map();
      return;
    }
    
    // 创建成员Map，提高查找效率
    this._membersMap = new Map();
    members.forEach(member => {
      this._membersMap.set(member.id, member);
    });
  },

  /**
   * 加载族谱历史
   */
  _loadGenealogyHistory: function(genealogyId) {
    api.genealogyAPI.getGenealogyHistory(genealogyId)
      .then(result => {
        if (result && result.history) {
          this.setData({
            genealogyHistory: result.history
          });
        }
      })
      .catch(error => {
        console.error('加载族谱历史失败:', error);
      });
  },

    /**   * 显示家族史弹窗   */  showFamilyHistory: function() {    this.setData({      isHistoryPopupVisible: true,      isGuidePopupVisible: false    });  },  /**   * 显示操作指引弹窗   */  showGuide: function() {    this.setData({      isGuidePopupVisible: true,      isHistoryPopupVisible: false    });  },  /**   * 隐藏所有弹窗   */  hidePopup: function() {    this.setData({      isHistoryPopupVisible: false,      isGuidePopupVisible: false    });  },

  /**
   * 构建族谱树
   */
  _buildFamilyTree: function (members, rootMemberId) {
    // 添加参数验证
    if (!members || !members.length) {
      this.setData({
        familyTree: null,
        isLoading: false
      });
      return null;
    }
    
    if (!rootMemberId) {
      // 尝试从成员列表中找到一个作为根节点
      const firstMember = members[0];
      if (firstMember) {
        rootMemberId = firstMember.id;
      } else {
        this.setData({
          familyTree: null,
          isLoading: false
        });
        return null;
      }
    }
    
    // 检查根节点是否在成员列表中
    const rootExists = members.some(m => m.id === rootMemberId);
    if (!rootExists) {
      // 尝试查找一个合适的成员作为根节点
      const firstMember = members[0];
      if (firstMember) {
        rootMemberId = firstMember.id;
      }
    }
    
    // 使用树形结构工具构建族谱树
    const familyTree = treeUtil.buildFamilyTree(members, rootMemberId);
    
    if (!familyTree) {
      console.error('树形结构构建失败');
      this.setData({
        familyTree: null,
        isLoading: false
      });
      return null;
    }
    
    // 布局族谱树节点
    const direction = this.data.direction || 'vertical'; // 确保总是有方向值
    
    const { nodeWidth, nodeHeight, horizontalGap, verticalGap, leftPadding } = LAYOUT_CONFIG;
    
    try {
      const layoutTree = treeUtil.layoutFamilyTree(
        familyTree,
        nodeWidth,
        nodeHeight,
        horizontalGap,
        verticalGap
      );
      
      if (!layoutTree) {
        console.error('树形结构布局失败');
        this.setData({
          familyTree: null,
          isLoading: false
        });
        return null;
      }
      
      // 为所有节点添加左侧边距，确保最左侧节点完全可见
      this._addLeftPadding(layoutTree, leftPadding);
      
      // 生成树节点和连接线数据
      const { nodes, connectors, maxX, maxY } = this._generateTreeNodesAndConnectors(layoutTree);
      
      // 计算树的宽高，确保有足够空间
      const treeWidth = maxX + LAYOUT_CONFIG.edgePadding;
      const treeHeight = maxY + LAYOUT_CONFIG.edgePadding;
      
      // 批量设置数据，减少setData次数
      this.setData({
        familyTree: layoutTree,
        allTreeNodes: nodes,            // 存储所有节点
        allTreeConnectors: connectors,  // 存储所有连接线
        treeWidth,
        treeHeight,
        isLoading: false,
        // 重置缩放和位置
        zoomScale: 1,
        zoomLevel: 100,
        direction: 'vertical' // 确保总是使用垂直方向
      }, () => {
        // 更新/初始化Canvas组件引用
        if (!this.treeCanvas) {
          this.treeCanvas = this.selectComponent('#canvasFamilyTree');
          console.log('初始化Canvas组件引用:', !!this.treeCanvas);
        }
        
        if (this.treeCanvas) {
          // 传递必要的属性
          this.treeCanvas.setData({
            viewportWidth: this.data.treeViewWidth,
            viewportHeight: this.data.treeViewHeight,
            ready: true
          }, () => {
            // 确保属性设置后再重置
            setTimeout(() => {
              // 重置树图视图，使其居中显示
              this.treeCanvas.reset && this.treeCanvas.reset();
            }, 100);
          });
        } else {
          console.error('未找到Canvas组件');
        }
      });
      
      return layoutTree;
    } catch (error) {
      console.error('构建族谱树过程中出错:', error);
      this.setData({
        familyTree: null,
        isLoading: false
      });
      
      wx.showToast({
        title: '族谱树生成失败',
        icon: 'none'
      });
      
      return null;
    }
  },
  
  /**
   * 为所有节点添加左侧边距
   */
  _addLeftPadding: function(tree, padding) {
    if (!tree) return;
    
    const applyPadding = (node) => {
      if (!node) return;
      
      // 添加左侧边距
      node.x += padding;
      
      // 处理配偶节点
      if (node.spouses) {
        node.spouses.forEach(spouse => {
          spouse.x += padding;
        });
      }
      
      // 递归处理子节点
      if (node.children) {
        node.children.forEach(child => {
          applyPadding(child);
        });
      }
    };
    
    applyPadding(tree);
  },

  /**
   * 创建节点Map，用于快速查找
   */
  _createNodesMap: function(nodes) {
    if (!nodes || nodes.length === 0) {
      this._nodesMap = new Map();
      return;
    }
    
    // 创建节点Map，提高查找效率
    this._nodesMap = new Map();
    nodes.forEach(node => {
      this._nodesMap.set(node.id, node);
    });
  },

  /**
   * 生成树节点和连接线数据
   */
  _generateTreeNodesAndConnectors: function (tree) {
    if (!tree) return { nodes: [], connectors: [], maxX: 0, maxY: 0 };
    
    const nodes = [];
    const connectors = [];
    let maxX = 0;
    let maxY = 0;
    const direction = this.data.direction || 'vertical';
    
    // 递归遍历树节点
    const traverseTree = (node, parentId = null) => {
      if (!node) return;
      
      // 根据节点ID找到对应的成员数据
      const memberData = this._membersMap ? this._membersMap.get(node.id) : null;
      
      // 添加节点 - 确保member是真正的成员数据，而不是整个节点对象
      const nodeData = {
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        member: memberData // 使用真正的成员数据
      };
      
      nodes.push(nodeData);
      
      // 更新最大坐标
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
      
      // 添加与父节点的连接线
      if (parentId) {
        // 查找父节点
        const parentNode = nodes.find(n => n.id === parentId);
        if (parentNode) {
          // 添加父子连接线
          if (direction === 'vertical') {
            // 垂直方向的连接线
            connectors.push({
              id: `${parentId}-${nodeData.id}`,
              fromId: parentId,
              toId: nodeData.id,
              fromX: parentNode.x + parentNode.width / 2,
              fromY: parentNode.y + parentNode.height,
              toX: nodeData.x + nodeData.width / 2,
              toY: nodeData.y,
              type: 'parent-child'
            });
          } else {
            // 水平方向的连接线
            connectors.push({
              id: `${parentId}-${nodeData.id}`,
              fromId: parentId,
              toId: nodeData.id,
              fromX: parentNode.x + parentNode.width,
              fromY: parentNode.y + parentNode.height / 2,
              toX: nodeData.x,
              toY: nodeData.y + nodeData.height / 2,
              type: 'parent-child'
            });
          }
        }
      }
      
      // 添加与配偶的连接线
      if (node.spouses && node.spouses.length > 0) {
        node.spouses.forEach(spouse => {
          // 获取配偶的成员数据
          const spouseMemberData = this._membersMap ? this._membersMap.get(spouse.id) : null;
          
          // 添加配偶节点
          const spouseNode = {
            id: spouse.id,
            x: spouse.x,
            y: spouse.y,
            width: spouse.width,
            height: spouse.height,
            member: spouseMemberData // 使用真正的配偶成员数据
          };
          
          nodes.push(spouseNode);
          
          // 更新最大坐标
          maxX = Math.max(maxX, spouse.x + spouse.width);
          maxY = Math.max(maxY, spouse.y + spouse.height);
          
          // 添加配偶连接线
          if (direction === 'vertical') {
            // 垂直方向的连接线
            connectors.push({
              id: `${node.id}-${spouseNode.id}`,
              fromId: node.id,
              toId: spouseNode.id,
              fromX: nodeData.x + nodeData.width,
              fromY: nodeData.y + nodeData.height / 2,
              toX: spouseNode.x,
              toY: spouseNode.y + spouseNode.height / 2,
              type: 'spouse'
            });
          } else {
            // 水平方向的连接线
            connectors.push({
              id: `${node.id}-${spouseNode.id}`,
              fromId: node.id,
              toId: spouseNode.id,
              fromX: nodeData.x + nodeData.width / 2,
              fromY: nodeData.y + nodeData.height,
              toX: spouseNode.x + spouseNode.width / 2,
              toY: spouseNode.y,
              type: 'spouse'
            });
          }
        });
      }
      
      // 递归遍历子节点
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          traverseTree(child, node.id);
        });
      }
    };
    
    traverseTree(tree);
    
    return { nodes, connectors, maxX, maxY };
  },

  /**
   * 切换视图模式
   */
  switchViewMode: function (e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode !== this.data.viewMode) {
      this.setData({ 
        viewMode: mode,
        direction: 'vertical' // 确保总是使用垂直显示方向
      });
    }
  },

  /**
   * 切换方向
   */
  switchDirection: function (e) {
    const direction = e.currentTarget.dataset.direction;
    if (direction !== this.data.direction) {
      this.setData({ 
        direction: direction,
        isLoading: true
      });
      
      // 重新构建家族树
      wx.nextTick(() => {
        if (this.data.allMembers.length > 0 && this.data.currentGenealogy) {
          this._buildFamilyTree(
            this.data.allMembers, 
            this.data.currentGenealogy.rootMemberId
          );
        }
      });
    }
  },

  /**
   * 筛选世代
   */
  selectGeneration: function (e) {
    const generation = parseInt(e.currentTarget.dataset.generation);
    
    if (generation !== this.data.selectedGeneration) {
      this.setData({
        selectedGeneration: generation,
        filteredMembers: generation === 0 
          ? this.data.allMembers 
          : this.data.allMembers.filter(m => m.generation === generation)
      });
    }
  },

  /**
   * 处理Canvas缩放事件
   */
  onCanvasScale: function(e) {
    const { scale } = e.detail;
    this.setData({
      zoomScale: scale,
      zoomLevel: Math.round(scale * 100)
    });
  },

  /**
   * 切换控制面板展开/收起状态
   */
  toggleControls: function() {
    this.setData({
      isControlsExpanded: !this.data.isControlsExpanded
    });
  },
  
  /**
   * 放大
   */
  zoomIn: function() {
    // 计算新的缩放比例，确保不超过最大值
    const newScale = Math.min(this.data.zoomScale + ZOOM_STEP, MAX_ZOOM);
    
    if (newScale !== this.data.zoomScale) {
      this.setData({
        zoomScale: newScale,
        zoomLevel: Math.round(newScale * 100)
      });
    }
  },
  
  /**
   * 缩小
   */
  zoomOut: function() {
    // 计算新的缩放比例，确保不低于最小值
    const newScale = Math.max(this.data.zoomScale - ZOOM_STEP, MIN_ZOOM);
    
    if (newScale !== this.data.zoomScale) {
      this.setData({
        zoomScale: newScale,
        zoomLevel: Math.round(newScale * 100)
      });
    }
  },

  /**
   * 重置缩放和位置
   */
  resetZoom: function() {
    this.setData({
      zoomScale: 1,
      zoomLevel: 100
    });
    
    // 确保组件引用存在
    if (!this.treeCanvas) {
      this.treeCanvas = this.selectComponent('#canvasFamilyTree');
    }
    
    // 获取Canvas组件实例，调用重置方法
    if (this.treeCanvas && this.treeCanvas.reset) {
      this.treeCanvas.reset();
    } else {
      console.error('重置视图失败：未找到Canvas组件或组件未实现reset方法');
    }
  },

  /**
   * 定位到当前用户
   */
  onTapLocateButton: function() {
    if (!this.data.currentUser || !this.data.currentUser.memberId) {
      wx.showToast({
        title: '用户未关联成员',
        icon: 'none'
      });
      return;
    }
    
    // 确保组件引用存在
    if (!this.treeCanvas) {
      this.treeCanvas = this.selectComponent('#canvasFamilyTree');
    }
    
    // 调用Canvas组件的定位方法
    if (this.treeCanvas && this.treeCanvas.locateNode) {
      const result = this.treeCanvas.locateNode(this.data.currentUser.memberId);
      
      if (result) {
        // 成功定位
        wx.vibrateShort({
          type: 'light'
        });
        
        wx.showToast({
          title: '已定位到当前用户',
          icon: 'success',
          duration: 1000
        });
      } else {
        wx.showToast({
          title: '定位失败',
          icon: 'none'
        });
      }
    } else {
      console.error('定位失败：未找到Canvas组件或组件未实现locateNode方法');
      wx.showToast({
        title: '定位功能不可用',
        icon: 'none'
      });
    }
  },

  /**
   * 节点被选中
   */
  onNodeSelect: function (e) {
    console.log('节点被选中', e.detail);
    
    // 首先检查是否有完整的member对象
    if (e.detail.member) {
      const member = e.detail.member;
      console.log('使用传递的完整member对象:', member);
      
      // 获取族谱ID
      const genealogyId = this.data.currentGenealogy ? this.data.currentGenealogy.id : '';
      
      // 跳转到成员详情页面
      wx.navigateTo({
        url: `/pages/member-detail/member-detail?genealogyId=${genealogyId}&memberId=${member.id}`
      });
      return;
    }
    
    // 兼容旧版处理：如果没有完整member对象，仅使用memberId
    const memberId = e.detail.memberId;
    
    // 获取族谱ID
    const genealogyId = this.data.currentGenealogy ? this.data.currentGenealogy.id : '';
    
    if (!memberId || !genealogyId) {
      wx.showToast({
        title: '无法获取成员信息',
        icon: 'none'
      });
      return;
    }
    
    // 跳转到成员详情页面
    wx.navigateTo({
      url: `/pages/member-detail/member-detail?genealogyId=${genealogyId}&memberId=${memberId}`
    });
  },

  /**
   * 成员详情
   */
  onMemberDetail: function (e) {
    const member = e.detail.member;
    
    wx.navigateTo({
      url: `/pages/member-detail/member-detail?id=${member.id}`
    });
  },

  /**
   * 编辑成员
   */
  onMemberEdit: function (e) {
    const member = e.detail.member;
    
    wx.navigateTo({
      url: `/pages/member-edit/member-edit?id=${member.id}`
    });
  },

  /**
   * 跳转到添加成员页面
   */
  navigateToAddMember: function () {
    wx.navigateTo({
      url: '/pages/member-add/member-add'
    });
  },

  /**
   * 用户下拉刷新
   */
  onPullDownRefresh: function () {
    const { currentGenealogy } = this.data;
    
    if (currentGenealogy) {
      // 并行执行数据加载和族谱详情获取
      Promise.all([
        this._loadGenealogyData(currentGenealogy.id),
        api.genealogyAPI.getGenealogyDetail(currentGenealogy.id)
          .then(genealogy => {
            if (genealogy) {
              app.setCurrentGenealogy(genealogy);
              this.setData({ currentGenealogy: genealogy });
            }
            return genealogy;
          })
      ])
      .finally(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const { currentGenealogy } = this.data;
    
    if (currentGenealogy) {
      return {
        title: `「${currentGenealogy.name}」家族树`,
        path: `/pages/share/share?genealogyId=${currentGenealogy.id}&tab=tree`,
        imageUrl: '/images/share_tree.png'
      };
    }
    
    return {
      title: '云族谱-云端数字族谱',
      path: '/pages/index/index',
      imageUrl: '/images/share_app.png'
    };
  },

  /**
   * 应用族谱设置
   */
  _applyFamilyTreeSetting() {
    // 应用性能优化设置，根据设备能力自动调整
    this._applyAutoOptimizations();
  },

  /**
   * 自动应用优化设置
   * 根据设备能力自动选择最佳优化组合
   */
  _applyAutoOptimizations() {
    if (!this.treeCanvas) return;

    const { hasCanvas2D, hasWebGL, hasOffscreenCanvas } = this.data.deviceCapabilities;
    
    // 根据设备能力决定启用哪些优化
    const optimizations = {
      // 精灵图需要离屏Canvas支持
      sprite: hasOffscreenCanvas,
      // 分层渲染只需要基本Canvas支持，几乎所有设备都可用
      layered: true,
      // WebGL需要WebGL支持
      webgl: hasWebGL
    };
    
    // 更新状态
    this.setData({
      optimization: {
        ...this.data.optimization,
        ...optimizations
      }
    });
    
    // 应用到Canvas组件
    const result = this.treeCanvas.setOptimizationModes(optimizations);
    
    console.log('自动应用优化设置:', {
      精灵图: optimizations.sprite ? '启用' : '禁用',
      分层渲染: optimizations.layered ? '启用' : '禁用',
      WebGL: optimizations.webgl ? '启用' : '禁用'
    });
  },

  /**
   * 重置视图
   */
  resetView: function() {
    // 调用已有的重置缩放方法
    this.resetZoom();
  }
});
