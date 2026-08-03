import { request } from '../utils/request'
import {
  Circle,
  CircleMember,
  CircleExerciseStats,
  Plan,
  CreateCircleRequest,
  JoinCircleRequest,
  GetCirclesRequest,
  APIResponse,
  PaginatedResult
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

  static async getMyCircles(params: GetCirclesRequest = {}): Promise<APIResponse<PaginatedResult<Circle>>> {
    return request('/circles/my')
  }

  static async getCircleDetail(circleId: string): Promise<APIResponse<Circle>> {
    return request(`/circles/${circleId}`)
  }

  static async getCircleMembers(circleId: string): Promise<APIResponse<CircleMember[]>> {
    return request(`/circles/${circleId}/members`)
  }

  static async updateCircle(circleData: {
    circle_id: string
    name?: string
    description?: string
    max_members?: number
  }): Promise<APIResponse<Circle>> {
    return request(`/circles/${circleData.circle_id}`, 'PUT', circleData)
  }

  static async generateNewInviteCode(circleId: string): Promise<APIResponse<{ invite_code: string }>> {
    return request(`/circles/${circleId}/invite-code`, 'POST')
  }

  static async archiveCircle(circleId: string): Promise<APIResponse<null>> {
    return request(`/circles/${circleId}/archive`, 'POST')
  }

  static async getCurrentPlan(circleId: string): Promise<APIResponse<Plan | null>> {
    return request(`/plans/circle/${circleId}`)
  }

  static async getCircleStats(circleId: string): Promise<APIResponse<CircleExerciseStats>> {
    return request('/checkin/stats/0')
  }
}
