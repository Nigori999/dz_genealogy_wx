#include <emscripten/bind.h>
#include <vector>
#include <unordered_map>
#include <string>

using namespace emscripten;

struct Node {
  std::string id;
  std::string parentId;
  std::string spouseId;
  float x;
  float y;
  float width;
  float height;
  int generation;
};

struct Connector {
  std::string fromId;
  std::string toId;
  std::string type;
  float fromX;
  float fromY;
  float toX;
  float toY;
};

struct LayoutResult {
  std::vector<Node> nodes;
  std::vector<Connector> connectors;
  float totalWidth;
  float totalHeight;
};

class TreeLayoutCalculator {
public:
  LayoutResult calculateLayout(const std::vector<Node>& inputNodes, 
                              float levelHeight, 
                              float siblingDistance) {
    // 高效族谱树布局算法实现
    LayoutResult result;
    
    // 1. 构建节点索引
    std::unordered_map<std::string, Node> nodeIndex;
    std::unordered_map<std::string, std::vector<std::string>> childrenMap;
    
    // 创建节点索引和子节点映射
    for (const auto& node : inputNodes) {
      nodeIndex[node.id] = node;
      
      if (!node.parentId.empty()) {
        childrenMap[node.parentId].push_back(node.id);
      }
    }
    
    // 2. 查找根节点
    std::vector<std::string> rootNodeIds;
    for (const auto& node : inputNodes) {
      if (node.parentId.empty()) {
        rootNodeIds.push_back(node.id);
      }
    }
    
    // 3. 执行布局计算
    float currentX = 0;
    float maxY = 0;
    
    // 逐个处理根节点
    for (const auto& rootId : rootNodeIds) {
      auto layoutInfo = layoutSubtree(rootId, 0, currentX, levelHeight, siblingDistance, 
                                     nodeIndex, childrenMap);
      currentX = layoutInfo.first;
      maxY = std::max(maxY, layoutInfo.second);
    }
    
    // 4. 将计算结果转换回节点数组
    for (const auto& pair : nodeIndex) {
      result.nodes.push_back(pair.second);
    }
    
    // 5. 生成连接线
    result.connectors = generateConnectors(nodeIndex);
    
    // 设置布局总尺寸
    result.totalWidth = currentX;
    result.totalHeight = maxY + levelHeight;
    
    return result;
  }

private:
  // 递归布局子树
  std::pair<float, float> layoutSubtree(const std::string& nodeId, 
                                      int level, 
                                      float startX, 
                                      float levelHeight,
                                      float siblingDistance,
                                      std::unordered_map<std::string, Node>& nodeIndex,
                                      std::unordered_map<std::string, std::vector<std::string>>& childrenMap) {
    // 实现递归布局算法
    auto& node = nodeIndex[nodeId];
    node.y = level * levelHeight;
    float currentX = startX;
    float maxY = node.y;
    
    // 检查是否有子节点
    auto it = childrenMap.find(nodeId);
    if (it == childrenMap.end() || it->second.empty()) {
      // 叶节点
      node.x = currentX;
      currentX += siblingDistance;
      return {currentX, maxY};
    }
    
    // 处理所有子节点
    float childStartX = currentX;
    const auto& children = it->second;
    std::vector<float> childrenCenters;
    
    for (const auto& childId : children) {
      auto result = layoutSubtree(childId, level + 1, currentX, levelHeight, 
                                siblingDistance, nodeIndex, childrenMap);
      currentX = result.first;
      maxY = std::max(maxY, result.second);
      
      // 记录子节点中心位置
      auto& childNode = nodeIndex[childId];
      childrenCenters.push_back(childNode.x + childNode.width/2);
    }
    
    // 父节点位于所有子节点中心
    float leftMost = childrenCenters.front();
    float rightMost = childrenCenters.back();
    node.x = (leftMost + rightMost) / 2 - node.width/2;
    
    return {currentX, maxY};
  }
  
  // 生成连接线
  std::vector<Connector> generateConnectors(const std::unordered_map<std::string, Node>& nodeIndex) {
    std::vector<Connector> connectors;
    
    // 生成父子关系连接线
    for (const auto& pair : nodeIndex) {
      const auto& node = pair.second;
      if (!node.parentId.empty()) {
        auto parentIt = nodeIndex.find(node.parentId);
        if (parentIt != nodeIndex.end()) {
          const auto& parent = parentIt->second;
          
          Connector connector;
          connector.type = "parent-child";
          connector.fromId = parent.id;
          connector.toId = node.id;
          connector.fromX = parent.x + parent.width/2;
          connector.fromY = parent.y + parent.height;
          connector.toX = node.x + node.width/2;
          connector.toY = node.y;
          
          connectors.push_back(connector);
        }
      }
    }
    
    // 生成配偶关系连接线
    for (const auto& pair : nodeIndex) {
      const auto& node = pair.second;
      if (!node.spouseId.empty()) {
        auto spouseIt = nodeIndex.find(node.spouseId);
        if (spouseIt != nodeIndex.end()) {
          const auto& spouse = spouseIt->second;
          
          // 避免重复添加
          if (node.id < spouse.id) {
            Connector connector;
            connector.type = "spouse";
            connector.fromId = node.id;
            connector.toId = spouse.id;
            connector.fromX = node.x + node.width;
            connector.fromY = node.y + node.height/2;
            connector.toX = spouse.x;
            connector.toY = spouse.y + spouse.height/2;
            
            connectors.push_back(connector);
          }
        }
      }
    }
    
    return connectors;
  }
};

// 导出类和方法到JavaScript
EMSCRIPTEN_BINDINGS(tree_layout_module) {
  value_array<std::vector<Node>>("NodeVector")
    .element(emscripten::index<0>());
    
  value_array<std::vector<Connector>>("ConnectorVector")
    .element(emscripten::index<0>());
    
  value_object<Node>("Node")
    .field("id", &Node::id)
    .field("parentId", &Node::parentId)
    .field("spouseId", &Node::spouseId)
    .field("x", &Node::x)
    .field("y", &Node::y)
    .field("width", &Node::width)
    .field("height", &Node::height)
    .field("generation", &Node::generation);
    
  value_object<Connector>("Connector")
    .field("fromId", &Connector::fromId)
    .field("toId", &Connector::toId)
    .field("type", &Connector::type)
    .field("fromX", &Connector::fromX)
    .field("fromY", &Connector::fromY)
    .field("toX", &Connector::toX)
    .field("toY", &Connector::toY);
    
  value_object<LayoutResult>("LayoutResult")
    .field("nodes", &LayoutResult::nodes)
    .field("connectors", &LayoutResult::connectors)
    .field("totalWidth", &LayoutResult::totalWidth)
    .field("totalHeight", &LayoutResult::totalHeight);
    
  class_<TreeLayoutCalculator>("TreeLayoutCalculator")
    .constructor<>()
    .function("calculateLayout", &TreeLayoutCalculator::calculateLayout);
} 