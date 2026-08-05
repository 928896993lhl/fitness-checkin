/**
 * 微信小程序健身打卡应用 - 类型定义
 * 定义所有数据实体、API接口、状态管理等类型
 */

// ==================== 基础类型 ====================

/** 时间戳类型（ISO 8601 UTC格式） */
export type Timestamp = string

/** ID类型 */
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

/** 用户角色枚举 */
export enum UserRole {
  MEMBER = 'member',
  CREATOR = 'creator'
}

/** 圈子状态枚举 */
export enum CircleStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

/** 计划状态枚举 */
export enum PlanStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

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
  _id: ID
  openid: string
  nickname: string
  avatar_url: string
  gender: number // 0:未知, 1:男, 2:女
  province: string
  city: string
  country: string
  created_at: Timestamp
  updated_at: Timestamp
}

/** 圈子信息 */
export interface Circle {
  _id: ID
  name: string
  description: string
  creator_id: ID
  max_members: number // 2-8人
  invite_code: string
  status: CircleStatus
  created_at: Timestamp
  updated_at: Timestamp
}

/** 圈子成员关系 */
export interface CircleMember {
  _id: ID
  circle_id: ID
  user_id: ID
  role: UserRole
  joined_at: Timestamp
  // 联合查询字段（非数据库字段）
  user?: User
  circle?: Circle
}

/** 周期计划 */
export interface Plan {
  _id: ID
  circle_id: ID
  name: string
  description: string
  start_date: Timestamp
  end_date: Timestamp
  total_duration_goal: number // 总运动时长目标（分钟）
  daily_duration_goal: number // 每天运动时长目标（分钟）
  circle_total_goal: number // 圈子总运动时长目标（分钟）
  min_duration_per_checkin: number // 每次打卡最低时长（默认10分钟）
  status: PlanStatus
  created_at: Timestamp
  updated_at: Timestamp
  // 联合查询字段（非数据库字段）
  circle?: Circle
}

/** 打卡记录 */
export interface CheckinRecord {
  _id: ID
  plan_id: ID
  user_id: ID
  duration: number // 运动时长（分钟）
  exercise_type: ExerciseType | string
  photo_url: string
  photo_file_id: string // 云存储文件ID
  note: string // 打卡备注
  checkin_time: Timestamp
  created_at: Timestamp
  // 联合查询字段（非数据库字段）
  user?: User
  plan?: Plan
}

// ==================== 请求/响应类型 ====================

/** 创建圈子请求 */
export interface CreateCircleRequest {
  name: string
  description?: string
  max_members: number
}

/** 加入圈子请求 */
export interface JoinCircleRequest {
  invite_code: string
}

/** 创建计划请求 */
export interface CreatePlanRequest {
  circle_id: ID
  name: string
  description?: string
  start_date: string
  end_date: string
  total_duration_goal: number
  daily_duration_goal: number
  circle_total_goal: number
  min_duration_per_checkin?: number
}

/** 创建打卡记录请求 */
export interface CreateCheckinRequest {
  plan_id: ID
  duration: number
  exercise_type: ExerciseType | string
  photo_temp_path?: string // 临时文件路径（用于上传）
  photo_url?: string // 已上传的照片URL
  note?: string
}

/** 查询圈子列表请求 */
export interface GetCirclesRequest {
  page?: number
  page_size?: number
  status?: CircleStatus
}

/** 查询计划列表请求 */
export interface GetPlansRequest {
  circle_id?: ID
  status?: PlanStatus
  page?: number
  page_size?: number
}

/** 查询打卡记录请求 */
export interface GetCheckinRecordsRequest {
  plan_id?: ID
  user_id?: ID
  start_date?: string
  duration?: string
  page?: number
  page_size?: number
}

// ==================== 统计类型 ====================

/** 用户运动统计 */
export interface UserExerciseStats {
  totalDuration: number // 总运动时长（分钟）
  totalCheckins: number // 总打卡次数
  checkinDays: number // 累计打卡天数
  currentStreak: number // 当前连续打卡天数
  maxStreak: number // 最大连续打卡天数
  passedDays: number // 计划已进行天数
  completionRate: number // 计划完成率（0-100）
  thisWeekDuration: number // 本周运动时长
  thisMonthDuration: number // 本月运动时长
}

/** 圈子运动统计 */
export interface CircleExerciseStats {
  circle_id: ID
  totalDuration: number // 圈子总运动时长
  totalCheckins: number // 圈子总打卡次数
  member_count: number // 成员数量
  activeMemberCount: number // 活跃成员数量（本周打卡）
  averageDuration: number // 人均运动时长
  checkinDays: number // 累计打卡天数
  passedDays: number // 计划已进行天数
  completionRate: number // 计划完成率（0-100）
}

/** 计划进度 */
export interface PlanProgress {
  plan_id: ID
  total_goal: number
  current_duration: number
  progress_percentage: number
  days_remaining: number
  is_on_track: boolean // 是否按计划进行
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
  current_circle: Circle | null
  members: CircleMember[]
  isLoading: boolean
  error: string | null
}

/** 计划状态 */
export interface PlanState {
  plans: Plan[]
  current_plan: Plan | null
  progress: PlanProgress | null
  isLoading: boolean
  error: string | null
}

/** 打卡状态 */
export interface CheckinState {
  today_records: CheckinRecord[]
  total_today_duration: number
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
}

// ==================== 组件Props类型 ====================

/** 圈子卡片组件Props */
export interface CircleCardProps {
  circle: Circle
  member_count?: number
  current_plan?: Plan | null
  onTap?: (circle: Circle) => void
}

/** 打卡记录卡片组件Props */
export interface CheckinCardProps {
  record: CheckinRecord
  show_user?: boolean
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
  page_size: number
}

/** 分页结果 */
export interface PaginatedResult<T> {
  list: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/** 日期范围 */
export interface DateRange {
  start: string
  end: string
}
