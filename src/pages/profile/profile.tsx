import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useUserState, useUserDispatch } from '../../context/UserContext'
import { UserService } from '../../services/UserService'
import { CheckinService } from '../../services/CheckinService'
import { BadgeService } from '../../services/BadgeService'
import { BadgeInfo, HeatmapData } from '../../types'
import { PAGE_PATHS, REGEX_PATTERNS, BADGE_TOTAL_COUNT } from '../../types/constants'
import { compressImage, chooseImage } from '../../utils/imageUtils'
import BadgeWall from '../../components/badge/BadgeWall'
import Heatmap from '../../components/heatmap/Heatmap'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './profile.scss'

/**
 * 个人中心页面
 * 用户信息卡（头像/昵称可编辑）、活跃度热力图（180 天 compact）、徽章墙（iconOnly 已解锁 X/19）、
 * 运动历史/运动生涯/设置入口、退出登录
 */
const Profile = () => {
  const { user, isLoggedIn } = useUserState()
  const { updateUser, logout } = useUserDispatch()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [badges, setBadges] = useState<BadgeInfo[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)

  /**
   * 加载个人中心数据（徽章墙 + 180 天热力图，并行）
   */
  const loadData = async () => {
    if (!isLoggedIn) {
      setIsLoading(false)
      return
    }
    try {
      const [badgesRes, heatmapRes] = await Promise.allSettled([
        BadgeService.getMyBadges(),
        CheckinService.getHeatmap(180)
      ])
      if (badgesRes.status === 'fulfilled' && badgesRes.value.code === 200) {
        setBadges(Array.isArray(badgesRes.value.data) ? badgesRes.value.data : [])
      }
      if (heatmapRes.status === 'fulfilled' && heatmapRes.value.code === 200) {
        setHeatmap(heatmapRes.value.data)
      }
    } catch (error) {
      console.error('加载个人中心数据失败:', error)
      setBadges([])
      setHeatmap(null)
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
   * 跳转到历史记录
   */
  const navigateToHistory = () => {
    Taro.navigateTo({
      url: '/pages/profile/history/history'
    })
  }

  /**
   * 跳转到运动生涯页（热力图"更多›"）
   */
  const navigateToCareer = () => {
    Taro.navigateTo({
      url: PAGE_PATHS.PROFILE_CAREER
    })
  }

  /**
   * 跳转到徽章列表页（徽章墙"查看全部›"/点徽章）
   */
  const navigateToBadges = () => {
    Taro.navigateTo({
      url: PAGE_PATHS.PROFILE_BADGES
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
   * 更新头像：ActionSheet 选择来源 → 选图 → 压缩 → 上传 → 更新用户信息
   */
  const handleAvatarTap = () => {
    Taro.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: async (res) => {
        try {
          const sourceType: ('camera' | 'album')[] = res.tapIndex === 0 ? ['camera'] : ['album']
          const paths = await chooseImage(1, ['compressed'], sourceType)
          if (!paths || paths.length === 0) return

          Taro.showLoading({ title: '上传头像中...' })
          const compressed = await compressImage(paths[0], 80, 512, 512)
          const uploadRes = await CheckinService.uploadPhoto(compressed)
          if (uploadRes.code !== 200) {
            Taro.hideLoading()
            throw new Error('头像上传失败')
          }

          const avatarUrl = uploadRes.data.url
          const updateRes = await UserService.updateUserInfo({ avatarUrl })
          Taro.hideLoading()

          if (updateRes.code === 200 && updateRes.data) {
            updateUser(updateRes.data)
            Taro.showToast({
              title: '头像已更新',
              icon: 'success'
            })
          } else {
            throw new Error(updateRes.message || '更新失败')
          }
        } catch (error) {
          Taro.hideLoading()
          console.error('更新头像失败:', error)
          Taro.showToast({
            title: error.message || '头像更新失败，请重试',
            icon: 'none'
          })
        }
      },
      fail: () => {
        // 用户取消选择，忽略
      }
    })
  }

  /**
   * 编辑昵称：showModal editable → 2-20 校验 → 更新用户信息
   */
  const handleNicknameTap = () => {
    Taro.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称（2-20个字符）',
      content: '',
      success: async (res) => {
        if (!res.confirm) return
        const nickname = (res.content || '').trim()
        if (!nickname) {
          Taro.showToast({ title: '昵称不能为空', icon: 'none' })
          return
        }
        if (nickname.length < 2 || nickname.length > 20) {
          Taro.showToast({ title: '昵称长度为2-20个字符', icon: 'none' })
          return
        }
        if (!REGEX_PATTERNS.NICKNAME.test(nickname)) {
          Taro.showToast({ title: '昵称仅支持中英文、数字和下划线', icon: 'none' })
          return
        }
        try {
          const updateRes = await UserService.updateUserInfo({ nickname })
          if (updateRes.code === 200 && updateRes.data) {
            updateUser(updateRes.data)
            Taro.showToast({
              title: '昵称已更新',
              icon: 'success'
            })
          } else {
            throw new Error(updateRes.message || '更新失败')
          }
        } catch (error) {
          console.error('更新昵称失败:', error)
          Taro.showToast({
            title: error.message || '昵称更新失败，请重试',
            icon: 'none'
          })
        }
      }
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
          <View className='user-avatar' onClick={handleAvatarTap}>
            {user?.avatarUrl ? (
              <Image className='avatar-image' src={user.avatarUrl} mode='aspectFill' />
            ) : (
              <View className='avatar-placeholder'>
                <Text className='avatar-text'>{user?.nickname?.charAt(0) || '健'}</Text>
              </View>
            )}
          </View>
          <View className='user-info'>
            <View className='user-name-row' onClick={handleNicknameTap}>
              <Text className='user-name'>{user?.nickname || '健身达人'}</Text>
              <Text className='user-edit-icon'>✏️</Text>
            </View>
            <Text className='user-id'>ID: {user?.openid?.slice(-6) || '------'}</Text>
            <Text className='user-hint'>点击头像/昵称可修改</Text>
          </View>
        </View>
      </View>

      {/* 活跃度热力图（180 天 compact；更多› 跳运动生涯） */}
      <View className='heatmap-section'>
        <Heatmap
          data={heatmap || { startDate: '', endDate: '', days: [] }}
          compact
          mode='minutes'
          showMore
          onMore={navigateToCareer}
        />
      </View>

      {/* 徽章墙（仅已解锁图标；查看全部/点徽章跳徽章列表页） */}
      <View className='badges-section'>
        <View className='badges-header'>
          <Text className='badges-title'>我的徽章 已解锁 {badges.filter(b => b.unlocked).length}/{BADGE_TOTAL_COUNT}</Text>
          <View className='badges-more' onClick={navigateToBadges}>
            <Text className='badges-more-text'>查看全部 ›</Text>
          </View>
        </View>
        <BadgeWall badges={badges} iconOnly onBadgeTap={navigateToBadges} />
      </View>

      {/* 功能菜单 */}
      <View className='menu-section'>
        <View className='menu-item' onClick={navigateToHistory}>
          <Text className='menu-icon'>📋</Text>
          <Text className='menu-text'>运动历史</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={navigateToCareer}>
          <Text className='menu-icon'>🏆</Text>
          <Text className='menu-text'>运动生涯</Text>
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
