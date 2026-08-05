import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView, Input, Picker, Image } from '@tarojs/components'
import { CheckinService } from '../../services/CheckinService'
import { CircleService } from '../../services/CircleService'
import { Circle } from '../../types'
import {
  CHECKIN_RULES,
  DURATION_QUICK_OPTIONS,
  EXERCISE_TYPE_CONFIG,
  STORAGE_KEYS
} from '../../types/constants'
import './LooseCheckinPanel.scss'

interface LooseCheckinPanelProps {
  visible: boolean
  onClose: () => void
  defaultPlanId?: string
  defaultCircleId?: string
}

interface CircleOption {
  circleId: string
  name: string
}

/**
 * 宽松打卡半屏面板
 * 底部弹出：运动类型宫格 → 时长快速档位/手动输入 → 可选关联圈子 → 可选照片/备注 → 完成打卡
 */
const LooseCheckinPanel: React.FC<LooseCheckinPanelProps> = ({
  visible,
  onClose,
  defaultPlanId,
  defaultCircleId
}) => {
  const [exerciseType, setExerciseType] = useState<string>('running')
  const [duration, setDuration] = useState<number>(30)
  const [durationInput, setDurationInput] = useState<string>('30')
  const [circleId, setCircleId] = useState<string>('')
  const [circleOptions, setCircleOptions] = useState<CircleOption[]>([])
  const [photoPath, setPhotoPath] = useState<string>('')
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [remark, setRemark] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [todayDuration, setTodayDuration] = useState<number | null>(null)

  /**
   * 面板打开时初始化
   */
  useEffect(() => {
    if (!visible) return

    // 重置状态
    setDuration(30)
    setDurationInput('30')
    setPhotoPath('')
    setPhotoUrl('')
    setRemark('')
    setIsSubmitting(false)
    setTodayDuration(null)

    // 默认运动类型：上次选择
    const lastType = Taro.getStorageSync(STORAGE_KEYS.LAST_EXERCISE_TYPE)
    setExerciseType(lastType || 'running')

    // 加载我的圈子
    loadCircles()
  }, [visible])

  /**
   * 加载可选圈子
   */
  const loadCircles = async () => {
    try {
      const res = await CircleService.getMyCircles()
      if (res.code === 200) {
        const data: any = res.data || []
        const list = (Array.isArray(data) ? data : (data.records || [])) as Circle[]
        const options = list.map((c: Circle) => ({
          circleId: String(c.circleId),
          name: c.name
        }))
        setCircleOptions(options)

        // 预选圈子：defaultCircleId > 上次选择的圈子 > 不选
        let preset = ''
        const lastCircleId = String(Taro.getStorageSync(STORAGE_KEYS.LAST_CIRCLE_ID) || '')
        if (defaultCircleId && options.some(o => o.circleId === String(defaultCircleId))) {
          preset = String(defaultCircleId)
        } else if (lastCircleId && options.some(o => o.circleId === lastCircleId)) {
          preset = lastCircleId
        }
        setCircleId(preset)
      }
    } catch (error) {
      console.error('加载圈子列表失败:', error)
      setCircleOptions([])
    }
  }

  /**
   * 选择运动类型并记忆
   */
  const handleSelectType = (type: string) => {
    setExerciseType(type)
    Taro.setStorageSync(STORAGE_KEYS.LAST_EXERCISE_TYPE, type)
  }

  /**
   * 快速档位选择
   */
  const handleQuickDuration = (value: number) => {
    setDuration(value)
    setDurationInput(String(value))
  }

  /**
   * 手动输入时长
   */
  const handleDurationInput = (e: any) => {
    const value = e.detail.value
    setDurationInput(value)
    const num = parseInt(value, 10)
    if (!isNaN(num)) {
      setDuration(num)
    }
  }

  /**
   * 选择关联圈子并记忆
   */
  const handleCircleChange = (e: any) => {
    const selected = circleOptions[e.detail.value]
    if (selected) {
      setCircleId(selected.circleId)
      Taro.setStorageSync(STORAGE_KEYS.LAST_CIRCLE_ID, selected.circleId)
    }
  }

  /**
   * 选择照片
   */
  const handleChoosePhoto = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
      if (res.tempFilePaths.length > 0) {
        const tempPath = res.tempFilePaths[0]
        const fileInfo = await Taro.getFileInfo({ filePath: tempPath })
        if (fileInfo.size > CHECKIN_RULES.MAX_PHOTO_SIZE) {
          Taro.showToast({
            title: '图片大小超过限制',
            icon: 'none'
          })
          return
        }
        setPhotoPath(tempPath)
        setPhotoUrl('')
      }
    } catch (error) {
      console.error('选择照片失败:', error)
    }
  }

  /**
   * 删除照片
   */
  const handleRemovePhoto = () => {
    setPhotoPath('')
    setPhotoUrl('')
  }

  /**
   * 校验时长
   */
  const validateDuration = (): boolean => {
    if (!duration || duration < CHECKIN_RULES.MIN_DURATION || duration > CHECKIN_RULES.MAX_DURATION) {
      Taro.showToast({
        title: `打卡时长需在${CHECKIN_RULES.MIN_DURATION}-${CHECKIN_RULES.MAX_DURATION}分钟之间`,
        icon: 'none'
      })
      return false
    }
    return true
  }

  /**
   * 提交打卡
   */
  const handleSubmit = async () => {
    if (!validateDuration() || isSubmitting) return

    try {
      setIsSubmitting(true)

      // 上传照片（如果有）
      let finalPhotoUrl = photoUrl
      if (photoPath && !photoUrl) {
        Taro.showLoading({ title: '上传照片中...' })
        const uploadRes = await CheckinService.uploadPhoto(photoPath)
        Taro.hideLoading()
        if (uploadRes.code === 200) {
          finalPhotoUrl = uploadRes.data.url
          setPhotoUrl(finalPhotoUrl)
        } else {
          throw new Error('照片上传失败')
        }
      }

      // 宽松打卡：planId/circleId 为空时必须省略/传 null，禁止传空字符串（后端 Long 空串 400）
      const finalPlanId = defaultPlanId && String(defaultPlanId).trim() !== '' ? String(defaultPlanId) : undefined
      const finalCircleId = circleId && String(circleId).trim() !== '' ? circleId : undefined

      const result = await CheckinService.createCheckin({
        planId: finalPlanId,
        circleId: finalCircleId,
        exerciseType,
        duration,
        ...(finalPhotoUrl ? { photoUrl: finalPhotoUrl } : {}),
        ...(remark.trim() ? { remark: remark.trim() } : {})
      })

      if (result.code === 200) {
        Taro.showToast({
          title: '打卡成功',
          icon: 'success'
        })

        // 获取今日累计并展示结果摘要
        try {
          const statsRes = await CheckinService.getUserStats()
          if (statsRes.code === 200) {
            setTodayDuration(statsRes.data?.todayDuration || 0)
          }
        } catch (statsError) {
          console.error('获取今日统计失败:', statsError)
        }

        // 1.5s 后收起面板并刷新页面
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('打卡失败:', error)
      Taro.showToast({
        title: error.message || '打卡失败，请重试',
        icon: 'none'
      })
      setIsSubmitting(false)
    }
  }

  if (!visible) return null

  const exerciseTypes = Object.entries(EXERCISE_TYPE_CONFIG).map(([key, config]) => ({
    value: key,
    name: config.name,
    icon: config.icon
  }))

  const currentCircleIndex = circleOptions.findIndex(o => o.circleId === circleId)

  return (
    <View className='loose-panel-mask' catchMove onClick={onClose}>
      <View
        className='loose-panel'
        catchMove
        onClick={(e: any) => e.stopPropagation()}
      >
        {/* 面板头部 */}
        <View className='panel-header'>
          <View className='panel-grabber'></View>
          <Text className='panel-title'>宽松打卡</Text>
          <View className='panel-close' onClick={onClose}>
            <Text className='close-icon'>×</Text>
          </View>
        </View>

        <ScrollView
          className='panel-body'
          scrollY
          enhanced
          showScrollbar={false}
        >
          {/* 运动类型宫格 */}
          <View className='form-section'>
            <Text className='section-title'>运动类型</Text>
            <View className='type-grid'>
              {exerciseTypes.map(type => (
                <View
                  key={type.value}
                  className={`type-item ${exerciseType === type.value ? 'active' : ''}`}
                  onClick={() => handleSelectType(type.value)}
                >
                  <Text className='type-icon'>{type.icon}</Text>
                  <Text className='type-name'>{type.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 时长选择 */}
          <View className='form-section'>
            <Text className='section-title'>运动时长（分钟）</Text>
            <View className='quick-options'>
              {DURATION_QUICK_OPTIONS.map(option => (
                <View
                  key={option}
                  className={`quick-option ${duration === option ? 'active' : ''}`}
                  onClick={() => handleQuickDuration(option)}
                >
                  <Text className='quick-option-text'>{option}</Text>
                </View>
              ))}
            </View>
            <View className='duration-input-wrapper'>
              <Input
                className='duration-input'
                type='number'
                value={durationInput}
                onInput={handleDurationInput}
                placeholder='手动输入 1-480'
                maxlength={3}
              />
              <Text className='duration-unit'>分钟</Text>
            </View>
            <Text className='form-hint'>支持 1-{CHECKIN_RULES.MAX_DURATION} 分钟</Text>
          </View>

          {/* 关联圈子（可选） */}
          {circleOptions.length > 0 && (
            <View className='form-section'>
              <Text className='section-title'>关联圈子（选填）</Text>
              <Picker
                mode='selector'
                range={circleOptions.map(o => o.name)}
                value={currentCircleIndex >= 0 ? currentCircleIndex : 0}
                onChange={handleCircleChange}
              >
                <View className='picker-input'>
                  <Text className='picker-text'>
                    {circleId ? (circleOptions[currentCircleIndex]?.name || '选择圈子') : '不关联圈子'}
                  </Text>
                  <Text className='picker-arrow'>›</Text>
                </View>
              </Picker>
            </View>
          )}

          {/* 照片（可选） */}
          <View className='form-section'>
            <Text className='section-title'>运动照片（选填）</Text>
            {photoPath ? (
              <View className='photo-preview'>
                <Image className='photo-image' src={photoPath} mode='aspectFill' />
                <View className='photo-remove' onClick={handleRemovePhoto}>
                  <Text className='remove-icon'>×</Text>
                </View>
              </View>
            ) : (
              <View className='photo-upload' onClick={handleChoosePhoto}>
                <Text className='upload-icon'>📷</Text>
                <Text className='upload-text'>添加照片</Text>
              </View>
            )}
          </View>

          {/* 备注（可选） */}
          <View className='form-section'>
            <Text className='section-title'>备注（选填）</Text>
            <Input
              className='remark-input'
              placeholder='记录今天的运动感受...'
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
              maxlength={200}
              type='text'
            />
          </View>
        </ScrollView>

        {/* 底部提交区 */}
        <View className='panel-footer'>
          {todayDuration !== null && (
            <Text className='result-summary'>
              今日累计运动 {todayDuration} 分钟
            </Text>
          )}
          <View
            className={`submit-btn ${isSubmitting ? 'disabled' : 'active'}`}
            onClick={handleSubmit}
          >
            <Text className='submit-btn-text'>
              {isSubmitting ? '提交中...' : '完成打卡'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default LooseCheckinPanel
