#include <emscripten/bind.h>
#include <vector>
#include <string>

using namespace emscripten;

struct Rect {
  std::string id;
  float x;
  float y;
  float width;
  float height;
};

struct VisibleArea {
  float left;
  float top;
  float right;
  float bottom;
  float buffer;
};

class VisibilityCalculator {
public:
  std::vector<std::string> calculateVisibleElements(const std::vector<Rect>& elements, 
                                                  const VisibleArea& area) {
    std::vector<std::string> visibleIds;
    
    for (const auto& element : elements) {
      if (isVisible(element, area)) {
        visibleIds.push_back(element.id);
      }
    }
    
    return visibleIds;
  }
  
private:
  bool isVisible(const Rect& rect, const VisibleArea& area) {
    return !(rect.x > area.right + area.buffer || 
             rect.x + rect.width < area.left - area.buffer || 
             rect.y > area.bottom + area.buffer || 
             rect.y + rect.height < area.top - area.buffer);
  }
};

// 导出类和方法到JavaScript
EMSCRIPTEN_BINDINGS(visibility_module) {
  value_array<std::vector<std::string>>("StringVector")
    .element(emscripten::index<0>());
    
  value_array<std::vector<Rect>>("RectVector")
    .element(emscripten::index<0>());
    
  value_object<Rect>("Rect")
    .field("id", &Rect::id)
    .field("x", &Rect::x)
    .field("y", &Rect::y)
    .field("width", &Rect::width)
    .field("height", &Rect::height);
    
  value_object<VisibleArea>("VisibleArea")
    .field("left", &VisibleArea::left)
    .field("top", &VisibleArea::top)
    .field("right", &VisibleArea::right)
    .field("bottom", &VisibleArea::bottom)
    .field("buffer", &VisibleArea::buffer);
    
  class_<VisibilityCalculator>("VisibilityCalculator")
    .constructor<>()
    .function("calculateVisibleElements", &VisibilityCalculator::calculateVisibleElements);
} 