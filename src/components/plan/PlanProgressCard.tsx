import { View, Text } from '@tarojs/components'
import { Plan, PlanProgress, CirclePlanStats } from '../../types'
import './PlanProgressCard.scss'

interface PlanProgressCardProps {
  plan: Plan
  progress?: PlanProgress | null
  onTap?: () => void
  showDetails?: boolean
}

/**
 * 计划进度卡片组件
 * r5：进度读取走兼容链 plan.stats → plan.circleStats → progress → 0，
 * 同时供圈子详情页（列表接口 stats）与计划详情页（详情接口 circleStats）复用。
 */
const PlanProgressCard: React.FC<PlanProgressCardProps> = ({
  plan,
  progress,
  onTap,
  showDetails = false
}) => {
  /**
   * 格式化日期
   */
  const formatDate = (date: string): string => {
    if (!date) return '--'
    const normalized = date.includes('T') ? date : date.replace(' ', 'T')
    const d = new Date(normalized)
    if (isNaN(d.getTime())) return '--'
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  /**
   * 格式化时长
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
   * 读取圈子统计（兼容链：plan.stats → plan.circleStats）
   */
  const getCircleStats = (): CirclePlanStats | null | undefined => {
    return plan.stats || plan.circleStats
  }

  /**
   * 计算进度百分比（r5 兼容链）
   * 圈子详情页（列表接口）读 plan.stats；计划详情页（详情接口）读 plan.circleStats；
   * 旧调用方传 progress 时回退 PlanProgress；均缺失为 0。
   */
  const getProgressPercentage = (): number => {
    const stats = getCircleStats()
    if (stats && Number(stats.progressPercentage) >= 0) {
      return Number(stats.progressPercentage) || 0
    }
    if (progress) return progress.progressPercentage
    return 0
  }

  /**
   * 计算计划总天数（endDate - startDate + 1，避免依赖后端字段）
   */
  const getTotalDays = (): number => {
    if (!plan.startDate || !plan.endDate) return 0
    const startMs = new Date(plan.startDate.includes('T') ? plan.startDate : plan.startDate.replace(' ', 'T')).getTime()
    const endMs = new Date(plan.endDate.includes('T') ? plan.endDate : plan.endDate.replace(' ', 'T')).getTime()
    if (isNaN(startMs) || isNaN(endMs) || endMs < startMs) return 0
    return Math.round((endMs - startMs) / 86400000) + 1
  }

  /**
   * 格式化副文本：全员打卡 X人天 · 计划 N天 · 参与 M人（stats 缺失时返回 null，隐藏整行）
   */
  const formatMemberDaysText = (): string | null => {
    const stats = getCircleStats()
    if (!stats) return null
    const totalMemberDays = Number(stats.totalMemberDays) || 0
    const userCount = Number(stats.userCount) || 0
    const totalDays = getTotalDays()
    return `全员打卡 ${totalMemberDays}人天 · 计划 ${totalDays}天 · 参与 ${userCount}人`
  }

  /**
   * 获取状态颜色（计划状态：0-未开始，1-进行中，2-已结束）
   */
  const getStatusColor = (): string => {
    switch (plan.status) {
      case 1: return '#10b981'
      case 0: return '#f59e0b'
      case 2: return '#3b82f6'
      default: return '#6b7280'
    }
  }

  /**
   * 获取状态文本
   */
  const getStatusText = (): string => {
    switch (plan.status) {
      case 1: return '进行中'
      case 0: return '未开始'
      case 2: return '已结束'
      default: return '未知'
    }
  }

  const percentage = getProgressPercentage()
  // 至多展示 1 位小数（如 76.2% / 76%）
  const displayPercentage = Math.round(percentage * 10) / 10
  const statusColor = getStatusColor()
  const memberDaysText = formatMemberDaysText()

  return (
    <View className='plan-progress-card' onClick={onTap}>
      <View className='card-header'>
        <View className='plan-info'>
          <Text className='plan-name'>{plan.name}</Text>
          <View className='plan-status' style={{ backgroundColor: `${statusColor}20` }}>
            <Text className='status-text' style={{ color: statusColor }}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        <View className='plan-dates'>
          <Text className='date-text'>
            {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
          </Text>
        </View>
      </View>

      <View className='card-body'>
        {/* 进度条 */}
        <View className='progress-section'>
          <View className='progress-header'>
            <Text className='progress-label'>圈子进度</Text>
            <Text className='progress-value' style={{ color: statusColor }}>
              {displayPercentage}%
            </Text>
          </View>
          <View className='progress-bar'>
            <View
              className='progress-fill'
              style={{
                width: `${displayPercentage}%`,
                backgroundColor: statusColor
              }}
            ></View>
          </View>
          {/* 副文本：全员打卡人天/计划天数/参与人数（stats 缺失时整行隐藏） */}
          {memberDaysText && (
            <View className='member-days-text'>
              <Text className='member-days-text-content'>{memberDaysText}</Text>
            </View>
          )}
        </View>

        {/* 详情信息 */}
        {showDetails && progress && (
          <View className='details-section'>
            <View className='detail-item'>
              <Text className='detail-label'>总目标</Text>
              <Text className='detail-value'>{formatDuration(plan.totalDurationGoal)}</Text>
            </View>
            <View className='detail-item'>
              <Text className='detail-label'>已完成</Text>
              <Text className='detail-value'>{formatDuration(progress.currentDuration)}</Text>
            </View>
            <View className='detail-item'>
              <Text className='detail-label'>剩余天数</Text>
              <Text className='detail-value'>{progress.daysRemaining}天</Text>
            </View>
            <View className='detail-item'>
              <Text className='detail-label'>进度状态</Text>
              <Text className='detail-value' style={{ color: progress.isOnTrack ? '#10b981' : '#ef4444' }}>
                {progress.isOnTrack ? '正常' : '落后'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 每日目标 */}
      <View className='card-footer'>
        <View className='goal-item'>
          <Text className='goal-icon'>🎯</Text>
          <Text className='goal-text'>每日目标: {plan.dailyDurationGoal}分钟</Text>
        </View>
        <View className='goal-item'>
          <Text className='goal-icon'>⏱️</Text>
          <Text className='goal-text'>最低打卡: {plan.minDurationPerCheckin}分钟</Text>
        </View>
      </View>
    </View>
  )
}

export default PlanProgressCard
