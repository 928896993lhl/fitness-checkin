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
  maxMembers: number // 2-50人
  inviteCode: string
  status: CircleStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  // 联合查询字段（非数据库字段，圈子列表接口返回）
  memberCount?: number
}

/** 圈子成员关系 */
export interface CircleMember {
  id: ID
  circleId: ID
  userId: ID
  role: UserRole
  joinedAt: Timestamp
  // 联合查询字段（非数据库字段）
  nickname?: string // 扁平昵称（GET /circles/{id}/members 返回，扁平优先）
  avatarUrl?: string // 扁平头像URL（GET /circles/{id}/members 返回，扁平优先）
  user?: User
  circle?: Circle
  // r4：成员运动进展统计（圈子维度，GET /circles/{id}/members 的 stats 键）
  stats?: MemberProgressStats
}

/** 成员运动进展统计（圈子维度，对齐 GET /circles/{id}/members 的 stats 键） */
export interface MemberProgressStats {
  totalDuration: number // 该圈打卡总时长（分钟），无记录为 0
  totalCheckins: number // 该圈打卡次数，无记录为 0
  checkinDays: number // 该圈打卡天数，无记录为 0
  currentPlanId?: ID | null // 当前进行中计划ID（无进行中计划为 null）
  currentPlanName?: string | null // 当前进行中计划名称（无进行中计划为 null）
  currentPlanProgress: number // 当前进行中计划完成率（0-100，四舍五入保留1位小数，clamp 0~100；无进行中计划为 0）
  completedPlans: number // 该圈已结束计划中该成员有打卡记录的去重计划数
  totalFinishedPlans?: number // 圈子已结束计划总数（用于展示"已完成 X/X 计划"分母）
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
  // 本次打卡新解锁徽章（POST /checkin 成功后由后端填充，向后兼容）
  newlyUnlockedBadges?: NewlyUnlockedBadge[]
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

/** 更新用户信息请求（至少一个字段；avatarUrl 传空字符串表示清空头像） */
export interface UpdateUserInfoRequest {
  nickname?: string
  avatarUrl?: string
}

/** 更新计划请求（同 CreatePlanRequest 去掉 circleId，全部可选，至少一个字段） */
export interface UpdatePlanRequest {
  name?: string
  description?: string
  startDate?: string
  endDate?: string
  totalDurationGoal?: number
  dailyDurationGoal?: number
  circleTotalGoal?: number
  minDurationPerCheckin?: number
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
  // 扩展（本轮新增）
  longestStreak: number // 历史最长连续打卡天数
  exerciseTypeBreakdown: ExerciseTypeBreakdownItem[] // 运动类型分布
  estimatedDistanceKm: number // 估算总里程（公里）
  estimatedKcal: number // 估算总消耗（千卡，r3 新增，与后端 BadgeCode.estimateKcal 同步）
}

/** 运动类型分布条目 */
export interface ExerciseTypeBreakdownItem {
  type: string // 运动类型编码（running/walking/...）
  duration: number // 该类运动累计时长（分钟）
}

/** 徽章信息（对齐 GET /badges/mine，19 条固定顺序 = 后端 sort 升序） */
export interface BadgeInfo {
  code: string
  name: string
  icon: string
  conditionText: string
  unlocked: boolean
  unlockedAt?: Timestamp | null
  progressText: string
  // r3 新增：分类（days/streak/duration/kcal/distance）/ 全局排序（1~19）/ 未解锁"还差 N 解锁"（已解锁为 null）
  category?: string
  sort?: number
  remainText?: string | null
}

/** 本次打卡新解锁徽章（POST /checkin 响应瞬态字段元素） */
export interface NewlyUnlockedBadge {
  code: string
  name: string
  icon: string
}

/** 热力图单日数据 */
export interface HeatmapDay {
  date: string // YYYY-MM-DD
  minutes?: number // 用户模式：当日总运动时长
  count: number // 用户模式=当日打卡次数；圈子模式=当日去重打卡人数
  totalMinutes?: number // 圈子模式：当日总分钟
}

/** 热力图数据（对齐 GET /checkin/heatmap/mine 与 GET /checkin/heatmap/circle/{id}） */
export interface HeatmapData {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  days: HeatmapDay[] // 仅含有打卡记录的日期
  circleId?: ID // 圈子热力图返回（圈子维度）
}

/** 圈子打卡统计（对齐 GET /checkin/stats/circle/{id}，r3 新增，替代 CircleExerciseStats） */
export interface CircleStats {
  circleId: ID
  totalDuration: number // 圈子累计总时长（分钟）
  totalCheckins: number // 圈子累计打卡次数
  activeMembers: number // 本周去重打卡人数
  avgDurationPerCheckin: number // 平均每次时长（分钟，= totalDuration/totalCheckins，除零保护）
  todayActiveCount: number // 今日去重打卡人数
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

/** 徽章墙组件Props */
export interface BadgeWallProps {
  badges: BadgeInfo[]
  limit?: number // 最多展示数量（默认全部）
  iconOnly?: boolean // r3：仅显示已解锁图标（5 列紧凑 grid），默认 false 普通 3 列模式
  onBadgeTap?: (badge: BadgeInfo) => void // r3：iconOnly 模式点击徽章回调
}

/** 活跃度热力图组件Props */
export interface HeatmapProps {
  data: HeatmapData
  compact?: boolean // r3：8px 紧凑格子（我的页），默认 false 12px 格子
  mode?: 'minutes' | 'members' // r3：着色维度，默认 minutes（按分钟）；members 按人数
  showMore?: boolean // r3：区块右上角"更多›"，默认 false
  onMore?: () => void
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
