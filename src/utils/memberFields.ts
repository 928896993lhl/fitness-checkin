/**
 * 圈子成员字段读取工具（r4）
 * GET /circles/{id}/members 返回的是扁平字段 {nickname, avatarUrl}，
 * 而打卡记录等接口的 user 是嵌套结构 {user: {nickname, avatarUrl}}。
 * 本工具统一做「扁平优先 + 嵌套兜底」的兼容读取，避免组件各自判断。
 */
import { CircleMember } from '../types'

/**
 * 读取成员昵称（扁平 member.nickname 优先，嵌套 member.user?.nickname 兜底）
 * @param member 圈子成员
 * @returns 昵称，缺失时返回 '未知用户'
 */
export function getMemberNickname(member: CircleMember | null | undefined): string {
  if (!member) return '未知用户'
  const flat = member.nickname
  if (flat && flat.trim().length > 0) return flat
  const nested = member.user?.nickname
  if (nested && nested.trim().length > 0) return nested
  return '未知用户'
}

/**
 * 读取成员头像URL（扁平 member.avatarUrl 优先，嵌套 member.user?.avatarUrl 兜底）
 * @param member 圈子成员
 * @returns 头像URL，缺失时返回空字符串
 */
export function getMemberAvatarUrl(member: CircleMember | null | undefined): string {
  if (!member) return ''
  const flat = member.avatarUrl
  if (flat && flat.trim().length > 0) return flat
  const nested = member.user?.avatarUrl
  if (nested && nested.trim().length > 0) return nested
  return ''
}
