import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useUserState, useUserDispatch } from '../../context/UserContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './profile.scss'

/**
 * 个人中心页面（精简版）
 * 保留用户信息卡、运动历史入口、设置入口、退出登录
 */
const Profile = () => {
  const { user, isLoggedIn } = useUserState()
  const { logout } = useUserDispatch()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  /**
   * 加载个人中心数据
   */
  const loadData = async () => {
    if (!isLoggedIn) {
      setIsLoading(false)
      return
    }
    setIsLoading(false)
  }

  /**
   * 页面显示时加载数据
   */
  useDidShow(() => {
    loadData()
  })

  /**
   * 跳转到登录页
   */
  const navigateToLogin = () => {
    Taro.navigateTo({
      url: '/pages/login/login'
    })
  }

  /**
   * 跳转到历史记录
   */
  const navigateToHistory = () => {
    Taro.navigateTo({
      url: '/pages/profile/history/history'
    })
  }

  /**
   * 跳转到设置页
   */
  const navigateToSettings = () => {
    Taro.navigateTo({
      url: '/pages/profile/settings/settings'
    })
  }

  /**
   * 退出登录
   */
  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '退出登录后将清除本地数据',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  }

  // 未登录状态
  if (!isLoggedIn) {
    return (
      <View className='profile-page'>
        <View className='login-prompt'>
          <View className='login-icon'>👤</View>
          <Text className='login-title'>登录后查看个人中心</Text>
          <Text className='login-desc'>记录您的运动数据，查看圈子信息</Text>
          <View className='login-btn' onClick={navigateToLogin}>
            <Text className='login-btn-text'>立即登录</Text>
          </View>
        </View>
      </View>
    )
  }

  // 加载状态
  if (isLoading) {
    return (
      <View className='profile-page'>
        <LoadingSpinner text='加载中...' />
      </View>
    )
  }

  return (
    <ScrollView
      className='profile-page'
      scrollY
      enhanced
      showScrollbar={false}
    >
      {/* 用户信息卡片 */}
      <View className='user-card'>
        <View className='user-header'>
          <View className='user-avatar'>
            {user?.avatarUrl ? (
              <Image className='avatar-image' src={user.avatarUrl} mode='aspectFill' />
            ) : (
              <View className='avatar-placeholder'>
                <Text className='avatar-text'>{user?.nickname?.charAt(0) || '健'}</Text>
              </View>
            )}
          </View>
          <View className='user-info'>
            <Text className='user-name'>{user?.nickname || '健身达人'}</Text>
            <Text className='user-id'>ID: {user?.openid?.slice(-6) || '------'}</Text>
          </View>
        </View>
      </View>

      {/* 功能菜单 */}
      <View className='menu-section'>
        <View className='menu-item' onClick={navigateToHistory}>
          <Text className='menu-icon'>📋</Text>
          <Text className='menu-text'>运动历史</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={navigateToSettings}>
          <Text className='menu-icon'>⚙️</Text>
          <Text className='menu-text'>设置</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
      </View>

      {/* 退出登录 */}
      <View className='logout-section'>
        <View className='logout-btn' onClick={handleLogout}>
          <Text className='logout-text'>退出登录</Text>
        </View>
      </View>
    </ScrollView>
  )
}

export default Profile
