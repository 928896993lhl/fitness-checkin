/**
 * 云函数工具函数
 */

/**
 * 生成邀请码
 * @param {number} length 邀请码长度
 * @returns {string} 邀请码
 */
function generateInviteCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 格式化日期
 * @param {Date|string} date 日期对象或日期字符串
 * @param {string} format 格式化模板 (YYYY-MM-DD HH:mm:ss)
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date)
  
  if (isNaN(d.getTime())) {
    return ''
  }

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 计算两个日期之间的天数差
 * @param {Date} startDate 开始日期
 * @param {Date} endDate 结束日期
 * @returns {number} 天数差
 */
function calculateDaysDiff(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // 重置时间部分，只计算日期差
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * 判断两个日期是否是同一天
 * @param {Date} date1 日期1
 * @param {Date} date2 日期2
 * @returns {boolean} 是否是同一天
 */
function isSameDay(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * 获取今天的开始时间
 * @returns {Date} 今天的开始时间
 */
function getStartOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 获取今天的结束时间
 * @returns {Date} 今天的结束时间
 */
function getEndOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * 获取本周的开始时间（周日）
 * @returns {Date} 本周的开始时间
 */
function getStartOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 获取本月的开始时间
 * @returns {Date} 本月的开始时间
 */
function getStartOfMonth(date = new Date()) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 验证手机号格式
 * @param {string} phone 手机号
 * @returns {boolean} 是否有效
 */
function isValidPhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证邀请码格式
 * @param {string} code 邀请码
 * @returns {boolean} 是否有效
 */
function isValidInviteCode(code) {
  const codeRegex = /^[A-Za-z0-9]{6}$/
  return codeRegex.test(code)
}

/**
 * 验证昵称格式
 * @param {string} nickname 昵称
 * @returns {boolean} 是否有效
 */
function isValidNickname(nickname) {
  const nicknameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/
  return nicknameRegex.test(nickname)
}

/**
 * 安全的JSON解析
 * @param {string} jsonString JSON字符串
 * @param {*} defaultValue 默认值
 * @returns {*} 解析结果
 */
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('JSON解析失败:', error)
    return defaultValue
  }
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait = 300) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit = 300) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

module.exports = {
  generateInviteCode,
  formatDate,
  calculateDaysDiff,
  isSameDay,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getStartOfMonth,
  isValidPhone,
  isValidInviteCode,
  isValidNickname,
  safeJsonParse,
  debounce,
  throttle
}
