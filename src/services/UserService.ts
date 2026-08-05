import { request } from '../utils/request'
import { User, LoginResult, UpdateUserInfoRequest, APIResponse } from '../types'

/**
 * 用户服务类
 * 处理用户相关的API调用
 */
export class UserService {
  /**
   * 用户登录
   * 后端 AuthController.wxLogin 返回扁平 Map {token, userId, openid, nickname, avatarUrl}
   * @param loginData 登录数据
   * @returns 登录结果（扁平结构）
   */
  static async login(loginData: {
    code: string
    nickname?: string
    avatarUrl?: string
    gender?: number
    province?: string
    city?: string
    country?: string
  }): Promise<APIResponse<LoginResult>> {
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
   * 更新用户信息（部分字段：nickname / avatarUrl 至少一个；avatarUrl 空串清空头像）
   * @param userData 用户数据
   * @returns 更新后的用户信息
   */
  static async updateUserInfo(userData: UpdateUserInfoRequest): Promise<APIResponse<User>> {
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
