import { request } from '../utils/request'
import {
  Circle,
  CircleMember,
  UserExerciseStats,
  Plan,
  CreateCircleRequest,
  JoinCircleRequest,
  GetCirclesRequest,
  APIResponse
} from '../types'

/**
 * 圈子服务类
 */
export class CircleService {
  static async createCircle(circleData: CreateCircleRequest): Promise<APIResponse<Circle>> {
    return request('/circles', 'POST', circleData)
  }

  static async joinCircle(joinData: JoinCircleRequest): Promise<APIResponse<Circle>> {
    return request('/circles/join', 'POST', joinData)
  }

  static async getMyCircles(params: GetCirclesRequest = {}): Promise<APIResponse<Circle[]>> {
    const query: Record<string, any> = {}
    if (params.page !== undefined) {
      query.page = params.page
    }
    if (params.pageSize !== undefined) {
      query.size = params.pageSize
    }
    if (params.status !== undefined) {
      query.status = params.status
    }
    return request('/circles/my', 'GET', query)
  }

  static async getCircleDetail(circleId: string): Promise<APIResponse<Circle>> {
    return request(`/circles/${circleId}`)
  }

  static async getCircleMembers(circleId: string): Promise<APIResponse<CircleMember[]>> {
    return request(`/circles/${circleId}/members`)
  }

  static async updateCircle(circleData: {
    circleId: string
    name?: string
    description?: string
    maxMembers?: number
  }): Promise<APIResponse<Circle>> {
    return request(`/circles/${circleData.circleId}`, 'PUT', circleData)
  }

  static async generateNewInviteCode(circleId: string): Promise<APIResponse<{ inviteCode: string }>> {
    return request(`/circles/${circleId}/invite-code`, 'POST')
  }

  static async archiveCircle(circleId: string): Promise<APIResponse<null>> {
    return request(`/circles/${circleId}/archive`, 'POST')
  }

  static async restoreCircle(circleId: string): Promise<APIResponse<null>> {
    return request(`/circles/${circleId}/restore`, 'POST')
  }

  static async getCurrentPlan(circleId: string): Promise<APIResponse<Plan | null>> {
    return request(`/plans/circle/${circleId}`)
  }

  /**
   * 获取圈子统计（本轮后端圈子维度统计未改造，临时复用用户维度统计接口）
   */
  static async getCircleStats(circleId: string): Promise<APIResponse<UserExerciseStats>> {
    return request('/checkin/stats/mine')
  }
}
