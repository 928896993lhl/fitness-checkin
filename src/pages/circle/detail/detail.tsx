import { useState } from 'react'
import Taro, { useDidShow, usePullDownRefresh, stopPullDownRefresh, useRouter, useShareAppMessage } from '@tarojs/taro'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useUserState } from '../../../context/UserContext'
import { CircleService } from '../../../services/CircleService'
import { CheckinService } from '../../../services/CheckinService'
import { PlanService } from '../../../services/PlanService'
import { Circle, Plan, CircleMember, CircleStats, HeatmapData } from '../../../types'
import { isCircleActive } from '../../../types/constants'
import MemberAvatarList from '../../../components/circle/MemberAvatarList'
import PlanProgressCard from '../../../components/plan/PlanProgressCard'
import LooseCheckinPanel from '../../../components/checkin/LooseCheckinPanel'
import Heatmap from '../../../components/heatmap/Heatmap'
import EmptyState from '../../../components/common/EmptyState'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import BottomTabBar from '../../../components/common/BottomTabBar'
import './detail.scss'

/**
 * 从圈子计划列表中选择"当前计划"
 * 规则：优先进行中（status=1）；否则取最新一条未开始（status=0，列表 created_at DESC 首条）；否则无
 */
const pickCurrentPlan = (plans: Plan[]): Plan | null => {
  if (!plans || plans.length === 0) return null
  const active = plans.find(p => Number(p.status) === 1)
  if (active) return active
  const pending = plans.find(p => Number(p.status) === 0)
  return pending || null
}

/**
 * 圈子详情页面
 * 显示圈子信息、状态标签、成员列表、当前计划（三态）、运动统计、归档/恢复控制
 */
const CircleDetail = () => {
  const router = useRouter()
  const { user } = useUserState()
  const circleId = router.params.circleId || router.params.id

  const [circle, setCircle] = useState<Circle | null>(null)
  const [members, setMembers] = useState<CircleMember[]>([])
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [stats, setStats] = useState<CircleStats | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [panelVisible, setPanelVisible] = useState<boolean>(false)

  /**
   * 定义分享内容（hook 必须在组件顶层无条件调用）
   */
  useShareAppMessage(() => ({
    title: `邀请您加入健身打卡圈子「${circle?.name}」`,
    path: `/pages/circle/join/join?code=${circle?.inviteCode || ''}`
  }))

  /**
   * 加载圈子详情数据
   */
  const loadData = async (showLoading = true) => {
    if (!circleId) {
      Taro.showToast({
        title: '圈子ID无效',
        icon: 'none'
      })
      return
    }

    try {
      if (showLoading) setIsLoading(true)

      // 并行请求数据（圈子维度统计 + 圈子维度热力图 365 天）
      const [circleRes, membersRes, planRes, statsRes, heatmapRes] = await Promise.allSettled([
        CircleService.getCircleDetail(circleId),
        CircleService.getCircleMembers(circleId),
        PlanService.getPlansByCircle(circleId),
        CircleService.getCircleStats(circleId),
        CheckinService.getCircleHeatmap(circleId, 365)
      ])

      // 处理圈子信息
      if (circleRes.status === 'fulfilled' && circleRes.value.code === 200) {
        setCircle(circleRes.value.data)
      }

      // 处理成员列表
      if (membersRes.status === 'fulfilled' && membersRes.value.code === 200) {
        setMembers(membersRes.value.data || [])
      }

      // 处理当前计划（后端返回列表 created_at DESC；优先进行中 status=1，否则最新 status=0）
      if (planRes.status === 'fulfilled' && planRes.value.code === 200) {
        const rawData: any = planRes.value.data
        const plans = (Array.isArray(rawData) ? rawData : (rawData?.records || [])) as Plan[]
        setCurrentPlan(pickCurrentPlan(plans))
      }

      // 处理圈子统计信息（圈子维度）
      if (statsRes.status === 'fulfilled' && statsRes.value.code === 200) {
        setStats(statsRes.value.data)
      }

      // 处理圈子活跃度热力图（圈子维度，按人数着色）
      if (heatmapRes.status === 'fulfilled' && heatmapRes.value.code === 200) {
        setHeatmap(heatmapRes.value.data)
      }
    } catch (error) {
      console.error('加载圈子详情失败:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

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
   * 检查当前用户是否是圈子创建者
   */
  const isCreator = (): boolean => {
    if (!circle || !user) return false
    return String(circle.creatorId) === String(user.userId)
  }

  /**
   * 跳转到创建计划页
   */
  const navigateToCreatePlan = () => {
    if (!circleId) return
    Taro.navigateTo({
      url: `/pages/plan/create/create?circleId=${circleId}`
    })
  }

  /**
   * 跳转到计划详情页
   */
  const navigateToPlanDetail = (plan: Plan) => {
    Taro.navigateTo({
      url: `/pages/plan/detail/detail?planId=${plan.planId}`
    })
  }

  /**
   * 跳转到计划编辑页（仅待启动计划 status=0）
   */
  const navigateToEditPlan = (plan: Plan) => {
    Taro.navigateTo({
      url: `/pages/plan/edit/edit?planId=${plan.planId}`
    })
  }

  /**
   * 启动待启动计划
   */
  const handleStartPlan = async (plan: Plan) => {
    try {
      Taro.showLoading({ title: '启动中...' })
      await PlanService.startPlan(plan.planId)
      Taro.hideLoading()
      Taro.showToast({
        title: '计划已启动',
        icon: 'success'
      })
      loadData(false)
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: error.message || '启动失败，请重试',
        icon: 'none'
      })
    }
  }

  /**
   * 打开宽松打卡面板
   */
  const openCheckinPanel = () => {
    if (!isCircleActive(circle?.status)) return
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
   * 复制邀请码
   */
  const copyInviteCode = () => {
    if (!circle?.inviteCode) return
    Taro.setClipboardData({
      data: circle.inviteCode,
      success: () => {
        Taro.showToast({
          title: '邀请码已复制',
          icon: 'success'
        })
      }
    })
  }

  /**
   * 分享圈子
   */
  const shareCircle = () => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }

  /**
   * 归档圈子（仅创建者，二次确认）
   */
  const handleArchive = () => {
    if (!circle) return
    Taro.showModal({
      title: '归档圈子',
      content: '归档后圈子将不可加入、不可创建计划、不可打卡，确定归档？',
      confirmText: '归档',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await CircleService.archiveCircle(circle.circleId)
          Taro.showToast({
            title: '圈子已归档',
            icon: 'success'
          })
          loadData(false)
        } catch (error) {
          console.error('归档圈子失败:', error)
          Taro.showToast({
            title: error.message || '归档失败，请重试',
            icon: 'none'
          })
        }
      }
    })
  }

  /**
   * 恢复圈子（仅创建者，二次确认）
   */
  const handleRestore = () => {
    if (!circle) return
    Taro.showModal({
      title: '恢复圈子',
      content: '恢复后圈子将重新开放加入与打卡，确定恢复？',
      confirmText: '恢复',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await CircleService.restoreCircle(circle.circleId)
          Taro.showToast({
            title: '圈子已恢复',
            icon: 'success'
          })
          loadData(false)
        } catch (error) {
          console.error('恢复圈子失败:', error)
          Taro.showToast({
            title: error.message || '恢复失败，请重试',
            icon: 'none'
          })
        }
      }
    })
  }

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

  const circleActive = isCircleActive(circle?.status)

  // 加载状态
  if (isLoading) {
    return (
      <View className='circle-detail-page'>
        <LoadingSpinner text='加载中...' />
      </View>
    )
  }

  // 圈子不存在
  if (!circle) {
    return (
      <View className='circle-detail-page'>
        <EmptyState
          icon='😔'
          title='圈子不存在'
          description='该圈子可能已被删除或您没有访问权限'
          actionText='返回首页'
          onAction={() => Taro.switchTab({ url: '/pages/index/index' })}
        />
      </View>
    )
  }

  return (
    <View className='circle-detail-wrapper'>
      <ScrollView
        className='circle-detail-page'
        scrollY
        enhanced
        showScrollbar={false}
      >
      {/* 圈子头部信息 */}
      <View className='circle-header'>
        <View className='header-bg'></View>
        <View className='header-content'>
          <View className='circle-info'>
            <View className='name-row'>
              <Text className='circle-name'>{circle.name}</Text>
              <View className={`status-tag ${circleActive ? 'active' : 'archived'}`}>
                <View className={`status-dot ${circleActive ? 'active' : 'archived'}`}></View>
                <Text className='status-text'>{circleActive ? '进行中' : '已归档'}</Text>
              </View>
            </View>
            <Text className='circle-desc'>{circle.description || '暂无简介'}</Text>
          </View>
          <View className='circle-meta'>
            <View className='meta-item'>
              <Text className='meta-icon'>👥</Text>
              <Text className='meta-text'>{members.length}/{circle.maxMembers}人</Text>
            </View>
            <View className='meta-item' onClick={copyInviteCode}>
              <Text className='meta-icon'>🔗</Text>
              <Text className='meta-text'>邀请码: {circle.inviteCode}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 已归档提示条 */}
      {!circleActive && (
        <View className='archived-banner'>
          <Text className='archived-banner-text'>该圈子已归档，仅可查看历史</Text>
        </View>
      )}

      {/* 操作按钮 */}
      <View className='action-buttons'>
        {circleActive && (
          <View className='action-btn primary-btn' onClick={openCheckinPanel}>
            <Text className='btn-icon'>📸</Text>
            <Text className='btn-text'>今日打卡</Text>
          </View>
        )}
        <View className='action-btn secondary-btn' onClick={shareCircle}>
          <Text className='btn-icon'>📤</Text>
          <Text className='btn-text'>邀请好友</Text>
        </View>
      </View>

      {/* 运动统计（圈子维度） */}
      {stats && (
        <View className='stats-card'>
          <Text className='card-title'>运动统计</Text>
          <View className='stats-grid'>
            <View className='stat-item'>
              <Text className='stat-value'>{stats.todayActiveCount || 0}人</Text>
              <Text className='stat-label'>今日打卡</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>{formatDuration(stats.totalDuration || 0)}</Text>
              <Text className='stat-label'>总运动时长</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>{stats.totalCheckins || 0}次</Text>
              <Text className='stat-label'>打卡次数</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>{stats.activeMembers || 0}人</Text>
              <Text className='stat-label'>本周活跃</Text>
            </View>
          </View>
        </View>
      )}

      {/* 圈子活跃度热力图（圈子维度，按人数着色；位于运动统计下方、当前计划上方） */}
      <View className='circle-heatmap-section'>
        <Text className='section-title'>圈子活跃度</Text>
        <Heatmap
          data={heatmap || { startDate: '', endDate: '', days: [] }}
          mode='members'
        />
      </View>

      {/* 当前计划区（三态：进行中/待启动/无计划） */}
      <View className='plan-section'>
        <Text className='section-title'>当前计划</Text>
        {currentPlan ? (
          Number(currentPlan.status) === 1 ? (
            <PlanProgressCard
              plan={currentPlan}
              onTap={() => navigateToPlanDetail(currentPlan)}
            />
          ) : (
            <View className='pending-plan-card'>
              <View className='pending-plan-header'>
                <View className='pending-plan-info'>
                  <Text className='pending-plan-name'>{currentPlan.name}</Text>
                  <View className='pending-tag'>
                    <Text className='pending-tag-text'>待启动</Text>
                  </View>
                </View>
                <Text className='pending-plan-dates'>
                  {currentPlan.startDate} 至 {currentPlan.endDate}
                </Text>
              </View>
              <View className='pending-plan-goals'>
                <View className='pending-goal-item'>
                  <Text className='pending-goal-label'>每日目标</Text>
                  <Text className='pending-goal-value'>{currentPlan.dailyDurationGoal}分钟</Text>
                </View>
                <View className='pending-goal-item'>
                  <Text className='pending-goal-label'>总目标</Text>
                  <Text className='pending-goal-value'>{currentPlan.totalDurationGoal}分钟</Text>
                </View>
                <View className='pending-goal-item'>
                  <Text className='pending-goal-label'>最低打卡</Text>
                  <Text className='pending-goal-value'>{currentPlan.minDurationPerCheckin}分钟</Text>
                </View>
              </View>
              <Text className='pending-plan-desc'>
                {currentPlan.description || '系统生成的初始计划，可在编辑后启动'}
              </Text>
              {circleActive && isCreator() && (
                <View className='pending-plan-actions'>
                  <View
                    className='pending-btn edit-btn'
                    onClick={() => navigateToEditPlan(currentPlan)}
                  >
                    <Text className='pending-btn-text'>编辑计划</Text>
                  </View>
                  <View
                    className='pending-btn start-btn'
                    onClick={() => handleStartPlan(currentPlan)}
                  >
                    <Text className='pending-btn-text'>启动计划</Text>
                  </View>
                </View>
              )}
            </View>
          )
        ) : (
          <View className='no-plan-card'>
            <Text className='no-plan-text'>
              {isCreator() && circleActive ? '还没有计划，创建一个开始打卡吧' : '暂无计划'}
            </Text>
            {isCreator() && circleActive && (
              <View className='no-plan-create-btn' onClick={navigateToCreatePlan}>
                <Text className='no-plan-create-text'>创建计划</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 成员列表 */}
      <View className='members-section'>
        <View className='section-header'>
          <Text className='section-title'>圈子成员</Text>
          <Text className='member-count'>{members.length}人</Text>
        </View>
        <MemberAvatarList
          members={members}
          maxDisplay={8}
          size={80}
        />
        <View className='member-list'>
          {members.map(member => (
            <View key={member.id || member.userId} className='member-item'>
              <View className='member-avatar'>
                {member.user?.avatarUrl ? (
                  <Image src={member.user.avatarUrl} mode='aspectFill' />
                ) : (
                  <View className='avatar-placeholder'>
                    <Text>{member.user?.nickname?.charAt(0) || '?'}</Text>
                  </View>
                )}
              </View>
              <View className='member-info'>
                <Text className='member-name'>{member.user?.nickname || '未知用户'}</Text>
                <Text className='member-role'>
                  {member.role === 2 ? '创建者' : member.role === 1 ? '管理员' : '成员'}
                </Text>
              </View>
              {member.role === 2 && (
                <View className='creator-badge'>
                  <Text className='badge-text'>👑</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 历史计划入口 */}
      <View className='history-entry' onClick={() => Taro.navigateTo({
        url: `/pages/profile/history/history?circleId=${circleId}`
      })}>
        <Text className='history-icon'>📋</Text>
        <Text className='history-text'>查看历史计划</Text>
        <Text className='history-arrow'>›</Text>
      </View>

      {/* 圈子设置（仅创建者可见） */}
      {isCreator() && (
        <View className='settings-entry'>
          <View className='settings-item' onClick={copyInviteCode}>
            <Text className='settings-icon'>🔗</Text>
            <Text className='settings-text'>复制邀请码</Text>
            <Text className='settings-arrow'>›</Text>
          </View>
          {circleActive ? (
            <View className='settings-item danger' onClick={handleArchive}>
              <Text className='settings-icon'>📦</Text>
              <Text className='settings-text'>归档圈子</Text>
              <Text className='settings-arrow'>›</Text>
            </View>
          ) : (
            <View className='settings-item' onClick={handleRestore}>
              <Text className='settings-icon'>♻️</Text>
              <Text className='settings-text'>恢复圈子</Text>
              <Text className='settings-arrow'>›</Text>
            </View>
          )}
        </View>
      )}

      {/* 宽松打卡半屏面板 */}
      <LooseCheckinPanel
        visible={panelVisible}
        onClose={handlePanelClose}
        defaultPlanId={currentPlan?.planId}
        defaultCircleId={circleId}
      />
      </ScrollView>

      {/* 自渲染底部导航：保留 首页/圈子/我的 三个 tab（原生 tabBar 在非 tab 页不显示） */}
      <BottomTabBar current='circle' />
    </View>
  )
}

export default CircleDetail
