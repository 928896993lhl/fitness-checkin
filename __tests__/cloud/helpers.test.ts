/**
 * 云函数工具函数测试
 * 测试 cloud/utils/helpers.js 中的所有函数
 */

const helpers = require('../../cloud/utils/helpers')

describe('generateInviteCode', () => {
  test('默认生成6位邀请码', () => {
    const code = helpers.generateInviteCode()
    expect(code.length).toBe(6)
    expect(/^[A-Za-z0-9]{6}$/.test(code)).toBe(true)
  })

  test('自定义长度', () => {
    const code = helpers.generateInviteCode(10)
    expect(code.length).toBe(10)
  })

  test('每次生成不同', () => {
    const codes = new Set()
    for (let i = 0; i < 50; i++) {
      codes.add(helpers.generateInviteCode())
    }
    expect(codes.size).toBeGreaterThan(1) // 极小概率重复，但基本不会
  })

  test('只包含字母数字', () => {
    const code = helpers.generateInviteCode(100)
    expect(/^[A-Za-z0-9]+$/.test(code)).toBe(true)
  })
})

describe('formatDate (cloud)', () => {
  test('默认格式', () => {
    const date = new Date(2024, 0, 15)
    expect(helpers.formatDate(date)).toBe('2024-01-15')
  })

  test('完整格式', () => {
    const date = new Date(2024, 0, 15, 14, 30, 45)
    expect(helpers.formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2024-01-15 14:30:45')
  })

  test('无效日期返回空字符串', () => {
    expect(helpers.formatDate('invalid')).toBe('')
  })

  test('补零', () => {
    const date = new Date(2024, 2, 5)
    expect(helpers.formatDate(date)).toBe('2024-03-05')
  })
})

describe('calculateDaysDiff (cloud)', () => {
  test('同一天', () => {
    const date = new Date('2024-01-15')
    expect(helpers.calculateDaysDiff(date, date)).toBe(0)
  })

  test('相邻两天', () => {
    expect(helpers.calculateDaysDiff('2024-01-15', '2024-01-16')).toBe(1)
  })

  test('7天', () => {
    expect(helpers.calculateDaysDiff('2024-01-01', '2024-01-08')).toBe(7)
  })

  test('逆序返回正值', () => {
    expect(helpers.calculateDaysDiff('2024-01-20', '2024-01-15')).toBe(5)
  })
})

describe('isSameDay (cloud)', () => {
  test('同一天', () => {
    const d1 = new Date(2024, 0, 15, 10, 30)
    const d2 = new Date(2024, 0, 15, 20, 45)
    expect(helpers.isSameDay(d1, d2)).toBe(true)
  })

  test('不同天', () => {
    expect(helpers.isSameDay('2024-01-15', '2024-01-16')).toBe(false)
  })
})

describe('getStartOfDay (cloud)', () => {
  test('重置时间', () => {
    const date = new Date(2024, 0, 15, 14, 30, 45)
    const start = helpers.getStartOfDay(date)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
  })
})

describe('getEndOfDay (cloud)', () => {
  test('设置时间到23:59:59.999', () => {
    const date = new Date(2024, 0, 15, 10, 0, 0)
    const end = helpers.getEndOfDay(date)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
    expect(end.getMilliseconds()).toBe(999)
  })
})

describe('isValidPhone (cloud)', () => {
  test('有效手机号', () => {
    expect(helpers.isValidPhone('13812345678')).toBe(true)
    expect(helpers.isValidPhone('15900001111')).toBe(true)
  })

  test('无效手机号', () => {
    expect(helpers.isValidPhone('12345678901')).toBe(false)
    expect(helpers.isValidPhone('1381234567')).toBe(false)
  })
})

describe('isValidInviteCode (cloud)', () => {
  test('有效邀请码', () => {
    expect(helpers.isValidInviteCode('ABC123')).toBe(true)
    expect(helpers.isValidInviteCode('abc123')).toBe(true)
  })

  test('无效邀请码', () => {
    expect(helpers.isValidInviteCode('ABC12')).toBe(false)
    expect(helpers.isValidInviteCode('ABC1234')).toBe(false)
  })
})

describe('isValidNickname (cloud)', () => {
  test('有效昵称', () => {
    expect(helpers.isValidNickname('健身达人')).toBe(true)
    expect(helpers.isValidNickname('User123')).toBe(true)
  })

  test('无效昵称', () => {
    expect(helpers.isValidNickname('A')).toBe(false)
    expect(helpers.isValidNickname('')).toBe(false)
  })
})

describe('safeJsonParse (cloud)', () => {
  test('有效JSON', () => {
    expect(helpers.safeJsonParse('{"key":"value"}')).toEqual({ key: 'value' })
  })

  test('无效JSON返回默认值', () => {
    expect(helpers.safeJsonParse('invalid', null)).toBeNull()
    expect(helpers.safeJsonParse('invalid', [])).toEqual([])
  })
})

describe('debounce (cloud)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('延迟执行', () => {
    const fn = jest.fn()
    const debouncedFn = helpers.debounce(fn, 300)

    debouncedFn()
    expect(fn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('throttle (cloud)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('立即执行', () => {
    const fn = jest.fn()
    const throttledFn = helpers.throttle(fn, 300)

    throttledFn()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('节流期间不执行', () => {
    const fn = jest.fn()
    const throttledFn = helpers.throttle(fn, 300)

    throttledFn()
    throttledFn()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
