import { request, uploadFile } from '../utils/request'
import {
  CheckinRecord,
  UserExerciseStats,
  CreateCheckinRequest,
  GetCheckinRecordsRequest,
  HeatmapData,
  APIResponse,
  PaginatedResult
} from '../types'

/**
 * 打卡服务类
 * 处理打卡相关的API调用
 */
export class CheckinService {
  /**
   * 创建打卡记录（宽松打卡：planId/circleId 均可空）
   * 响应 data 含瞬态字段 newlyUnlockedBadges（本次新解锁徽章，向后兼容）
   */
  static async createCheckin(checkinData: CreateCheckinRequest): Promise<APIResponse<CheckinRecord>> {
    return request('/checkin', 'POST', checkinData)
  }

  /**
   * 获取我的活跃度热力图（按天聚合）
   * @param days 天数（默认365，后端截断 [7,365]）
   */
  static async getHeatmap(days: number = 365): Promise<APIResponse<HeatmapData>> {
    return request(`/checkin/heatmap/mine?days=${days}`)
  }

  /**
   * 获取我的打卡记录（分页 + 可选筛选）
   */
  static async getMyCheckins(params: GetCheckinRecordsRequest = {}): Promise<APIResponse<PaginatedResult<CheckinRecord>>> {
    const query: Record<string, any> = {
      page: params.page ?? 1,
      size: params.pageSize ?? 10
    }
    if (params.planId !== undefined && params.planId !== null && params.planId !== '') {
      query.planId = params.planId
    }
    if (params.exerciseType !== undefined && params.exerciseType !== '') {
      query.exerciseType = params.exerciseType
    }
    if (params.startDate !== undefined && params.startDate !== '') {
      query.startDate = params.startDate
    }
    if (params.endDate !== undefined && params.endDate !== '') {
      query.endDate = params.endDate
    }
    return request('/checkin/records/mine', 'GET', query)
  }

  /**
   * 获取计划的打卡记录
   */
  static async getCheckinsByPlan(planId: string, params: GetCheckinRecordsRequest = {}): Promise<APIResponse<PaginatedResult<CheckinRecord>>> {
    const query: Record<string, any> = {
      page: params.page ?? 1,
      size: params.pageSize ?? 10
    }
    if (params.startDate !== undefined && params.startDate !== '') {
      query.startDate = params.startDate
    }
    if (params.endDate !== undefined && params.endDate !== '') {
      query.endDate = params.endDate
    }
    return request(`/checkin/records/${planId}`, 'GET', query)
  }

  /**
   * 获取用户打卡记录
   */
  static async getCheckinsByUser(userId: string, params: GetCheckinRecordsRequest = {}): Promise<APIResponse<PaginatedResult<CheckinRecord>>> {
    const query: Record<string, any> = {
      page: params.page ?? 1,
      size: params.pageSize ?? 10
    }
    return request('/checkin/records/mine', 'GET', query)
  }

  /**
   * 获取今日打卡记录
   */
  static async getTodayCheckins(planId?: string): Promise<APIResponse<{
    checked: boolean
    planId?: string
  }>> {
    const url = planId ? `/checkin/check-today/${planId}` : '/checkin/check-today/0'
    return request(url)
  }

  /**
   * 获取我的运动统计
   */
  static async getUserStats(): Promise<APIResponse<UserExerciseStats>> {
    return request('/checkin/stats/mine')
  }

  /**
   * 上传照片
   * 🔴 必须传 name='file'（后端 FileController 为 @RequestParam("file")；
   *    旧代码传 'photo' 会导致头像/打卡照片 400）
   */
  static async uploadPhoto(filePath: string): Promise<APIResponse<{
    url: string
  }>> {
    return uploadFile(filePath, 'file')
  }
}
