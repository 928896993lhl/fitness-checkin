import { request } from '../utils/request'
import {
  Plan,
  PlanProgress,
  CreatePlanRequest,
  UpdatePlanRequest,
  GetPlansRequest,
  APIResponse
} from '../types'

/**
 * 计划服务类
 */
export class PlanService {
  static async createPlan(planData: CreatePlanRequest): Promise<APIResponse<Plan>> {
    return request('/plans', 'POST', planData)
  }

  /**
   * 更新计划（部分字段：仅圈子管理员且仅 status=0 可改）
   * @param planId 计划ID
   * @param data   部分字段（至少一个）
   */
  static async updatePlan(planId: string, data: UpdatePlanRequest): Promise<APIResponse<Plan>> {
    return request(`/plans/${planId}`, 'PUT', data)
  }

  /**
   * 获取圈子计划列表
   * r5 契约：后端直接返回 Plan[]（非分页），每个元素含 stats 键
   * （CirclePlanStats：userCount/recordCount/totalDuration/totalMemberDays/progressPercentage）。
   * 权限：仅圈子成员可查，非成员返回 403。
   */
  static async getPlansByCircle(circleId: string, params: GetPlansRequest = {}): Promise<APIResponse<Plan[]>> {
    const query: Record<string, any> = {}
    if (params.status !== undefined) {
      query.status = params.status
    }
    if (params.page !== undefined) {
      query.page = params.page
    }
    if (params.pageSize !== undefined) {
      query.size = params.pageSize
    }
    return request(`/plans/circle/${circleId}`, 'GET', query)
  }

  /**
   * 获取计划详情
   * r5 契约：返回 Map（驼峰），含 circleStats 键
   * （CirclePlanStats：userCount/recordCount/totalDuration/totalMemberDays/progressPercentage）。
   */
  static async getPlanDetail(planId: string): Promise<APIResponse<Plan>> {
    return request(`/plans/${planId}`)
  }

  static async getCurrentPlan(circleId: string): Promise<APIResponse<Plan | null>> {
    return request(`/plans/circle/${circleId}`)
  }

  static async startPlan(planId: string): Promise<APIResponse<Plan>> {
    return request(`/plans/${planId}/start`, 'POST')
  }

  static async updatePlanStatus(planId: string, status: number): Promise<APIResponse<null>> {
    return request(`/plans/${planId}/start`, 'POST')
  }

  static async cancelPlan(planId: string): Promise<APIResponse<null>> {
    return request(`/plans/${planId}/start`, 'POST')
  }

  static async getPlanProgress(planId: string): Promise<APIResponse<PlanProgress>> {
    return request(`/plans/${planId}`)
  }
}
