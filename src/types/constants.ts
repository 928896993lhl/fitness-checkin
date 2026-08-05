/**
 * 常量定义
 * 存储应用中使用的所有常量
 */
export { isCircleActive, isCreatorRole } from './index'

/** API基础地址 */
export const API_BASE_URL = 'https://keepall.cloud/api'

/** 数据库集合名称 */
export const DB_COLLECTIONS = {
  USERS: 'users',
  CIRCLES: 'circles',
  CIRCLE_MEMBERS: 'circle_members',
  PLANS: 'plans',
  CHECKIN_RECORDS: 'checkin_records'
} as const

/** API路径 */
export const API_PATHS = {
  USER: '/auth',
  CIRCLE: '/circles',
  PLAN: '/plans',
  CHECKIN: '/checkin',
  MESSAGE: '/messages'
} as const

/** 分页默认值 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50
} as const

/** 打卡规则 */
export const CHECKIN_RULES = {
  MIN_DURATION: 1, // 最低打卡时长（分钟），全局 1-480
  MAX_DURATION: 480, // 最高打卡时长（8小时，防止误填）
  MAX_PHOTO_SIZE: 1024 * 1024, // 最大照片大小（1MB）
  PHOTO_QUALITY: 80 // 照片压缩质量
} as const

/** 打卡时长快捷档位（分钟） */
export const DURATION_QUICK_OPTIONS = [15, 30, 45, 60] as const

/** 圈子规则 */
export const CIRCLE_RULES = {
  MIN_MEMBERS: 2,
  MAX_MEMBERS: 50,
  INVITE_CODE_LENGTH: 8 // 邀请码长度
} as const

/** 创建圈子可选人数档位 */
export const MEMBER_LIMIT_OPTIONS = [2, 5, 8, 15, 30, 50] as const

/** 热力图色阶（GitHub 风格，按分钟区间着色） */
export const HEATMAP_LEVELS = [
  { min: 0, color: '#EBEDF0' },
  { min: 1, color: '#9BE9A8' },
  { min: 30, color: '#40C463' },
  { min: 60, color: '#216E39' }
] as const

/** 运动类型里程系数（km/h），与后端 BadgeCode.EXERCISE_SPEED_KMH 必须同步 */
export const EXERCISE_SPEED_KMH: Record<string, number> = {
  running: 8,
  walking: 5,
  cycling: 15,
  swimming: 3
} as const

/** 计划规则 */
export const PLAN_RULES = {
  MIN_DURATION_DAYS: 1, // 最小计划天数
  MAX_DURATION_DAYS: 90, // 最大计划天数（3个月）
  REMINDER_DAYS_BEFORE_END: 2 // 结束前提醒天数
} as const

/** 时间常量（毫秒） */
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
} as const

/** 运动类型配置 */
export const EXERCISE_TYPE_CONFIG = {
  running: {
    name: '跑步',
    icon: '🏃',
    color: '#3b82f6'
  },
  walking: {
    name: '健走',
    icon: '🚶',
    color: '#10b981'
  },
  cycling: {
    name: '骑行',
    icon: '🚴',
    color: '#f59e0b'
  },
  swimming: {
    name: '游泳',
    icon: '🏊',
    color: '#06b6d4'
  },
  yoga: {
    name: '瑜伽',
    icon: '🧘',
    color: '#8b5cf6'
  },
  gym: {
    name: '健身',
    icon: '💪',
    color: '#ef4444'
  },
  other: {
    name: '其他',
    icon: '⚡',
    color: '#6b7280'
  }
} as const

/** 错误消息 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络',
  AUTH_ERROR: '登录已过期，请重新登录',
  PARAM_ERROR: '参数错误',
  SERVER_ERROR: '服务器错误，请稍后重试',
  PERMISSION_DENIED: '权限不足',
  NOT_FOUND: '资源不存在',
  CIRCLE_FULL: '圈子人数已满',
  ALREADY_IN_CIRCLE: '您已在圈子中',
  CIRCLE_ARCHIVED: '圈子已归档',
  CHECKIN_DURATION_INVALID: '打卡时长不符合要求',
  CHECKIN_ALREADY_EXISTS: '今日已打卡，请勿重复打卡',
  IMAGE_TOO_LARGE: '图片大小超过限制',
  IMAGE_UPLOAD_FAILED: '图片上传失败'
} as const

/** 成功消息 */
export const SUCCESS_MESSAGES = {
  CIRCLE_CREATED: '圈子创建成功',
  CIRCLE_JOINED: '成功加入圈子',
  PLAN_CREATED: '计划创建成功',
  CHECKIN_SUCCESS: '打卡成功',
  PROFILE_UPDATED: '个人信息更新成功'
} as const

/** 本地存储键名 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  LAST_CIRCLE_ID: 'lastCircleId',
  LAST_EXERCISE_TYPE: 'lastExerciseType',
  EXERCISE_TYPES: 'exerciseTypes'
} as const

/** 页面路径 */
export const PAGE_PATHS = {
  INDEX: '/pages/index/index',
  LOGIN: '/pages/login/login',
  CIRCLE: '/pages/circle/circle',
  CIRCLE_CREATE: '/pages/circle/create/create',
  CIRCLE_JOIN: '/pages/circle/join/join',
  PLAN_CREATE: '/pages/plan/create/create',
  PLAN_DETAIL: '/pages/plan/detail/detail',
  PLAN_EDIT: '/pages/plan/edit/edit',
  CHECKIN: '/pages/checkin/checkin',
  PROFILE: '/pages/profile/profile',
  PROFILE_HISTORY: '/pages/profile/history/history',
  PROFILE_CAREER: '/pages/profile/career/career',
  PROFILE_SETTINGS: '/pages/profile/settings/settings'
} as const

/** 正则表达式 */
export const REGEX_PATTERNS = {
  INVITE_CODE: /^[A-Za-z0-9]{8}$/, // 8位字母数字邀请码
  PHONE: /^1[3-9]\d{9}$/, // 手机号
  NICKNAME: /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/ // 2-20位中英文数字下划线昵称
} as const
