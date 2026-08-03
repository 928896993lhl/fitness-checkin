/**
 * 日期工具函数测试
 * 测试 src/utils/dateUtils.ts 中的所有函数
 */

import {
  formatDate,
  calculateDaysDiff,
  isSameDay,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getStartOfMonth,
  isDateInRange,
  getRelativeTime,
  calculateAge,
  isLeapYear,
  getDaysInMonth
} from '../../src/utils/dateUtils'

describe('formatDate', () => {
  test('默认格式 YYYY-MM-DD', () => {
    const date = new Date(2024, 0, 15) // 2024-01-15
    expect(formatDate(date)).toBe('2024-01-15')
  })

  test('完整格式 YYYY-MM-DD HH:mm:ss', () => {
    const date = new Date(2024, 0, 15, 14, 30, 45)
    expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2024-01-15 14:30:45')
  })

  test('支持字符串输入', () => {
    expect(formatDate('2024-06-01')).toBe('2024-06-01')
  })

  test('无效日期返回空字符串', () => {
    expect(formatDate('invalid-date')).toBe('')
  })

  test('月份和日期补零', () => {
    const date = new Date(2024, 2, 5) // 3月5日
    expect(formatDate(date)).toBe('2024-03-05')
  })

  test('自定义格式 YYYY/MM/DD', () => {
    const date = new Date(2024, 11, 25)
    expect(formatDate(date, 'YYYY/MM/DD')).toBe('2024/12/25')
  })
})

describe('calculateDaysDiff', () => {
  test('同一天返回0', () => {
    const date = new Date('2024-01-15')
    expect(calculateDaysDiff(date, date)).toBe(0)
  })

  test('相邻两天返回1', () => {
    const start = new Date('2024-01-15')
    const end = new Date('2024-01-16')
    expect(calculateDaysDiff(start, end)).toBe(1)
  })

  test('跨月计算', () => {
    const start = new Date('2024-01-30')
    const end = new Date('2024-02-02')
    expect(calculateDaysDiff(start, end)).toBe(3)
  })

  test('逆序日期返回正值（使用绝对值）', () => {
    const start = new Date('2024-01-20')
    const end = new Date('2024-01-15')
    expect(calculateDaysDiff(start, end)).toBe(5)
  })

  test('跨年计算', () => {
    const start = new Date('2023-12-31')
    const end = new Date('2024-01-02')
    expect(calculateDaysDiff(start, end)).toBe(2)
  })

  test('闰年2月计算', () => {
    const start = new Date('2024-02-28')
    const end = new Date('2024-03-01')
    expect(calculateDaysDiff(start, end)).toBe(2) // 2024是闰年
  })

  test('字符串输入', () => {
    expect(calculateDaysDiff('2024-01-01', '2024-01-08')).toBe(7)
  })
})

describe('isSameDay', () => {
  test('同一天同时间', () => {
    const d1 = new Date(2024, 0, 15, 10, 30)
    const d2 = new Date(2024, 0, 15, 14, 45)
    expect(isSameDay(d1, d2)).toBe(true)
  })

  test('不同天', () => {
    const d1 = new Date(2024, 0, 15)
    const d2 = new Date(2024, 0, 16)
    expect(isSameDay(d1, d2)).toBe(false)
  })

  test('不同月同日', () => {
    const d1 = new Date(2024, 0, 15)
    const d2 = new Date(2024, 1, 15)
    expect(isSameDay(d1, d2)).toBe(false)
  })

  test('字符串输入', () => {
    expect(isSameDay('2024-01-15', '2024-01-15')).toBe(true)
    expect(isSameDay('2024-01-15', '2024-01-16')).toBe(false)
  })
})

describe('getStartOfDay', () => {
  test('时间重置为00:00:00.000', () => {
    const date = new Date(2024, 0, 15, 14, 30, 45, 500)
    const start = getStartOfDay(date)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getSeconds()).toBe(0)
    expect(start.getMilliseconds()).toBe(0)
  })

  test('日期保持不变', () => {
    const date = new Date(2024, 0, 15, 14, 30)
    const start = getStartOfDay(date)
    expect(start.getFullYear()).toBe(2024)
    expect(start.getMonth()).toBe(0)
    expect(start.getDate()).toBe(15)
  })
})

describe('getEndOfDay', () => {
  test('时间设置为23:59:59.999', () => {
    const date = new Date(2024, 0, 15, 10, 0, 0, 0)
    const end = getEndOfDay(date)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
    expect(end.getSeconds()).toBe(59)
    expect(end.getMilliseconds()).toBe(999)
  })
})

describe('getStartOfWeek', () => {
  test('返回本周日（一周开始）', () => {
    // 2024-01-17 是周三
    const date = new Date(2024, 0, 17)
    const start = getStartOfWeek(date)
    expect(start.getDay()).toBe(0) // 周日
    expect(start.getDate()).toBe(14) // 1月14日是周日
  })
})

describe('getStartOfMonth', () => {
  test('返回本月第一天', () => {
    const date = new Date(2024, 2, 15) // 3月15日
    const start = getStartOfMonth(date)
    expect(start.getDate()).toBe(1)
    expect(start.getMonth()).toBe(2)
    expect(start.getHours()).toBe(0)
  })
})

describe('isDateInRange', () => {
  test('在范围内', () => {
    expect(isDateInRange('2024-01-15', '2024-01-01', '2024-01-31')).toBe(true)
  })

  test('在边界上（开始）', () => {
    expect(isDateInRange('2024-01-01', '2024-01-01', '2024-01-31')).toBe(true)
  })

  test('在边界上（结束）', () => {
    expect(isDateInRange('2024-01-31', '2024-01-01', '2024-01-31')).toBe(true)
  })

  test('在范围外（之前）', () => {
    expect(isDateInRange('2023-12-31', '2024-01-01', '2024-01-31')).toBe(false)
  })

  test('在范围外（之后）', () => {
    expect(isDateInRange('2024-02-01', '2024-01-01', '2024-01-31')).toBe(false)
  })
})

describe('isLeapYear', () => {
  test('能被4整除但不能被100整除 - 闰年', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2028)).toBe(true)
  })

  test('能被400整除 - 闰年', () => {
    expect(isLeapYear(2000)).toBe(true)
    expect(isLeapYear(1600)).toBe(true)
  })

  test('能被100整除但不能被400整除 - 非闰年', () => {
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2100)).toBe(false)
  })

  test('不能被4整除 - 非闰年', () => {
    expect(isLeapYear(2023)).toBe(false)
    expect(isLeapYear(2025)).toBe(false)
  })
})

describe('getDaysInMonth', () => {
  test('1月有31天', () => {
    expect(getDaysInMonth(2024, 1)).toBe(31)
  })

  test('闰年2月有29天', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29)
  })

  test('非闰年2月有28天', () => {
    expect(getDaysInMonth(2023, 2)).toBe(28)
  })

  test('4月有30天', () => {
    expect(getDaysInMonth(2024, 4)).toBe(30)
  })

  test('12月有31天', () => {
    expect(getDaysInMonth(2024, 12)).toBe(31)
  })
})
