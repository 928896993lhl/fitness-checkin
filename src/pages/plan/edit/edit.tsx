import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, Picker } from '@tarojs/components'
import { PlanService } from '../../../services/PlanService'
import { Plan, UpdatePlanRequest } from '../../../types'
import { PLAN_RULES } from '../../../types/constants'
import { formatDate, calculateDaysDiff } from '../../../utils/dateUtils'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import './edit.scss'

/**
 * 编辑计划页面
 * 预填当前计划数据（GET /plans/{id}）→ 修改部分字段 → PUT /plans/{id} → 返回
 * 仅圈子管理员且仅 status=0 的计划可编辑（后端校验，前端兜底拦截）
 */
const EditPlan = () => {
  const router = useRouter()
  const planId = router.params.planId || ''

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [plan, setPlan] = useState<Plan | null>(null)

  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [durationDays, setDurationDays] = useState<number>(7)
  const [totalDurationGoal, setTotalDurationGoal] = useState<number>(300)
  const [dailyDurationGoal, setDailyDurationGoal] = useState<number>(30)
  const [minDurationPerCheckin, setMinDurationPerCheckin] = useState<number>(10)

  // 选项（与创建页一致）
  const durationOptions = [3, 5, 7, 14, 21, 30]
  const goalOptions = [15, 20, 30, 45, 60, 90, 120]
  const totalGoalOptions = [100, 200, 300, 500, 700, 1000, 1500, 2000]
  const minDurationOptions = [5, 10, 15, 20, 30]

  /**
   * 归一化日期（兼容 "2026-08-06" 与 ISO）
   */
  const normalizeDate = (date: string): string => {
    if (!date) return formatDate(new Date(), 'YYYY-MM-DD')
    return date.slice(0, 10)
  }

  /**
   * 加载计划详情并预填表单
   */
  const loadPlan = async () => {
    if (!planId) {
      Taro.showToast({ title: '计划ID无效', icon: 'none' })
      setIsLoading(false)
      return
    }

    try {
      const res = await PlanService.getPlanDetail(planId)
      if (res.code === 200 && res.data) {
        const data: any = res.data
        setPlan(data as Plan)

        // 非待启动计划禁止编辑（后端也会校验，此处提前提示）
        if (Number(data.status) !== 0) {
          Taro.showModal({
            title: '无法编辑',
            content: '仅未开始的计划可以修改',
            showCancel: false,
            success: () => Taro.navigateBack()
          })
          setIsLoading(false)
          return
        }

        const normalizedStart = normalizeDate(data.startDate)
        const normalizedEnd = normalizeDate(data.endDate)
        setName(data.name || '')
        setDescription(data.description || '')
        setStartDate(normalizedStart)
        // 计划天数含首尾：endDate = startDate + durationDays - 1
        setDurationDays(Math.max(calculateDaysDiff(normalizedStart, normalizedEnd) + 1, 1))
        setTotalDurationGoal(Number(data.totalDurationGoal) || 0)
        setDailyDurationGoal(Number(data.dailyDurationGoal) || 30)
        setMinDurationPerCheckin(Number(data.minDurationPerCheckin) || 10)
      } else {
        throw new Error(res.message || '计划不存在')
      }
    } catch (error) {
      console.error('加载计划详情失败:', error)
      Taro.showToast({ title: error.message || '加载失败', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1200)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlan()
  }, [planId])

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
      Taro.showToast({ title: `计划时长为${PLAN_RULES.MIN_DURATION_DAYS}-${PLAN_RULES.MAX_DURATION_DAYS}天`, icon: 'none' })
      return false
    }
    if (totalDurationGoal <= 0 || dailyDurationGoal <= 0) {
      Taro.showToast({ title: '运动目标必须大于0', icon: 'none' })
      return false
    }
    return true
  }

  /**
   * 提交更新计划（部分字段，仅提交有变更的字段）
   */
  const handleSubmit = async () => {
    if (!validateForm() || !plan || isSaving) return

    const payload: UpdatePlanRequest = {}
    if (name.trim() !== (plan.name || '')) payload.name = name.trim()
    if (description.trim() !== (plan.description || '')) payload.description = description.trim()
    if (startDate !== normalizeDate(plan.startDate)) payload.startDate = startDate
    const endDate = getEndDate()
    if (endDate !== normalizeDate(plan.endDate)) payload.endDate = endDate
    if (totalDurationGoal !== Number(plan.totalDurationGoal)) payload.totalDurationGoal = totalDurationGoal
    if (dailyDurationGoal !== Number(plan.dailyDurationGoal)) payload.dailyDurationGoal = dailyDurationGoal
    if (minDurationPerCheckin !== Number(plan.minDurationPerCheckin)) payload.minDurationPerCheckin = minDurationPerCheckin

    // 无变更直接返回
    if (Object.keys(payload).length === 0) {
      Taro.showToast({ title: '没有需要修改的内容', icon: 'none' })
      return
    }

    try {
      setIsSaving(true)
      const result = await PlanService.updatePlan(planId, payload)
      if (result.code === 200) {
        Taro.showToast({ title: '计划已更新', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1200)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('更新计划失败:', error)
      Taro.showToast({ title: error.message || '更新失败，请重试', icon: 'none' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartDateChange = (e: any) => setStartDate(e.detail.value)
  const handleDurationChange = (e: any) => setDurationDays(durationOptions[e.detail.value])
  const handleDailyGoalChange = (e: any) => setDailyDurationGoal(goalOptions[e.detail.value])
  const handleTotalGoalChange = (e: any) => setTotalDurationGoal(totalGoalOptions[e.detail.value])
  const handleMinDurationChange = (e: any) => setMinDurationPerCheckin(minDurationOptions[e.detail.value])

  if (isLoading) {
    return (
      <View className='edit-plan-page'>
        <LoadingSpinner text='加载中...' />
      </View>
    )
  }

  return (
    <View className='edit-plan-page'>
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
            value={Math.max(durationOptions.indexOf(durationDays), 0)}
            onChange={handleDurationChange}
          >
            <View className='picker-input'>
              <Text className='picker-text'>{durationDays}天</Text>
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
          <Text className='form-hint'>结束日期：{getEndDate()}</Text>
        </View>
      </View>

      {/* 目标设置 */}
      <View className='form-section'>
        <Text className='section-title'>运动目标设置</Text>

        <View className='form-item'>
          <Text className='form-label'>每日运动目标</Text>
          <Picker
            mode='selector'
            range={goalOptions.map(g => `${g}分钟`)}
            value={Math.max(goalOptions.indexOf(dailyDurationGoal), 0)}
            onChange={handleDailyGoalChange}
          >
            <View className='picker-input'>
              <Text className='picker-text'>{dailyDurationGoal}分钟/天</Text>
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </View>

        <View className='form-item'>
          <Text className='form-label'>总运动目标</Text>
          <Picker
            mode='selector'
            range={totalGoalOptions.map(g => `${g}分钟`)}
            value={Math.max(totalGoalOptions.indexOf(totalDurationGoal), 0)}
            onChange={handleTotalGoalChange}
          >
            <View className='picker-input'>
              <Text className='picker-text'>{totalDurationGoal}分钟</Text>
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </View>

        <View className='form-item'>
          <Text className='form-label'>每次打卡最低时长</Text>
          <Picker
            mode='selector'
            range={minDurationOptions.map(m => `${m}分钟`)}
            value={Math.max(minDurationOptions.indexOf(minDurationPerCheckin), 0)}
            onChange={handleMinDurationChange}
          >
            <View className='picker-input'>
              <Text className='picker-text'>{minDurationPerCheckin}分钟</Text>
              <Text className='picker-arrow'>›</Text>
            </View>
          </Picker>
        </View>
      </View>

      {/* 提示 */}
      <View className='tips-section'>
        <Text className='tips-text'>仅未开始的计划可修改；圈子不可变更；修改后需重新启动计划。</Text>
      </View>

      {/* 提交按钮 */}
      <View className='submit-section'>
        <View
          className={`submit-btn ${name.trim() ? 'active' : 'disabled'}`}
          onClick={handleSubmit}
        >
          <Text className='submit-btn-text'>{isSaving ? '保存中...' : '保存修改'}</Text>
        </View>
      </View>
    </View>
  )
}

export default EditPlan
