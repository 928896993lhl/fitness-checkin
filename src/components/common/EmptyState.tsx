import { View, Text } from '@tarojs/components'
import './EmptyState.scss'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
  secondaryActionText?: string
  onSecondaryAction?: () => void
  compact?: boolean
}

/**
 * 空状态组件
 * 用于无数据时的占位显示
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  compact = false
}) => {
  return (
    <View className={`empty-state ${compact ? 'compact' : ''}`}>
      <Text className='empty-icon'>{icon}</Text>
      <Text className='empty-title'>{title}</Text>
      {description && (
        <Text className='empty-desc'>{description}</Text>
      )}
      {(actionText || secondaryActionText) && (
        <View className='empty-actions'>
          {actionText && onAction && (
            <View className='action-btn primary' onClick={onAction}>
              <Text className='btn-text'>{actionText}</Text>
            </View>
          )}
          {secondaryActionText && onSecondaryAction && (
            <View className='action-btn secondary' onClick={onSecondaryAction}>
              <Text className='btn-text'>{secondaryActionText}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

export default EmptyState
