import { View, Text, Image } from '@tarojs/components'
import { CheckinRecord } from '../../types'
import { EXERCISE_TYPE_CONFIG } from '../../types/constants'
import './CheckinCard.scss'

interface CheckinCardProps {
  record: CheckinRecord
  showUser?: boolean
  showDate?: boolean
  onTap?: (record: CheckinRecord) => void
}

/**
 * 打卡记录卡片组件
 * 用于展示打卡记录
 */
const CheckinCard: React.FC<CheckinCardProps> = ({
  record,
  showUser = false,
  showDate = false,
  onTap
}) => {
  /**
   * 获取运动类型配置
   */
  const getExerciseConfig = (type: string) => {
    return EXERCISE_TYPE_CONFIG[type] || EXERCISE_TYPE_CONFIG.other
  }

  /**
   * 格式化时间
   */
  const formatTime = (date: string): string => {
    const d = new Date(date)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  /**
   * 格式化日期
   */
  const formatDate = (date: string): string => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
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
   * 处理点击事件
   */
  const handleClick = () => {
    onTap && onTap(record)
  }

  const exerciseConfig = getExerciseConfig(record.exercise_type)

  return (
    <View className='checkin-card' onClick={handleClick}>
      <View className='card-header'>
        {showUser && record.user && (
          <View className='user-info'>
            <View className='user-avatar'>
              {record.user.avatar_url ? (
                <Image
                  className='avatar-image'
                  src={record.user.avatar_url}
                  mode='aspectFill'
                />
              ) : (
                <View className='avatar-placeholder'>
                  <Text className='avatar-text'>
                    {record.user.nickname?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
            </View>
            <Text className='user-name'>{record.user.nickname || '未知用户'}</Text>
          </View>
        )}
        
        <View className='time-info'>
          {showDate && (
            <Text className='date-text'>{formatDate(record.checkin_time)}</Text>
          )}
          <Text className='time-text'>{formatTime(record.checkin_time)}</Text>
        </View>
      </View>
      
      <View className='card-body'>
        <View className='exercise-info'>
          <View className='exercise-icon'>
            <Text className='icon-text'>{exerciseConfig.icon}</Text>
          </View>
          <View className='exercise-details'>
            <Text className='exercise-type'>{exerciseConfig.name}</Text>
            <Text className='exercise-duration'>{formatDuration(record.duration)}</Text>
          </View>
        </View>
        
        {record.photo_url && (
          <View className='photo-preview'>
            <Image
              className='photo-image'
              src={record.photo_url}
              mode='aspectFill'
            />
          </View>
        )}
      </View>
      
      {record.note && (
        <View className='card-footer'>
          <Text className='note-text'>{record.note}</Text>
        </View>
      )}
    </View>
  )
}

export default CheckinCard
