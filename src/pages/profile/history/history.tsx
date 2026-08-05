import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { useUserState } from '../../../context/UserContext'
import { CheckinService } from '../../../services/CheckinService'
import { PlanService } from '../../../services/PlanService'
import { CheckinRecord, Plan } from '../../../types'
import CheckinCard from '../../../components/checkin/CheckinCard'
import EmptyState from '../../../components/common/EmptyState'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import './history.scss'

/**
 * 运动历史页面
 */
const History = () => {
  const router = useRouter()
  const { user } = useUserState()
  const circleId = router.params.circleId || ''
  // 支持从热力图点击跳转携带日期筛选（startDate/endDate 成对出现）
  const routeStartDate = router.params.startDate || ''
  const routeEndDate = router.params.endDate || ''

  const [records, setRecords] = useState<CheckinRecord[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>(routeStartDate)
  const [endDate, setEndDate] = useState<string>(routeEndDate)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [total, setTotal] = useState<number>(0)

  /**
   * 加载历史记录
   */
  const loadRecords = async (reset = false) => {
    if (!user) return

    try {
      setIsLoading(true)

      const currentPage = reset ? 1 : page
      const params: any = {
        page: currentPage,
        pageSize: 20
      }

      if (selectedPlan !== 'all') {
        params.planId = selectedPlan
      }
      if (startDate) {
        params.startDate = startDate
      }
      if (endDate) {
        params.endDate = endDate
      }

      const result = await CheckinService.getMyCheckins(params)

      if (result.code === 200) {
        const rawData = result.data
        const data: any = rawData || { records: [], total: 0 }
        const newRecords = (Array.isArray(data) ? data : (data.records || [])) as CheckinRecord[]
        const totalCount = Array.isArray(data) ? newRecords.length : (data.total || 0)

        const mergedRecords = reset ? newRecords : [...records, ...newRecords]
        setRecords(mergedRecords)
        setTotal(totalCount)
        setHasMore(mergedRecords.length < totalCount)
        setPage(currentPage + 1)
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 加载计划列表
   */
  const loadPlans = async () => {
    if (!circleId) return

    try {
      const result = await PlanService.getPlansByCircle(circleId)
      if (result.code === 200) {
        const data: any = result.data
        const list = (Array.isArray(data) ? data : (data?.records || [])) as Plan[]
        setPlans(list)
      }
    } catch (error) {
      console.error('加载计划列表失败:', error)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [circleId])

  useEffect(() => {
    loadRecords(true)
  }, [selectedPlan, startDate, endDate])

  /**
   * 加载更多
   */
  const loadMore = () => {
    if (!hasMore || isLoading) return
    loadRecords()
  }

  /**
   * 切换计划筛选
   */
  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId)
    setPage(1)
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

  /**
   * 计算总运动时长
   */
  const totalDuration = (records || []).reduce((sum, record) => sum + (record.duration || 0), 0)

  /**
   * 清除日期筛选（从热力图跳转进入时可回到全部记录）
   */
  const clearDateFilter = () => {
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  return (
    <View className='history-page'>
      {/* 日期筛选提示（从热力图跳转进入时展示） */}
      {(startDate || endDate) && (
        <View className='date-filter-banner'>
          <Text className='date-filter-text'>
            已筛选：{startDate || '--'} 至 {endDate || '--'}
          </Text>
          <View className='date-filter-clear' onClick={clearDateFilter}>
            <Text className='date-filter-clear-text'>清除筛选</Text>
          </View>
        </View>
      )}

      {/* 筛选栏 */}
      <View className='filter-section'>
        <ScrollView
          className='filter-scroll'
          scrollX
          enhanced
          showScrollbar={false}
        >
          <View className='filter-list'>
            <View
              className={`filter-item ${selectedPlan === 'all' ? 'active' : ''}`}
              onClick={() => handlePlanChange('all')}
            >
              <Text className='filter-text'>全部</Text>
            </View>
            {plans.map(plan => (
              <View
                key={plan.planId}
                className={`filter-item ${selectedPlan === plan.planId ? 'active' : ''}`}
                onClick={() => handlePlanChange(plan.planId)}
              >
                <Text className='filter-text'>{plan.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 统计信息 */}
      <View className='stats-bar'>
        <View className='stat-item'>
          <Text className='stat-value'>{records.length}</Text>
          <Text className='stat-label'>打卡次数</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value'>{formatDuration(totalDuration)}</Text>
          <Text className='stat-label'>总运动时长</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value'>
            {records.length > 0 ? Math.round(totalDuration / records.length) : 0}
          </Text>
          <Text className='stat-label'>平均时长(分钟)</Text>
        </View>
      </View>

      {/* 记录列表 */}
      <ScrollView
        className='records-scroll'
        scrollY
        enhanced
        showScrollbar={false}
        onScrollToLower={loadMore}
      >
        {records.length === 0 && !isLoading ? (
          <EmptyState
            icon='📋'
            title='暂无运动记录'
            description='开始运动并打卡吧'
          />
        ) : (
          <View className='records-list'>
            {records.map(record => (
              <CheckinCard
                key={record.recordId}
                record={record}
                showDate
              />
            ))}
            
            {hasMore && (
              <View className='load-more'>
                <Text className='load-more-text'>
                  {isLoading ? '加载中...' : '加载更多'}
                </Text>
              </View>
            )}
            
            {!hasMore && records.length > 0 && (
              <View className='no-more'>
                <Text className='no-more-text'>没有更多记录了</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default History
