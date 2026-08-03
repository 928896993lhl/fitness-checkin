/**
 * 云函数常量定义
 */

// 数据库集合名称
const DB_COLLECTIONS = {
  USERS: 'users',
  CIRCLES: 'circles',
  CIRCLE_MEMBERS: 'circle_members',
  PLANS: 'plans',
  CHECKIN_RECORDS: 'checkin_records'
}

// 错误码
const ErrorCode = {
  SUCCESS: 0,
  PARAM_ERROR: 1001,
  AUTH_ERROR: 1002,
  NOT_FOUND: 1003,
  PERMISSION_DENIED: 1004,
  SERVER_ERROR: 5000,
  CLOUD_ERROR: 5001,
  NETWORK_ERROR: 5002
}

// 打卡规则
const CHECKIN_RULES = {
  MIN_DURATION: 10, // 最低打卡时长（分钟）
  MAX_DURATION: 480, // 最高打卡时长（8小时）
  MAX_PHOTO_SIZE: 1024 * 1024, // 最大照片大小（1MB）
  PHOTO_QUALITY: 80 // 照片压缩质量
}

// 圈子规则
const CIRCLE_RULES = {
  MIN_MEMBERS: 2,
  MAX_MEMBERS: 8,
  INVITE_CODE_LENGTH: 6 // 邀请码长度
}

// 计划规则
const PLAN_RULES = {
  MIN_DURATION_DAYS: 1, // 最小计划天数
  MAX_DURATION_DAYS: 90, // 最大计划天数（3个月）
  REMINDER_DAYS_BEFORE_END: 2 // 结束前提醒天数
}

module.exports = {
  DB_COLLECTIONS,
  ErrorCode,
  CHECKIN_RULES,
  CIRCLE_RULES,
  PLAN_RULES
}
