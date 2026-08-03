import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from '../types/constants'

/**
 * 本地存储工具函数
 */

/**
 * 设置存储数据
 * @param key 存储键名
 * @param value 存储值
 */
export function setStorage<T>(key: string, value: T): void {
  try {
    Taro.setStorageSync(key, value)
  } catch (error) {
    console.error(`设置存储失败 [${key}]:`, error)
  }
}

/**
 * 获取存储数据
 * @param key 存储键名
 * @param defaultValue 默认值
 * @returns 存储值
 */
export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const value = Taro.getStorageSync(key)
    return value !== '' ? value : defaultValue
  } catch (error) {
    console.error(`获取存储失败 [${key}]:`, error)
    return defaultValue
  }
}

/**
 * 删除存储数据
 * @param key 存储键名
 */
export function removeStorage(key: string): void {
  try {
    Taro.removeStorageSync(key)
  } catch (error) {
    console.error(`删除存储失败 [${key}]:`, error)
  }
}

/**
 * 清空所有存储数据
 */
export function clearStorage(): void {
  try {
    Taro.clearStorageSync()
  } catch (error) {
    console.error('清空存储失败:', error)
  }
}

/**
 * 获取存储信息
 * @returns 存储信息
 */
export function getStorageInfo(): Taro.getStorageInfoSync.Result {
  try {
    return Taro.getStorageInfoSync()
  } catch (error) {
    console.error('获取存储信息失败:', error)
    return {
      keys: [],
      currentSize: 0,
      limitSize: 0
    }
  }
}

/**
 * 设置用户token
 * @param token token值
 */
export function setToken(token: string): void {
  setStorage(STORAGE_KEYS.TOKEN, token)
}

/**
 * 获取用户token
 * @returns token值
 */
export function getToken(): string | null {
  return getStorage<string | null>(STORAGE_KEYS.TOKEN, null)
}

/**
 * 删除用户token
 */
export function removeToken(): void {
  removeStorage(STORAGE_KEYS.TOKEN)
}

/**
 * 设置用户信息
 * @param userInfo 用户信息
 */
export function setUserInfo(userInfo: any): void {
  setStorage(STORAGE_KEYS.USER_INFO, userInfo)
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function getUserInfo(): any {
  return getStorage(STORAGE_KEYS.USER_INFO, null)
}

/**
 * 删除用户信息
 */
export function removeUserInfo(): void {
  removeStorage(STORAGE_KEYS.USER_INFO)
}

/**
 * 设置最后访问的圈子ID
 * @param circleId 圈子ID
 */
export function setLastCircleId(circleId: string): void {
  setStorage(STORAGE_KEYS.LAST_CIRCLE_ID, circleId)
}

/**
 * 获取最后访问的圈子ID
 * @returns 圈子ID
 */
export function getLastCircleId(): string | null {
  return getStorage<string | null>(STORAGE_KEYS.LAST_CIRCLE_ID, null)
}

/**
 * 删除最后访问的圈子ID
 */
export function removeLastCircleId(): void {
  removeStorage(STORAGE_KEYS.LAST_CIRCLE_ID)
}

/**
 * 设置自定义运动类型
 * @param types 运动类型列表
 */
export function setExerciseTypes(types: string[]): void {
  setStorage(STORAGE_KEYS.EXERCISE_TYPES, types)
}

/**
 * 获取自定义运动类型
 * @returns 运动类型列表
 */
export function getExerciseTypes(): string[] {
  return getStorage<string[]>(STORAGE_KEYS.EXERCISE_TYPES, [])
}

/**
 * 删除自定义运动类型
 */
export function removeExerciseTypes(): void {
  removeStorage(STORAGE_KEYS.EXERCISE_TYPES)
}

/**
 * 检查存储空间是否充足
 * @param requiredSize 需要的空间大小（KB）
 * @returns 是否充足
 */
export function checkStorageSpace(requiredSize: number): boolean {
  try {
    const info = getStorageInfo()
    const availableSpace = info.limitSize - info.currentSize
    return availableSpace >= requiredSize
  } catch (error) {
    console.error('检查存储空间失败:', error)
    return false
  }
}

/**
 * 清理过期的存储数据
 * @param maxAge 最大有效期（毫秒）
 */
export function cleanExpiredStorage(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
  try {
    const info = getStorageInfo()
    const now = Date.now()
    
    info.keys.forEach(key => {
      try {
        const data = Taro.getStorageSync(key)
        if (data && typeof data === 'object' && data.timestamp) {
          if (now - data.timestamp > maxAge) {
            Taro.removeStorageSync(key)
          }
        }
      } catch (error) {
        // 忽略单个键的错误
      }
    })
  } catch (error) {
    console.error('清理过期存储失败:', error)
  }
}

/**
 * 导出存储数据
 * @returns 所有存储数据
 */
export function exportStorageData(): Record<string, any> {
  try {
    const info = getStorageInfo()
    const data: Record<string, any> = {}
    
    info.keys.forEach(key => {
      try {
        data[key] = Taro.getStorageSync(key)
      } catch (error) {
        // 忽略单个键的错误
      }
    })
    
    return data
  } catch (error) {
    console.error('导出存储数据失败:', error)
    return {}
  }
}

/**
 * 导入存储数据
 * @param data 要导入的数据
 */
export function importStorageData(data: Record<string, any>): void {
  try {
    Object.entries(data).forEach(([key, value]) => {
      Taro.setStorageSync(key, value)
    })
  } catch (error) {
    console.error('导入存储数据失败:', error)
  }
}
