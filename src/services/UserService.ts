import { request, uploadFile } from '../utils/request'
import { User, APIResponse } from '../types'

/**
 * 用户服务类
 * 处理用户相关的API调用
 */
export class UserService {
  /**
   * 用户登录
   * @param loginData 登录数据
   * @returns 登录结果
   */
  static async login(loginData: {
    code: string
    nickname?: string
    avatar_url?: string
    gender?: number
    province?: string
    city?: string
    country?: string
  }): Promise<APIResponse<{ user: User; token: string; isNewUser: boolean }>> {
    return request('/auth/login', 'POST', loginData)
  }

  /**
   * 获取当前用户信息
   * @returns 用户信息
   */
  static async getUserInfo(): Promise<APIResponse<User>> {
    return request('/auth/userinfo')
  }

  /**
   * 更新用户信息
   * @param userData 用户数据
   * @returns 更新结果
   */
  static async updateUserInfo(userData: {
    nickname?: string
    avatar_url?: string
    gender?: number
    province?: string
    city?: string
    country?: string
  }): Promise<APIResponse<User>> {
    return request('/auth/userinfo', 'PUT', userData)
  }

  /**
   * 根据用户ID获取用户信息
   * @param userId 用户ID
   * @returns 用户信息
   */
  static async getUserById(userId: string): Promise<APIResponse<User>> {
    return request(`/users/${userId}`)
  }

  /**
   * 批量获取用户信息
   * @param userIds 用户ID列表
   * @returns 用户信息列表
   */
  static async getUsersByIds(userIds: string[]): Promise<APIResponse<User[]>> {
    return request('/users/batch', 'POST', { userIds })
  }
}
