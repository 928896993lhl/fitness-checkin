import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button, Input, Image } from '@tarojs/components'
import { useUserDispatch } from '../../context/UserContext'
import { UserService } from '../../services/UserService'
import { API_BASE_URL } from '../../types/constants'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './login.scss'

/**
 * 登录页面组件
 * 微信授权登录（使用新的头像昵称填写组件，符合微信审核要求）
 */
const Login = () => {
  const { login } = useUserDispatch()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isAgreed, setIsAgreed] = useState<boolean>(false)
  const [showProfileForm, setShowProfileForm] = useState<boolean>(false)
  const [loginCode, setLoginCode] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [nickname, setNickname] = useState<string>('')

  /**
   * 处理微信登录（第一步：获取code）
   */
  const handleLogin = async () => {
    if (!isAgreed) {
      Taro.showToast({
        title: '请先同意用户协议和隐私政策',
        icon: 'none'
      })
      return
    }

    try {
      setIsLoading(true)

      // 获取微信登录code
      const loginRes = await Taro.login()
      if (!loginRes.code) {
        throw new Error('微信登录失败')
      }

      setLoginCode(loginRes.code)
      setShowProfileForm(true)
      setIsLoading(false)
    } catch (error) {
      console.error('登录失败:', error)
      Taro.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none'
      })
      setIsLoading(false)
    }
  }

  /**
   * 处理头像选择
   */
  const onChooseAvatar = (e: any) => {
    if (e.detail.avatarUrl) {
      setAvatarUrl(e.detail.avatarUrl)
    }
  }

  /**
   * 处理昵称输入
   */
  const onNicknameInput = (e: any) => {
    setNickname(e.detail.value)
  }

  /**
   * 提交登录（第二步：调用登录接口）
   */
  const handleSubmitProfile = async () => {
    if (!nickname.trim()) {
      Taro.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    try {
      setIsLoading(true)

      // 调用登录接口
      const result = await UserService.login({
        code: loginCode,
        nickname: nickname.trim(),
        avatarUrl: avatarUrl,
        gender: 0,
        province: '',
        city: '',
        country: ''
      })

      if (result.code === 200) {
        // 保存登录信息
        Taro.setStorageSync('token', result.data.token)
        Taro.setStorageSync('userInfo', result.data)

        // 更新全局状态
        login(result.data)

        Taro.showToast({
          title: '登录成功',
          icon: 'success'
        })

        // 跳转到首页
        setTimeout(() => {
          Taro.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('登录失败:', error)
      Taro.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 切换协议同意状态
   */
  const toggleAgreement = () => {
    setIsAgreed(!isAgreed)
  }

  /**
   * 查看用户协议
   */
  const viewUserAgreement = () => {
    Taro.navigateTo({
      url: `/pages/webview/webview?url=${API_BASE_URL}/agreement.html`
    })
  }

  /**
   * 查看隐私政策
   */
  const viewPrivacyPolicy = () => {
    Taro.navigateTo({
      url: `/pages/webview/webview?url=${API_BASE_URL}/privacy.html`
    })
  }

  // 加载状态
  if (isLoading) {
    return (
      <View className='login-page'>
        <LoadingSpinner text={showProfileForm ? '登录中...' : '获取登录凭证...'} />
      </View>
    )
  }

  // 头像昵称填写界面
  if (showProfileForm) {
    return (
      <View className='login-page'>
        {/* 背景装饰 */}
        <View className='login-bg'>
          <View className='bg-circle circle-1'></View>
          <View className='bg-circle circle-2'></View>
          <View className='bg-circle circle-3'></View>
        </View>

        <View className='login-content'>
          <View className='logo-section'>
            <View className='logo-icon'>🏃</View>
            <Text className='logo-title'>完善个人信息</Text>
            <Text className='logo-subtitle'>设置您的头像和昵称</Text>
          </View>

          <View className='profile-form'>
            {/* 头像选择 */}
            <View className='avatar-section'>
              <Button
                className='avatar-btn'
                open-type='chooseAvatar'
                onChooseAvatar={onChooseAvatar}
              >
                {avatarUrl ? (
                  <Image className='avatar-img' src={avatarUrl} mode='aspectFill' />
                ) : (
                  <View className='avatar-placeholder'>
                    <Text className='avatar-icon'>📷</Text>
                    <Text className='avatar-text'>选择头像</Text>
                  </View>
                )}
              </Button>
            </View>

            {/* 昵称输入 */}
            <View className='nickname-section'>
              <Text className='nickname-label'>昵称</Text>
              <Input
                className='nickname-input'
                type='nickname'
                placeholder='请输入昵称'
                value={nickname}
                onInput={onNicknameInput}
                maxlength={20}
              />
            </View>

            {/* 提交按钮 */}
            <Button
              className='submit-btn'
              onClick={handleSubmitProfile}
              disabled={!nickname.trim()}
            >
              <Text className='submit-btn-text'>完成注册</Text>
            </Button>
          </View>
        </View>

        {/* 底部信息 */}
        <View className='login-footer'>
          <Text className='footer-text'>健身打卡 © 2024</Text>
        </View>
      </View>
    )
  }

  // 登录首页
  return (
    <View className='login-page'>
      {/* 背景装饰 */}
      <View className='login-bg'>
        <View className='bg-circle circle-1'></View>
        <View className='bg-circle circle-2'></View>
        <View className='bg-circle circle-3'></View>
      </View>

      {/* 登录内容 */}
      <View className='login-content'>
        {/* Logo区域 */}
        <View className='logo-section'>
          <View className='logo-icon'>🏃</View>
          <Text className='logo-title'>健身打卡</Text>
          <Text className='logo-subtitle'>和朋友一起坚持运动</Text>
        </View>

        {/* 功能介绍 */}
        <View className='features-section'>
          <View className='feature-item'>
            <Text className='feature-icon'>👥</Text>
            <Text className='feature-text'>创建健身圈子</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>🎯</Text>
            <Text className='feature-text'>设定运动目标</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>📸</Text>
            <Text className='feature-text'>每日打卡记录</Text>
          </View>
          <View className='feature-item'>
            <Text className='feature-icon'>🏆</Text>
            <Text className='feature-text'>互相监督鼓励</Text>
          </View>
        </View>

        {/* 登录按钮 */}
        <View className='login-action'>
          <Button
            className='login-btn'
            onClick={handleLogin}
            disabled={!isAgreed}
          >
            <Text className='login-btn-icon'>💬</Text>
            <Text className='login-btn-text'>微信一键登录</Text>
          </Button>

          {/* 协议同意 */}
          <View className='agreement-section' onClick={toggleAgreement}>
            <View className={`checkbox ${isAgreed ? 'checked' : ''}`}>
              {isAgreed && <Text className='checkbox-icon'>✓</Text>}
            </View>
            <Text className='agreement-text'>
              我已阅读并同意
              <Text className='agreement-link' onClick={(e) => { e.stopPropagation(); viewUserAgreement() }}>
                《用户协议》
              </Text>
              和
              <Text className='agreement-link' onClick={(e) => { e.stopPropagation(); viewPrivacyPolicy() }}>
                《隐私政策》
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* 底部信息 */}
      <View className='login-footer'>
        <Text className='footer-text'>健身打卡 © 2024</Text>
      </View>
    </View>
  )
}

export default Login
