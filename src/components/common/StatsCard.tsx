import { View, Text } from '@tarojs/components'
import './StatsCard.scss'

interface StatsCardProps {
  title: string
  value: string
  icon?: string
  color?: string
  onClick?: () => void
}

/**
 * 统计卡片组件
 * 用于展示统计数据
 */
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon = '📊',
  color = '#3b82f6',
  onClick
}) => {
  return (
    <View
      className='stats-card'
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      <View className='card-header'>
        <Text className='card-icon'>{icon}</Text>
        <Text className='card-title'>{title}</Text>
      </View>
      <Text className='card-value' style={{ color }}>
        {value}
      </Text>
    </View>
  )
}

export default StatsCard
