import { useState } from 'react'
import Taro, { useDidShow, usePullDownRefresh, stopPullDownRefresh } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { useUserState } from '../../context/UserContext'
import { CircleService } from '../../services/CircleService'
import { Circle } from '../../types'
import CircleCard from '../../components/circle/CircleCard'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './circle.scss'

/**
 * 圈子列表页面（tabBar页）
 * 显示我加入的所有圈子
 */
const CircleList = () => {
  const { user, isLoggedIn } = useUserState()
  const [circles, setCircles] = useState<Circle[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  /**
   * 加载我的圈子列表
   */
  const loadData = async () => {
    if (!isLoggedIn) {
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      const res = await CircleService.getMyCircles()
      if (res.code === 200) {
        const data = res.data || []
        setCircles(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('加载圈子列表失败:', error)
      setCircles([])
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 页面显示时加载
   */
  useDidShow(() => {
    loadData()
  })

  /**
   * 下拉刷新
   */
  usePullDownRefresh(() => {
    loadData()
    setTimeout(() => {
      stopPullDownRefresh()
    }, 1000)
  })

  /**
   * 跳转到圈子详情
   */
  const goToDetail = (circle: Circle) => {
    Taro.navigateTo({
      url: `/pages/circle/detail/detail?circleId=${circle.circleId}`
    })
  }

  /**
   * 跳转创建圈子
   */
  const goToCreate = () => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/login' })
      return
    }
    Taro.navigateTo({
      url: '/pages/circle/create/create'
    })
  }

  /**
   * 跳转加入圈子
   */
  const goToJoin = () => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: '/pages/login/login' })
      return
    }
    Taro.navigateTo({
      url: '/pages/circle/join/join'
    })
  }

  // 未登录
  if (!isLoggedIn) {
    return (
      <View className='circle-page'>
        <EmptyState
          icon='👥'
          title='登录后查看圈子'
          description='登录后即可创建或加入健身打卡圈子'
          actionText='去登录'
          onAction={() => Taro.navigateTo({ url: '/pages/login/login' })}
        />
      </View>
    )
  }

  // 加载中
  if (isLoading) {
    return (
      <View className='circle-page'>
        <LoadingSpinner text='加载中...' />
      </View>
    )
  }

  return (
    <View className='circle-page'>
      {/* 顶部操作栏 */}
      <View className='circle-toolbar'>
        <View className='toolbar-btn' onClick={goToCreate}>
          <Text className='toolbar-icon'>➕</Text>
          <Text className='toolbar-text'>创建圈子</Text>
        </View>
        <View className='toolbar-btn' onClick={goToJoin}>
          <Text className='toolbar-icon'>🔑</Text>
          <Text className='toolbar-text'>加入圈子</Text>
        </View>
      </View>

      {/* 圈子列表 */}
      <View className='circle-list'>
        <Text className='section-title'>我的圈子</Text>
        {circles.length > 0 ? (
          circles.map(circle => (
            <CircleCard
              key={circle.circleId}
              circle={circle}
              onTap={goToDetail}
              memberCount={0}
            />
          ))
        ) : (
          <EmptyState
            icon='🏃'
            title='还没有加入圈子'
            description='创建或加入一个圈子，开始和朋友一起运动打卡'
          />
        )}
      </View>
    </View>
  )
}

export default CircleList
