import { View, Text } from '@tarojs/components'
import './CheckinButton.scss'

interface CheckinButtonProps {
  onClick?: () => void
  disabled?: boolean
  todayDuration?: number
  dailyGoal?: number
}

/**
 * 打卡按钮组件
 * 用于首页快速打卡
 */
const CheckinButton: React.FC<CheckinButtonProps> = ({
  onClick,
  disabled = false,
  todayDuration = 0,
  dailyGoal = 0
}) => {
  /**
   * 计算进度百分比
   */
  const getProgress = (): number => {
    if (dailyGoal <= 0) return 0
    return Math.min(100, Math.round((todayDuration / dailyGoal) * 100))
  }

  /**
   * 获取按钮状态文本
   */
  const getStatusText = (): string => {
    if (disabled) return '暂无计划'
    if (todayDuration === 0) return '今日未打卡'
    if (todayDuration >= dailyGoal) return '今日已达标'
    return `还差${dailyGoal - todayDuration}分钟`
  }

  /**
   * 获取按钮样式类名
   */
  const getButtonClass = (): string => {
    if (disabled) return 'disabled'
    if (todayDuration >= dailyGoal) return 'completed'
    if (todayDuration > 0) return 'partial'
    return 'default'
  }

  const progress = getProgress()

  return (
    <View
      className={`checkin-button ${getButtonClass()}`}
      onClick={disabled ? undefined : onClick}
    >
      {/* 进度环 */}
      <View className='progress-ring'>
        <View className='ring-bg'></View>
        <View
          className='ring-progress'
          style={{
            background: `conic-gradient(${
              todayDuration >= dailyGoal ? '#10b981' : '#3b82f6'
            } ${progress}%, transparent ${progress}%)`
          }}
        ></View>
        <View className='ring-center'>
          <Text className='ring-icon'>📸</Text>
          <Text className='ring-text'>打卡</Text>
        </View>
      </View>
      
      {/* 状态文本 */}
      <Text className='status-text'>{getStatusText()}</Text>
      
      {/* 进度条 */}
      {dailyGoal > 0 && (
        <View className='progress-bar'>
          <View
            className='progress-fill'
            style={{
              width: `${progress}%`,
              backgroundColor: todayDuration >= dailyGoal ? '#10b981' : '#3b82f6'
            }}
          ></View>
        </View>
      )}
    </View>
  )
}

export default CheckinButton
