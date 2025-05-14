/**
 * 日期处理工具函数
 */

/**
 * 解析日期字符串为Date对象
 * @param {String} dateString - 日期字符串
 * @returns {Date|null} Date对象或null
 */
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // 尝试解析不同格式的日期
  const date = new Date(dateString);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    // 尝试解析其他格式
    // 例如："2021年5月1日" 或 "2021/5/1" 等
    const formats = [
      // "2021年5月1日" 格式
      {
        regex: /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
        parser: (match) => new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      },
      // "2021/5/1" 格式
      {
        regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
        parser: (match) => new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      },
      // "2021-5-1" 格式
      {
        regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
        parser: (match) => new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      },
      // "2021.5.1" 格式
      {
        regex: /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/,
        parser: (match) => new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      }
    ];
    
    for (const format of formats) {
      const match = dateString.match(format.regex);
      if (match) {
        const parsedDate = format.parser(match);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
    
    return null;
  }
  
  return date;
};

/**
 * 格式化日期为指定格式的字符串
 * @param {Date|String} date - 日期对象或日期字符串
 * @param {String} format - 格式字符串，例如 'YYYY-MM-DD'
 * @returns {String} 格式化后的日期字符串
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  // 如果是字符串，尝试解析
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const seconds = dateObj.getSeconds();
  
  const pad = (num) => (num < 10 ? '0' + num : num);
  
  return format
    .replace('YYYY', year)
    .replace('MM', pad(month))
    .replace('DD', pad(day))
    .replace('HH', pad(hours))
    .replace('mm', pad(minutes))
    .replace('ss', pad(seconds));
};

/**
 * 获取两个日期之间的天数差
 * @param {Date|String} date1 - 第一个日期
 * @param {Date|String} date2 - 第二个日期
 * @returns {Number} 天数差
 */
const daysBetween = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? parseDate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
  
  if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  
  // 转换为UTC时间戳，忽略时区差异
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  
  // 计算差异的毫秒数，并转换为天数
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

/**
 * 获取某个日期前后N天的日期
 * @param {Date|String} date - 基准日期
 * @param {Number} days - 天数，正数为之后，负数为之前
 * @returns {Date} 计算后的日期
 */
const addDays = (date, days) => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (!d || isNaN(d.getTime())) return null;
  
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * 获取某个日期前后N个月的日期
 * @param {Date|String} date - 基准日期
 * @param {Number} months - 月数，正数为之后，负数为之前
 * @returns {Date} 计算后的日期
 */
const addMonths = (date, months) => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (!d || isNaN(d.getTime())) return null;
  
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * 获取某个日期前后N年的日期
 * @param {Date|String} date - 基准日期
 * @param {Number} years - 年数，正数为之后，负数为之前
 * @returns {Date} 计算后的日期
 */
const addYears = (date, years) => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (!d || isNaN(d.getTime())) return null;
  
  const result = new Date(d);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

/**
 * 判断日期是否是今天
 * @param {Date|String} date - 要判断的日期
 * @returns {Boolean} 是否是今天
 */
const isToday = (date) => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (!d || isNaN(d.getTime())) return false;
  
  const today = new Date();
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

/**
 * 获取日期是星期几
 * @param {Date|String} date - 日期
 * @returns {Number} 星期几，0-6 分别代表星期日到星期六
 */
const getDayOfWeek = (date) => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (!d || isNaN(d.getTime())) return -1;
  
  return d.getDay();
};

/**
 * 获取星期几的中文名称
 * @param {Date|String} date - 日期
 * @returns {String} 星期几的中文名称
 */
const getDayOfWeekChinese = (date) => {
  const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const day = getDayOfWeek(date);
  
  if (day < 0) return '';
  return weekdayMap[day];
};

/**
 * 获取某月的天数
 * @param {Number} year - 年份
 * @param {Number} month - 月份（1-12）
 * @returns {Number} 天数
 */
const getDaysInMonth = (year, month) => {
  // 月份需要转换为0-11
  return new Date(year, month, 0).getDate();
};

/**
 * 判断是否是闰年
 * @param {Number} year - 年份
 * @returns {Boolean} 是否是闰年
 */
const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * 获取某年某月的第一天是星期几
 * @param {Number} year - 年份
 * @param {Number} month - 月份（1-12）
 * @returns {Number} 星期几，0-6 分别代表星期日到星期六
 */
const getFirstDayOfMonth = (year, month) => {
  // 月份需要转换为0-11
  return new Date(year, month - 1, 1).getDay();
};

/**
 * 获取某年某月的日历数据
 * @param {Number} year - 年份
 * @param {Number} month - 月份（1-12）
 * @returns {Array} 日历数据，包含前后月份的日期
 */
const getCalendarDays = (year, month) => {
  const days = [];
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  
  // 添加上个月的日期
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({
      date: new Date(prevYear, prevMonth - 1, daysInPrevMonth - firstDayOfMonth + i + 1),
      isCurrentMonth: false,
      isPrevMonth: true,
      isNextMonth: false
    });
  }
  
  // 添加当前月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month - 1, i),
      isCurrentMonth: true,
      isPrevMonth: false,
      isNextMonth: false
    });
  }
  
  // 添加下个月的日期，补齐到42天（6周）
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  
  const daysNeeded = 42 - days.length;
  for (let i = 1; i <= daysNeeded; i++) {
    days.push({
      date: new Date(nextYear, nextMonth - 1, i),
      isCurrentMonth: false,
      isPrevMonth: false,
      isNextMonth: true
    });
  }
  
  return days;
};

/**
 * 格式化日期范围
 * @param {Date|String} startDate - 开始日期
 * @param {Date|String} endDate - 结束日期
 * @param {String} format - 日期格式
 * @returns {String} 格式化后的日期范围
 */
const formatDateRange = (startDate, endDate, format = 'YYYY-MM-DD') => {
  if (!startDate || !endDate) return '';
  
  const start = formatDate(startDate, format);
  const end = formatDate(endDate, format);
  
  return `${start} 至 ${end}`;
};

/**
 * 获取中文农历日期
 * 注意：此函数为简化实现，仅作示意，实际农历计算较为复杂
 * @param {Date|String} date - 日期
 * @returns {String} 中文农历日期字符串
 */
const getChineseLunarDate = (date) => {
  // 实际项目中应使用专业的农历计算库
  // 这里仅返回提示信息
  return '农历日期计算需要专业库支持';
};

/**
 * 格式化时间为相对时间描述
 * @param {Date|String} date - 日期
 * @returns {String} 相对时间描述
 */
const formatRelativeTime = (date) => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (!d || isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  
  if (diffYear > 0) {
    return `${diffYear}年前`;
  } else if (diffMonth > 0) {
    return `${diffMonth}个月前`;
  } else if (diffDay > 0) {
    return `${diffDay}天前`;
  } else if (diffHour > 0) {
    return `${diffHour}小时前`;
  } else if (diffMin > 0) {
    return `${diffMin}分钟前`;
  } else {
    return '刚刚';
  }
};

/**
 * 获取时间戳
 * @param {Date|String} date - 日期
 * @returns {Number} 时间戳（毫秒）
 */
const getTimestamp = (date) => {
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (!d || isNaN(d.getTime())) return 0;
  
  return d.getTime();
};

/**
 * 从时间戳创建日期
 * @param {Number} timestamp - 时间戳（毫秒）
 * @returns {Date} 日期对象
 */
const createDateFromTimestamp = (timestamp) => {
  return new Date(timestamp);
};

/**
 * 计算年龄
 * @param {Date|String} birthDate - 出生日期
 * @param {Date|String} referenceDate - 参考日期，默认为当前日期
 * @returns {Number} 年龄
 */
const calculateAge = (birthDate, referenceDate = new Date()) => {
  const birth = typeof birthDate === 'string' ? parseDate(birthDate) : birthDate;
  const reference = typeof referenceDate === 'string' ? parseDate(referenceDate) : referenceDate;
  
  if (!birth || isNaN(birth.getTime())) return 0;
  if (!reference || isNaN(reference.getTime())) return 0;
  
  let age = reference.getFullYear() - birth.getFullYear();
  
  // 检查月份和日期，看是否已经过了生日
  const m = reference.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && reference.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * 日期比较
 * @param {Date|String} date1 - 第一个日期
 * @param {Date|String} date2 - 第二个日期
 * @returns {Number} 比较结果：-1表示date1小于date2，0表示相等，1表示date1大于date2
 */
const compareDate = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? parseDate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
  
  if (!d1 || isNaN(d1.getTime())) return -1;
  if (!d2 || isNaN(d2.getTime())) return 1;
  
  const t1 = d1.getTime();
  const t2 = d2.getTime();
  
  if (t1 < t2) return -1;
  if (t1 > t2) return 1;
  return 0;
};

module.exports = {
  parseDate,
  formatDate,
  daysBetween,
  addDays,
  addMonths,
  addYears,
  isToday,
  getDayOfWeek,
  getDayOfWeekChinese,
  getDaysInMonth,
  isLeapYear,
  getFirstDayOfMonth,
  getCalendarDays,
  formatDateRange,
  getChineseLunarDate,
  formatRelativeTime,
  getTimestamp,
  createDateFromTimestamp,
  calculateAge,
  compareDate
};