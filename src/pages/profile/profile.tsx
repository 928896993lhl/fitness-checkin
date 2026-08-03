import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { useUserState, useUserDispatch } from '../../context/UserContext'
import { CircleService } from '../../services/CircleService'
import { CheckinService } from '../../services/CheckinService'
import { Circle, UserExerciseStats } from '../../types'
import CircleCard from '../../components/circle/CircleCard'
import StatsCard from '../../components/common/StatsCard'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './profile.scss'

/**
 * 个人中心页面
 */
const Profile = () => {
  const { user, isLoggedIn } = useUserState()
  const { logout } = useUserDispatch()
  const [circles, setCircles] = useState<Circle[]>([])
  const [stats, setStats] = useState<UserExerciseStats | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  /**
   * 加载个人中心数据
   */
  const loadData = async () => {
    if (!isLoggedIn) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      const [circlesRes, statsRes] = await Promise.allSettled([
        CircleService.getMyCircles(),
        CheckinService.getUserStats()
      ])

      if (circlesRes.status === 'fulfilled' && circlesRes.value.code === 0) {
        setCircles(circlesRes.value.data.list)
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.code === 0) {
        setStats(statsRes.value.data)
      }
    } catch (error) {
      console.error('加载个人中心数据失败:', error)
    } finally {
      setIsLoading(false)
    }
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
   * 跳转到圈子详情
   */
  const navigateToCircle = (circle: Circle) => {
    Taro.navigateTo({
      url: `/pages/circle/circle?id=${circle._id}`
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

  /**
   * 格式化时长
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
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
            {user?.avatar_url ? (
              <Image className='avatar-image' src={user.avatar_url} mode='aspectFill' />
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

      {/* 运动统计 */}
      {stats && (
        <View className='stats-section'>
          <Text className='section-title'>运动数据</Text>
          <View className='stats-grid'>
            <StatsCard
              title='累计运动'
              value={formatDuration(stats.total_duration)}
              icon='🏆'
              color='#f59e0b'
            />
            <StatsCard
              title='打卡次数'
              value={`${stats.total_checkins}次`}
              icon='📸'
              color='#10b981'
            />
            <StatsCard
              title='连续打卡'
              value={`${stats.current_streak}天`}
              icon='🔥'
              color='#ef4444'
            />
            <StatsCard
              title='最长连续'
              value={`${stats.max_streak}天`}
              icon='⭐'
              color='#8b5cf6'
            />
          </View>
        </View>
      )}

      {/* 我的圈子 */}
      <View className='circles-section'>
        <View className='section-header'>
          <Text className='section-title'>我的圈子</Text>
          <Text className='circle-count'>{circles.length}个</Text>
        </View>
        
        {circles.length === 0 ? (
          <EmptyState
            icon='👥'
            title='还没有加入圈子'
            description='创建或加入一个健身圈子'
            compact
          />
        ) : (
          <View className='circles-list'>
            {circles.map(circle => (
              <CircleCard
                key={circle._id}
                circle={circle}
                onTap={navigateToCircle}
                compact
              />
            ))}
          </View>
        )}
      </View>

      {/* 功能菜单 */}
      <View className='menu-section'>
        <View className='menu-item' onClick={navigateToHistory}>
          <Text className='menu-icon'>📋</Text>
          <Text className='menu-text'>运动历史</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/circle/create/create' })}>
          <Text className='menu-icon'>➕</Text>
          <Text className='menu-text'>创建圈子</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/circle/join/join' })}>
          <Text className='menu-icon'>🔗</Text>
          <Text className='menu-text'>加入圈子</Text>
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
