import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { useUserState } from '../../../context/UserContext'
import { CheckinService } from '../../../services/CheckinService'
import { BadgeService } from '../../../services/BadgeService'
import { UserExerciseStats, HeatmapData, BadgeInfo, ExerciseTypeBreakdownItem } from '../../../types'
import { EXERCISE_SPEED_KMH, EXERCISE_TYPE_CONFIG } from '../../../types/constants'
import Heatmap from '../../../components/heatmap/Heatmap'
import BadgeWall from '../../../components/badge/BadgeWall'
import EmptyState from '../../../components/common/EmptyState'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import './career.scss'

/**
 * 运动生涯页面
 * 总览 4 宫格 + 活跃度热力图 + 次级指标 + 运动类型分布 + 徽章墙全量
 */
const Career = () => {
  const { isLoggedIn } = useUserState()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [stats, setStats] = useState<UserExerciseStats | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
  const [badges, setBadges] = useState<BadgeInfo[]>([])

  /**
   * 并行加载运动生涯数据
   */
  const loadData = async () => {
    if (!isLoggedIn) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const [statsRes, heatmapRes, badgesRes] = await Promise.allSettled([
        CheckinService.getUserStats(),
        CheckinService.getHeatmap(365),
        BadgeService.getMyBadges()
      ])

      if (statsRes.status === 'fulfilled' && statsRes.value.code === 200) {
        setStats(statsRes.value.data)
      }
      if (heatmapRes.status === 'fulfilled' && heatmapRes.value.code === 200) {
        setHeatmap(heatmapRes.value.data)
      }
      if (badgesRes.status === 'fulfilled' && badgesRes.value.code === 200) {
        setBadges(Array.isArray(badgesRes.value.data) ? badgesRes.value.data : [])
      }
    } catch (error) {
      console.error('加载运动生涯数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useDidShow(() => {
    loadData()
  })

  /**
   * 格式化时长
   */
  const formatDuration = (minutes: number): string => {
    if (!minutes) return '0分钟'
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  /**
   * 计算平均每次时长（除零保护）
   */
  const calcAverage = (): number => {
    if (!stats || !stats.totalCheckins) return 0
    return Math.round(stats.totalDuration / stats.totalCheckins)
  }

  /**
   * 估算总里程（EXERCISE_SPEED_KMH 系数，与后端徽章口径一致）
   */
  const calcDistance = (): number => {
    const breakdown: ExerciseTypeBreakdownItem[] = stats?.exerciseTypeBreakdown || []
    return breakdown.reduce((sum, item) => {
      const speed = EXERCISE_SPEED_KMH[item.type] || 0
      return sum + (item.duration / 60) * speed
    }, 0)
  }

  /**
   * 计算运动类型分布占比
   */
  const calcTypePercent = (duration: number): number => {
    if (!stats || !stats.totalDuration) return 0
    return Math.round((duration / stats.totalDuration) * 100)
  }

  if (!isLoggedIn) {
    return (
      <View className='career-page'>
        <EmptyState
          icon='🏆'
          title='登录后查看运动生涯'
          description='登录后即可查看您的运动数据'
          actionText='去登录'
          onAction={() => Taro.navigateTo({ url: '/pages/login/login' })}
        />
      </View>
    )
  }

  if (isLoading) {
    return (
      <View className='career-page'>
        <LoadingSpinner text='加载中...' />
      </View>
    )
  }

  const distance = calcDistance()
  const breakdown: ExerciseTypeBreakdownItem[] = stats?.exerciseTypeBreakdown || []

  return (
    <ScrollView
      className='career-page'
      scrollY
      enhanced
      showScrollbar={false}
    >
      {/* 总览 4 宫格 */}
      <View className='overview-section'>
        <View className='overview-grid'>
          <View className='overview-item'>
            <Text className='overview-value'>{formatDuration(stats?.totalDuration || 0)}</Text>
            <Text className='overview-label'>累计时长</Text>
          </View>
          <View className='overview-item'>
            <Text className='overview-value'>{stats?.checkinDays || 0}天</Text>
            <Text className='overview-label'>打卡天数</Text>
          </View>
          <View className='overview-item'>
            <Text className='overview-value'>{stats?.totalCheckins || 0}次</Text>
            <Text className='overview-label'>打卡次数</Text>
          </View>
          <View className='overview-item'>
            <Text className='overview-value'>{stats?.currentStreak || 0}天</Text>
            <Text className='overview-label'>连续天数</Text>
          </View>
        </View>
      </View>

      {/* 活跃度热力图 */}
      <View className='heatmap-section'>
        <Text className='section-title'>活跃度</Text>
        <Heatmap data={heatmap || { startDate: '', endDate: '', days: [] }} />
      </View>

      {/* 次级指标 */}
      <View className='metrics-section'>
        <Text className='section-title'>更多数据</Text>
        <View className='metrics-grid'>
          <View className='metric-item'>
            <Text className='metric-value'>{stats?.todayDuration || 0}分钟</Text>
            <Text className='metric-label'>今日已运动</Text>
          </View>
          <View className='metric-item'>
            <Text className='metric-value'>{stats?.longestStreak || 0}天</Text>
            <Text className='metric-label'>最长连续</Text>
          </View>
          <View className='metric-item'>
            <Text className='metric-value'>{calcAverage()}分钟</Text>
            <Text className='metric-label'>平均每次</Text>
          </View>
          <View className='metric-item'>
            <Text className='metric-value'>{distance.toFixed(1)}公里</Text>
            <Text className='metric-label'>总里程估算</Text>
          </View>
        </View>
      </View>

      {/* 运动类型分布 */}
      <View className='type-section'>
        <Text className='section-title'>运动类型分布</Text>
        {breakdown.length > 0 ? (
          <View className='type-list'>
            {breakdown.map(item => {
              const config = EXERCISE_TYPE_CONFIG[item.type as keyof typeof EXERCISE_TYPE_CONFIG]
              const percent = calcTypePercent(item.duration)
              return (
                <View key={item.type} className='type-item'>
                  <Text className='type-icon'>{config?.icon || '⚡'}</Text>
                  <Text className='type-name'>{config?.name || item.type}</Text>
                  <View className='type-bar-wrap'>
                    <View
                      className='type-bar'
                      style={{
                        width: `${percent}%`,
                        backgroundColor: config?.color || '#6b7280'
                      }}
                    />
                  </View>
                  <Text className='type-percent'>{percent}%</Text>
                  <Text className='type-duration'>{formatDuration(item.duration)}</Text>
                </View>
              )
            })}
          </View>
        ) : (
          <View className='type-empty'>
            <Text className='type-empty-text'>暂无运动数据</Text>
          </View>
        )}
      </View>

      {/* 徽章墙（全量） */}
      <View className='badges-section'>
        <Text className='section-title'>我的徽章</Text>
        <BadgeWall badges={badges} />
      </View>
    </ScrollView>
  )
}

export default Career
