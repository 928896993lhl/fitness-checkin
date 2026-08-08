export * from './dateUtils'
export * from './imageUtils'
export * from './validationUtils'
export * from './storageUtils'
export * from './memberFields'

/**
 * 通用工具函数
 */

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 生成唯一ID
 * @returns 唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 安全的JSON解析
 * @param jsonString JSON字符串
 * @param defaultValue 默认值
 * @returns 解析结果
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error('JSON解析失败:', error)
    return defaultValue
  }
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any
  }
  
  if (obj instanceof Object) {
    const copy = {} as any
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone((obj as any)[key])
    })
    return copy
  }
  
  return obj
}

/**
 * 格式化数字（添加千位分隔符）
 * @param num 数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 截断字符串
 * @param str 字符串
 * @param maxLength 最大长度
 * @param suffix 后缀
 * @returns 截断后的字符串
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) {
    return str
  }
  
  return str.substring(0, maxLength - suffix.length) + suffix
}

/**
 * 首字母大写
 * @param str 字符串
 * @returns 首字母大写的字符串
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 驼峰命名转换
 * @param str 字符串
 * @returns 驼峰命名的字符串
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[\s\-_]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toLowerCase())
}

/**
 * 短横线命名转换
 * @param str 字符串
 * @returns 短横线命名的字符串
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * 判断是否为空值
 * @param value 值
 * @returns 是否为空
 */
export function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined) {
    return true
  }
  
  if (typeof value === 'string') {
    return value.trim().length === 0
  }
  
  if (Array.isArray(value)) {
    return value.length === 0
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0
  }
  
  return false
}

/**
 * 等待指定时间
 * @param ms 毫秒数
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 重试函数
 * @param func 要重试的函数
 * @param maxRetries 最大重试次数
 * @param delay 重试延迟（毫秒）
 * @returns 函数执行结果
 */
export async function retry<T>(
  func: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await func()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await sleep(delay * (i + 1))
      }
    }
  }
  
  throw lastError!
}
