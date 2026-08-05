import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { CircleService } from '../../../services/CircleService'
import { CIRCLE_RULES, MEMBER_LIMIT_OPTIONS, SUCCESS_MESSAGES } from '../../../types/constants'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import './create.scss'

/**
 * 创建圈子页面
 */
const CreateCircle = () => {
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [maxMembers, setMaxMembers] = useState<number>(8)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  /**
   * 选择人数档位
   */
  const handleMemberSelect = (value: number) => {
    setMaxMembers(value)
  }

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      Taro.showToast({
        title: '请输入圈子名称',
        icon: 'none'
      })
      return false
    }

    if (name.trim().length < 2 || name.trim().length > 20) {
      Taro.showToast({
        title: '圈子名称为2-20个字符',
        icon: 'none'
      })
      return false
    }

    if (description.length > 100) {
      Taro.showToast({
        title: '圈子简介不能超过100字',
        icon: 'none'
      })
      return false
    }

    return true
  }

  /**
   * 提交创建圈子
   */
  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)

      const result = await CircleService.createCircle({
        name: name.trim(),
        description: description.trim(),
        maxMembers: maxMembers
      })

      if (result.code === 200) {
        Taro.showToast({
          title: SUCCESS_MESSAGES.CIRCLE_CREATED,
          icon: 'success'
        })

        // 跳转到圈子详情页
        const circleId = result.data?.circleId
        setTimeout(() => {
          if (circleId) {
            Taro.redirectTo({
              url: `/pages/circle/detail/detail?circleId=${circleId}`
            })
          } else {
            Taro.switchTab({ url: '/pages/circle/circle' })
          }
        }, 1500)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('创建圈子失败:', error)
      Taro.showToast({
        title: error.message || '创建失败，请重试',
        icon: 'none'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <View className='create-circle-page'>
        <LoadingSpinner text='创建中...' />
      </View>
    )
  }

  return (
    <View className='create-circle-page'>
      {/* 表单区域 */}
      <View className='form-section'>
        {/* 圈子名称 */}
        <View className='form-item'>
          <Text className='form-label'>圈子名称 *</Text>
          <Input
            className='form-input'
            placeholder='请输入圈子名称（2-20个字符）'
            value={name}
            onInput={(e) => setName(e.detail.value)}
            maxlength={20}
          />
        </View>

        {/* 圈子简介 */}
        <View className='form-item'>
          <Text className='form-label'>圈子简介</Text>
          <Input
            className='form-input textarea'
            placeholder='请输入圈子简介（选填，最多100字）'
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={100}
            type='text'
          />
        </View>

        {/* 成员人数限制 */}
        <View className='form-item'>
          <Text className='form-label'>成员人数限制</Text>
          <View className='member-chips'>
            {MEMBER_LIMIT_OPTIONS.map(option => (
              <View
                key={option}
                className={`member-chip ${maxMembers === option ? 'active' : ''}`}
                onClick={() => handleMemberSelect(option)}
              >
                <Text className='member-chip-text'>{option}人</Text>
              </View>
            ))}
          </View>
          <Text className='form-hint'>
            建议设置为2-{CIRCLE_RULES.MAX_MEMBERS}人，成员加入后不可退出
          </Text>
        </View>
      </View>

      {/* 提示信息 */}
      <View className='tips-section'>
        <Text className='tips-title'>温馨提示</Text>
        <View className='tips-list'>
          <Text className='tips-item'>• 圈子创建后，您将成为圈子发起人</Text>
          <Text className='tips-item'>• 发起人需要设定周期计划和运动目标</Text>
          <Text className='tips-item'>• 成员通过邀请码加入圈子，加入后不可退出</Text>
          <Text className='tips-item'>• 每人只能创建或加入一个圈子</Text>
        </View>
      </View>

      {/* 提交按钮 */}
      <View className='submit-section'>
        <View
          className={`submit-btn ${name.trim() ? 'active' : 'disabled'}`}
          onClick={handleSubmit}
        >
          <Text className='submit-btn-text'>创建圈子</Text>
        </View>
      </View>
    </View>
  )
}

export default CreateCircle
