/**
 * 通用工具函数测试
 * 测试 src/utils/index.ts 中的通用函数
 */

import {
  debounce,
  throttle,
  generateId,
  safeJsonParse,
  deepClone,
  formatNumber,
  formatFileSize,
  truncateString,
  capitalizeFirstLetter,
  toCamelCase,
  toKebabCase,
  isEmptyValue,
  sleep,
  retry
} from '../../src/utils/index'

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('延迟执行', () => {
    const fn = jest.fn()
    const debouncedFn = debounce(fn, 300)

    debouncedFn()
    expect(fn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('多次调用只执行最后一次', () => {
    const fn = jest.fn()
    const debouncedFn = debounce(fn, 300)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    jest.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('传递参数', () => {
    const fn = jest.fn()
    const debouncedFn = debounce(fn, 300)

    debouncedFn('arg1', 'arg2')
    jest.advanceTimersByTime(300)

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2')
  })
})

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('第一次调用立即执行', () => {
    const fn = jest.fn()
    const throttledFn = throttle(fn, 300)

    throttledFn()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('节流期间不重复执行', () => {
    const fn = jest.fn()
    const throttledFn = throttle(fn, 300)

    throttledFn()
    throttledFn()
    throttledFn()

    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('节流结束后可以再次执行', () => {
    const fn = jest.fn()
    const throttledFn = throttle(fn, 300)

    throttledFn()
    expect(fn).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(300)

    throttledFn()
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

describe('generateId', () => {
  test('生成字符串', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  test('每次生成唯一ID', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})

describe('safeJsonParse', () => {
  test('解析有效JSON', () => {
    expect(safeJsonParse('{"key":"value"}', {})).toEqual({ key: 'value' })
    expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3])
    expect(safeJsonParse('"hello"', '')).toBe('hello')
    expect(safeJsonParse('42', 0)).toBe(42)
  })

  test('无效JSON返回默认值', () => {
    expect(safeJsonParse('invalid', { default: true })).toEqual({ default: true })
    expect(safeJsonParse('', [])).toEqual([])
    expect(safeJsonParse('{bad json}', null)).toBeNull()
  })
})

describe('deepClone', () => {
  test('克隆基本类型', () => {
    expect(deepClone(42)).toBe(42)
    expect(deepClone('hello')).toBe('hello')
    expect(deepClone(null)).toBeNull()
    expect(deepClone(undefined)).toBeUndefined()
  })

  test('克隆对象', () => {
    const original = { a: 1, b: { c: 2 } }
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned.b).not.toBe(original.b)
  })

  test('克隆数组', () => {
    const original = [1, [2, 3], { a: 4 }]
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned[1]).not.toBe(original[1])
  })

  test('克隆日期', () => {
    const original = new Date('2024-01-15')
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
  })

  test('修改克隆不影响原对象', () => {
    const original = { a: { b: 1 } }
    const cloned = deepClone(original)
    cloned.a.b = 2

    expect(original.a.b).toBe(1)
    expect(cloned.a.b).toBe(2)
  })
})

describe('formatNumber', () => {
  test('添加千位分隔符', () => {
    expect(formatNumber(1234)).toBe('1,234')
    expect(formatNumber(1234567)).toBe('1,234,567')
    expect(formatNumber(100)).toBe('100')
  })

  test('0和负数', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(-1234)).toBe('-1,234')
  })
})

describe('formatFileSize', () => {
  test('格式化字节', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1048576)).toBe('1 MB')
    expect(formatFileSize(1073741824)).toBe('1 GB')
  })

  test('非整数', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })
})

describe('truncateString', () => {
  test('不超过最大长度', () => {
    expect(truncateString('hello', 10)).toBe('hello')
  })

  test('超过最大长度截断', () => {
    expect(truncateString('hello world', 8)).toBe('hello...')
  })

  test('自定义后缀', () => {
    expect(truncateString('hello world', 8, '…')).toBe('hello w…')
  })
})

describe('capitalizeFirstLetter', () => {
  test('首字母大写', () => {
    expect(capitalizeFirstLetter('hello')).toBe('Hello')
    expect(capitalizeFirstLetter('world')).toBe('World')
  })

  test('空字符串', () => {
    expect(capitalizeFirstLetter('')).toBe('')
  })

  test('已是大写', () => {
    expect(capitalizeFirstLetter('Hello')).toBe('Hello')
  })
})

describe('toCamelCase', () => {
  test('短横线转驼峰', () => {
    expect(toCamelCase('hello-world')).toBe('helloWorld')
  })

  test('空格转驼峰', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld')
  })

  test('下划线转驼峰', () => {
    expect(toCamelCase('hello_world')).toBe('helloWorld')
  })

  test('多段转驼峰', () => {
    expect(toCamelCase('get-user-info')).toBe('getUserInfo')
  })

  test('全大写开头', () => {
    expect(toCamelCase('Hello_World')).toBe('helloWorld')
  })
})

describe('toKebabCase', () => {
  test('驼峰转短横线', () => {
    expect(toKebabCase('helloWorld')).toBe('hello-world')
  })

  test('空格转短横线', () => {
    expect(toKebabCase('hello world')).toBe('hello-world')
  })
})

describe('isEmptyValue', () => {
  test('空值', () => {
    expect(isEmptyValue(null)).toBe(true)
    expect(isEmptyValue(undefined)).toBe(true)
    expect(isEmptyValue('')).toBe(true)
    expect(isEmptyValue('   ')).toBe(true)
    expect(isEmptyValue([])).toBe(true)
    expect(isEmptyValue({})).toBe(true)
  })

  test('非空值', () => {
    expect(isEmptyValue('hello')).toBe(false)
    expect(isEmptyValue(0)).toBe(false)
    expect(isEmptyValue(false)).toBe(false)
    expect(isEmptyValue([1])).toBe(false)
    expect(isEmptyValue({ a: 1 })).toBe(false)
  })
})

describe('retry', () => {
  test('第一次成功', async () => {
    const fn = jest.fn().mockResolvedValue('success')
    const result = await retry(fn, 3, 100)
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('重试后成功', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success')

    const result = await retry(fn, 3, 10) // 使用短延迟
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  }, 10000)

  test('所有重试都失败', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fail'))

    await expect(retry(fn, 2, 10)).rejects.toThrow('always fail')
    expect(fn).toHaveBeenCalledTimes(2)
  }, 10000)
})
