/**
 * 类型定义测试
 * 验证 src/types/index.ts 中的类型定义完整性
 *
 * BUG已修复: APIResponse 类型定义语法错误已修正（添加了 type 关键字）
 * r5 同步: 字段断言与线上驼峰 JSON 对齐；新增 CirclePlanStats/Plan.stats/circleStats；
 *          删除已移除的 MemberAvatarListProps（随 T03 删头像条组件）。
 */

const fs = require('fs')
const path = require('path')

const typesFilePath = path.resolve(__dirname, '../../src/types/index.ts')
const typesContent = fs.readFileSync(typesFilePath, 'utf-8')

describe('类型定义文件结构检查', () => {
  test('文件存在且可读取', () => {
    expect(typesContent).toBeTruthy()
    expect(typesContent.length).toBeGreaterThan(100)
  })

  test('APIResponse 类型定义包含 type 关键字（BUG已修复）', () => {
    expect(typesContent).toContain('export type APIResponse<T = any> = {')
  })

  test('定义了 User 接口', () => {
    expect(typesContent).toContain('export interface User')
    expect(typesContent).toContain('openid: string')
    expect(typesContent).toContain('nickname: string')
    expect(typesContent).toContain('avatarUrl: string')
  })

  test('定义了 Circle 接口', () => {
    expect(typesContent).toContain('export interface Circle')
    expect(typesContent).toContain('name: string')
    expect(typesContent).toContain('creatorId: ID')
    expect(typesContent).toContain('maxMembers: number')
    expect(typesContent).toContain('inviteCode: string')
  })

  test('定义了 CircleMember 接口', () => {
    expect(typesContent).toContain('export interface CircleMember')
    expect(typesContent).toContain('circleId: ID')
    expect(typesContent).toContain('userId: ID')
    expect(typesContent).toContain('role: UserRole')
  })

  test('定义了 Plan 接口', () => {
    expect(typesContent).toContain('export interface Plan')
    expect(typesContent).toContain('circleId: ID')
    expect(typesContent).toContain('startDate: Timestamp')
    expect(typesContent).toContain('endDate: Timestamp')
    expect(typesContent).toContain('totalDurationGoal: number')
    expect(typesContent).toContain('dailyDurationGoal: number')
    expect(typesContent).toContain('minDurationPerCheckin: number')
  })

  test('定义了 CheckinRecord 接口', () => {
    expect(typesContent).toContain('export interface CheckinRecord')
    expect(typesContent).toContain('planId?: ID | null')
    expect(typesContent).toContain('duration: number')
    expect(typesContent).toContain('exerciseType: ExerciseType | string')
    expect(typesContent).toContain('photoUrl: string')
    expect(typesContent).toContain('checkinTime: Timestamp')
  })

  test('DateRange 接口字段已修正（duration→end）', () => {
    expect(typesContent).toContain('export interface DateRange')
    expect(typesContent).toContain('end: string')
    expect(typesContent).not.toMatch(/DateRange[\s\S]{0,100}duration: string/)
  })

  test('定义了所有枚举类型', () => {
    expect(typesContent).toContain('export enum ErrorCode')
    expect(typesContent).toContain('export enum UserRole')
    expect(typesContent).toContain('export enum CircleStatus')
    expect(typesContent).toContain('export enum PlanStatus')
    expect(typesContent).toContain('export enum ExerciseType')
  })

  test('定义了请求/响应类型', () => {
    expect(typesContent).toContain('export interface CreateCircleRequest')
    expect(typesContent).toContain('export interface JoinCircleRequest')
    expect(typesContent).toContain('export interface CreatePlanRequest')
    expect(typesContent).toContain('export interface CreateCheckinRequest')
  })

  test('定义了状态管理类型', () => {
    expect(typesContent).toContain('export interface UserState')
    expect(typesContent).toContain('export interface CircleState')
    expect(typesContent).toContain('export interface PlanState')
    expect(typesContent).toContain('export interface CheckinState')
  })

  test('定义了统计类型', () => {
    expect(typesContent).toContain('export interface UserExerciseStats')
    expect(typesContent).toContain('export interface MemberProgressStats')
    expect(typesContent).toContain('export interface PlanProgress')
  })

  test('定义了组件Props类型', () => {
    expect(typesContent).toContain('export interface CircleCardProps')
    expect(typesContent).toContain('export interface CheckinCardProps')
    expect(typesContent).toContain('export interface ProgressBarProps')
    // r5：MemberAvatarList 已删除，其 Props 不得再存在于类型定义中
    expect(typesContent).not.toContain('export interface MemberAvatarListProps')
  })

  test('数据模型与PRD完全匹配', () => {
    // PRD 定义了5个核心实体
    expect(typesContent).toContain('export interface User')
    expect(typesContent).toContain('export interface Circle')
    expect(typesContent).toContain('export interface CircleMember')
    expect(typesContent).toContain('export interface Plan')
    expect(typesContent).toContain('export interface CheckinRecord')
  })
})

describe('r5 新增类型契约', () => {
  test('定义了 CirclePlanStats 接口', () => {
    expect(typesContent).toContain('export interface CirclePlanStats')
    expect(typesContent).toContain('userCount: number')
    expect(typesContent).toContain('recordCount: number')
    expect(typesContent).toContain('totalDuration: number')
    expect(typesContent).toContain('totalMemberDays: number')
    expect(typesContent).toContain('progressPercentage: number')
  })

  test('Plan 接口包含 stats / circleStats（CirclePlanStats）', () => {
    expect(typesContent).toContain('stats?: CirclePlanStats')
    expect(typesContent).toContain('circleStats?: CirclePlanStats')
  })
})

describe('类型定义与PRD数据模型对比', () => {
  test('用户表字段 - 与PRD一致（线上驼峰）', () => {
    expect(typesContent).toContain('userId: ID')
    expect(typesContent).toContain('openid: string')
    expect(typesContent).toContain('nickname: string')
    expect(typesContent).toContain('avatarUrl: string')
    expect(typesContent).toContain('createdAt?: Timestamp')
  })

  test('圈子表字段 - 与PRD一致（线上驼峰）', () => {
    expect(typesContent).toContain('creatorId: ID')
    expect(typesContent).toContain('maxMembers: number')
    expect(typesContent).toContain('inviteCode: string')
    expect(typesContent).toContain('status: CircleStatus')
  })

  test('计划表字段 - 与PRD一致（线上驼峰）', () => {
    expect(typesContent).toContain('circleTotalGoal: number')
    expect(typesContent).toContain('minDurationPerCheckin: number')
    expect(typesContent).toContain('status: PlanStatus')
  })

  test('打卡记录表字段 - 与PRD一致（线上驼峰）', () => {
    expect(typesContent).toContain('photoUrl: string')
    expect(typesContent).toContain('remark: string')
    expect(typesContent).toContain('checkinTime: Timestamp')
  })
})
