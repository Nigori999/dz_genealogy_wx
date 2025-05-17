// 权限设置页面
const app = getApp();
const api = require('../../services/api');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    genealogyId: '',
    genealogy: null,
    userList: [],
    members: [],
    searchValue: '',
    searchResults: [],
    selectedUser: null,
    permissions: [
      { id: 'invite', name: '邀请成员', checked: false, desc: '可以邀请新成员加入族谱' },
      { id: 'remove', name: '删除成员', checked: false, desc: '可以从族谱中移除成员' },
      { id: 'event', name: '发布事件', checked: false, desc: '可以在族谱中添加和编辑事件' },
      { id: 'edit', name: '修改族谱', checked: false, desc: '可以修改族谱基本信息和历史' },
      { id: 'admin', name: '管理员权限', checked: false, desc: '拥有除族长外的所有权限' }
    ],
    showUserSelector: false,
    showPermissionDialog: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const genealogyId = options.genealogyId;
    
    if (!genealogyId) {
      wx.showToast({
        title: '缺少族谱ID',
        icon: 'none'
      });
      wx.navigateBack();
      return;
    }
    
    this.setData({ genealogyId });
    this._loadData();
  },

  /**
   * 加载数据
   */
  _loadData: function () {
    this.setData({ isLoading: true });
    
    // 加载族谱信息
    api.genealogyAPI.getGenealogyDetail(this.data.genealogyId)
      .then(genealogy => {
        this.setData({ genealogy });
        
        // 加载成员列表
        return api.memberAPI.getMembers(this.data.genealogyId);
      })
      .then(members => {
        this.setData({ members });
        
        // 筛选出有管理权限的成员
        this._filterMembersWithPermissions();
      })
      .catch(err => {
        console.error('加载族谱数据失败', err);
        wx.showToast({
          title: '加载数据失败',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ isLoading: false });
      });
    
    // 加载用户列表（可以授权的用户）
    api.userAPI.getUsers()
      .then(users => {
        this.setData({ userList: users });
      })
      .catch(err => {
        console.error('加载用户列表失败', err);
      });
  },

  /**
   * 筛选有权限的成员
   */
  _filterMembersWithPermissions: function () {
    // 筛选有权限的成员
    const membersWithPermissions = this.data.members
      .filter(member => member.permissions && (
        Object.keys(member.permissions).length > 0 || 
        (Array.isArray(member.permissions) && member.permissions.length > 0)
      ));
      
    console.log('有权限的成员：', membersWithPermissions);
    this.setData({ membersWithPermissions });
  },

  /**
   * 搜索用户
   */
  onSearchInput: function (e) {
    const value = e.detail.value;
    this.setData({ searchValue: value });
    
    if (!value) {
      this.setData({ searchResults: [] });
      return;
    }
    
    // 搜索用户
    const results = this.data.userList.filter(user => 
      (user.nickname && user.nickname.includes(value)) || 
      (user.realName && user.realName.includes(value)) ||
      (user.phone && user.phone.includes(value))
    );
    
    this.setData({ searchResults: results });
  },

  /**
   * 清除搜索
   */
  onClearSearch: function () {
    this.setData({ 
      searchValue: '',
      searchResults: [] 
    });
  },

  /**
   * 选择用户
   */
  onSelectUser: function (e) {
    const userId = e.currentTarget.dataset.id;
    const user = this.data.userList.find(u => u.id === userId) || 
                 this.data.searchResults.find(u => u.id === userId);
                 
    if (!user) return;
    
    this.setData({ 
      selectedUser: user,
      showUserSelector: false,
      showPermissionDialog: true,
      // 重置权限选择
      permissions: this.data.permissions.map(p => ({...p, checked: false}))
    });
  },

  /**
   * 显示用户选择器
   */
  showUserSelector: function () {
    this.setData({ 
      showUserSelector: true,
      searchValue: '',
      searchResults: [] 
    });
  },

  /**
   * 关闭用户选择器
   */
  closeUserSelector: function () {
    this.setData({ showUserSelector: false });
  },

  /**
   * 关闭权限对话框
   */
  closePermissionDialog: function () {
    this.setData({ showPermissionDialog: false });
  },

  /**
   * 权限切换
   */
  onPermissionChange: function (e) {
    const id = e.currentTarget.dataset.id;
    
    // 获取当前选中状态，用于切换
    const currentPermission = this.data.permissions.find(p => p.id === id);
    const willBeChecked = !currentPermission.checked;
    
    // 如果取消管理员权限，询问是否同时取消其他权限
    if (id === 'admin' && !willBeChecked) {
      wx.showModal({
        title: '取消管理员权限',
        content: '是否同时取消其他所有权限？',
        cancelText: '否',
        confirmText: '是',
        success: (res) => {
          let permissions = this.data.permissions.map(p => {
            if (p.id === 'admin') {
              return {...p, checked: false};
            }
            if (res.confirm) {
              // 用户选择同时取消其他权限
              return {...p, checked: false};
            }
            // 保持其他权限不变
            return p;
          });
          
          this.setData({ permissions });
        }
      });
      return;
    }
    
    const permissions = this.data.permissions.map(p => {
      // 更新当前点击的权限状态
      if (p.id === id) {
        return {...p, checked: willBeChecked};
      }
      
      // 如果选中了管理员权限，则自动选中其他权限
      if (id === 'admin' && p.id !== 'admin' && willBeChecked) {
        return {...p, checked: true};
      }
      
      return p;
    });
    
    this.setData({ permissions });
    
    // 如果选中了管理员权限，提示用户
    if (id === 'admin' && willBeChecked) {
      wx.showToast({
        title: '已自动选中所有权限',
        icon: 'none',
        duration: 1500
      });
    }
  },

  /**
   * 保存权限设置
   */
  savePermissions: function () {
    if (!this.data.selectedUser) {
      return;
    }
    
    const selectedPermissions = this.data.permissions
      .filter(p => p.checked)
      .map(p => p.id);
      
    if (selectedPermissions.length === 0) {
      wx.showToast({
        title: '请至少选择一项权限',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载状态
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    // 根据选择的权限确定角色
    let role = 'viewer';
    if (selectedPermissions.includes('admin')) {
      role = 'admin';
    } else if (selectedPermissions.includes('edit')) {
      role = 'editor';
    }
    
    console.log('保存权限:', this.data.selectedUser.id, role, selectedPermissions);
    
    // 提交权限设置（使用updateMemberRole方法）
    api.genealogyAPI.updateMemberRole(
      this.data.genealogyId,
      this.data.selectedUser.id,
      { 
        role: role,
        permissions: selectedPermissions 
      }
    )
      .then(() => {
        wx.hideLoading();
        
        wx.showToast({
          title: '权限设置成功',
          icon: 'success'
        });
        
        // 关闭对话框并刷新数据
        this.setData({ showPermissionDialog: false });
        this._loadData();
      })
      .catch(err => {
        wx.hideLoading();
        console.error('设置权限失败', err);
        
        wx.showToast({
          title: '设置权限失败',
          icon: 'none'
        });
      });
  },

  /**
   * 编辑用户权限
   */
  editPermission: function (e) {
    const userId = e.currentTarget.dataset.id;
    const user = this.data.members.find(m => m.id === userId);
    
    if (!user) return;
    
    // 设置当前选中的用户
    this.setData({
      selectedUser: user,
      showPermissionDialog: true
    });
    
    // 根据用户当前权限设置选中状态
    const permissions = this.data.permissions.map(p => {
      const checked = user.permissions && 
                    (user.permissions[p.id] === true || 
                     (Array.isArray(user.permissions) && user.permissions.includes(p.id)));
      return {...p, checked};
    });
    
    this.setData({ permissions });
  },

  /**
   * 移除用户权限
   */
  removePermission: function (e) {
    const userId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '移除权限',
      content: '确定要移除该用户的所有权限吗？',
      success: res => {
        if (res.confirm) {
          // 显示加载状态
          wx.showLoading({
            title: '移除中...',
            mask: true
          });
          
          // 提交移除权限请求
          api.genealogyAPI.updateMemberRole(
            this.data.genealogyId,
            userId,
            { 
              role: 'viewer',
              permissions: [] 
            }
          )
            .then(() => {
              wx.hideLoading();
              
              wx.showToast({
                title: '权限已移除',
                icon: 'success'
              });
              
              // 刷新数据
              this._loadData();
            })
            .catch(err => {
              wx.hideLoading();
              console.error('移除权限失败', err);
              
              wx.showToast({
                title: '移除权限失败',
                icon: 'none'
              });
            });
        }
      }
    });
  },

  /**
   * 移除特定权限
   */
  removeSpecificPermission: function (e) {
    const userId = e.currentTarget.dataset.userId;
    const permissionToRemove = e.currentTarget.dataset.permission;
    
    // 如果是管理员权限，需要特殊处理
    if (permissionToRemove === 'admin') {
      wx.showModal({
        title: '移除管理员权限',
        content: '移除管理员权限将同时移除其他所有权限，是否继续？',
        confirmText: '继续',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this._updateUserPermission(userId, []);
          }
        }
      });
      return;
    }
    
    // 获取当前用户所有权限
    const userWithPermissions = this.data.membersWithPermissions.find(m => m.id === userId);
    if (!userWithPermissions || !userWithPermissions.permissions) {
      return;
    }
    
    // 获取权限列表并移除指定权限
    const permissions = Object.keys(userWithPermissions.permissions)
      .filter(perm => userWithPermissions.permissions[perm] && perm !== permissionToRemove);
    
    // 确认移除
    wx.showModal({
      title: '移除权限',
      content: `确定要移除"${this._getPermissionName(permissionToRemove)}"权限吗？`,
      confirmText: '移除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this._updateUserPermission(userId, permissions);
        }
      }
    });
  },
  
  /**
   * 获取权限名称
   */
  _getPermissionName: function(permissionId) {
    const permission = this.data.permissions.find(p => p.id === permissionId);
    return permission ? permission.name : permissionId;
  },
  
  /**
   * 更新用户权限
   */
  _updateUserPermission: function(userId, permissions) {
    // 显示加载状态
    wx.showLoading({
      title: '更新中...',
      mask: true
    });
    
    // 根据权限列表判断角色
    let role = 'viewer';
    if (permissions.includes('admin')) {
      role = 'admin';
    } else if (permissions.includes('edit')) {
      role = 'editor';
    }
    
    // 提交权限更新
    api.genealogyAPI.updateMemberRole(
      this.data.genealogyId,
      userId,
      { 
        role: role,
        permissions: permissions 
      }
    )
      .then(() => {
        wx.hideLoading();
        
        wx.showToast({
          title: '权限已更新',
          icon: 'success'
        });
        
        // 刷新数据
        this._loadData();
      })
      .catch(err => {
        wx.hideLoading();
        console.error('更新权限失败', err);
        
        wx.showToast({
          title: '更新权限失败',
          icon: 'none'
        });
      });
  },
}); 