import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './settings.scss'

/**
 * 设置占位页面（P1）
 * 仅提供入口列表，具体设置项后续版本实现
 */
const Settings = () => {
  /**
   * 展示功能开发中提示
   */
  const showDeveloping = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }

  return (
    <View className='settings-page'>
      {/* 通用设置 */}
      <View className='settings-group'>
        <View className='settings-item' onClick={showDeveloping}>
          <Text className='settings-icon'>🔔</Text>
          <Text className='settings-text'>通知提醒</Text>
          <Text className='settings-arrow'>›</Text>
        </View>
        <View className='settings-item' onClick={showDeveloping}>
          <Text className='settings-icon'>🌙</Text>
          <Text className='settings-text'>深色模式</Text>
          <Text className='settings-arrow'>›</Text>
        </View>
        <View className='settings-item' onClick={showDeveloping}>
          <Text className='settings-icon'>💾</Text>
          <Text className='settings-text'>数据管理</Text>
          <Text className='settings-arrow'>›</Text>
        </View>
      </View>

      {/* 关于 */}
      <View className='settings-group'>
        <View className='settings-item' onClick={showDeveloping}>
          <Text className='settings-icon'>📄</Text>
          <Text className='settings-text'>用户协议</Text>
          <Text className='settings-arrow'>›</Text>
        </View>
        <View className='settings-item' onClick={showDeveloping}>
          <Text className='settings-icon'>🛡️</Text>
          <Text className='settings-text'>隐私政策</Text>
          <Text className='settings-arrow'>›</Text>
        </View>
        <View className='settings-item' onClick={showDeveloping}>
          <Text className='settings-icon'>ℹ️</Text>
          <Text className='settings-text'>关于健身打卡</Text>
          <Text className='settings-arrow'>›</Text>
        </View>
      </View>

      <Text className='version-text'>健身打卡 v1.0.0</Text>
    </View>
  )
}

export default Settings
