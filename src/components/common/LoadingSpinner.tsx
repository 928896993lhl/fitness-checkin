import { View, Text } from '@tarojs/components'
import './LoadingSpinner.scss'

interface LoadingSpinnerProps {
  text?: string
  size?: 'small' | 'medium' | 'large'
  color?: string
}

/**
 * 加载指示器组件
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = '加载中...',
  size = 'medium',
  color = '#3b82f6'
}) => {
  return (
    <View className={`loading-spinner ${size}`}>
      <View className='spinner' style={{ borderTopColor: color }}></View>
      {text && <Text className='loading-text'>{text}</Text>}
    </View>
  )
}

export default LoadingSpinner
