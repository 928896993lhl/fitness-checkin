import { View, Text } from '@tarojs/components'
import { MemberProgressStats } from '../../types'
import './MemberProgressRow.scss'

interface MemberProgressRowProps {
  stats?: MemberProgressStats | null
}

/**
 * 格式化时长（分钟 → 中文展示，与详情页/首页口径一致）
 * @param minutes 分钟数
 * @returns 格式化字符串，如 "30分钟" / "1小时5分钟"
 */
const formatDuration = (minutes: number): string => {
  const value = Number(minutes) || 0
  if (value <= 0) return '0分钟'
  if (value < 60) return `${value}分钟`
  const hours = Math.floor(value / 60)
  const mins = value % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

/**
 * 成员运动进展行组件（r4）
 * 展示单个成员在圈子内的运动统计，紧凑单行/双行，不破坏成员行布局：
 * - 无 stats 或无任何记录：显示"暂无运动记录"
 * - 无进行中计划：总时长 + 已完成计划（X/X 为 该成员完成数/圈子已结束计划总数）
 * - 有进行中计划：当前计划完成率 + 总时长 + 迷你进度条
 */
const MemberProgressRow: React.FC<MemberProgressRowProps> = ({ stats }) => {
  // 无 stats 或完全无记录：保持行高一致
  if (!stats || (!Number(stats.totalCheckins) && !Number(stats.totalDuration) && !Number(stats.checkinDays))) {
    return (
      <View className='member-progress'>
        <Text className='member-progress-text'>暂无运动记录</Text>
      </View>
    )
  }

  const hasActivePlan = !!stats.currentPlanId && !!stats.currentPlanName
  const durationText = formatDuration(Number(stats.totalDuration) || 0)

  // 有进行中计划：当前计划完成率 + 总时长 + 迷你进度条
  if (hasActivePlan) {
    const progress = Math.min(100, Math.max(0, Number(stats.currentPlanProgress) || 0))
    return (
      <View className='member-progress'>
        <Text className='member-progress-text'>
          当前计划 {Math.round(progress)}% · 总时长 {durationText}
        </Text>
        <View className='member-progress-bar'>
          <View
            className='member-progress-bar-inner'
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>
    )
  }

  // 无进行中计划：总时长 + 已完成计划（分母为圈子已结束计划总数，缺省退化为分子）
  const completedPlans = Number(stats.completedPlans) || 0
  const totalFinishedPlans = Number(stats.totalFinishedPlans) || 0
  const planText = totalFinishedPlans > 0
    ? `已完成 ${completedPlans}/${totalFinishedPlans} 计划`
    : `已完成 ${completedPlans} 计划`
  return (
    <View className='member-progress'>
      <Text className='member-progress-text'>
        总时长 {durationText} · {planText}
      </Text>
    </View>
  )
}

export default MemberProgressRow
