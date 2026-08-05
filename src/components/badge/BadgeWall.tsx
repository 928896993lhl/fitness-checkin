import { View, Text } from '@tarojs/components'
import { BadgeInfo } from '../../types'
import './BadgeWall.scss'

interface BadgeWallProps {
  badges: BadgeInfo[]
  limit?: number // 最多展示数量（默认全部）
}

/**
 * 徽章墙组件
 * 3 列 grid：已解锁彩色（icon + 名称）；未解锁灰色（🔒 + progressText）
 */
const BadgeWall: React.FC<BadgeWallProps> = ({ badges, limit }) => {
  const list = limit && limit > 0 ? (badges || []).slice(0, limit) : (badges || [])

  if (list.length === 0) {
    return (
      <View className='badge-wall empty'>
        <Text className='badge-wall-empty-text'>暂无徽章数据</Text>
      </View>
    )
  }

  return (
    <View className='badge-wall'>
      {list.map(badge => (
        <View
          key={badge.code}
          className={`badge-item ${badge.unlocked ? 'unlocked' : 'locked'}`}
        >
          <View className='badge-icon-wrap'>
            <Text className='badge-icon'>{badge.unlocked ? badge.icon : '🔒'}</Text>
          </View>
          <Text className='badge-name'>{badge.name}</Text>
          <Text className='badge-progress'>
            {badge.unlocked ? '已解锁' : badge.progressText}
          </Text>
        </View>
      ))}
    </View>
  )
}

export default BadgeWall
