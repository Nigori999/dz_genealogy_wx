/**
 * HTTP请求封装服务
 * 处理所有网络请求，包括拦截器、错误处理和认证
 */

// 请求基础URL，正式环境和测试环境可配置
const BASE_URL = 'https://api.example.com/v1';

// 本地存储的Token键名
const TOKEN_KEY = 'cloud_genealogy_token';

/**
 * 获取存储的Token
 * @returns {String} 认证Token
 */
const getToken = () => {
  return wx.getStorageSync(TOKEN_KEY) || '';
};

/**
 * 设置Token到本地存储
 * @param {String} token - 认证Token
 */
const setToken = (token) => {
  wx.setStorageSync(TOKEN_KEY, token);
};

/**
 * 清除Token
 */
const clearToken = () => {
  wx.removeStorageSync(TOKEN_KEY);
};

/**
 * 请求拦截器
 * @param {Object} options - 请求选项
 * @returns {Object} 处理后的请求选项
 */
const requestInterceptor = (options) => {
  // 添加token到请求头
  const token = getToken();
  if (token) {
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${token}`
    };
  }

  // 添加通用请求头
  options.header = {
    'Content-Type': 'application/json',
    ...options.header
  };

  // 处理URL
  if (!options.url.startsWith('http')) {
    options.url = BASE_URL + options.url;
  }
  
  return options;
};

/**
 * 响应拦截器
 * @param {Object} response - 响应数据
 * @returns {Promise} 处理后的响应Promise
 */
const responseInterceptor = (response) => {
  return new Promise((resolve, reject) => {
    const { statusCode, data } = response;
    
    // 请求成功
    if (statusCode >= 200 && statusCode < 300) {
      // API返回的业务状态码处理
      if (data.code === 0 || data.code === 200) {
        resolve(data.data);
      } else {
        // 业务错误
        showToast(data.message || '请求失败');
        reject(data);
      }
    } 
    // 认证失败
    else if (statusCode === 401) {
      clearToken();
      showToast('登录已过期，请重新登录');
      // 跳转登录页面
      wx.navigateTo({
        url: '/pages/login/login'
      });
      reject(response);
    } 
    // 服务器错误
    else if (statusCode >= 500) {
      showToast('服务器错误，请稍后重试');
      reject(response);
    } 
    // 其他错误
    else {
      showToast(data.message || '请求失败');
      reject(response);
    }
  });
};

/**
 * 显示提示信息
 * @param {String} message - 提示消息
 */
const showToast = (message) => {
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
};

/**
 * 发起HTTP请求
 * @param {Object} options - 请求选项
 * @returns {Promise} 请求Promise
 */
const request = (options) => {
  // 应用请求拦截器
  options = requestInterceptor(options);
  
  // 显示加载提示
  if (options.showLoading !== false) {
    wx.showLoading({
      title: options.loadingText || '加载中...',
      mask: true
    });
  }
  
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: (res) => {
        // 应用响应拦截器
        responseInterceptor(res)
          .then(resolve)
          .catch(reject);
      },
      fail: (error) => {
        console.error('Request failed:', error);
        showToast('网络请求失败，请检查网络连接');
        reject(error);
      },
      complete: () => {
        // 隐藏加载提示
        if (options.showLoading !== false) {
          wx.hideLoading();
        }
      }
    });
  });
};

/**
 * GET请求
 * @param {String} url - 请求URL
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他选项
 * @returns {Promise} 请求Promise
 */
const get = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'GET',
    ...options
  });
};

/**
 * POST请求
 * @param {String} url - 请求URL
 * @param {Object} data - 请求数据
 * @param {Object} options - 其他选项
 * @returns {Promise} 请求Promise
 */
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'POST',
    ...options
  });
};

/**
 * PUT请求
 * @param {String} url - 请求URL
 * @param {Object} data - 请求数据
 * @param {Object} options - 其他选项
 * @returns {Promise} 请求Promise
 */
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'PUT',
    ...options
  });
};

/**
 * DELETE请求
 * @param {String} url - 请求URL
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他选项
 * @returns {Promise} 请求Promise
 */
const del = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'DELETE',
    ...options
  });
};

/**
 * 上传文件
 * @param {String} url - 上传URL
 * @param {String} filePath - 文件路径
 * @param {String} name - 文件对应的 key
 * @param {Object} formData - 附加的表单数据
 * @param {Object} options - 其他选项
 * @returns {Promise} 上传Promise
 */
const upload = (url, filePath, name = 'file', formData = {}, options = {}) => {
  // 应用请求拦截器处理header和url
  options = requestInterceptor(options);
  
  // 显示上传加载提示
  if (options.showLoading !== false) {
    wx.showLoading({
      title: options.loadingText || '上传中...',
      mask: true
    });
  }
  
  return new Promise((resolve, reject) => {
    const uploadTask = wx.uploadFile({
      url: options.url,
      filePath,
      name,
      formData,
      header: options.header,
      success: (res) => {
        // 将返回的JSON字符串转换为对象
        try {
          const data = JSON.parse(res.data);
          // 应用响应拦截器
          responseInterceptor({
            statusCode: res.statusCode,
            data
          })
            .then(resolve)
            .catch(reject);
        } catch (error) {
          console.error('Parse response failed:', error);
          reject(error);
        }
      },
      fail: (error) => {
        console.error('Upload failed:', error);
        showToast('上传失败，请重试');
        reject(error);
      },
      complete: () => {
        // 隐藏上传加载提示
        if (options.showLoading !== false) {
          wx.hideLoading();
        }
      }
    });
    
    // 监听上传进度
    if (options.onProgress) {
      uploadTask.onProgressUpdate((res) => {
        options.onProgress(res.progress);
      });
    }
  });
};

module.exports = {
  // 请求方法
  get,
  post,
  put,
  del,
  upload,
  request,
  
  // Token管理
  getToken,
  setToken,
  clearToken,
  
  // 工具方法
  showToast
};