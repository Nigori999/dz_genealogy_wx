@echo off
echo "编译WebAssembly模块..."

if not exist "dist" mkdir dist

echo "编译树布局算法..."
emcc %~dp0src/tree_layout.cpp -o %~dp0dist/tree_layout.js ^
  -s WASM=1 ^
  -s MODULARIZE=1 ^
  -s EXPORT_ES6=1 ^
  -s EXPORT_NAME=TreeLayoutModule ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  --bind ^
  -O3

if %errorlevel% neq 0 (
  echo "树布局算法编译失败！"
)

echo "编译视口可见性计算..."
emcc %~dp0src/visibility_calculator.cpp -o %~dp0dist/visibility_calculator.js ^
  -s WASM=1 ^
  -s MODULARIZE=1 ^
  -s EXPORT_ES6=1 ^
  -s EXPORT_NAME=VisibilityModule ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  --bind ^
  -O3

if %errorlevel% neq 0 (
  echo "视口可见性计算编译失败！"
)

echo "编译路径绘制计算..."
emcc %~dp0src/path_calculator.cpp -o %~dp0dist/path_calculator.js ^
  -s WASM=1 ^
  -s MODULARIZE=1 ^
  -s EXPORT_ES6=1 ^
  -s EXPORT_NAME=PathModule ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  --bind ^
  -O3

if %errorlevel% neq 0 (
  echo "路径绘制计算失败！"
)

echo "编译完成！所有模块已生成在dist目录下。"

pause