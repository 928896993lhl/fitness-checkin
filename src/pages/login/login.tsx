import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button } from '@tarojs/components'
import { useUserDispatch } from '../../context/UserContext'
import { UserService } from '../../services/UserService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './login.scss'

/**
 * 登录页面组件
 * 微信授权登录
 */
const Login = () => {
  const { login } = useUserDispatch()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isAgreed, setIsAgreed] = useState<boolean>(false)

  /**
   * 处理微信登录
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

      // 获取用户信息（需要用户授权）
      let userInfo: any = null
      try {
        const profileRes = await Taro.getUserProfile({
          desc: '用于完善您的个人资料'
        })
        userInfo = profileRes.userInfo
      } catch (profileError) {
        console.log('用户拒绝授权，使用默认信息')
        userInfo = {
          nickname: '健身达人',
          avatarUrl: '',
          gender: 0,
          province: '',
          city: '',
          country: ''
        }
      }

      // 调用登录接口
      const result = await UserService.login({
        code: loginRes.code,
        nickname: userInfo.nickName,
        avatar_url: userInfo.avatarUrl,
        gender: userInfo.gender,
        province: userInfo.province,
        city: userInfo.city,
        country: userInfo.country
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
      url: '/pages/webview/webview?url=https://example.com/agreement'
    })
  }

  /**
   * 查看隐私政策
   */
  const viewPrivacyPolicy = () => {
    Taro.navigateTo({
      url: '/pages/webview/webview?url=https://example.com/privacy'
    })
  }

  // 加载状态
  if (isLoading) {
    return (
      <View className='login-page'>
        <LoadingSpinner text='登录中...' />
      </View>
    )
  }

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
