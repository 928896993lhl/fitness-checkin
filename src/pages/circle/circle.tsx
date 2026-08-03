import { useState, useEffect } from 'react'
import Taro, { useDidShow, usePullDownRefresh, stopPullDownRefresh, useRouter } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { useUserState } from '../../context/UserContext'
import { CircleService } from '../../services/CircleService'
import { Circle, Plan, CircleMember, CircleExerciseStats } from '../../types'
import CircleCard from '../../components/circle/CircleCard'
import MemberAvatarList from '../../components/circle/MemberAvatarList'
import PlanProgressCard from '../../components/plan/PlanProgressCard'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './circle.scss'

/**
 * 圈子详情页面
 * 显示圈子信息、成员列表、当前计划、运动统计
 */
const CircleDetail = () => {
  const router = useRouter()
  const { user } = useUserState()
  const circleId = router.params.id

  const [circle, setCircle] = useState<Circle | null>(null)
  const [members, setMembers] = useState<CircleMember[]>([])
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [stats, setStats] = useState<CircleExerciseStats | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

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

      // 并行请求数据
      const [circleRes, membersRes, planRes, statsRes] = await Promise.allSettled([
        CircleService.getCircleDetail(circleId),
        CircleService.getCircleMembers(circleId),
        CircleService.getCurrentPlan(circleId),
        CircleService.getCircleStats(circleId)
      ])

      // 处理圈子信息
      if (circleRes.status === 'fulfilled' && circleRes.value.code === 0) {
        setCircle(circleRes.value.data)
      }

      // 处理成员列表
      if (membersRes.status === 'fulfilled' && membersRes.value.code === 0) {
        setMembers(membersRes.value.data)
      }

      // 处理当前计划
      if (planRes.status === 'fulfilled' && planRes.value.code === 0) {
        setCurrentPlan(planRes.value.data)
      }

      // 处理统计信息
      if (statsRes.status === 'fulfilled' && statsRes.value.code === 0) {
        setStats(statsRes.value.data)
      }
    } catch (error) {
      console.error('加载圈子详情失败:', error)
      Taro.showToast({
        title: '数据加载失败',
        icon: 'none'
      })
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
    return circle.creator_id === user._id
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
      url: `/pages/plan/detail/detail?planId=${plan._id}`
    })
  }

  /**
   * 跳转到打卡页
   */
  const navigateToCheckin = () => {
    if (!currentPlan) {
      Taro.showToast({
        title: '暂无进行中的计划',
        icon: 'none'
      })
      return
    }
    Taro.navigateTo({
      url: `/pages/checkin/checkin?planId=${currentPlan._id}`
    })
  }

  /**
   * 复制邀请码
   */
  const copyInviteCode = () => {
    if (!circle?.invite_code) return
    Taro.setClipboardData({
      data: circle.invite_code,
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
    // 触发分享菜单
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
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

  /**
   * 定义分享内容
   */
  useShareAppMessage(() => {
    return {
      title: `邀请您加入健身打卡圈子「${circle?.name}」`,
      path: `/pages/circle/join/join?code=${circle?.invite_code}`,
      imageUrl: '' // 可以设置分享图片
    }
  })

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
            <Text className='circle-name'>{circle.name}</Text>
            <Text className='circle-desc'>{circle.description || '暂无简介'}</Text>
          </View>
          <View className='circle-meta'>
            <View className='meta-item'>
              <Text className='meta-icon'>👥</Text>
              <Text className='meta-text'>{members.length}/{circle.max_members}人</Text>
            </View>
            <View className='meta-item'>
              <Text className='meta-icon'>🔗</Text>
              <Text className='meta-text' onClick={copyInviteCode}>
                邀请码: {circle.invite_code}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className='action-buttons'>
        {isCreator() && !currentPlan && (
          <View className='action-btn primary-btn' onClick={navigateToCreatePlan}>
            <Text className='btn-icon'>🎯</Text>
            <Text className='btn-text'>创建计划</Text>
          </View>
        )}
        {currentPlan && (
          <View className='action-btn primary-btn' onClick={navigateToCheckin}>
            <Text className='btn-icon'>📸</Text>
            <Text className='btn-text'>今日打卡</Text>
          </View>
        )}
        <View className='action-btn secondary-btn' onClick={shareCircle}>
          <Text className='btn-icon'>📤</Text>
          <Text className='btn-text'>邀请好友</Text>
        </View>
      </View>

      {/* 运动统计 */}
      {stats && (
        <View className='stats-card'>
          <Text className='card-title'>运动统计</Text>
          <View className='stats-grid'>
            <View className='stat-item'>
              <Text className='stat-value'>{formatDuration(stats.total_duration)}</Text>
              <Text className='stat-label'>总运动时长</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>{stats.total_checkins}</Text>
              <Text className='stat-label'>总打卡次数</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>{stats.active_member_count}</Text>
              <Text className='stat-label'>本周活跃</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>{formatDuration(stats.average_duration)}</Text>
              <Text className='stat-label'>人均运动</Text>
            </View>
          </View>
        </View>
      )}

      {/* 当前计划 */}
      {currentPlan && (
        <View className='plan-section'>
          <Text className='section-title'>当前计划</Text>
          <PlanProgressCard
            plan={currentPlan}
            onTap={() => navigateToPlanDetail(currentPlan)}
          />
        </View>
      )}

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
            <View key={member._id} className='member-item'>
              <View className='member-avatar'>
                {member.user?.avatar_url ? (
                  <Image src={member.user.avatar_url} mode='aspectFill' />
                ) : (
                  <View className='avatar-placeholder'>
                    <Text>{member.user?.nickname?.charAt(0) || '?'}</Text>
                  </View>
                )}
              </View>
              <View className='member-info'>
                <Text className='member-name'>{member.user?.nickname || '未知用户'}</Text>
                <Text className='member-role'>
                  {member.role === 'creator' ? '创建者' : '成员'}
                </Text>
              </View>
              {member.user?._id === circle.creator_id && (
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
        </View>
      )}
    </ScrollView>
  )
}

export default CircleDetail
