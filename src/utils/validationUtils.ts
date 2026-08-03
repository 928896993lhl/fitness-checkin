import { REGEX_PATTERNS, CHECKIN_RULES, CIRCLE_RULES } from '../types/constants'

/**
 * 验证工具函数
 */

/**
 * 验证手机号格式
 * @param phone 手机号
 * @returns 是否有效
 */
export function isValidPhone(phone: string): boolean {
  return REGEX_PATTERNS.PHONE.test(phone)
}

/**
 * 验证邀请码格式
 * @param code 邀请码
 * @returns 是否有效
 */
export function isValidInviteCode(code: string): boolean {
  return REGEX_PATTERNS.INVITE_CODE.test(code)
}

/**
 * 验证昵称格式
 * @param nickname 昵称
 * @returns 是否有效
 */
export function isValidNickname(nickname: string): boolean {
  return REGEX_PATTERNS.NICKNAME.test(nickname)
}

/**
 * 验证打卡时长
 * @param duration 时长（分钟）
 * @returns 是否有效
 */
export function isValidCheckinDuration(duration: number): boolean {
  return duration >= CHECKIN_RULES.MIN_DURATION && duration <= CHECKIN_RULES.MAX_DURATION
}

/**
 * 验证圈子人数
 * @param count 人数
 * @returns 是否有效
 */
export function isValidMemberCount(count: number): boolean {
  return count >= CIRCLE_RULES.MIN_MEMBERS && count <= CIRCLE_RULES.MAX_MEMBERS
}

/**
 * 验证邮箱格式
 * @param email 邮箱
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证身份证号格式
 * @param idCard 身份证号
 * @returns 是否有效
 */
export function isValidIdCard(idCard: string): boolean {
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return idCardRegex.test(idCard)
}

/**
 * 验证URL格式
 * @param url URL
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证字符串是否为空
 * @param str 字符串
 * @returns 是否为空
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0
}

/**
 * 验证字符串长度
 * @param str 字符串
 * @param min 最小长度
 * @param max 最大长度
 * @returns 是否在范围内
 */
export function isLengthInRange(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max
}

/**
 * 验证数字是否在范围内
 * @param num 数字
 * @param min 最小值
 * @param max 最大值
 * @returns 是否在范围内
 */
export function isNumberInRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max
}

/**
 * 验证日期是否有效
 * @param dateStr 日期字符串
 * @returns 是否有效
 */
export function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

/**
 * 验证日期是否在将来
 * @param dateStr 日期字符串
 * @returns 是否在将来
 */
export function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return date > now
}

/**
 * 验证日期是否在过去
 * @param dateStr 日期字符串
 * @returns 是否在过去
 */
export function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return date < now
}

/**
 * 验证开始日期是否早于结束日期
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 是否有效
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return start < end
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 强度等级（0-3）
 */
export function getPasswordStrength(password: string): number {
  let strength = 0
  
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  
  return Math.min(strength, 3)
}

/**
 * 验证文件大小
 * @param size 文件大小（字节）
 * @param maxSize 最大大小（字节）
 * @returns 是否符合大小要求
 */
export function isValidFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize
}

/**
 * 验证文件类型
 * @param fileName 文件名
 * @param allowedTypes 允许的文件类型
 * @returns 是否为允许的类型
 */
export function isValidFileType(fileName: string, allowedTypes: string[]): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return allowedTypes.includes(ext || '')
}

/**
 * 验证图片文件
 * @param fileName 文件名
 * @returns 是否为图片文件
 */
export function isImageFile(fileName: string): boolean {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  return isValidFileType(fileName, imageTypes)
}

/**
 * 清理和验证用户输入
 * @param input 用户输入
 * @param maxLength 最大长度
 * @returns 清理后的输入
 */
export function sanitizeInput(input: string, maxLength: number = 100): string {
  // 移除HTML标签
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // 移除多余空格
  sanitized = sanitized.replace(/\s+/g, ' ').trim()
  
  // 限制长度
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  return sanitized
}

/**
 * 验证并格式化手机号
 * @param phone 手机号
 * @returns 格式化后的手机号或null
 */
export function formatPhone(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, '')
  
  if (isValidPhone(cleaned)) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  
  return null
}
