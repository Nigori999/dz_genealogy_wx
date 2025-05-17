/**
 * 事件处理器
 * 处理canvas-family-tree组件中的各种触摸和交互事件
 */

const EventHandlers = {
  /**
   * 触摸开始事件处理
   * @param {Object} component - 组件实例
   * @param {Object} e - 事件对象
   */
  onTouchStart(component, e) {
    const touches = e.touches;
    
    // 重置拖动计数器
    component._dragRenderCount = 0;
    
    // 单指触摸（拖动）
    if (touches.length === 1) {
      component.setData({
        lastX: touches[0].clientX,
        lastY: touches[0].clientY,
        isDragging: true
      });
    } 
    // 双指触摸（缩放）
    else if (touches.length === 2) {
      const distance = this._calculateDistance(touches[0], touches[1]);
      component.setData({
        initialDistance: distance,
        initialScale: component.data.currentScale,
        isDragging: false
      });
    }
  },
  
  /**
   * 触摸移动事件处理
   * @param {Object} component - 组件实例
   * @param {Object} e - 事件对象
   */
  onTouchMove(component, e) {
    if (!component.ctx || !component.canvas) return;
    
    const touches = e.touches;
    
    // 单指拖动
    if (touches.length === 1 && component.data.isDragging) {
      this._handleDrag(component, touches[0]);
      return;
    }
    
    // 双指缩放
    if (touches.length === 2) {
      this._handlePinch(component, touches);
    }
  },
  
  /**
   * 处理拖动行为
   * @param {Object} component - 组件实例
   * @param {Object} touch - 触摸点
   * @private
   */
  _handleDrag(component, touch) {
    const { clientX, clientY } = touch;
    const { lastX, lastY } = component.data;
    
    // 计算位移
    const deltaX = clientX - lastX;
    const deltaY = clientY - lastY;
    
    // 位移量小于2px时忽略，防止轻微颤抖
    if (Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) {
      return;
    }
    
    // 更新位置
    component.setData({
      offsetX: component.data.offsetX + deltaX,
      offsetY: component.data.offsetY + deltaY,
      lastX: clientX,
      lastY: clientY
    });
    
    // 性能优化：检测快速移动
    if (!component._lastMoveTime) {
      component._lastMoveTime = Date.now();
      component._moveCount = 0;
    } else {
      const now = Date.now();
      const elapsed = now - component._lastMoveTime;
      component._moveCount++;
      
      // 如果在短时间内移动很频繁，则判定为快速移动
      if (elapsed < 200 && component._moveCount > 5) {
        component._inFastMovement = true;
      } else if (elapsed > 300) {
        // 重置计数
        component._lastMoveTime = now;
        component._moveCount = 0;
        component._inFastMovement = false;
      }
    }
    
    // 根据移动速度调整渲染策略
    if (component._inFastMovement) {
      // 快速移动时降低渲染质量，提高性能
      if (!component._throttledRender) {
        component._throttledRender = true;
        
        // 简化渲染 - 避免每次拖动都完整渲染
        setTimeout(() => {
          component._render();
          component._throttledRender = false;
        }, 32); // 大约30fps
      }
    } else {
      // 正常速度时正常渲染
      component._render();
    }
    
    // 减少更新频率过高导致的性能问题
    if (!component._dragThrottled) {
      component._dragThrottled = true;
      setTimeout(() => {
        component._dragThrottled = false;
      }, 16); // 约60fps
    }
  },
  
  /**
   * 处理缩放行为
   * @param {Object} component - 组件实例
   * @param {Array} touches - 触摸点数组
   * @private
   */
  _handlePinch(component, touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    // 计算当前两指间距离
    const currentDistance = this._calculateDistance(touch1, touch2);
    const { initialDistance, initialScale } = component.data;
    
    // 计算新的缩放值：基于初始缩放和距离变化比例
    const newScale = Math.min(
      Math.max(
        initialScale * (currentDistance / initialDistance),
        0.1  // 最小缩放
      ),
      5.0  // 最大缩放
    );
    
    // 更新缩放
    if (Math.abs(newScale - component.data.currentScale) > 0.01) {
      component.setData({
        currentScale: newScale,
        showScaleIndicator: true,
        scalePercentage: Math.round(newScale * 100)
      });
      
      // 触发缩放事件
      component.triggerEvent('scale', { scale: newScale });
      
      // 强制立即渲染更新
      component._render();
      
      // 设置缩放指示器隐藏计时器
      clearTimeout(component._scaleIndicatorTimer);
      component._scaleIndicatorTimer = setTimeout(() => {
        component.setData({ showScaleIndicator: false });
      }, 1500);
    }
  },
  
  /**
   * 触摸结束事件处理
   * @param {Object} component - 组件实例
   */
  onTouchEnd(component) {
    // 结束拖动状态
    component.setData({
      isDragging: false
    });
    
    // 重置移动监测
    component._lastMoveTime = 0;
    component._moveCount = 0;
    component._inFastMovement = false;
    
    // 触发完整渲染，确保高质量显示
    setTimeout(() => {
      component._render();
    }, 100);
  },
  
  /**
   * 画布点击事件处理
   * @param {Object} component - 组件实例
   * @param {Object} e - 事件对象
   */
  onCanvasTap(component, e) {
    // 获取点击位置
    const { x, y } = e.detail;
    
    // 转换为画布坐标
    const canvasX = x;
    const canvasY = y;
    
    // 转换为世界坐标
    const worldX = (canvasX - component.data.offsetX) / component.data.currentScale;
    const worldY = (canvasY - component.data.offsetY) / component.data.currentScale;
    
    // 查找被点击的节点
    const clickedNode = this._findNodeAtPosition(component, worldX, worldY);
    
    if (clickedNode) {
      // 触发节点点击事件
      component.triggerEvent('nodeClick', {
        nodeId: clickedNode.id,
        memberId: clickedNode.memberId,
        node: clickedNode
      });
    } else {
      // 触发空白区域点击事件
      component.triggerEvent('blankClick', {
        x: worldX,
        y: worldY
      });
    }
  },
  
  /**
   * 查找指定位置的节点
   * @param {Object} component - 组件实例
   * @param {Number} x - 世界坐标X
   * @param {Number} y - 世界坐标Y
   * @returns {Object|null} 找到的节点或null
   * @private
   */
  _findNodeAtPosition(component, x, y) {
    const { nodesMap } = component.data;
    
    if (!nodesMap || !nodesMap.length) {
      return null;
    }
    
    // 从上到下检查（后绘制的节点在上层）
    for (let i = nodesMap.length - 1; i >= 0; i--) {
      const node = nodesMap[i];
      
      // 检查点是否在节点矩形区域内
      if (
        x >= node.x &&
        x <= node.x + node.width &&
        y >= node.y &&
        y <= node.y + node.height
      ) {
        return node;
      }
    }
    
    return null;
  },
  
  /**
   * 计算两点间距离
   * @param {Object} touch1 - 第一个触摸点
   * @param {Object} touch2 - 第二个触摸点
   * @returns {Number} 距离
   * @private
   */
  _calculateDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
};

module.exports = EventHandlers; 