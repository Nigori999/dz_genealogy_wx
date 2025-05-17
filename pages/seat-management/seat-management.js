/**
 * 族谱席位管理页面
 * 用于管理族谱成员席位分配和权限设置
 */

const app = getApp();
const api = require('../../services/api');
const toast = require('../../utils/toast');

Page({
  /**
   * 页面初始数据
   */
  data: {
    isLoading: true,
    genealogyId: '',
    genealogy: null,
    members: [],
    roleOptions: [
      { value: 'admin', label: '管理员' },
      { value: 'editor', label: '编辑者' },
      { value: 'viewer', label: '浏览者' }
    ],
    // 分配显示状态
    showAllocationDialog: false,
    // 席位分配控制
    totalSeats: 0,
    usedSeats: 0,
    remainingSeats: 0,
    // 新增或编辑成员权限
    currentMember: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { genealogyId } = options;
    
    if (!genealogyId) {
      toast.show('参数错误');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    this.setData({
      genealogyId,
      isLoading: true
    });
    
    // 加载族谱信息
    this._loadGenealogyInfo(genealogyId);
    
    // 加载族谱成员
    this._loadGenealogyMembers(genealogyId);
    
    // 加载席位信息
    this._loadSeatAllocation(genealogyId);
  },

  /**
   * 加载族谱信息
   */
  _loadGenealogyInfo: function (genealogyId) {
    return api.genealogyAPI.getGenealogyDetail(genealogyId)
      .then(genealogy => {
        if (!genealogy) {
          toast.show('族谱不存在');
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
          return;
        }
        
        this.setData({
          genealogy,
          isLoading: false
        });
      })
      .catch(error => {
        console.error('加载族谱信息失败:', error);
        toast.show('加载失败，请重试');
        this.setData({ isLoading: false });
      });
  },

  /**
   * 加载族谱成员
   */
  _loadGenealogyMembers: function (genealogyId) {
    api.memberAPI.getMembers(genealogyId)
      .then(members => {
        // 为每个成员添加roleIndex属性
        const processedMembers = members.map(member => {
          // 查找角色在roleOptions中的索引
          const roleIndex = this.data.roleOptions.findIndex(opt => opt.value === member.role);
          return {
            ...member,
            roleIndex: roleIndex >= 0 ? roleIndex : 2 // 默认为浏览者(2)
          };
        });
        this.setData({ members: processedMembers || [] });
      })
      .catch(error => {
        console.error('加载族谱成员失败:', error);
        toast.show('加载成员失败');
      });
  },

  /**
   * 加载席位分配信息
   */
  _loadSeatAllocation: function (genealogyId) {
    api.genealogyAPI.getSeatAllocation(genealogyId)
      .then(allocation => {
        if (allocation) {
          this.setData({
            totalSeats: allocation.totalSeats || 0,
            usedSeats: allocation.usedSeats || 0,
            remainingSeats: (allocation.totalSeats || 0) - (allocation.usedSeats || 0)
          });
        }
      })
      .catch(error => {
        console.error('加载席位分配信息失败:', error);
      });
  },

  /**
   * 显示分配席位对话框
   */
  showAllocationDialog: function () {
    this.setData({
      showAllocationDialog: true
    });
  },

  /**
   * 关闭分配席位对话框
   */
  closeAllocationDialog: function () {
    this.setData({
      showAllocationDialog: false
    });
  },

  /**
   * 设置成员角色
   */
  setMemberRole: function (e) {
    const { memberId } = e.currentTarget.dataset;
    const roleIndex = parseInt(e.detail.value);
    const role = this.data.roleOptions[roleIndex].value;
    const { genealogyId } = this.data;
    
    this.setData({ isLoading: true });
    
    api.genealogyAPI.updateMemberRole(genealogyId, memberId, { role })
      .then(() => {
        // 更新本地成员角色
        const members = this.data.members.map(member => {
          if (member.userId === memberId) {
            return {
              ...member,
              role,
              roleIndex
            };
          }
          return member;
        });
        
        this.setData({
          members,
          isLoading: false
        });
        
        toast.show('角色已更新');
      })
      .catch(error => {
        console.error('更新角色失败:', error);
        toast.show('更新失败，请重试');
        this.setData({ isLoading: false });
      });
  },

  /**
   * 移除成员席位
   */
  removeMemberSeat: function (e) {
    const { memberId, name } = e.currentTarget.dataset;
    const { genealogyId } = this.data;
    
    wx.showModal({
      title: '移除席位',
      content: `确定要移除「${name}」的族谱席位吗？移除后该成员将无法访问族谱。`,
      confirmText: '移除',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          this.setData({ isLoading: true });
          
          api.genealogyAPI.removeMemberSeat(genealogyId, memberId)
            .then(() => {
              // 刷新席位信息
              return this._loadSeatAllocation(genealogyId);
            })
            .then(() => {
              // 从成员列表中移除
              const members = this.data.members.filter(member => member.userId !== memberId);
              this.setData({
                members,
                isLoading: false
              });
              
              toast.show('席位已移除');
            })
            .catch(error => {
              console.error('移除席位失败:', error);
              toast.show('移除失败，请重试');
              this.setData({ isLoading: false });
            });
        }
      }
    });
  },

  /**
   * 分配更多席位
   */
  allocateMoreSeats: function (e) {
    const { genealogyId } = this.data;
    const additionalSeats = parseInt(e.detail.value.seats) || 0;
    
    if (additionalSeats <= 0) {
      toast.show('请输入有效的席位数量');
      return;
    }
    
    this.setData({ isLoading: true });
    
    api.genealogyAPI.allocateSeats(genealogyId, { additionalSeats })
      .then(() => {
        // 刷新席位信息
        return this._loadSeatAllocation(genealogyId);
      })
      .then(() => {
        toast.show('席位已分配');
        this.setData({
          isLoading: false,
          showAllocationDialog: false
        });
      })
      .catch(error => {
        console.error('分配席位失败:', error);
        toast.show('分配失败，请重试');
        this.setData({ isLoading: false });
      });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const { genealogy } = this.data;
    
    if (genealogy) {
      return {
        title: `邀请您管理「${genealogy.name}」族谱`,
        path: `/pages/seat-management/seat-management?genealogyId=${genealogy.id}`,
        imageUrl: '/images/share_genealogy.png'
      };
    }
    
    return {
      title: '族谱席位管理',
      path: '/pages/index/index'
    };
  },

  /**
   * 导航到创建新图谱页面
   */
  navigateToCreateGenealogy: function() {
    wx.navigateTo({
      url: '/pages/create-genealogy/create-genealogy'
    });
  },
}); 