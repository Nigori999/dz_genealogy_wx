/**
 * 成员选择器组件
 * 用于选择单个或多个族谱成员
 */

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示选择器
    visible: {
      type: Boolean,
      value: false
    },
    // 选择模式：single（单选） 或 multiple（多选）
    mode: {
      type: String,
      value: 'single'
    },
    // 已选中的成员IDs
    selectedIds: {
      type: Array,
      value: []
    },
    // 可选择的成员列表
    members: {
      type: Array,
      value: []
    },
    // 排除的成员IDs（不在列表中显示）
    excludeIds: {
      type: Array,
      value: []
    },
    // 标题
    title: {
      type: String,
      value: '选择成员'
    },
    // 筛选条件
    filter: {
      type: Object,
      value: null
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 内部选中的成员IDs（用于多选时取消）
    internalSelectedIds: [],
    // 搜索关键词
    searchKeyword: '',
    // 筛选后的成员列表
    filteredMembers: []
  },

  /**
   * 数据监听器
   */
  observers: {
    'visible, members, selectedIds, excludeIds': function(visible, members, selectedIds, excludeIds) {
      if (visible) {
        // 初始化内部选中状态
        this.setData({
          internalSelectedIds: [...selectedIds],
          searchKeyword: ''
        });
        
        // 应用筛选
        this._applyFilter(members, excludeIds, '');
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 应用筛选
     */
    _applyFilter: function(members, excludeIds, keyword) {
      const { filter } = this.properties;
      
      // 筛选成员列表
      let filteredMembers = members;
      
      // 排除指定ID的成员
      if (excludeIds && excludeIds.length > 0) {
        filteredMembers = filteredMembers.filter(m => !excludeIds.includes(m.id));
      }
      
      // 应用关键词搜索
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        filteredMembers = filteredMembers.filter(m => 
          m.name.toLowerCase().includes(lowerKeyword)
        );
      }
      
      // 应用自定义筛选条件
      if (filter) {
        // 性别筛选
        if (filter.gender) {
          filteredMembers = filteredMembers.filter(m => m.gender === filter.gender);
        }
        
        // 世代筛选
        if (filter.generation) {
          filteredMembers = filteredMembers.filter(m => m.generation === filter.generation);
        }
      }
      
      this.setData({
        filteredMembers
      });
    },

    /**
     * 处理搜索输入
     */
    onSearchInput: function(e) {
      const keyword = e.detail.value;
      const { members, excludeIds } = this.properties;
      
      this.setData({
        searchKeyword: keyword
      });
      
      // 应用筛选
      this._applyFilter(members, excludeIds, keyword);
    },

    /**
     * 处理单选项点击
     */
    onItemClick: function(e) {
      if (this.properties.mode !== 'single') return;
      
      const { id } = e.currentTarget.dataset;
      const member = this.properties.members.find(m => m.id === id);
      
      // 触发选择事件
      this.triggerEvent('select', { member });
      
      // 关闭选择器
      this.triggerEvent('close');
    },

    /**
     * 处理复选框变更
     */
    onCheckboxChange: function(e) {
      const selectedIds = e.detail.value;
      
      this.setData({
        internalSelectedIds: selectedIds
      });
    },

    /**
     * 多选模式下确认选择
     */
    onConfirm: function() {
      if (this.properties.mode !== 'multiple') return;
      
      const { internalSelectedIds, filteredMembers } = this.data;
      const selectedMembers = this.properties.members.filter(m => 
        internalSelectedIds.includes(m.id)
      );
      
      // 触发选择事件
      this.triggerEvent('select', { 
        members: selectedMembers,
        ids: internalSelectedIds
      });
      
      // 关闭选择器
      this.triggerEvent('close');
    },

    /**
     * 取消选择
     */
    onCancel: function() {
      this.triggerEvent('close');
    }
  }
});