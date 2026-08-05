import { request } from '../utils/request'
import {
  Plan,
  PlanProgress,
  CreatePlanRequest,
  GetPlansRequest,
  APIResponse,
  PaginatedResult
} from '../types'

/**
 * 计划服务类
 */
export class PlanService {
  static async createPlan(planData: CreatePlanRequest): Promise<APIResponse<Plan>> {
    return request('/plans', 'POST', planData)
  }

  static async getPlansByCircle(circleId: string, params: GetPlansRequest = {}): Promise<APIResponse<PaginatedResult<Plan>>> {
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
