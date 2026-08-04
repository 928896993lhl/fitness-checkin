import { useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { CircleService } from '../../../services/CircleService'
import { SUCCESS_MESSAGES, REGEX_PATTERNS } from '../../../types/constants'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import './join.scss'

/**
 * 加入圈子页面
 */
const JoinCircle = () => {
  const router = useRouter()
  const initialCode = router.params.code || ''
  
  const [inviteCode, setInviteCode] = useState<string>(initialCode)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  /**
   * 验证邀请码
   */
  const validateCode = (): boolean => {
    if (!inviteCode.trim()) {
      Taro.showToast({
        title: '请输入邀请码',
        icon: 'none'
      })
      return false
    }

    if (!REGEX_PATTERNS.INVITE_CODE.test(inviteCode.trim())) {
      Taro.showToast({
        title: '邀请码格式错误',
        icon: 'none'
      })
      return false
    }

    return true
  }

  /**
   * 处理加入圈子
   */
  const handleJoin = async () => {
    if (!validateCode()) return

    try {
      setIsLoading(true)

      const result = await CircleService.joinCircle({
        invite_code: inviteCode.trim()
      })

      if (result.code === 200) {
        Taro.showToast({
          title: SUCCESS_MESSAGES.CIRCLE_JOINED,
          icon: 'success'
        })

        // 跳转到圈子详情页
        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/circle/circle?id=${result.data._id}`
          })
        }, 1500)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('加入圈子失败:', error)
      Taro.showToast({
        title: error.message || '加入失败，请重试',
        icon: 'none'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 粘贴邀请码
   */
  const pasteCode = async () => {
    try {
      const clipRes = await Taro.getClipboardData()
      if (clipRes.data) {
        setInviteCode(clipRes.data.trim())
      }
    } catch (error) {
      console.error('粘贴失败:', error)
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <View className='join-circle-page'>
        <LoadingSpinner text='加入中...' />
      </View>
    )
  }

  return (
    <View className='join-circle-page'>
      {/* 图标区域 */}
      <View className='icon-section'>
        <View className='join-icon'>🔗</View>
        <Text className='join-title'>加入健身圈子</Text>
        <Text className='join-desc'>输入好友分享的邀请码即可加入</Text>
      </View>

      {/* 输入区域 */}
      <View className='input-section'>
        <View className='input-wrapper'>
          <Input
            className='invite-input'
            placeholder='请输入6位邀请码'
            value={inviteCode}
            onInput={(e) => setInviteCode(e.detail.value)}
            maxlength={6}
          />
          <View className='paste-btn' onClick={pasteCode}>
            <Text className='paste-text'>粘贴</Text>
          </View>
        </View>
        <Text className='input-hint'>
          邀请码由圈子创建者提供，为6位字母数字组合
        </Text>
      </View>

      {/* 加入按钮 */}
      <View className='action-section'>
        <View
          className={`join-btn ${inviteCode.trim().length === 8 ? 'active' : 'disabled'}`}
          onClick={handleJoin}
        >
          <Text className='join-btn-text'>加入圈子</Text>
        </View>
      </View>

      {/* 提示信息 */}
      <View className='tips-section'>
        <Text className='tips-title'>加入须知</Text>
        <View className='tips-list'>
          <Text className='tips-item'>• 每人只能加入一个圈子</Text>
          <Text className='tips-item'>• 加入后不可退出</Text>
          <Text className='tips-item'>• 请确保邀请码正确，区分大小写</Text>
          <Text className='tips-item'>• 圈子人数有限，满员后无法加入</Text>
        </View>
      </View>
    </View>
  )
}

export default JoinCircle
