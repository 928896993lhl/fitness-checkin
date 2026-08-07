import { useState, useCallback } from 'react'
import Taro, { useDidShow, usePullDownRefresh, stopPullDownRefresh } from '@tarojs/taro'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useUserState } from '../../context/UserContext'
import { CircleService } from '../../services/CircleService'
import { CheckinService } from '../../services/CheckinService'
import { Circle, Plan, UserExerciseStats } from '../../types'
import CircleCard from '../../components/circle/CircleCard'
import StatsCard from '../../components/common/StatsCard'
import CheckinButton from '../../components/checkin/CheckinButton'
import LooseCheckinPanel from '../../components/checkin/LooseCheckinPanel'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './index.scss'

/**
 * 首页组件
 * 显示用户的圈子列表、今日打卡状态、运动统计
 */
const Index = () => {
  const { user, isLoggedIn } = useUserState()
  const [circles, setCircles] = useState<Circle[]>([])
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [stats, setStats] = useState<UserExerciseStats | null>(null)
  const [todayDuration, setTodayDuration] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [panelVisible, setPanelVisible] = useState<boolean>(false)

  /**
   * 加载首页数据
   */
  const loadData = useCallback(async (showLoading = true) => {
    if (!isLoggedIn) {
      setIsLoading(false)
      return
    }

    try {
      if (showLoading) setIsLoading(true)

      // 并行请求数据
      const [circlesRes, statsRes] = await Promise.allSettled([
        CircleService.getMyCircles(),
        CheckinService.getUserStats()
      ])

      // 处理圈子数据
      if (circlesRes.status === 'fulfilled' && circlesRes.value.code === 200) {
        const circlesList = circlesRes.value.data || []
        setCircles(circlesList)

        // 获取第一个圈子的当前计划
        if (circlesList.length > 0 && circlesList[0] && circlesList[0].circleId) {
          try {
            const planRes = await CircleService.getCurrentPlan(circlesList[0].circleId)
            if (planRes.code === 200) {
              setCurrentPlan(planRes.data)
            }
          } catch (planError) {
            console.log('获取计划失败，可能是圈子还没有计划')
          }
        }
      }

      // 处理统计数据（今日打卡时长用 todayDuration 字段）
      if (statsRes.status === 'fulfilled' && statsRes.value.code === 200) {
        setStats(statsRes.value.data)
        setTodayDuration(statsRes.value.data?.todayDuration || 0)
      }
    } catch (error) {
      console.error('加载首页数据失败:', error)
      Taro.showToast({
        title: '数据加载失败',
        icon: 'none'
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [isLoggedIn])

  /**
   * 页面显示时加载数据
   */
  useDidShow(() => {
    loadData()
  })

  /**
   * 下拉刷新
   */
  usePullDownRefresh(() => {
    setIsRefreshing(true)
    loadData(false)
    setTimeout(() => {
      stopPullDownRefresh()
    }, 1000)
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
      url: `/pages/circle/detail/detail?circleId=${circle.circleId}`
    })
  }

  /**
   * 打开宽松打卡面板（无计划也可打卡）
   */
  const openCheckinPanel = () => {
    setPanelVisible(true)
  }

  /**
   * 关闭打卡面板并刷新
   */
  const handlePanelClose = () => {
    setPanelVisible(false)
    loadData(false)
  }

  /**
   * 跳转到创建圈子页
   */
  const navigateToCreateCircle = () => {
    Taro.navigateTo({
      url: '/pages/circle/create/create'
    })
  }

  /**
   * 跳转到加入圈子页
   */
  const navigateToJoinCircle = () => {
    Taro.navigateTo({
      url: '/pages/circle/join/join'
    })
  }

  /**
   * 格式化时长显示
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
      <View className='index-page'>
        <View className='login-prompt'>
          <View className='login-icon'>🏃</View>
          <Text className='login-title'>开始您的健身之旅</Text>
          <Text className='login-desc'>登录后即可创建或加入健身打卡圈子</Text>
          <View className='login-btn' onClick={navigateToLogin}>
            <Text className='login-btn-text'>微信登录</Text>
          </View>
        </View>
      </View>
    )
  }

  // 加载状态
  if (isLoading) {
    return (
      <View className='index-page'>
        <LoadingSpinner text='加载中...' />
      </View>
    )
  }

  return (
    <ScrollView
      className='index-page'
      scrollY
      enhanced
      showScrollbar={false}
    >
      {/* 用户欢迎区域 */}
      <View className='welcome-section'>
        <View className='welcome-header'>
          <View className='avatar-wrapper'>
            {user?.avatarUrl ? (
              <Image className='avatar-image' src={user.avatarUrl} mode='aspectFill' />
            ) : (
              <View className='avatar-placeholder'>
                <Text className='avatar-text'>{user?.nickname?.charAt(0) || '健'}</Text>
              </View>
            )}
          </View>
          <View className='welcome-info'>
            <Text className='welcome-greeting'>
              {getGreeting()}，{user?.nickname || '健身达人'}
            </Text>
            <Text className='welcome-date'>{formatDate()}</Text>
          </View>
        </View>
      </View>

      {/* 今日打卡状态 */}
      <View className='checkin-status-card'>
        <View className='status-header'>
          <Text className='status-title'>今日运动</Text>
          {currentPlan && (
            <Text className='status-plan'>{currentPlan.name}</Text>
          )}
        </View>
        <View className='status-content'>
          <View className='duration-display'>
            <Text className='duration-number'>{todayDuration}</Text>
            <Text className='duration-unit'>分钟</Text>
          </View>
          <View className='status-actions'>
            <CheckinButton
              onClick={openCheckinPanel}
              disabled={false}
              todayDuration={todayDuration}
              dailyGoal={currentPlan?.dailyDurationGoal || 0}
            />
          </View>
        </View>
        {currentPlan && todayDuration < currentPlan.dailyDurationGoal && (
          <View className='goal-hint'>
            <Text className='goal-hint-text'>
              距离今日目标还差 {currentPlan.dailyDurationGoal - todayDuration} 分钟
            </Text>
          </View>
        )}
      </View>

      {/* 运动统计 */}
      {stats && (
        <View className='stats-section'>
          <Text className='section-title'>运动统计</Text>
          <View className='stats-grid'>
            <StatsCard
              title='总运动时长'
              value={formatDuration(stats.totalDuration || 0)}
              icon='📊'
              color='#3b82f6'
            />
            <StatsCard
              title='打卡天数'
              value={`${stats.checkinDays || 0}天`}
              icon='📅'
              color='#10b981'
            />
            <StatsCard
              title='连续打卡'
              value={`${stats.currentStreak || 0}天`}
              icon='🔥'
              color='#f59e0b'
            />
            <StatsCard
              title='完成率'
              value={`${Math.round(stats.completionRate || 0)}%`}
              icon='🏆'
              color='#8b5cf6'
            />
          </View>
        </View>
      )}

      {/* 我的圈子 */}
      <View className='circles-section'>
        <View className='section-header'>
          <Text className='section-title'>我的圈子</Text>
          {circles.length > 0 && (
            <Text
              className='section-more'
              onClick={() => Taro.switchTab({ url: '/pages/circle/circle' })}
            >
              查看全部
            </Text>
          )}
        </View>
        
        {circles.length === 0 ? (
          <EmptyState
            icon='👥'
            title='还没有加入圈子'
            description='创建或加入一个健身圈子，和朋友一起打卡'
            actionText='创建圈子'
            onAction={navigateToCreateCircle}
            secondaryActionText='加入圈子'
            onSecondaryAction={navigateToJoinCircle}
          />
        ) : (
          <View className='circles-list'>
            {circles.slice(0, 3).map(circle => (
              <CircleCard
                key={circle.circleId}
                circle={circle}
                memberCount={circle.memberCount}
                onTap={navigateToCircle}
              />
            ))}
          </View>
        )}
      </View>

      {/* 快速操作 */}
      <View className='quick-actions'>
        <View className='action-item' onClick={navigateToCreateCircle}>
          <View className='action-icon create-icon'>➕</View>
          <Text className='action-text'>创建圈子</Text>
        </View>
        <View className='action-item' onClick={navigateToJoinCircle}>
          <View className='action-icon join-icon'>🔗</View>
          <Text className='action-text'>加入圈子</Text>
        </View>
        <View className='action-item' onClick={() => Taro.switchTab({ url: '/pages/profile/profile' })}>
          <View className='action-icon profile-icon'>👤</View>
          <Text className='action-text'>个人中心</Text>
        </View>
      </View>

      {/* 宽松打卡半屏面板 */}
      <LooseCheckinPanel
        visible={panelVisible}
        onClose={handlePanelClose}
        defaultPlanId={currentPlan?.planId}
      />
    </ScrollView>
  )
}

/**
 * 获取问候语
 */
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 17) return '下午好'
  if (hour < 19) return '傍晚好'
  return '晚上好'
}

/**
 * 格式化日期
 */
function formatDate(): string {
  const now = new Date()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekday = weekdays[now.getDay()]
  return `${month}月${day}日 ${weekday}`
}

export default Index
