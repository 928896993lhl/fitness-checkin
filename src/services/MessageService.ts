import { request } from '../utils/request'
import { APIResponse } from '../types'

/**
 * 消息服务类
 * 处理消息推送相关的API调用
 */
export class MessageService {
  /**
   * 发送每日运动汇总
   * @returns 发送结果
   */
  static async sendDailySummary(): Promise<APIResponse<any[]>> {
    return request('/messages/daily-summary', 'POST')
  }

  /**
   * 发送周期结束提醒
   * @returns 发送结果
   */
  static async sendPlanEndReminder(): Promise<APIResponse<any[]>> {
    return request('/messages/plan-end-reminder', 'POST')
  }

  /**
   * 发送打卡提醒
   * @returns 发送结果
   */
  static async sendCheckinReminder(): Promise<APIResponse<any[]>> {
    return request('/messages/checkin-reminder', 'POST')
  }

  /**
   * 获取已订阅消息的用户
   * @param circleId 圈子ID
   * @returns 用户ID列表
   */
  static async getSubscribers(circleId: string): Promise<APIResponse<string[]>> {
    return request(`/messages/subscribers?circleId=${circleId}`)
  }
}
