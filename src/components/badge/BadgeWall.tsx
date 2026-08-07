import { View, Text } from '@tarojs/components'
import { BadgeInfo, BadgeWallProps } from '../../types'
import './BadgeWall.scss'

/**
 * 徽章墙组件
 * 普通模式（默认）：3 列 grid，已解锁彩色（icon + 名称）；未解锁灰色（🔒 + progressText）。
 * iconOnly 模式（r3）：仅显示已解锁徽章图标，5 列紧凑 grid（40-44px 图标，浅底圆角），
 * 点击回调 onBadgeTap；0 解锁显示占位提示。普通模式逻辑不变（career 页零改动）。
 */
const BadgeWall: React.FC<BadgeWallProps> = ({ badges, limit, iconOnly, onBadgeTap }) => {
  const list = limit && limit > 0 ? (badges || []).slice(0, limit) : (badges || [])

  if (list.length === 0) {
    return (
      <View className='badge-wall empty'>
        <Text className='badge-wall-empty-text'>暂无徽章数据</Text>
      </View>
    )
  }

  // iconOnly 模式：仅渲染已解锁图标
  if (iconOnly) {
    const unlocked = list.filter(badge => badge.unlocked)
    if (unlocked.length === 0) {
      return (
        <View className='badge-wall empty icon-only'>
          <Text className='badge-wall-empty-text'>暂无解锁徽章，快去打卡吧</Text>
        </View>
      )
    }
    return (
      <View className='badge-wall icon-only'>
        {unlocked.map(badge => (
          <View
            key={badge.code}
            className='badge-icon-item'
            onClick={() => onBadgeTap && onBadgeTap(badge)}
          >
            <Text className='badge-icon'>{badge.icon}</Text>
          </View>
        ))}
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
