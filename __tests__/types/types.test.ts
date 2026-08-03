/**
 * 类型定义测试
 * 验证 src/types/index.ts 中的类型定义完整性
 *
 * BUG已修复: APIResponse 类型定义语法错误已修正（添加了 type 关键字）
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
    expect(typesContent).toContain('avatar_url: string')
  })

  test('定义了 Circle 接口', () => {
    expect(typesContent).toContain('export interface Circle')
    expect(typesContent).toContain('name: string')
    expect(typesContent).toContain('creator_id: ID')
    expect(typesContent).toContain('max_members: number')
    expect(typesContent).toContain('invite_code: string')
  })

  test('定义了 CircleMember 接口', () => {
    expect(typesContent).toContain('export interface CircleMember')
    expect(typesContent).toContain('circle_id: ID')
    expect(typesContent).toContain('user_id: ID')
    expect(typesContent).toContain('role: UserRole')
  })

  test('定义了 Plan 接口', () => {
    expect(typesContent).toContain('export interface Plan')
    expect(typesContent).toContain('circle_id: ID')
    expect(typesContent).toContain('start_date: Timestamp')
    expect(typesContent).toContain('end_date: Timestamp')
    expect(typesContent).toContain('total_duration_goal: number')
    expect(typesContent).toContain('daily_duration_goal: number')
    expect(typesContent).toContain('min_duration_per_checkin: number')
  })

  test('定义了 CheckinRecord 接口', () => {
    expect(typesContent).toContain('export interface CheckinRecord')
    expect(typesContent).toContain('plan_id: ID')
    expect(typesContent).toContain('duration: number')
    expect(typesContent).toContain('exercise_type: ExerciseType | string')
    expect(typesContent).toContain('photo_url: string')
    expect(typesContent).toContain('checkin_time: Timestamp')
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
    expect(typesContent).toContain('export interface CircleExerciseStats')
    expect(typesContent).toContain('export interface PlanProgress')
  })

  test('定义了组件Props类型', () => {
    expect(typesContent).toContain('export interface CircleCardProps')
    expect(typesContent).toContain('export interface CheckinCardProps')
    expect(typesContent).toContain('export interface ProgressBarProps')
    expect(typesContent).toContain('export interface MemberAvatarListProps')
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

describe('类型定义与PRD数据模型对比', () => {
  test('用户表字段 - 与PRD一致', () => {
    // PRD: user_id, openid, nickname, avatar_url, created_at
    expect(typesContent).toContain('_id: ID') // user_id 对应 _id
    expect(typesContent).toContain('openid: string')
    expect(typesContent).toContain('nickname: string')
    expect(typesContent).toContain('avatar_url: string')
    expect(typesContent).toContain('created_at: Timestamp')
  })

  test('圈子表字段 - 与PRD一致', () => {
    // PRD: circle_id, name, creator_id, max_members, invite_code, created_at, status
    expect(typesContent).toContain('creator_id: ID')
    expect(typesContent).toContain('max_members: number')
    expect(typesContent).toContain('invite_code: string')
    expect(typesContent).toContain('status: CircleStatus')
  })

  test('计划表字段 - 与PRD一致', () => {
    // PRD: plan_id, circle_id, name, start_date, end_date, total_duration_goal,
    //      daily_duration_goal, circle_total_goal, min_duration_per_checkin, status
    expect(typesContent).toContain('circle_total_goal: number')
    expect(typesContent).toContain('min_duration_per_checkin: number')
    expect(typesContent).toContain('status: PlanStatus')
  })

  test('打卡记录表字段 - 与PRD一致', () => {
    // PRD: record_id, plan_id, user_id, duration, exercise_type, photo_url, checkin_time, created_at
    expect(typesContent).toContain('photo_file_id: string') // 扩展字段
    expect(typesContent).toContain('note: string') // 扩展字段
  })
})
