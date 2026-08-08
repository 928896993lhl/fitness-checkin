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
 * 成员运动进展行组件（r5 升级为两行布局中的"副信息行 + 右侧进度"）
 * 渲染在 member-item 中部（flex:1）昵称行下方：
 * - 行2 副信息（左）："已运动 X天 · 总时长 X"（无记录 → "暂无运动记录"）
 * - 右侧（右对齐）：有进行中计划 → "当前计划 X%" + 迷你进度条；无 → "已完成 X/X计划"
 */
const MemberProgressRow: React.FC<MemberProgressRowProps> = ({ stats }) => {
  const totalCheckins = Number(stats?.totalCheckins) || 0
  const totalDuration = Number(stats?.totalDuration) || 0
  const checkinDays = Number(stats?.checkinDays) || 0
  const hasAnyRecord = !!(totalCheckins || totalDuration || checkinDays)

  // 副信息行（行2）：已运动天数 + 总时长；无记录显示占位文本
  const subText = hasAnyRecord
    ? `已运动 ${checkinDays}天 · 总时长 ${formatDuration(totalDuration)}`
    : '暂无运动记录'

  // 右侧进度：有进行中计划 → 当前计划 X% + 迷你进度条；无 → 已完成 X/X计划
  const hasActivePlan = hasAnyRecord && !!stats?.currentPlanId && !!stats?.currentPlanName
  const progress = hasActivePlan
    ? Math.min(100, Math.max(0, Number(stats?.currentPlanProgress) || 0))
    : 0
  const completedPlans = Number(stats?.completedPlans) || 0
  const totalFinishedPlans = Number(stats?.totalFinishedPlans) || 0
  const planText = totalFinishedPlans > 0
    ? `已完成 ${completedPlans}/${totalFinishedPlans}计划`
    : `已完成 ${completedPlans}计划`

  return (
    <View className='member-progress'>
      <View className='member-sub-row'>
        <Text className='member-sub-text'>{subText}</Text>
        {hasActivePlan ? (
          <View className='member-current-plan'>
            <Text className='member-right-text'>当前计划 {Math.round(progress)}%</Text>
            <View className='member-progress-bar'>
              <View
                className='member-progress-bar-inner'
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
        ) : hasAnyRecord ? (
          <Text className='member-right-text'>{planText}</Text>
        ) : null}
      </View>
    </View>
  )
}

export default MemberProgressRow
