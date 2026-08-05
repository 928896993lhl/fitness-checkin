import { useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, Picker } from '@tarojs/components'
import { PlanService } from '../../../services/PlanService'
import { PLAN_RULES, SUCCESS_MESSAGES } from '../../../types/constants'
import { formatDate } from '../../../utils/dateUtils'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import './create.scss'

/**
 * 创建计划页面
 */
const CreatePlan = () => {
  const router = useRouter()
  const circleId = router.params.circleId || ''

  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(formatDate(new Date(), 'YYYY-MM-DD'))
  const [durationDays, setDurationDays] = useState<number>(7)
  const [totalDurationGoal, setTotalDurationGoal] = useState<number>(300)
  const [dailyDurationGoal, setDurationGoal] = useState<number>(30)
  const [minDurationPerCheckin, setMinDurationPerCheckin] = useState<number>(10)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // 时长选项
  const durationOptions = [3, 5, 7, 14, 21, 30]
  const goalOptions = [15, 20, 30, 45, 60, 90, 120]
  const totalGoalOptions = [100, 200, 300, 500, 700, 1000, 1500, 2000]
  const minDurationOptions = [5, 10, 15, 20, 30]

  /**
   * 计算结束日期
   */
  const getEndDate = (): string => {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + durationDays - 1)
    return formatDate(end, 'YYYY-MM-DD')
  }

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入计划名称', icon: 'none' })
      return false
    }

    if (name.trim().length < 2 || name.trim().length > 20) {
      Taro.showToast({ title: '计划名称为2-20个字符', icon: 'none' })
      return false
    }

    if (durationDays < PLAN_RULES.MIN_DURATION_DAYS || durationDays > PLAN_RULES.MAX_DURATION_DAYS) {
      Taro.showToast({
        title: `计划时长为${PLAN_RULES.MIN_DURATION_DAYS}-${PLAN_RULES.MAX_DURATION_DAYS}天`,
        icon: 'none'
      })
      return false
    }

    if (totalDurationGoal <= 0 || dailyDurationGoal <= 0) {
      Taro.showToast({ title: '运动目标必须大于0', icon: 'none' })
      return false
    }

    return true
  }

  /**
   * 提交创建计划
   */
  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsLoading(true)

      const result = await PlanService.createPlan({
        circle_id: circleId,
        name: name.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: getEndDate(),
        total_duration_goal: totalDurationGoal,
        daily_duration_goal: dailyDurationGoal,
        circle_total_goal: totalDurationGoal * 2, // 圈子总目标为个人目标的2倍
        min_duration_per_checkin: minDurationPerCheckin
      })

      if (result.code === 200) {
        Taro.showToast({
          title: SUCCESS_MESSAGES.PLAN_CREATED,
          icon: 'success'
        })

        // 返回圈子详情页
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('创建计划失败:', error)
      Taro.showToast({
        title: error.message || '创建失败，请重试',
        icon: 'none'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 开始日期选择
   */
  const handleStartDateChange = (e: any) => {
    setStartDate(e.detail.value)
  }

  /**
   * 时长选择
   */
  const handleDurationChange = (e: any) => {
    setDurationDays(durationOptions[e.detail.value])
  }

  /**
   * 每日目标选择
   */
  const handleDailyGoalChange = (e: any) => {
    setDurationGoal(goalOptions[e.detail.value])
  }

  /**
   * 总目标选择
   */
  const handleTotalGoalChange = (e: any) => {
    setTotalDurationGoal(totalGoalOptions[e.detail.value])
  }

  /**
   * 最低打卡时长选择
   */
  const handleMinDurationChange = (e: any) => {
    setMinDurationPerCheckin(minDurationOptions[e.detail.value])
  }

  // 加载状态
  if (isLoading) {
    return (
      <View className='create-plan-page'>
        <LoadingSpinner text='创建中...' />
      </View>
    )
  }

  return (
    <View className='create-plan-page'>
      {/* 表单区域 */}
      <View className='form-section'>
        {/* 计划名称 */}
        <View className='form-item'>
          <Text className='form-label'>计划名称 *</Text>
          <Input
            className='form-input'
            placeholder='例如：一周健身挑战'
            value={name}
            onInput={(e) => setName(e.detail.value)}
            maxlength={20}
          />
        </View>

        {/* 计划描述 */}
        <View className='form-item'>
          <Text className='form-label'>计划描述</Text>
          <Input
            className='form-input textarea'
            placeholder='请输入计划描述（选填）'
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={100}
            type='text'
          />
        </View>

        {/* 开始日期 */}
        <View className='form-item'>
          <Text className='form-label'>开始日期</Text>
          <Picker
            mode='date'
            start={formatDate(new Date(), 'YYYY-MM-DD')}
            value={startDate}
            onChange={handleStartDateChange}
          >
            <View className='picker-input'>
              <Text className='picker-text'>{startDate}</Text>
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </View>

        {/* 计划时长 */}
        <View className='form-item'>
          <Text className='form-label'>计划时长</Text>
          <Picker
            mode='selector'
            range={durationOptions.map(d => `${d}天`)}
            value={durationOptions.indexOf(durationDays)}
            onChange={handleDurationChange}
          >
            <View className='picker-input'>
              <Text className='picker-text'>{durationDays}天</Text>
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
          <Text className='form-hint'>
            结束日期：{getEndDate()}
          </Text>
        </View>
      </View>

      {/* 目标设置 */}
      <View className='form-section'>
        <Text className='section-title'>运动目标设置</Text>

        {/* 每日运动目标 */}
        <View className='form-item'>
          <Text className='form-label'>每日运动目标</Text>
          <Picker
            mode='selector'
            range={goalOptions.map(g => `${g}分钟`)}
            value={goalOptions.indexOf(dailyDurationGoal)}
            onChange={handleDailyGoalChange}
          >
            <View className='picker-input'>
              <Text className='picker-text'>{dailyDurationGoal}分钟/天</Text>
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </View>

        {/* 总运动目标 */}
        <View className='form-item'>
          <Text className='form-label'>总运动目标</Text>
          <Picker
            mode='selector'
            range={totalGoalOptions.map(g => `${g}分钟`)}
            value={totalGoalOptions.indexOf(totalDurationGoal)}
            onChange={handleTotalGoalChange}
          >
            <View className='picker-input'>
              <Text className='picker-text'>{totalDurationGoal}分钟</Text>
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
          <Text className='form-hint'>
            建议设置为每日目标 × 计划天数的1.5-2倍
          </Text>
        </View>

        {/* 每次打卡最低时长 */}
        <View className='form-item'>
          <Text className='form-label'>每次打卡最低时长</Text>
          <Picker
            mode='selector'
            range={minDurationOptions.map(m => `${m}分钟`)}
            value={minDurationOptions.indexOf(minDurationPerCheckin)}
            onChange={handleMinDurationChange}
          >
            <View className='picker-input'>
              <Text className='picker-text'>{minDurationPerCheckin}分钟</Text>
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </View>
      </View>

      {/* 目标预览 */}
      <View className='preview-section'>
        <Text className='section-title'>计划预览</Text>
        <View className='preview-card'>
          <View className='preview-item'>
            <Text className='preview-label'>计划名称</Text>
            <Text className='preview-value'>{name || '未填写'}</Text>
          </View>
          <View className='preview-item'>
            <Text className='preview-label'>计划周期</Text>
            <Text className='preview-value'>{startDate} 至 {getEndDate()}</Text>
          </View>
          <View className='preview-item'>
            <Text className='preview-label'>每日目标</Text>
            <Text className='preview-value'>{dailyDurationGoal}分钟</Text>
          </View>
          <View className='preview-item'>
            <Text className='preview-label'>总目标</Text>
            <Text className='preview-value'>{totalDurationGoal}分钟</Text>
          </View>
          <View className='preview-item'>
            <Text className='preview-label'>最低打卡时长</Text>
            <Text className='preview-value'>{minDurationPerCheckin}分钟</Text>
          </View>
        </View>
      </View>

      {/* 提交按钮 */}
      <View className='submit-section'>
        <View
          className={`submit-btn ${name.trim() ? 'active' : 'disabled'}`}
          onClick={handleSubmit}
        >
          <Text className='submit-btn-text'>创建计划</Text>
        </View>
      </View>
    </View>
  )
}

export default CreatePlan
