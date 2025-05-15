/**
 * HTTP请求服务（http.js的别名）
 * 这个文件是为了兼容性目的而存在的，方便从'./request'导入HTTP请求功能
 */

// 从http.js重新导出所有功能
module.exports = require('./http'); 