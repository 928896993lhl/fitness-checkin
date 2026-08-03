/**
 * 存储工具函数测试
 * 测试 src/utils/storageUtils.ts 中的函数
 * 注意：这些测试依赖于 Taro mock
 */

import {
  setStorage,
  getStorage,
  removeStorage,
  clearStorage,
  setToken,
  getToken,
  removeToken,
  setUserInfo,
  getUserInfo,
  removeUserInfo,
  setLastCircleId,
  getLastCircleId,
  removeLastCircleId,
  setExerciseTypes,
  getExerciseTypes,
  removeExerciseTypes
} from '../../src/utils/storageUtils'

describe('基础存储操作', () => {
  beforeEach(() => {
    clearStorage()
  })

  test('setStorage 和 getStorage', () => {
    setStorage('testKey', 'testValue')
    expect(getStorage('testKey', 'default')).toBe('testValue')
  })

  test('getStorage 默认值', () => {
    expect(getStorage('nonExistent', 'default')).toBe('default')
  })

  test('removeStorage', () => {
    setStorage('toRemove', 'value')
    removeStorage('toRemove')
    expect(getStorage('toRemove', null)).toBeNull()
  })

  test('clearStorage 清除所有', () => {
    setStorage('key1', 'value1')
    setStorage('key2', 'value2')
    clearStorage()
    expect(getStorage('key1', null)).toBeNull()
    expect(getStorage('key2', null)).toBeNull()
  })

  test('存储不同类型的数据', () => {
    setStorage('string', 'hello')
    setStorage('number', 42)
    setStorage('object', { a: 1, b: 2 })
    setStorage('array', [1, 2, 3])

    expect(getStorage('string', '')).toBe('hello')
    expect(getStorage('number', 0)).toBe(42)
    expect(getStorage('object', {})).toEqual({ a: 1, b: 2 })
    expect(getStorage('array', [])).toEqual([1, 2, 3])
  })
})

describe('Token 操作', () => {
  beforeEach(() => {
    removeToken()
  })

  test('设置和获取Token', () => {
    setToken('test-token-123')
    expect(getToken()).toBe('test-token-123')
  })

  test('删除Token', () => {
    setToken('test-token')
    removeToken()
    expect(getToken()).toBeNull()
  })

  test('未设置时返回null', () => {
    expect(getToken()).toBeNull()
  })
})

describe('用户信息操作', () => {
  beforeEach(() => {
    removeUserInfo()
  })

  test('设置和获取用户信息', () => {
    const userInfo = { nickname: '测试用户', avatar_url: 'https://example.com/avatar.jpg' }
    setUserInfo(userInfo)
    expect(getUserInfo()).toEqual(userInfo)
  })

  test('删除用户信息', () => {
    setUserInfo({ nickname: 'test' })
    removeUserInfo()
    expect(getUserInfo()).toBeNull()
  })
})

describe('最后访问圈子ID', () => {
  beforeEach(() => {
    removeLastCircleId()
  })

  test('设置和获取圈子ID', () => {
    setLastCircleId('circle-123')
    expect(getLastCircleId()).toBe('circle-123')
  })

  test('删除圈子ID', () => {
    setLastCircleId('circle-123')
    removeLastCircleId()
    expect(getLastCircleId()).toBeNull()
  })
})

describe('运动类型操作', () => {
  beforeEach(() => {
    removeExerciseTypes()
  })

  test('设置和获取运动类型', () => {
    const types = ['running', 'walking', 'yoga']
    setExerciseTypes(types)
    expect(getExerciseTypes()).toEqual(types)
  })

  test('删除运动类型', () => {
    setExerciseTypes(['running'])
    removeExerciseTypes()
    expect(getExerciseTypes()).toEqual([])
  })
})
