/**
 * 微信小程序健身打卡应用 - 类型定义
 * 定义所有数据实体、API接口、状态管理等类型
 *
 * 命名约定：线上 JSON 一律驼峰（后端实体与 Map 均如此）；
 * 圈子状态 status 用数字 1=活跃 / 0=已归档；成员角色 role 用数字 0=普通 / 1=管理员 / 2=创建者。
 */

// ==================== 基础类型 ====================

/** 时间戳类型（ISO 8601 UTC格式） */
export type Timestamp = string

/** ID类型（后端 Long 序列化为字符串或数字，统一用 string 承载） */
export type ID = string

/** API响应格式 */
export type APIResponse<T = any> = {
  code: number
  data: T
  message: string
}

/** 错误码枚举 */
export enum ErrorCode {
  SUCCESS = 0,
  PARAM_ERROR = 1001,
  AUTH_ERROR = 1002,
  NOT_FOUND = 1003,
  PERMISSION_DENIED = 1004,
  SERVER_ERROR = 5000,
  CLOUD_ERROR = 5001,
  NETWORK_ERROR = 5002
}

/** 用户角色：0=普通成员，1=管理员，2=创建者（数字线上传输） */
export type UserRole = 0 | 1 | 2

/** 圈子状态：1=活跃，0=已归档/禁用（数字线上传输） */
export type CircleStatus = 0 | 1

/** 计划状态：0=未开始，1=进行中，2=已结束（数字线上传输） */
export type PlanStatus = 0 | 1 | 2

/** 运动类型枚举 */
export enum ExerciseType {
  RUNNING = 'running',
  WALKING = 'walking',
  CYCLING = 'cycling',
  SWIMMING = 'swimming',
  YOGA = 'yoga',
  GYM = 'gym',
  OTHER = 'other'
}

// ==================== 数据实体类型 ====================

/** 用户信息 */
export interface User {
  userId: ID
  openid: string
  nickname: string
  avatarUrl: string
  gender?: number // 0:未知, 1:男, 2:女
  province?: string
  city?: string
  country?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

/** 圈子信息 */
export interface Circle {
  circleId: ID
  name: string
  description: string
  creatorId: ID
  maxMembers: number // 2-8人
  inviteCode: string
  status: CircleStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** 圈子成员关系 */
export interface CircleMember {
  id: ID
  circleId: ID
  userId: ID
  role: UserRole
  joinedAt: Timestamp
  // 联合查询字段（非数据库字段）
  user?: User
  circle?: Circle
}

/** 周期计划 */
export interface Plan {
  planId: ID
  circleId: ID
  name: string
  description: string
  startDate: Timestamp
  endDate: Timestamp
  totalDurationGoal: number // 总运动时长目标（分钟）
  dailyDurationGoal: number // 每天运动时长目标（分钟）
  circleTotalGoal: number // 圈子总运动时长目标（分钟）
  minDurationPerCheckin: number // 每次打卡最低时长（默认10分钟）
  status: PlanStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  // 联合查询字段（非数据库字段）
  circle?: Circle
}

/** 打卡记录（planId/circleId 均可空，宽松打卡不依赖计划） */
export interface CheckinRecord {
  recordId: ID
  planId?: ID | null
  circleId?: ID | null
  userId: ID
  duration: number // 运动时长（分钟）
  exerciseType: ExerciseType | string
  photoUrl: string
  remark: string // 打卡备注
  checkinTime: Timestamp
  createdAt: Timestamp
  // 联合查询字段（非数据库字段）
  user?: User
  plan?: Plan
}

// ==================== 请求/响应类型 ====================

/** 登录结果（后端 AuthController.wxLogin 返回的扁平 Map） */
export interface LoginResult {
  token: string
  userId: ID
  openid: string
  nickname: string
  avatarUrl: string
}

/** 创建圈子请求 */
export interface CreateCircleRequest {
  name: string
  description?: string
  maxMembers: number
}

/** 加入圈子请求 */
export interface JoinCircleRequest {
  inviteCode: string
}

/** 创建计划请求 */
export interface CreatePlanRequest {
  circleId: ID
  name: string
  description?: string
  startDate: string
  endDate: string
  totalDurationGoal: number
  dailyDurationGoal: number
  circleTotalGoal: number
  minDurationPerCheckin?: number
}

/** 创建打卡记录请求（planId/circleId 均可空；宽松打卡省略/传 null，禁止传空字符串） */
export interface CreateCheckinRequest {
  planId?: ID | null
  circleId?: ID | null
  duration: number // 全局 1-480 分钟
  exerciseType: ExerciseType | string
  photoUrl?: string
  remark?: string
}

/** 查询圈子列表请求 */
export interface GetCirclesRequest {
  page?: number
  pageSize?: number
  status?: CircleStatus
}

/** 查询计划列表请求 */
export interface GetPlansRequest {
  circleId?: ID
  status?: PlanStatus
  page?: number
  pageSize?: number
}

/** 查询打卡记录请求 */
export interface GetCheckinRecordsRequest {
  planId?: ID
  exerciseType?: string
  startDate?: string
  endDate?: string
  duration?: number
  page?: number
  pageSize?: number
}

// ==================== 统计类型 ====================

/** 用户运动统计（对齐 GET /checkin/stats/mine） */
export interface UserExerciseStats {
  todayDuration: number // 今日运动时长（分钟）
  totalDuration: number // 总运动时长（分钟）
  checkinDays: number // 累计打卡天数
  totalCheckins: number // 总打卡次数
  currentStreak: number // 当前连续打卡天数
  completionRate: number // 计划完成率（0-100，仅进行中计划）
}

/** 圈子运动统计 */
export interface CircleExerciseStats {
  circleId: ID
  totalDuration: number // 圈子总运动时长
  totalCheckins: number // 圈子总打卡次数
  memberCount: number // 成员数量
  activeMemberCount: number // 活跃成员数量（本周打卡）
  averageDuration: number // 人均运动时长
  checkinDays: number // 累计打卡天数
  passedDays: number // 计划已进行天数
  completionRate: number // 计划完成率（0-100）
}

/** 计划进度 */
export interface PlanProgress {
  planId: ID
  totalGoal: number
  currentDuration: number
  progressPercentage: number
  daysRemaining: number
  isOnTrack: boolean // 是否按计划进行
}

// ==================== 状态管理类型 ====================

/** 用户状态 */
export interface UserState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  isLoading: boolean
  error: string | null
}

/** 圈子状态 */
export interface CircleState {
  circles: Circle[]
  currentCircle: Circle | null
  members: CircleMember[]
  isLoading: boolean
  error: string | null
}

/** 计划状态 */
export interface PlanState {
  plans: Plan[]
  currentPlan: Plan | null
  progress: PlanProgress | null
  isLoading: boolean
  error: string | null
}

/** 打卡状态 */
export interface CheckinState {
  todayRecords: CheckinRecord[]
  totalTodayDuration: number
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

// ==================== 组件Props类型 ====================

/** 圈子卡片组件Props */
export interface CircleCardProps {
  circle: Circle
  memberCount?: number
  currentPlan?: Plan | null
  onTap?: (circle: Circle) => void
}

/** 打卡记录卡片组件Props */
export interface CheckinCardProps {
  record: CheckinRecord
  showUser?: boolean
  onTap?: (record: CheckinRecord) => void
}

/** 计划进度条组件Props */
export interface ProgressBarProps {
  percentage: number
  height?: number
  color?: string
  backgroundColor?: string
  showLabel?: boolean
}

/** 成员头像列表组件Props */
export interface MemberAvatarListProps {
  members: CircleMember[]
  maxDisplay?: number
  size?: number
}

// ==================== 工具类型 ====================

/** 分页参数 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/** 分页结果（对齐后端 {records,total,page,size}） */
export interface PaginatedResult<T> {
  records: T[]
  total: number
  page: number
  size: number
}

/** 日期范围 */
export interface DateRange {
  start: string
  end: string
}

// ==================== 助手函数 ====================

/** 判断圈子是否活跃（status === 1） */
export function isCircleActive(status: CircleStatus | number | undefined | null): boolean {
  return Number(status) === 1
}

/** 判断成员角色是否为创建者（role === 2） */
export function isCreatorRole(role: UserRole | number | undefined | null): boolean {
  return Number(role) === 2
}
