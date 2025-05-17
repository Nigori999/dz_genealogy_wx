#include <emscripten/bind.h>
#include <vector>
#include <cmath>

using namespace emscripten;

struct Point {
  float x;
  float y;
};

class PathCalculator {
public:
  // 计算圆角矩形路径点
  std::vector<Point> roundRectPath(float x, float y, float width, float height, float radius) {
    std::vector<Point> points;
    const int segments = 8; // 每个圆角的分段数
    
    // 右上角圆弧
    for (int i = 0; i <= segments; i++) {
      float angle = i * M_PI / (2 * segments);
      float px = x + width - radius + radius * cos(angle);
      float py = y + radius - radius * sin(angle);
      points.push_back({px, py});
    }
    
    // 右下角圆弧
    for (int i = 0; i <= segments; i++) {
      float angle = i * M_PI / (2 * segments) + M_PI / 2;
      float px = x + width - radius + radius * cos(angle);
      float py = y + height - radius + radius * sin(angle);
      points.push_back({px, py});
    }
    
    // 左下角圆弧
    for (int i = 0; i <= segments; i++) {
      float angle = i * M_PI / (2 * segments) + M_PI;
      float px = x + radius + radius * cos(angle);
      float py = y + height - radius + radius * sin(angle);
      points.push_back({px, py});
    }
    
    // 左上角圆弧
    for (int i = 0; i <= segments; i++) {
      float angle = i * M_PI / (2 * segments) + 3 * M_PI / 2;
      float px = x + radius + radius * cos(angle);
      float py = y + radius + radius * sin(angle);
      points.push_back({px, py});
    }
    
    return points;
  }
  
  // 生成连接线控制点
  std::vector<Point> generateConnectorPoints(float fromX, float fromY, float toX, float toY, bool isSpouse) {
    std::vector<Point> points;
    
    if (isSpouse) {
      // 配偶连接线（直线）
      points.push_back({fromX, fromY});
      points.push_back({toX, toY});
    } else {
      // 父子连接线（三段线）
      float midY = (fromY + toY) / 2;
      
      points.push_back({fromX, fromY});
      points.push_back({fromX, midY});
      points.push_back({toX, midY});
      points.push_back({toX, toY});
    }
    
    return points;
  }
};

// 导出类和方法到JavaScript
EMSCRIPTEN_BINDINGS(path_module) {
  value_array<std::vector<Point>>("PointVector")
    .element(emscripten::index<0>());
    
  value_object<Point>("Point")
    .field("x", &Point::x)
    .field("y", &Point::y);
    
  class_<PathCalculator>("PathCalculator")
    .constructor<>()
    .function("roundRectPath", &PathCalculator::roundRectPath)
    .function("generateConnectorPoints", &PathCalculator::generateConnectorPoints);
} 