import { View, Text } from '@tarojs/components'
import { Circle } from '../../types'
import { isCircleActive } from '../../types/constants'
import './CircleCard.scss'

interface CircleCardProps {
  circle: Circle
  memberCount?: number
  onTap?: (circle: Circle) => void
  compact?: boolean
}

/**
 * 圈子卡片组件
 * 用于展示圈子信息（邀请码默认不显示，仅详情页头部展示）
 */
const CircleCard: React.FC<CircleCardProps> = ({
  circle,
  memberCount,
  onTap,
  compact = false
}) => {
  /**
   * 处理点击事件
   */
  const handleClick = () => {
    onTap && onTap(circle)
  }

  /**
   * 格式化创建时间
   */
  const formatCreatedTime = (date: string): string => {
    if (!date) return '未知时间'
    // 兼容 "2026-08-04 00:30:39" 和 ISO 格式
    const normalized = date.includes('T') ? date : date.replace(' ', 'T')
    const d = new Date(normalized)
    if (isNaN(d.getTime())) return '未知时间'
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天创建'
    if (days === 1) return '昨天创建'
    if (days < 7) return `${days}天前创建`
    if (days < 30) return `${Math.floor(days / 7)}周前创建`
    return `${d.getMonth() + 1}月${d.getDate()}日创建`
  }

  const active = isCircleActive(circle.status)

  return (
    <View
      className={`circle-card ${compact ? 'compact' : ''}`}
      onClick={handleClick}
    >
      <View className='card-header'>
        <View className='circle-icon'>
          <Text className='icon-text'>👥</Text>
        </View>
        <View className='circle-info'>
          <Text className='circle-name'>{circle.name}</Text>
          <Text className='circle-meta'>
            {memberCount || 0}/{circle.maxMembers}人 · {formatCreatedTime(circle.createdAt)}
          </Text>
        </View>
        <View className='card-arrow'>
          <Text className='arrow-text'>›</Text>
        </View>
      </View>
      
      {!compact && circle.description && (
        <View className='card-body'>
          <Text className='circle-desc'>{circle.description}</Text>
        </View>
      )}
      
      {!compact && (
        <View className='card-footer'>
          <View className={`status-tag ${active ? 'active' : 'archived'}`}>
            <Text className='status-text'>
              {active ? '活跃' : '已归档'}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default CircleCard
