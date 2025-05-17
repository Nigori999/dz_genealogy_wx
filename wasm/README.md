# 族谱树渲染WebAssembly优化模块

本目录包含族谱树渲染的WebAssembly优化模块，用于提高计算密集型任务的性能。

## 目录结构

```
wasm/
  ├── src/                 # C++源代码
  │    ├── tree_layout.cpp             # 树布局算法
  │    ├── visibility_calculator.cpp   # 视口可见性计算
  │    └── path_calculator.cpp         # 路径绘制计算
  │
  ├── dist/                # 编译后的WebAssembly文件
  │    ├── tree_layout.js             # 树布局模块JS胶水代码
  │    ├── tree_layout.wasm           # 树布局模块WASM文件
  │    ├── visibility_calculator.js   # 可见性计算模块JS胶水代码
  │    ├── visibility_calculator.wasm # 可见性计算模块WASM文件
  │    ├── path_calculator.js         # 路径计算模块JS胶水代码
  │    └── path_calculator.wasm       # 路径计算模块WASM文件
  │
  ├── compile.bat          # Windows编译脚本
  ├── compile.md           # 编译指南
  └── README.md            # 本文档
```

## 核心模块说明

### 1. 树布局算法 (tree_layout.cpp)

族谱树布局算法的C++实现，提供高性能的族谱树节点位置计算。

主要功能：
- 计算族谱树节点的最优位置
- 生成连接线信息
- 处理复杂的族谱结构关系

### 2. 视口可见性计算 (visibility_calculator.cpp)

高性能的视口剪裁算法，用于快速过滤不在可视区域内的元素。

主要功能：
- 快速判断元素是否在可视区域内
- 高效过滤大量节点数据
- 优化渲染性能

### 3. 路径绘制计算 (path_calculator.cpp)

优化的路径计算算法，用于生成高质量的图形路径点。

主要功能：
- 计算圆角矩形路径点
- 生成连接线控制点
- 优化路径渲染性能

## 使用方法

1. **初始化WebAssembly**

```javascript
// 导入WebAssembly加载器
const wasmLoader = require('../../utils/wasm-loader');

// 初始化WebAssembly模块
async function initWebAssembly() {
  try {
    await wasmLoader.init();
    console.log('WebAssembly模块初始化成功');
    return true;
  } catch (error) {
    console.error('WebAssembly初始化失败:', error);
    return false;
  }
}
```

2. **使用树布局算法**

```javascript
// 获取WebAssembly实例
const { treeLayoutCalculator } = wasmLoader.getInstances();

// 准备输入数据
const nodes = [
  { id: '1', parentId: '', width: 120, height: 150 },
  { id: '2', parentId: '1', width: 120, height: 150 },
  // ...更多节点
];

// 执行布局计算
const layoutResult = treeLayoutCalculator.calculateLayout(
  nodes,
  150, // 层高
  100  // 兄弟节点间距
);

// 处理结果
console.log('节点数量:', layoutResult.nodes.length);
console.log('连接线数量:', layoutResult.connectors.length);
```

3. **使用视口可见性计算**

```javascript
// 获取WebAssembly实例
const { visibilityCalculator } = wasmLoader.getInstances();

// 准备输入数据
const elements = [
  { id: '1', x: 10, y: 20, width: 120, height: 150 },
  { id: '2', x: 200, y: 300, width: 120, height: 150 },
  // ...更多元素
];

const visibleArea = {
  left: 0,
  top: 0,
  right: 500,
  bottom: 500,
  buffer: 200
};

// 执行可见性计算
const visibleIds = visibilityCalculator.calculateVisibleElements(elements, visibleArea);

// 处理结果
console.log('可见元素数量:', visibleIds.length);
```

4. **使用路径计算**

```javascript
// 获取WebAssembly实例
const { pathCalculator } = wasmLoader.getInstances();

// 计算圆角矩形路径点
const points = pathCalculator.roundRectPath(10, 20, 120, 150, 10);

// 使用路径绘制图形
ctx.beginPath();
ctx.moveTo(points[0].x, points[0].y);
for (let i = 1; i < points.length; i++) {
  ctx.lineTo(points[i].x, points[i].y);
}
ctx.closePath();
ctx.fill();
```

## 性能建议

1. **数据大小**：
   - 小数据集(<100元素)：直接使用JavaScript实现可能更快
   - 大数据集(>100元素)：使用WebAssembly实现可获得显著性能提升

2. **频率控制**：
   - 避免在高频率的事件处理程序中反复创建和传递大型数据结构
   - 考虑使用节流或防抖技术控制计算频率

3. **内存管理**：
   - 注意大型数据集的内存占用
   - 在不需要时调用`wasmLoader.dispose()`释放资源

## 兼容与降级

本模块提供了完善的兼容性检测和降级机制：

```javascript
// 检查WebAssembly支持
if (wasmLoader.isWasmSupported()) {
  // 使用WebAssembly实现
  // ...
} else {
  // 使用JavaScript降级实现
  const TreeLayoutFallback = require('../../utils/tree-layout-fallback');
  const calculator = new TreeLayoutFallback();
  // ...
}
```

## 故障排除

1. **初始化失败**：
   - 检查微信基础库版本是否支持WebAssembly (需2.8.0以上)
   - 确保WebAssembly文件路径正确

2. **性能不如预期**：
   - 检查数据集大小是否足够大(小数据集优化效果不明显)
   - 确保没有频繁的数据复制和转换操作

3. **内存问题**：
   - 检查是否有内存泄漏(未释放不再使用的资源)
   - 考虑增加`INITIAL_MEMORY`编译选项 