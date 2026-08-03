import { Component, PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { UserProvider } from './context/UserContext'
import { CircleProvider } from './context/CircleContext'
import { PlanProvider } from './context/PlanContext'
import Taro from '@tarojs/taro'
import './app.scss'

/**
 * 应用根组件
 * 提供全局状态管理的Context嵌套
 */
function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('App launched.')
    
    // 检查登录状态
    checkLoginStatus()
  })

  /**
   * 检查用户登录状态
   * 如果未登录则跳转到登录页
   */
  const checkLoginStatus = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const userInfo = Taro.getStorageSync('userInfo')
      
      if (!token || !userInfo) {
        // 首次使用，跳转登录页
        // 注意：不在launch中跳转，让用户自己选择
        console.log('用户未登录，等待用户操作')
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
    }
  }

  return (
    <UserProvider>
      <CircleProvider>
        <PlanProvider>
          {children}
        </PlanProvider>
      </CircleProvider>
    </UserProvider>
  )
}

export default App
