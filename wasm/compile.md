# WebAssembly编译指南

本文档提供了如何编译族谱树渲染优化中使用的WebAssembly模块的详细步骤。

## 环境准备

1. 安装Emscripten工具链：
   - 访问 https://emscripten.org/docs/getting_started/downloads.html
   - 按照官方指南安装Emscripten SDK
   - 确保`emcc`命令可用

2. 确认安装成功：
   ```bash
   emcc --version
   ```

## 编译C++源文件

### 1. 树布局算法

```bash
emcc src/tree_layout.cpp -o dist/tree_layout.js ^
  -s WASM=1 ^
  -s MODULARIZE=1 ^
  -s EXPORT_ES6=1 ^
  -s EXPORT_NAME=TreeLayoutModule ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  -O3
```

### 2. 视口可见性计算

```bash
emcc src/visibility_calculator.cpp -o dist/visibility_calculator.js ^
  -s WASM=1 ^
  -s MODULARIZE=1 ^
  -s EXPORT_ES6=1 ^
  -s EXPORT_NAME=VisibilityModule ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  -O3
```

### 3. 路径绘制计算

```bash
emcc src/path_calculator.cpp -o dist/path_calculator.js ^
  -s WASM=1 ^
  -s MODULARIZE=1 ^
  -s EXPORT_ES6=1 ^
  -s EXPORT_NAME=PathModule ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  -O3
```

## 编译参数说明

- `-s WASM=1`: 输出WebAssembly格式
- `-s MODULARIZE=1`: 将输出模块化
- `-s EXPORT_ES6=1`: 使用ES6模块格式
- `-s EXPORT_NAME=ModuleName`: 指定导出的模块名称
- `-s ALLOW_MEMORY_GROWTH=1`: 允许WebAssembly内存动态增长
- `-O3`: 最高级别的代码优化

## 集成到微信小程序

1. 编译完成后，会在`dist`目录生成以下文件：
   - `tree_layout.js` 和 `tree_layout.wasm`
   - `visibility_calculator.js` 和 `visibility_calculator.wasm`
   - `path_calculator.js` 和 `path_calculator.wasm`

2. 将这些文件复制到微信小程序项目的`wasm/dist`目录

3. 在微信小程序项目中，使用`utils/wasm-loader.js`加载这些模块

## 故障排除

1. 如果遇到内存相关错误，可以尝试增加内存限制：
   ```
   -s INITIAL_MEMORY=16MB
   ```

2. 如果需要调试，可以添加调试信息：
   ```
   -g4
   ```

3. 如需详细了解编译选项，请参考Emscripten文档：
   https://emscripten.org/docs/tools_reference/emcc.html 