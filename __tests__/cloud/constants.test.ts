/**
 * 云函数常量测试
 * 验证 cloud/utils/constants.js 中的常量与前端一致
 */

const cloudConstants = require('../../cloud/utils/constants')

describe('DB_COLLECTIONS', () => {
  test('集合名称与前端一致', () => {
    expect(cloudConstants.DB_COLLECTIONS.USERS).toBe('users')
    expect(cloudConstants.DB_COLLECTIONS.CIRCLES).toBe('circles')
    expect(cloudConstants.DB_COLLECTIONS.CIRCLE_MEMBERS).toBe('circle_members')
    expect(cloudConstants.DB_COLLECTIONS.PLANS).toBe('plans')
    expect(cloudConstants.DB_COLLECTIONS.CHECKIN_RECORDS).toBe('checkin_records')
  })
})

describe('ErrorCode', () => {
  test('错误码与前端一致', () => {
    expect(cloudConstants.ErrorCode.SUCCESS).toBe(0)
    expect(cloudConstants.ErrorCode.PARAM_ERROR).toBe(1001)
    expect(cloudConstants.ErrorCode.AUTH_ERROR).toBe(1002)
    expect(cloudConstants.ErrorCode.NOT_FOUND).toBe(1003)
    expect(cloudConstants.ErrorCode.PERMISSION_DENIED).toBe(1004)
    expect(cloudConstants.ErrorCode.SERVER_ERROR).toBe(5000)
    expect(cloudConstants.ErrorCode.CLOUD_ERROR).toBe(5001)
    expect(cloudConstants.ErrorCode.NETWORK_ERROR).toBe(5002)
  })
})

describe('CHECKIN_RULES', () => {
  test('打卡规则与前端一致', () => {
    expect(cloudConstants.CHECKIN_RULES.MIN_DURATION).toBe(10)
    expect(cloudConstants.CHECKIN_RULES.MAX_DURATION).toBe(480)
    expect(cloudConstants.CHECKIN_RULES.MAX_PHOTO_SIZE).toBe(1024 * 1024)
    expect(cloudConstants.CHECKIN_RULES.PHOTO_QUALITY).toBe(80)
  })
})

describe('CIRCLE_RULES', () => {
  test('圈子规则与前端一致', () => {
    expect(cloudConstants.CIRCLE_RULES.MIN_MEMBERS).toBe(2)
    expect(cloudConstants.CIRCLE_RULES.MAX_MEMBERS).toBe(8)
    expect(cloudConstants.CIRCLE_RULES.INVITE_CODE_LENGTH).toBe(6)
  })
})

describe('PLAN_RULES', () => {
  test('计划规则与前端一致', () => {
    expect(cloudConstants.PLAN_RULES.MIN_DURATION_DAYS).toBe(1)
    expect(cloudConstants.PLAN_RULES.MAX_DURATION_DAYS).toBe(90)
    expect(cloudConstants.PLAN_RULES.REMINDER_DAYS_BEFORE_END).toBe(2)
  })
})
