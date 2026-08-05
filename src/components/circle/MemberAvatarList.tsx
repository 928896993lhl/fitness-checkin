import { View, Text, Image } from '@tarojs/components'
import { CircleMember } from '../../types'
import './MemberAvatarList.scss'

interface MemberAvatarListProps {
  members: CircleMember[]
  maxDisplay?: number
  size?: number
  showCount?: boolean
}

/**
 * 成员头像列表组件
 * 用于展示圈子成员头像
 */
const MemberAvatarList: React.FC<MemberAvatarListProps> = ({
  members,
  maxDisplay = 5,
  size = 60,
  showCount = true
}) => {
  /**
   * 获取要显示的成员列表
   */
  const displayMembers = members.slice(0, maxDisplay)
  const remainingCount = members.length - maxDisplay

  /**
   * 获取用户头像首字母
   */
  const getInitial = (member: CircleMember): string => {
    return member.user?.nickname?.charAt(0) || '?'
  }

  return (
    <View className='member-avatar-list'>
      <View className='avatar-list'>
        {displayMembers.map((member, index) => (
          <View
            key={member.id || member.userId}
            className='avatar-item'
            style={{
              width: `${size}rpx`,
              height: `${size}rpx`,
              marginLeft: index > 0 ? `-${size / 3}rpx` : '0',
              zIndex: maxDisplay - index
            }}
          >
            {member.user?.avatarUrl ? (
              <Image
                className='avatar-image'
                src={member.user.avatarUrl}
                mode='aspectFill'
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <View
                className='avatar-placeholder'
                style={{ width: '100%', height: '100%' }}
              >
                <Text className='avatar-text' style={{ fontSize: `${size / 2.5}rpx` }}>
                  {getInitial(member)}
                </Text>
              </View>
            )}
          </View>
        ))}
        
        {remainingCount > 0 && showCount && (
          <View
            className='avatar-item more'
            style={{
              width: `${size}rpx`,
              height: `${size}rpx`,
              marginLeft: `-${size / 3}rpx`,
              zIndex: 0
            }}
          >
            <View className='more-placeholder' style={{ width: '100%', height: '100%' }}>
              <Text className='more-text' style={{ fontSize: `${size / 3}rpx` }}>
                +{remainingCount}
              </Text>
            </View>
          </View>
        )}
      </View>
      
      {showCount && (
        <Text className='member-count'>{members.length}人</Text>
      )}
    </View>
  )
}

export default MemberAvatarList
