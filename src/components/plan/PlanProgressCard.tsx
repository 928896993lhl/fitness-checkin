import { View, Text } from '@tarojs/components'
import { Plan, PlanProgress } from '../../types'
import './PlanProgressCard.scss'

interface PlanProgressCardProps {
  plan: Plan
  progress?: PlanProgress | null
  onTap?: () => void
  showDetails?: boolean
}

/**
 * 计划进度卡片组件
 * 用于展示计划进度信息
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
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  /**
   * 计算进度百分比
   */
  const getProgressPercentage = (): number => {
    if (progress) return progress.progressPercentage
    return 0
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
  const statusColor = getStatusColor()

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
            <Text className='progress-label'>完成进度</Text>
            <Text className='progress-value' style={{ color: statusColor }}>
              {percentage}%
            </Text>
          </View>
          <View className='progress-bar'>
            <View
              className='progress-fill'
              style={{
                width: `${percentage}%`,
                backgroundColor: statusColor
              }}
            ></View>
          </View>
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
