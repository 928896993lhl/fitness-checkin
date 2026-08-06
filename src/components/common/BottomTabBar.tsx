import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import './BottomTabBar.scss'

/** 底部导航 tab 标识 */
export type BottomTabKey = 'home' | 'circle' | 'profile'

/** 单个 tab 配置 */
interface BottomTabItem {
  key: BottomTabKey
  icon: string
  text: string
  path: string
}

/** 与原生 tabBar 一致的 tab 配置（路径必须为 app.config.ts tabBar.list 中的页面） */
const TABS: BottomTabItem[] = [
  { key: 'home', icon: '🏠', text: '首页', path: '/pages/index/index' },
  { key: 'circle', icon: '👥', text: '圈子', path: '/pages/circle/circle' },
  { key: 'profile', icon: '👤', text: '我的', path: '/pages/profile/profile' }
]

interface BottomTabBarProps {
  /** 当前高亮 tab */
  current: BottomTabKey
}

/**
 * 自渲染底部导航栏
 *
 * 用途：微信原生 tabBar 只在 tabBar 页面显示，navigateTo 打开的非 tab 页（如圈子详情）
 * 会自动隐藏底部导航。本组件在非 tab 页内自渲染一套与原生 tabBar 同款外观的底部导航，
 * 点击通过 Taro.switchTab 跳转到对应 tabBar 页面。
 */
const BottomTabBar: React.FC<BottomTabBarProps> = ({ current }) => {
  /**
   * 点击 tab 跳转（switchTab 仅支持跳转到 tabBar 页面）
   */
  const handleSwitch = (path: string) => {
    Taro.switchTab({ url: path })
  }

  return (
    <View className='bottom-tab-bar'>
      {TABS.map(tab => {
        const isActive = tab.key === current
        return (
          <View
            key={tab.key}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => handleSwitch(tab.path)}
          >
            <Text className='tab-icon'>{tab.icon}</Text>
            <Text className='tab-text'>{tab.text}</Text>
          </View>
        )
      })}
    </View>
  )
}

export default BottomTabBar
