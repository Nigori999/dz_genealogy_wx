// 家族树页面
const app = getApp();
const api = require('../../services/api');
const treeUtil = require('../../utils/tree-util');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    currentGenealogy: null,
    allMembers: [],
    familyTree: null,
    treeNodes: [],
    treeConnectors: [],
    treeWidth: 1000,
    treeHeight: 1000,
    treeViewHeight: 500,
    listViewHeight: 500,
    viewMode: 'tree', // tree 或 list
    direction: 'vertical', // vertical 或 horizontal
    generations: [], // 所有世代数
    selectedGeneration: 0, // 0 表示全部
    filteredMembers: [],
    maxGeneration: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    // 检查登录状态
    if (!app.globalData.isLogin) {
      app.checkLogin(false);
      return;
    }
    
    // 获取屏幕高度
    const systemInfo = wx.getSystemInfoSync();
    const windowHeight = systemInfo.windowHeight;
    
    // 计算视图高度（减去顶部区域高度）
    const headerHeight = 120; // 族谱信息 + 控制面板 的大致高度
    const viewHeight = windowHeight - headerHeight;
    
    this.setData({
      treeViewHeight: viewHeight,
      listViewHeight: viewHeight - 50 // 减去世代筛选器高度
    });
    
    // 获取当前族谱
    this._getCurrentGenealogy();
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
  },

  /**
   * 获取当前族谱
   */
  _getCurrentGenealogy: function () {
    const currentGenealogy = app.getCurrentGenealogy();
    
    if (currentGenealogy) {
      this.setData({
        currentGenealogy,
        isLoading: true
      });
      
      // 加载族谱数据
      this._loadGenealogyData(currentGenealogy.id);
    } else {
      // 跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  /**
   * 加载族谱数据
   */
  _loadGenealogyData: function (genealogyId) {
    if (!genealogyId) return;
    
    this.setData({ isLoading: true });
    
    api.memberAPI.getMembers(genealogyId)
      .then(members => {
        if (!members || members.length === 0) {
          this.setData({
            allMembers: [],
            familyTree: null,
            isLoading: false
          });
          return;
        }
        
        this.setData({ allMembers: members });
        
        // 生成世代数组
        const generations = [...new Set(members.map(m => m.generation).filter(Boolean))].sort((a, b) => a - b);
        const maxGeneration = generations.length > 0 ? Math.max(...generations) : 0;
        
        this.setData({
          generations,
          maxGeneration,
          filteredMembers: members
        });
        
        // 获取当前族谱，确保存在且有rootMemberId
        const currentGenealogy = this.data.currentGenealogy;
        if (!currentGenealogy) {
          console.warn('构建族谱树失败: 当前族谱为null');
          this.setData({ isLoading: false });
          return;
        }
        
        // 检查rootMemberId是否存在，如果不存在则使用第一个成员的ID
        let rootMemberId = currentGenealogy.rootMemberId;
        if (!rootMemberId && members.length > 0) {
          rootMemberId = members[0].id;
          console.log('使用第一个成员ID作为根节点:', rootMemberId);
        }
        
        // 构建族谱树
        this._buildFamilyTree(members, rootMemberId);
      })
      .catch(error => {
        console.error('Load members failed:', error);
        this.setData({ isLoading: false });
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 构建族谱树
   */
  _buildFamilyTree: function (members, rootMemberId) {
    // 添加参数验证
    if (!members || !members.length) {
      console.warn('构建族谱树失败: 成员列表为空');
      this.setData({
        familyTree: null,
        isLoading: false
      });
      return;
    }
    
    if (!rootMemberId) {
      console.warn('构建族谱树失败: 根成员ID为空');
      // 尝试从成员列表中找到一个作为根节点
      const firstMember = members[0];
      if (firstMember) {
        rootMemberId = firstMember.id;
        console.log('使用第一个成员作为根节点:', rootMemberId);
      } else {
        this.setData({
          familyTree: null,
          isLoading: false
        });
        return;
      }
    }
    
    // 使用树形结构工具构建族谱树
    const familyTree = treeUtil.buildFamilyTree(members, rootMemberId);
    
    if (!familyTree) {
      this.setData({
        familyTree: null,
        isLoading: false
      });
      return;
    }
    
    // 布局族谱树节点
    const direction = this.data.direction;
    const nodeWidth = 120;
    const nodeHeight = 150;
    const horizontalGap = 40;
    const verticalGap = 60;
    
    const layoutTree = treeUtil.layoutFamilyTree(
      familyTree,
      nodeWidth,
      nodeHeight,
      horizontalGap,
      verticalGap
    );
    
    // 生成树节点和连接线数据
    this._generateTreeNodesAndConnectors(layoutTree);
    
    this.setData({
      familyTree: layoutTree,
      isLoading: false
    });
  },

  /**
   * 生成树节点和连接线数据
   */
  _generateTreeNodesAndConnectors: function (tree) {
    if (!tree) return;
    
    const nodes = [];
    const connectors = [];
    let maxX = 0;
    let maxY = 0;
    
    // 水平或垂直方向的间距
    const horizontalGap = 40;
    const verticalGap = 60;
    
    // 递归遍历树节点
    const traverseTree = (node, parentId = null) => {
      if (!node) return;
      
      // 添加节点
      nodes.push({
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        member: node
      });
      
      // 更新最大坐标
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
      
      // 添加与父节点的连接线
      if (parentId) {
        const parentNode = nodes.find(n => n.id === parentId);
        if (parentNode) {
          if (this.data.direction === 'vertical') {
            // 垂直方向的连接线
            connectors.push({
              id: `${parentId}-${node.id}`,
              fromId: parentId,
              toId: node.id,
              fromX: parentNode.x + parentNode.width / 2,
              fromY: parentNode.y + parentNode.height,
              toX: node.x + node.width / 2,
              toY: node.y,
              type: 'parent-child'
            });
          } else {
            // 水平方向的连接线
            connectors.push({
              id: `${parentId}-${node.id}`,
              fromId: parentId,
              toId: node.id,
              fromX: parentNode.x + parentNode.width,
              fromY: parentNode.y + parentNode.height / 2,
              toX: node.x,
              toY: node.y + node.height / 2,
              type: 'parent-child'
            });
          }
        }
      }
      
      // 添加与配偶的连接线
      if (node.spouses && node.spouses.length > 0) {
        node.spouses.forEach(spouse => {
          // 添加配偶节点
          nodes.push({
            id: spouse.id,
            x: spouse.x,
            y: spouse.y,
            width: spouse.width,
            height: spouse.height,
            member: spouse
          });
          
          // 更新最大坐标
          maxX = Math.max(maxX, spouse.x + spouse.width);
          maxY = Math.max(maxY, spouse.y + spouse.height);
          
          // 添加配偶连接线
          if (this.data.direction === 'vertical') {
            // 垂直方向的配偶连接线（水平连接）
            connectors.push({
              id: `${node.id}-${spouse.id}`,
              fromId: node.id,
              toId: spouse.id,
              fromX: node.x + node.width,
              fromY: node.y + node.height / 2,
              toX: spouse.x,
              toY: spouse.y + spouse.height / 2,
              type: 'spouse'
            });
          } else {
            // 水平方向的配偶连接线（垂直连接）
            connectors.push({
              id: `${node.id}-${spouse.id}`,
              fromId: node.id,
              toId: spouse.id,
              fromX: node.x + node.width / 2,
              fromY: node.y + node.height,
              toX: spouse.x + spouse.width / 2,
              toY: spouse.y,
              type: 'spouse'
            });
          }
        });
      }
      
      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          traverseTree(child, node.id);
        });
      }
    };
    
    // 从根节点开始遍历
    traverseTree(tree);
    
    // 设置树的尺寸
    this.setData({
      treeNodes: nodes,
      treeConnectors: connectors,
      treeWidth: maxX + 100, // 添加右侧边距
      treeHeight: maxY + 100 // 添加底部边距
    });
  },

  /**
   * 切换视图模式
   */
  switchViewMode: function (e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ viewMode: mode });
  },

  /**
   * 切换方向
   */
  switchDirection: function (e) {
    const direction = e.currentTarget.dataset.direction;
    
    if (direction === this.data.direction) return;
    
    this.setData({ 
      direction,
      isLoading: true
    });
    
    // 重新构建族谱树布局
    setTimeout(() => {
      // 添加检查，确保currentGenealogy不为null
      if (!this.data.currentGenealogy) {
        console.warn('切换方向失败: currentGenealogy为null');
        this.setData({ isLoading: false });
        return;
      }
      this._buildFamilyTree(this.data.allMembers, this.data.currentGenealogy.rootMemberId);
    }, 100);
  },

  /**
   * 选择世代
   */
  selectGeneration: function (e) {
    const generation = parseInt(e.currentTarget.dataset.generation);
    
    this.setData({ selectedGeneration: generation });
    
    // 筛选成员
    const { allMembers } = this.data;
    
    if (generation === 0) {
      // 全部成员
      this.setData({ filteredMembers: allMembers });
    } else {
      // 按世代筛选
      const filtered = allMembers.filter(m => m.generation === generation);
      this.setData({ filteredMembers: filtered });
    }
  },

  /**
   * 点击树节点
   */
  onNodeSelect: function (e) {
    const { memberId } = e.detail;
    const { currentGenealogy } = this.data;
    
    wx.navigateTo({
      url: `/pages/member-detail/member-detail?genealogyId=${currentGenealogy.id}&memberId=${memberId}`
    });
  },

  /**
   * 查看成员详情
   */
  onMemberDetail: function (e) {
    const { member } = e.detail;
    const { currentGenealogy } = this.data;
    
    wx.navigateTo({
      url: `/pages/member-detail/member-detail?genealogyId=${currentGenealogy.id}&memberId=${member.id}`
    });
  },

  /**
   * 编辑成员
   */
  onMemberEdit: function (e) {
    const { member } = e.detail;
    const { currentGenealogy } = this.data;
    
    wx.navigateTo({
      url: `/pages/edit-member/edit-member?genealogyId=${currentGenealogy.id}&memberId=${member.id}`
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 导航到添加成员页面
   */
  navigateToAddMember: function () {
    const { currentGenealogy } = this.data;
    if (!currentGenealogy) return;
    
    wx.navigateTo({
      url: `/pages/add-member/add-member?genealogyId=${currentGenealogy.id}`
    });
    
    // 标记需要刷新
    this.needRefresh = true;
  },

  /**
   * 用户下拉刷新
   */
  onPullDownRefresh: function () {
    const { currentGenealogy } = this.data;
    
    if (currentGenealogy) {
      this._loadGenealogyData(currentGenealogy.id);
      
      // 获取最新的族谱信息
      api.genealogyAPI.getGenealogyDetail(currentGenealogy.id)
        .then(genealogy => {
          if (genealogy) {
            app.setCurrentGenealogy(genealogy);
            this.setData({ currentGenealogy: genealogy });
          }
          wx.stopPullDownRefresh();
        })
        .catch(() => {
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
  }
});