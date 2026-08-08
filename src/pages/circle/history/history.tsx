import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { PlanService } from '../../../services/PlanService'
import { Plan } from '../../../types'
import EmptyState from '../../../components/common/EmptyState'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import './history.scss'

/** Tab：全部（含未开始/进行中/已结束） / 已结束（status=2） */
type HistoryTab = 'all' | 'finished'

/**
 * 格式化日期（M月D日）
 */
const formatDate = (date: string): string => {
  if (!date) return '--'
  const normalized = date.includes('T') ? date : date.replace(' ', 'T')
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return '--'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/**
 * 格式化时长（分钟 → 中文展示）
 */
const formatDuration = (minutes: number): string => {
  const value = Number(minutes) || 0
  if (value <= 0) return '0分钟'
  if (value < 60) return `${value}分钟`
  const hours = Math.floor(value / 60)
  const mins = value % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

/**
 * 获取状态文本（计划状态：0-未开始，1-进行中，2-已结束）
 */
const getStatusText = (status: number): string => {
  switch (status) {
    case 1: return '进行中'
    case 0: return '未开始'
    case 2: return '已结束'
    default: return '未知'
  }
}

/**
 * 获取状态颜色
 */
const getStatusColor = (status: number): string => {
  switch (status) {
    case 1: return '#10b981'
    case 0: return '#f59e0b'
    case 2: return '#3b82f6'
    default: return '#6b7280'
  }
}

/**
 * 圈子历史计划页（r5 新增）
 * 路由：/pages/circle/history/history?circleId=xx
 * 数据复用 GET /plans/circle/{id}（Plan.stats 含 totalDuration/progressPercentage），前端按 status 过滤。
 */
const CircleHistory = () => {
  const router = useRouter()
  const circleId = router.params.circleId || ''

  const [plans, setPlans] = useState<Plan[]>([])
  const [tab, setTab] = useState<HistoryTab>('all')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  /**
   * 加载圈子计划列表
   */
  const loadPlans = async () => {
    if (!circleId) {
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      const result = await PlanService.getPlansByCircle(circleId)
      if (result.code === 200) {
        const data: any = result.data
        const list = (Array.isArray(data) ? data : (data?.records || [])) as Plan[]
        setPlans(list)
      }
    } catch (error) {
      console.error('加载圈子历史计划失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [circleId])

  /**
   * 已结束计划（status=2）
   */
  const finishedPlans = plans.filter(p => Number(p.status) === 2)
  const displayedPlans = tab === 'finished' ? finishedPlans : plans

  /**
   * 汇总：历史计划数 = status2 计数；累计全员时长 = SUM(stats.totalDuration)；平均完成率（已结束计划均值）
   */
  const totalFinishedDuration = finishedPlans.reduce(
    (sum, p) => sum + (Number(p.stats?.totalDuration) || 0), 0)
  const avgProgress = finishedPlans.length > 0
    ? Math.round(finishedPlans.reduce(
        (sum, p) => sum + (Number(p.stats?.progressPercentage) || 0), 0) / finishedPlans.length * 10) / 10
    : 0

  /**
   * 跳转计划详情
   */
  const navigateToPlanDetail = (plan: Plan) => {
    Taro.navigateTo({
      url: `/pages/plan/detail/detail?planId=${plan.planId}`
    })
  }

  if (isLoading) {
    return (
      <View className='circle-history-page'>
        <LoadingSpinner text='加载中...' />
      </View>
    )
  }

  return (
    <View className='circle-history-page'>
      {/* 顶部汇总条 */}
      <View className='summary-bar'>
        <View className='summary-item'>
          <Text className='summary-value'>{finishedPlans.length}</Text>
          <Text className='summary-label'>历史计划</Text>
        </View>
        <View className='summary-item'>
          <Text className='summary-value'>{formatDuration(totalFinishedDuration)}</Text>
          <Text className='summary-label'>累计全员时长</Text>
        </View>
        <View className='summary-item'>
          <Text className='summary-value'>{avgProgress}%</Text>
          <Text className='summary-label'>平均完成率</Text>
        </View>
      </View>

      {/* Tab：全部 / 已结束 */}
      <View className='tab-bar'>
        <View
          className={`tab-item ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          <Text className='tab-text'>全部</Text>
        </View>
        <View
          className={`tab-item ${tab === 'finished' ? 'active' : ''}`}
          onClick={() => setTab('finished')}
        >
          <Text className='tab-text'>已结束</Text>
        </View>
      </View>

      {/* 计划列表 */}
      {displayedPlans.length === 0 ? (
        <EmptyState
          icon='📋'
          title='暂无历史计划'
          description={tab === 'finished' ? '该圈子还没有已结束的计划' : '该圈子还没有计划'}
        />
      ) : (
        <View className='plan-list'>
          {displayedPlans.map(plan => {
            const status = Number(plan.status)
            const color = getStatusColor(status)
            const goal = Number(plan.circleTotalGoal) || 0
            const totalDuration = Number(plan.stats?.totalDuration) || 0
            const progress = Math.min(100, Math.max(0, Number(plan.stats?.progressPercentage) || 0))
            return (
              <View
                key={plan.planId}
                className='plan-card'
                onClick={() => navigateToPlanDetail(plan)}
              >
                <View className='plan-card-header'>
                  <Text className='plan-name'>{plan.name}</Text>
                  <View className='plan-status' style={{ backgroundColor: `${color}20` }}>
                    <Text className='plan-status-text' style={{ color }}>
                      {getStatusText(status)}
                    </Text>
                  </View>
                </View>
                <Text className='plan-dates'>
                  {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                </Text>
                <View className='plan-goals'>
                  <View className='goal-item'>
                    <Text className='goal-label'>目标</Text>
                    <Text className='goal-value'>{goal > 0 ? formatDuration(goal) : '--'}</Text>
                  </View>
                  <View className='goal-item'>
                    <Text className='goal-label'>全员完成</Text>
                    <Text className='goal-value'>{formatDuration(totalDuration)}</Text>
                  </View>
                  <View className='goal-item'>
                    <Text className='goal-label'>完成率</Text>
                    <Text className='goal-value'>{Math.round(progress * 10) / 10}%</Text>
                  </View>
                </View>
                <View className='plan-progress-bar'>
                  <View
                    className='plan-progress-fill'
                    style={{ width: `${progress}%`, backgroundColor: color }}
                  />
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

export default CircleHistory
