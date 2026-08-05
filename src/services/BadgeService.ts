import { request } from '../utils/request'
import { BadgeInfo, APIResponse } from '../types'

/**
 * 徽章服务类
 * 处理徽章相关的API调用
 */
export class BadgeService {
  /**
   * 获取我的全部徽章（8 条固定顺序，含解锁状态与进度文本）
   */
  static async getMyBadges(): Promise<APIResponse<BadgeInfo[]>> {
    return request('/badges/mine')
  }
}
