/**
 * 图像精灵工具 - 将多个小图像合并成一个精灵图
 * 作用：减少网络请求数，提高加载性能
 */

/**
 * 创建头像精灵图
 * @param {Array} avatarUrls - 需要合并的头像URL数组
 * @param {Function} callback - 回调函数，参数为生成的精灵图信息
 */
const createAvatarSprite = function(avatarUrls, callback) {
  if (!avatarUrls || avatarUrls.length === 0) {
    callback(null);
    return;
  }
  
  // 精灵图的配置
  const spriteConfig = {
    columns: 4,       // 每行放置的头像数量
    size: 64,         // 每个头像的大小
    spacing: 2        // 头像间的间距
  };
  
  // 计算精灵图尺寸
  const rows = Math.ceil(avatarUrls.length / spriteConfig.columns);
  const width = spriteConfig.columns * (spriteConfig.size + spriteConfig.spacing);
  const height = rows * (spriteConfig.size + spriteConfig.spacing);
  
  try {
    // 创建离屏Canvas进行合成
    const canvas = wx.createOffscreenCanvas({
      type: '2d',
      width: width,
      height: height
    });
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);
    
    // 记录每个头像在精灵图中的位置信息
    const positionMap = {};
    let loadedCount = 0;
    
    // 加载并绘制每个头像
    avatarUrls.forEach((url, index) => {
      const img = canvas.createImage();
      
      // 计算在精灵图中的位置
      const col = index % spriteConfig.columns;
      const row = Math.floor(index / spriteConfig.columns);
      const x = col * (spriteConfig.size + spriteConfig.spacing);
      const y = row * (spriteConfig.size + spriteConfig.spacing);
      
      // 记录位置信息
      positionMap[url] = { x, y, size: spriteConfig.size };
      
      img.onload = () => {
        // 绘制到精灵图上
        ctx.drawImage(img, x, y, spriteConfig.size, spriteConfig.size);
        loadedCount++;
        
        // 所有图片加载完成后，导出精灵图
        if (loadedCount === avatarUrls.length) {
          // 将Canvas导出为临时文件
          const tempFilePath = canvas.toDataURL({
            type: 'png',
            success: (res) => {
              callback({
                spriteUrl: res.tempFilePath,
                positionMap: positionMap,
                width: width,
                height: height
              });
            },
            fail: (err) => {
              console.error('生成精灵图失败:', err);
              callback(null);
            }
          });
        }
      };
      
      img.onerror = () => {
        loadedCount++;
        console.error('加载头像失败:', url);
        
        if (loadedCount === avatarUrls.length) {
          // 尽管有失败的图像，仍然尝试导出精灵图
          const tempFilePath = canvas.toDataURL({
            type: 'png',
            success: (res) => {
              callback({
                spriteUrl: res.tempFilePath,
                positionMap: positionMap,
                width: width,
                height: height
              });
            },
            fail: (err) => {
              console.error('生成精灵图失败:', err);
              callback(null);
            }
          });
        }
      };
      
      img.src = url;
    });
  } catch (error) {
    console.error('创建精灵图失败:', error);
    callback(null);
  }
};

// 检查设备是否支持生成精灵图
const isSpriteSupported = function() {
  try {
    const offCanvas = wx.createOffscreenCanvas({ type: '2d' });
    const ctx = offCanvas.getContext('2d');
    return !!ctx && !!offCanvas.createImage && typeof offCanvas.toDataURL === 'function';
  } catch (e) {
    console.warn('该设备不支持离屏Canvas:', e);
    return false;
  }
};

module.exports = {
  createAvatarSprite,
  isSpriteSupported
}; 