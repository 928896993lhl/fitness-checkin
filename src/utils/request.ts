import Taro from '@tarojs/taro'
import { APIResponse } from '../types'

/**
 * API基础地址
 */
const BASE_URL = 'http://124.222.95.76/api'

/**
 * 请求拦截器
 */
const requestInterceptor = (config: any) => {
  const token = Taro.getStorageSync('token')
  if (token) {
    config.header = {
      ...config.header,
      'Authorization': `Bearer ${token}`
    }
  }
  return config
}

/**
 * 响应拦截器
 */
const responseInterceptor = (response: any) => {
  if (response.statusCode === 401) {
    // token过期，跳转登录页
    Taro.removeStorageSync('token')
    Taro.navigateTo({ url: '/pages/login/login' })
    throw new Error('登录已过期，请重新登录')
  }
  
  if (response.statusCode >= 400) {
    const error = response.data?.message || '请求失败'
    throw new Error(error)
  }
  
  return response.data
}

/**
 * 通用请求方法
 */
export const request = async <T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<APIResponse<T>> => {
  try {
    const config = {
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json'
      }
    }
    
    const interceptedConfig = requestInterceptor(config)
    const response = await Taro.request(interceptedConfig)
    
    return responseInterceptor(response) as APIResponse<T>
  } catch (error) {
    console.error('请求失败:', error)
    throw error
  }
}

/**
 * 上传文件
 */
export const uploadFile = async (
  filePath: string,
  name: string = 'file'
): Promise<APIResponse<{ url: string }>> => {
  try {
    const token = Taro.getStorageSync('token')
    const result = await Taro.uploadFile({
      url: `${BASE_URL}/files/upload`,
      filePath,
      name,
      header: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (result.statusCode >= 400) {
      throw new Error('上传失败')
    }
    
    return JSON.parse(result.data) as APIResponse<{ url: string }>
  } catch (error) {
    console.error('上传文件失败:', error)
    throw error
  }
}

export default request
