/**
 * 通用工具函数
 */

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {String} fmt - 格式模板，例如："yyyy-MM-dd hh:mm:ss"
 * @returns {String} 格式化后的日期字符串
 */
function formatDate(date, fmt) {
  if (!date) return '';
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  var o = {
    "M+": date.getMonth() + 1, // 月份
    "d+": date.getDate(), // 日
    "h+": date.getHours(), // 小时
    "m+": date.getMinutes(), // 分
    "s+": date.getSeconds(), // 秒
    "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
    "S": date.getMilliseconds() // 毫秒
  };
  
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    }
  }
  
  return fmt;
}

/**
 * 计算年龄
 * @param {String} birthDate - 出生日期字符串
 * @param {String} deathDate - 死亡日期字符串（可选）
 * @returns {Number|String} 年龄或年龄范围
 */
const calculateAge = (birthDate, deathDate) => {
  if (!birthDate) return '';
  
  const birthYear = new Date(birthDate).getFullYear();
  
  if (deathDate) {
    // 已故，计算寿命
    const deathYear = new Date(deathDate).getFullYear();
    return deathYear - birthYear;
  } else {
    // 在世，计算当前年龄
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  }
};

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {Number} wait - 等待时间（毫秒）
 * @returns {Function} 节流处理后的函数
 */
function throttle(func, wait) {
  let lastTime = 0;
  return function() {
    const context = this;
    const args = arguments;
    const now = Date.now();
    if (now - lastTime >= wait) {
      func.apply(context, args);
      lastTime = now;
    }
  };
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {Number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖处理后的函数
 */
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 处理日期对象
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  // 处理普通对象
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = deepClone(obj[key]);
    }
  }
  
  return newObj;
};

/**
 * 获取文件扩展名
 * @param {String} filename - 文件名
 * @returns {String} 扩展名（小写）
 */
const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
};

/**
 * 判断是否是图片文件
 * @param {String} filename - 文件名
 * @returns {Boolean} 是否是图片
 */
const isImageFile = (filename) => {
  const ext = getFileExtension(filename);
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  return imageExts.includes(ext);
};

/**
 * 判断是否是视频文件
 * @param {String} filename - 文件名
 * @returns {Boolean} 是否是视频
 */
const isVideoFile = (filename) => {
  const ext = getFileExtension(filename);
  const videoExts = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv'];
  return videoExts.includes(ext);
};

/**
 * 格式化文件大小
 * @param {Number} size - 文件大小（字节）
 * @param {Number} decimal - 小数位数，默认2位
 * @returns {String} 格式化后的文件大小，例如 "1.25 MB"
 */
function formatFileSize(size, decimal = 2) {
  if (size === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const formattedSize = (size / Math.pow(1024, i)).toFixed(decimal);
  
  return `${formattedSize} ${units[i]}`;
}

/**
 * 获取省市区字符串中的省份
 * @param {String} address - 地址字符串
 * @returns {String} 省份
 */
const getProvince = (address) => {
  if (!address) return '';
  
  // 匹配省级行政区
  const provinces = [
    '北京市', '天津市', '上海市', '重庆市',
    '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
    '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
    '河南省', '湖北省', '湖南省', '广东省', '海南省', '四川省',
    '贵州省', '云南省', '陕西省', '甘肃省', '青海省', '台湾省',
    '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
    '香港特别行政区', '澳门特别行政区'
  ];
  
  for (const province of provinces) {
    if (address.startsWith(province)) {
      return province;
    }
  }
  
  return '';
};

/**
 * 隐藏手机号中间四位
 * @param {String} phone - 手机号码
 * @returns {String} 隐藏后的手机号码
 */
const hidePhoneNumber = (phone) => {
  if (!phone || phone.length !== 11) {
    return phone;
  }
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

/**
 * 判断字符串是否为空
 * @param {String} str - 字符串
 * @returns {Boolean} 是否为空
 */
const isEmpty = (str) => {
  return str === undefined || str === null || str.trim() === '';
};

/**
 * 生成随机颜色
 * @returns {String} 十六进制颜色值
 */
const randomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * 保留小数点后指定位数
 * @param {Number} num - 数字
 * @param {Number} digits - 小数位数
 * @returns {Number} 处理后的数字
 */
const toFixedNumber = (num, digits = 2) => {
  if (isNaN(num)) return 0;
  const multiplier = Math.pow(10, digits);
  return Math.round(num * multiplier) / multiplier;
};

/**
 * 获取当前页面路径
 * @returns {String} 当前页面路径
 */
const getCurrentPagePath = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage ? currentPage.route : '';
};

/**
 * 跳转到登录页面，并在登录成功后返回当前页面
 */
const navigateToLogin = () => {
  const currentPage = getCurrentPagePath();
  wx.navigateTo({
    url: `/pages/login/login?redirect=${encodeURIComponent('/' + currentPage)}`
  });
};

/**
 * 检查网络状态
 * @returns {Promise} 网络状态Promise
 */
const checkNetworkStatus = () => {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: (res) => {
        resolve(res.networkType !== 'none');
      },
      fail: () => {
        resolve(false);
      }
    });
  });
};

/**
 * 检查是否是成员关系（父子、兄弟姐妹、配偶等）
 * @param {String} memberId1 - 成员ID1
 * @param {String} memberId2 - 成员ID2
 * @param {Array} allMembers - 所有成员数据
 * @returns {String|null} 关系类型，如 'parent', 'child', 'spouse', 'sibling', null
 */
const checkMemberRelation = (memberId1, memberId2, allMembers) => {
  if (memberId1 === memberId2) return null;
  
  const member1 = allMembers.find(m => m.id === memberId1);
  const member2 = allMembers.find(m => m.id === memberId2);
  
  if (!member1 || !member2) return null;
  
  // 检查父子关系
  if (member1.parentId === memberId2) return 'parent';
  if (member2.parentId === memberId1) return 'child';
  
  // 检查配偶关系
  if (member1.spouseIds && member1.spouseIds.includes(memberId2)) return 'spouse';
  
  // 检查兄弟姐妹关系（共同父母）
  if (member1.parentId && member1.parentId === member2.parentId) return 'sibling';
  
  return null;
};

module.exports = {
  formatDate,
  calculateAge,
  throttle,
  debounce,
  deepClone,
  getFileExtension,
  isImageFile,
  isVideoFile,
  formatFileSize,
  getProvince,
  hidePhoneNumber,
  isEmpty,
  randomColor,
  toFixedNumber,
  getCurrentPagePath,
  navigateToLogin,
  checkNetworkStatus,
  checkMemberRelation
};