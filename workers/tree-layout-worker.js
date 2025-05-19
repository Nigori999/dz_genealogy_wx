/**
 * 树布局计算Worker
 * 
 * 用于在后台线程计算族谱树布局，减轻主线程负担，提高性能
 */
import { treeLayoutCalculator } from './utils/calculators';

// 内部状态
const state = {
  isInitialized: true // 不需要初始化过程，直接设为true
};

/**
 * 初始化Worker
 */
function initialize() {
  console.log('[Worker] 初始化完成');
  sendMessage({ 
    type: 'statusReport', 
    status: 'ready' 
  });
}

/**
 * 计算树布局
 */
function calculateTreeLayout(data) {
  try {
    const { nodes, levelHeight = 150, siblingDistance = 100 } = data;
    
    if (!nodes || nodes.length === 0) {
      throw new Error('节点数据为空');
    }
    
    // 复制节点数据，防止引用问题
    const nodesCopy = nodes.map(node => ({
      id: node.id,
      parentId: node.parentId || '',
      spouseId: node.spouseId || '',
      x: node.x || 0,
      y: node.y || 0,
      width: node.width || 120,
      height: node.height || 150,
      generation: node.generation || 1
    }));
    
    // 使用JS计算器计算布局
    const result = treeLayoutCalculator.calculateLayout(nodesCopy, levelHeight, siblingDistance);
    
    // 发送计算结果
    sendMessage({
      type: 'treeLayout',
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Worker] 布局计算出错:', error);
    sendMessage({
      type: 'treeLayout',
      success: false,
      error: error.message || '计算出错'
    });
  }
}

/**
 * 检查元素可见性
 */
function checkVisibility(data) {
  try {
    const { viewRect, nodes } = data;
    
    if (!viewRect || !nodes || nodes.length === 0) {
      throw new Error('参数无效');
    }
    
    // 扩展视口矩形（添加边距）
    const expandedRect = {
      x: viewRect.x - 100,
      y: viewRect.y - 100,
      width: viewRect.width + 200,
      height: viewRect.height + 200
    };
    
    // 判断节点是否在视口内
    const visibleNodes = nodes
      .filter(node => 
        node.x + node.width > expandedRect.x &&
        node.x < expandedRect.x + expandedRect.width &&
        node.y + node.height > expandedRect.y &&
        node.y < expandedRect.y + expandedRect.height
      )
      .map(node => node.id);
    
    // 发送结果
    sendMessage({
      type: 'visibilityCheck',
      success: true,
      data: { visibleNodes }
    });
  } catch (error) {
    console.error('[Worker] 可见性检查出错:', error);
    sendMessage({
      type: 'visibilityCheck',
      success: false,
      error: error.message || '检查出错'
    });
  }
}

/**
 * 发送消息到主线程
 */
function sendMessage(message) {
  try {
    worker.postMessage(message);
  } catch (error) {
    console.error('[Worker] 发送消息失败:', error);
  }
}

// 消息处理
worker.onMessage(function(message) {
  switch (message.type) {
    case 'init':
      initialize();
      break;
    case 'treeLayout':
      calculateTreeLayout(message.data);
      break;
    case 'visibilityCheck':
      checkVisibility(message.data);
      break;
    case 'testAlive':
      sendMessage({ type: 'aliveResponse', timestamp: Date.now() });
      break;
    default:
      console.warn('[Worker] 未知消息类型:', message.type);
  }
});

console.log('[Worker] 树布局Worker已启动'); 