/**
 * 常量定义测试
 * 验证 src/types/constants.ts 中的常量是否正确
 */

import {
  CLOUD_ENV,
  DB_COLLECTIONS,
  CLOUD_FUNCTIONS,
  PAGINATION_DEFAULTS,
  CHECKIN_RULES,
  CIRCLE_RULES,
  PLAN_RULES,
  TIME_CONSTANTS,
  EXERCISE_TYPE_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  PAGE_PATHS,
  REGEX_PATTERNS
} from '../../src/types/constants'

describe('CLOUD_ENV', () => {
  test('云环境ID不为空', () => {
    expect(CLOUD_ENV).toBeTruthy()
    expect(typeof CLOUD_ENV).toBe('string')
  })
})

describe('DB_COLLECTIONS', () => {
  test('包含所有必要的集合', () => {
    expect(DB_COLLECTIONS.USERS).toBe('users')
    expect(DB_COLLECTIONS.CIRCLES).toBe('circles')
    expect(DB_COLLECTIONS.CIRCLE_MEMBERS).toBe('circle_members')
    expect(DB_COLLECTIONS.PLANS).toBe('plans')
    expect(DB_COLLECTIONS.CHECKIN_RECORDS).toBe('checkin_records')
  })

  test('集合名称与PRD数据模型一致', () => {
    // PRD中定义的5个核心表
    expect(Object.keys(DB_COLLECTIONS)).toHaveLength(5)
  })
})

describe('CLOUD_FUNCTIONS', () => {
  test('包含所有必要的云函数', () => {
    expect(CLOUD_FUNCTIONS.USER).toBe('user')
    expect(CLOUD_FUNCTIONS.CIRCLE).toBe('circle')
    expect(CLOUD_FUNCTIONS.PLAN).toBe('plan')
    expect(CLOUD_FUNCTIONS.CHECKIN).toBe('checkin')
    expect(CLOUD_FUNCTIONS.MESSAGE).toBe('message')
  })
})

describe('PAGINATION_DEFAULTS', () => {
  test('默认分页参数', () => {
    expect(PAGINATION_DEFAULTS.PAGE).toBe(1)
    expect(PAGINATION_DEFAULTS.PAGE_SIZE).toBe(10)
    expect(PAGINATION_DEFAULTS.MAX_PAGE_SIZE).toBe(50)
  })

  test('分页参数合理', () => {
    expect(PAGINATION_DEFAULTS.PAGE_SIZE).toBeLessThanOrEqual(PAGINATION_DEFAULTS.MAX_PAGE_SIZE)
  })
})

describe('CHECKIN_RULES', () => {
  test('打卡规则与PRD一致', () => {
    expect(CHECKIN_RULES.MIN_DURATION).toBe(10) // PRD: 不低于10分钟
    expect(CHECKIN_RULES.MAX_DURATION).toBe(480) // 8小时上限
    expect(CHECKIN_RULES.MAX_PHOTO_SIZE).toBe(1024 * 1024) // 1MB
    expect(CHECKIN_RULES.PHOTO_QUALITY).toBe(80)
  })

  test('最小值小于最大值', () => {
    expect(CHECKIN_RULES.MIN_DURATION).toBeLessThan(CHECKIN_RULES.MAX_DURATION)
  })
})

describe('CIRCLE_RULES', () => {
  test('圈子规则与PRD一致', () => {
    expect(CIRCLE_RULES.MIN_MEMBERS).toBe(2) // PRD: 2-8人
    expect(CIRCLE_RULES.MAX_MEMBERS).toBe(8)
    expect(CIRCLE_RULES.INVITE_CODE_LENGTH).toBe(6)
  })

  test('最小人数小于最大人数', () => {
    expect(CIRCLE_RULES.MIN_MEMBERS).toBeLessThan(CIRCLE_RULES.MAX_MEMBERS)
  })
})

describe('PLAN_RULES', () => {
  test('计划规则与PRD一致', () => {
    expect(PLAN_RULES.MIN_DURATION_DAYS).toBe(1)
    expect(PLAN_RULES.MAX_DURATION_DAYS).toBe(90)
    expect(PLAN_RULES.REMINDER_DAYS_BEFORE_END).toBe(2) // PRD: 结束前两天提醒
  })

  test('最小天数小于最大天数', () => {
    expect(PLAN_RULES.MIN_DURATION_DAYS).toBeLessThan(PLAN_RULES.MAX_DURATION_DAYS)
  })
})

describe('TIME_CONSTANTS', () => {
  test('时间常量换算正确', () => {
    expect(TIME_CONSTANTS.SECOND).toBe(1000)
    expect(TIME_CONSTANTS.MINUTE).toBe(60 * 1000)
    expect(TIME_CONSTANTS.HOUR).toBe(60 * 60 * 1000)
    expect(TIME_CONSTANTS.DAY).toBe(24 * 60 * 60 * 1000)
    expect(TIME_CONSTANTS.WEEK).toBe(7 * 24 * 60 * 60 * 1000)
  })
})

describe('EXERCISE_TYPE_CONFIG', () => {
  test('包含所有运动类型', () => {
    expect(EXERCISE_TYPE_CONFIG.running).toBeDefined()
    expect(EXERCISE_TYPE_CONFIG.walking).toBeDefined()
    expect(EXERCISE_TYPE_CONFIG.cycling).toBeDefined()
    expect(EXERCISE_TYPE_CONFIG.swimming).toBeDefined()
    expect(EXERCISE_TYPE_CONFIG.yoga).toBeDefined()
    expect(EXERCISE_TYPE_CONFIG.gym).toBeDefined()
    expect(EXERCISE_TYPE_CONFIG.other).toBeDefined()
  })

  test('每个运动类型都有name/icon/color', () => {
    Object.values(EXERCISE_TYPE_CONFIG).forEach(config => {
      expect(config.name).toBeTruthy()
      expect(config.icon).toBeTruthy()
      expect(config.color).toBeTruthy()
    })
  })

  test('运动类型数量与枚举一致', () => {
    expect(Object.keys(EXERCISE_TYPE_CONFIG)).toHaveLength(7)
  })
})

describe('ERROR_MESSAGES', () => {
  test('所有错误消息是字符串', () => {
    Object.values(ERROR_MESSAGES).forEach(msg => {
      expect(typeof msg).toBe('string')
      expect(msg.length).toBeGreaterThan(0)
    })
  })

  test('包含核心错误消息', () => {
    expect(ERROR_MESSAGES.NETWORK_ERROR).toBeTruthy()
    expect(ERROR_MESSAGES.AUTH_ERROR).toBeTruthy()
    expect(ERROR_MESSAGES.CIRCLE_FULL).toBeTruthy()
    expect(ERROR_MESSAGES.CHECKIN_DURATION_INVALID).toBeTruthy()
    expect(ERROR_MESSAGES.IMAGE_TOO_LARGE).toBeTruthy()
  })
})

describe('SUCCESS_MESSAGES', () => {
  test('所有成功消息是字符串', () => {
    Object.values(SUCCESS_MESSAGES).forEach(msg => {
      expect(typeof msg).toBe('string')
      expect(msg.length).toBeGreaterThan(0)
    })
  })
})

describe('STORAGE_KEYS', () => {
  test('包含核心存储键', () => {
    expect(STORAGE_KEYS.TOKEN).toBeTruthy()
    expect(STORAGE_KEYS.USER_INFO).toBeTruthy()
    expect(STORAGE_KEYS.LAST_CIRCLE_ID).toBeTruthy()
    expect(STORAGE_KEYS.EXERCISE_TYPES).toBeTruthy()
  })
})

describe('PAGE_PATHS', () => {
  test('包含所有页面路径', () => {
    expect(PAGE_PATHS.INDEX).toBe('/pages/index/index')
    expect(PAGE_PATHS.LOGIN).toBe('/pages/login/login')
    expect(PAGE_PATHS.CIRCLE).toBe('/pages/circle/circle')
    expect(PAGE_PATHS.CIRCLE_CREATE).toBe('/pages/circle/create/create')
    expect(PAGE_PATHS.CIRCLE_JOIN).toBe('/pages/circle/join/join')
    expect(PAGE_PATHS.PLAN_CREATE).toBe('/pages/plan/create/create')
    expect(PAGE_PATHS.PLAN_DETAIL).toBe('/pages/plan/detail/detail')
    expect(PAGE_PATHS.CHECKIN).toBe('/pages/checkin/checkin')
    expect(PAGE_PATHS.PROFILE).toBe('/pages/profile/profile')
    expect(PAGE_PATHS.PROFILE_HISTORY).toBe('/pages/profile/history/history')
  })

  test('页面路径数量与实际文件匹配', () => {
    expect(Object.keys(PAGE_PATHS)).toHaveLength(10)
  })
})

describe('REGEX_PATTERNS', () => {
  test('邀请码正则 - 6位字母数字', () => {
    expect(REGEX_PATTERNS.INVITE_CODE.test('ABC123')).toBe(true)
    expect(REGEX_PATTERNS.INVITE_CODE.test('abc123')).toBe(true)
    expect(REGEX_PATTERNS.INVITE_CODE.test('ABC12')).toBe(false)
    expect(REGEX_PATTERNS.INVITE_CODE.test('ABC-23')).toBe(false)
  })

  test('手机号正则', () => {
    expect(REGEX_PATTERNS.PHONE.test('13812345678')).toBe(true)
    expect(REGEX_PATTERNS.PHONE.test('12345678901')).toBe(false)
  })

  test('昵称正则 - 2-20位中英文数字下划线', () => {
    expect(REGEX_PATTERNS.NICKNAME.test('健身达人')).toBe(true)
    expect(REGEX_PATTERNS.NICKNAME.test('User_123')).toBe(true)
    expect(REGEX_PATTERNS.NICKNAME.test('A')).toBe(false)
    expect(REGEX_PATTERNS.NICKNAME.test('user@name')).toBe(false)
  })
})
