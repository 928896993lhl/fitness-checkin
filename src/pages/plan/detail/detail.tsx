import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { PlanService } from '../../../services/PlanService'
import { CheckinService } from '../../../services/CheckinService'
import { Plan, PlanProgress, CheckinRecord } from '../../../types'
import PlanProgressCard from '../../../components/plan/PlanProgressCard'
import CheckinCard from '../../../components/checkin/CheckinCard'
import EmptyState from '../../../components/common/EmptyState'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import './detail.scss'

/**
 * 计划详情页面
 */
const PlanDetail = () => {
  const router = useRouter()
  const planId = router.params.planId

  const [plan, setPlan] = useState<Plan | null>(null)
  const [progress, setProgress] = useState<PlanProgress | null>(null)
  const [recentCheckins, setRecentCheckins] = useState<CheckinRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  /**
   * 加载计划详情
   */
  const loadData = async () => {
    if (!planId) return

    try {
      setIsLoading(true)

      const [planRes, progressRes, checkinsRes] = await Promise.allSettled([
        PlanService.getPlanDetail(planId),
        PlanService.getPlanProgress(planId),
        CheckinService.getCheckinsByPlan(planId, { page_size: 10 })
      ])

      if (planRes.status === 'fulfilled' && planRes.value.code === 0) {
        setPlan(planRes.value.data)
      }

      if (progressRes.status === 'fulfilled' && progressRes.value.code === 0) {
        setProgress(progressRes.value.data)
      }

      if (checkinsRes.status === 'fulfilled' && checkinsRes.value.code === 0) {
        setRecentCheckins(checkinsRes.value.data.list)
      }
    } catch (error) {
      console.error('加载计划详情失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [planId])

  /**
   * 格式化时长
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  /**
   * 格式化日期
   */
  const formatDateDisplay = (date: string): string => {
    const d = new Date(date)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  /**
   * 跳转到打卡页
   */
  const navigateToCheckin = () => {
    if (!plan) return
    Taro.navigateTo({
      url: `/pages/checkin/checkin?planId=${plan._id}`
    })
  }

  // 加载状态
  if (isLoading) {
    return (
      <View className='plan-detail-page'>
        <LoadingSpinner text='加载中...' />
      </View>
    )
  }

  if (!plan) {
    return (
      <View className='plan-detail-page'>
        <EmptyState
          icon='📋'
          title='计划不存在'
          description='该计划可能已被删除'
          actionText='返回'
          onAction={() => Taro.navigateBack()}
        />
      </View>
    )
  }

  return (
    <View className='plan-detail-page'>
      {/* 计划头部信息 */}
      <View className='plan-header'>
        <Text className='plan-name'>{plan.name}</Text>
        {plan.description && (
          <Text className='plan-desc'>{plan.description}</Text>
        )}
        <View className='plan-meta'>
          <View className='meta-item'>
            <Text className='meta-icon'>📅</Text>
            <Text className='meta-text'>
              {formatDateDisplay(plan.start_date)} - {formatDateDisplay(plan.end_date)}
            </Text>
          </View>
          <View className='meta-item'>
            <Text className='meta-icon'>📊</Text>
            <Text className='meta-text'>
              状态: {plan.status === 'active' ? '进行中' : plan.status === 'completed' ? '已完成' : '未开始'}
            </Text>
          </View>
        </View>
      </View>

      {/* 进度卡片 */}
      {progress && (
        <View className='progress-section'>
          <Text className='section-title'>计划进度</Text>
          <PlanProgressCard
            plan={plan}
            progress={progress}
            showDetails
          />
        </View>
      )}

      {/* 目标详情 */}
      <View className='goals-section'>
        <Text className='section-title'>运动目标</Text>
        <View className='goals-card'>
          <View className='goal-item'>
            <Text className='goal-icon'>🎯</Text>
            <View className='goal-info'>
              <Text className='goal-label'>每日目标</Text>
              <Text className='goal-value'>{plan.daily_duration_goal}分钟/天</Text>
            </View>
          </View>
          <View className='goal-item'>
            <Text className='goal-icon'>🏆</Text>
            <View className='goal-info'>
              <Text className='goal-label'>总目标</Text>
              <Text className='goal-value'>{formatDuration(plan.total_duration_goal)}</Text>
            </View>
          </View>
          <View className='goal-item'>
            <Text className='goal-icon'>⏱️</Text>
            <View className='goal-info'>
              <Text className='goal-label'>最低打卡时长</Text>
              <Text className='goal-value'>{plan.min_duration_per_checkin}分钟</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 打卡按钮 */}
      {plan.status === 'active' && (
        <View className='checkin-action'>
          <View className='checkin-btn' onClick={navigateToCheckin}>
            <Text className='checkin-btn-icon'>📸</Text>
            <Text className='checkin-btn-text'>今日打卡</Text>
          </View>
        </View>
      )}

      {/* 最近打卡记录 */}
      <View className='checkins-section'>
        <Text className='section-title'>最近打卡</Text>
        {recentCheckins.length === 0 ? (
          <EmptyState
            icon='📸'
            title='暂无打卡记录'
            description='开始运动并打卡吧'
            compact
          />
        ) : (
          <View className='checkins-list'>
            {recentCheckins.map(record => (
              <CheckinCard
                key={record._id}
                record={record}
                showUser
              />
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

export default PlanDetail
