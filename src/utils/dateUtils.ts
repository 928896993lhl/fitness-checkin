/**
 * 日期处理工具函数
 */

/**
 * 格式化日期
 * @param date 日期对象或日期字符串
 * @param format 格式化模板 (YYYY-MM-DD HH:mm:ss)
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
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
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 计算两个日期之间的天数差
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 天数差
 */
export function calculateDaysDiff(startDate: Date | string, endDate: Date | string): number {
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
 * @param date1 日期1
 * @param date2 日期2
 * @returns 是否是同一天
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
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
 * @param date 可选日期，默认为今天
 * @returns 今天的开始时间
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 获取今天的结束时间
 * @param date 可选日期，默认为今天
 * @returns 今天的结束时间
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * 获取本周的开始时间（周日）
 * @param date 可选日期，默认为今天
 * @returns 本周的开始时间
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 获取本月的开始时间
 * @param date 可选日期，默认为今天
 * @returns 本月的开始时间
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * 判断日期是否在范围内
 * @param date 要检查的日期
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 是否在范围内
 */
export function isDateInRange(date: Date | string, startDate: Date | string, endDate: Date | string): boolean {
  const d = new Date(date)
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  return d >= start && d <= end
}

/**
 * 获取相对时间描述
 * @param date 日期
 * @returns 相对时间描述（如：刚刚、5分钟前、昨天等）
 */
export function getRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return formatDate(d, 'YYYY-MM-DD')
}

/**
 * 计算年龄
 * @param birthday 生日
 * @returns 年龄
 */
export function calculateAge(birthday: Date | string): number {
  const birth = new Date(birthday)
  const today = new Date()
  
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * 判断是否为闰年
 * @param year 年份
 * @returns 是否为闰年
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * 获取月份的天数
 * @param year 年份
 * @param month 月份（1-12）
 * @returns 天数
 */
export function getDaysInMonth(year: number, month: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  
  if (month === 2 && isLeapYear(year)) {
    return 29
  }
  
  return daysInMonth[month - 1]
}
