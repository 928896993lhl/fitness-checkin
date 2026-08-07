import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { useUserState } from '../../../context/UserContext'
import { BadgeService } from '../../../services/BadgeService'
import { BadgeInfo } from '../../../types'
import { BADGE_CATEGORY_CONFIG, BADGE_TOTAL_COUNT } from '../../../types/constants'
import { formatDate } from '../../../utils/dateUtils'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import EmptyState from '../../../components/common/EmptyState'
import './badges.scss'

/** 分类展示顺序（与 BADGE_CATEGORY_CONFIG 键序一致：天数→连续→时长→能量→里程） */
const CATEGORY_ORDER = ['days', 'streak', 'duration', 'kcal', 'distance'] as const

/**
 * 徽章列表页
 * 总览卡（已解锁 X/19 + 进度条）→ 5 分类分组（标题 icon+名称+该类解锁数）→ 组内 3 列 grid
 * → 点击徽章自绘底部弹层（大图标/名称/conditionText/progressText/remainText/unlockedAt）
 */
const Badges = () => {
  const { isLoggedIn } = useUserState()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [badges, setBadges] = useState<BadgeInfo[]>([])
  const [selected, setSelected] = useState<BadgeInfo | null>(null)

  /**
   * 加载徽章列表
   */
  const loadData = async () => {
    if (!isLoggedIn) {
      setIsLoading(false)
      return
    }
    try {
      const res = await BadgeService.getMyBadges()
      if (res.code === 200) {
        setBadges(Array.isArray(res.data) ? res.data : [])
      }
    } catch (error) {
      console.error('加载徽章列表失败:', error)
      setBadges([])
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
   * 关闭底部弹层（遮罩点击 / 关闭按钮）
   */
  const closeSheet = () => {
    setSelected(null)
  }

  /**
   * 格式化解锁时间
   */
  const formatUnlockedAt = (value?: string | null): string => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return value
    return formatDate(d, 'YYYY-MM-DD HH:mm')
  }

  /**
   * 统计某分类解锁数
   */
  const countUnlockedInCategory = (category: string): number => {
    return badges.filter(b => b.category === category && b.unlocked).length
  }

  if (!isLoggedIn) {
    return (
      <View className='badges-page'>
        <EmptyState
          icon='🎖️'
          title='登录后查看徽章'
          description='登录后即可查看您的徽章墙'
          actionText='去登录'
          onAction={() => Taro.navigateTo({ url: '/pages/login/login' })}
        />
      </View>
    )
  }

  if (isLoading) {
    return (
      <View className='badges-page'>
        <LoadingSpinner text='加载中...' />
      </View>
    )
  }

  const unlockedCount = badges.filter(b => b.unlocked).length
  const progressPercent = BADGE_TOTAL_COUNT > 0 ? Math.round((unlockedCount / BADGE_TOTAL_COUNT) * 100) : 0

  return (
    <View className='badges-page'>
      <ScrollView
        className='badges-scroll'
        scrollY
        enhanced
        showScrollbar={false}
      >
        {/* 总览卡 */}
        <View className='overview-card'>
          <View className='overview-header'>
            <Text className='overview-title'>我的徽章</Text>
            <Text className='overview-count'>
              已解锁 {unlockedCount}/{BADGE_TOTAL_COUNT}
            </Text>
          </View>
          <View className='progress-track'>
            <View
              className='progress-bar'
              style={{ width: `${progressPercent}%` }}
            />
          </View>
          <Text className='overview-hint'>坚持打卡，解锁更多成就徽章</Text>
        </View>

        {/* 分类分组 */}
        {badges.length === 0 ? (
          <View className='empty-section'>
            <Text className='empty-text'>暂无徽章数据</Text>
          </View>
        ) : (
          CATEGORY_ORDER.map(category => {
            const config = BADGE_CATEGORY_CONFIG[category]
            if (!config) return null
            const groupBadges = badges
              .filter(b => b.category === category)
              .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
            if (groupBadges.length === 0) return null
            return (
              <View key={category} className='category-section'>
                <View className='category-header'>
                  <Text className='category-icon'>{config.icon}</Text>
                  <Text className='category-name'>{config.name}</Text>
                  <Text className='category-count'>
                    {countUnlockedInCategory(category)}/{groupBadges.length}
                  </Text>
                </View>
                <View className='category-grid'>
                  {groupBadges.map(badge => (
                    <View
                      key={badge.code}
                      className={`category-item ${badge.unlocked ? 'unlocked' : 'locked'}`}
                      onClick={() => setSelected(badge)}
                    >
                      <View className='item-icon-wrap'>
                        <Text className='item-icon'>{badge.unlocked ? badge.icon : '🔒'}</Text>
                      </View>
                      <Text className='item-name'>{badge.name}</Text>
                      <Text className='item-status'>
                        {badge.unlocked ? '已解锁' : badge.progressText}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      {/* 底部弹层：自绘（遮罩 + 底部滑入面板） */}
      {selected && (
        <View className='sheet-mask' catchMove onClick={closeSheet}>
          <View
            className='sheet-panel'
            onClick={(e: any) => e.stopPropagation()}
          >
            <View className='sheet-handle' />
            <View className='sheet-close' onClick={closeSheet}>
              <Text className='sheet-close-text'>✕</Text>
            </View>
            <View className='sheet-icon-wrap'>
              <Text className='sheet-icon'>{selected.icon}</Text>
            </View>
            <Text className='sheet-name'>{selected.name}</Text>
            <Text className='sheet-condition'>{selected.conditionText}</Text>
            <View className='sheet-info-row'>
              <Text className='sheet-info-label'>当前进度</Text>
              <Text className='sheet-info-value'>{selected.progressText}</Text>
            </View>
            {!selected.unlocked && selected.remainText && (
              <View className='sheet-info-row'>
                <Text className='sheet-info-label'>解锁提示</Text>
                <Text className='sheet-info-value remain'>{selected.remainText}</Text>
              </View>
            )}
            {selected.unlocked && (
              <View className='sheet-info-row'>
                <Text className='sheet-info-label'>解锁时间</Text>
                <Text className='sheet-info-value'>
                  {formatUnlockedAt(selected.unlockedAt)}
                </Text>
              </View>
            )}
            <View className='sheet-status-tag'>
              <Text className={`sheet-status-text ${selected.unlocked ? 'unlocked' : 'locked'}`}>
                {selected.unlocked ? '✓ 已解锁' : '未解锁'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default Badges
