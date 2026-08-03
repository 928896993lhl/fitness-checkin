import { useState } from 'react'
import Taro, { useRouter, chooseImage, showToast } from '@tarojs/taro'
import { View, Text, Input, Picker, Image } from '@tarojs/components'
import { CheckinService } from '../../services/CheckinService'
import { CHECKIN_RULES, EXERCISE_TYPE_CONFIG, SUCCESS_MESSAGES } from '../../types/constants'
import { ExerciseType } from '../../types'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './checkin.scss'

/**
 * 打卡页面
 */
const Checkin = () => {
  const router = useRouter()
  const planId = router.params.planId || ''

  const [duration, setDuration] = useState<number>(30)
  const [exerciseType, setExerciseType] = useState<ExerciseType | string>(ExerciseType.RUNNING)
  const [photoPath, setPhotoPath] = useState<string>('')
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // 时长选项
  const durationOptions = Array.from(
    { length: Math.floor((CHECKIN_RULES.MAX_DURATION - CHECKIN_RULES.MIN_DURATION) / 5) + 1 },
    (_, i) => CHECKIN_RULES.MIN_DURATION + i * 5
  )

  // 运动类型列表
  const exerciseTypes = Object.entries(EXERCISE_TYPE_CONFIG).map(([key, config]) => ({
    value: key,
    label: config.name,
    icon: config.icon
  }))

  /**
   * 选择照片
   */
  const handleChoosePhoto = async () => {
    try {
      const res = await chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths.length > 0) {
        const tempPath = res.tempFilePaths[0]
        
        // 检查文件大小
        const fileInfo = await Taro.getFileInfo({ filePath: tempPath })
        if (fileInfo.size > CHECKIN_RULES.MAX_PHOTO_SIZE) {
          showToast({
            title: '图片大小超过限制',
            icon: 'none'
          })
          return
        }

        setPhotoPath(tempPath)
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
   * 时长选择
   */
  const handleDurationChange = (e: any) => {
    setDuration(durationOptions[e.detail.value])
  }

  /**
   * 运动类型选择
   */
  const handleExerciseTypeChange = (e: any) => {
    setExerciseType(exerciseTypes[e.detail.value].value)
  }

  /**
   * 验证表单
   */
  const validateForm = (): boolean => {
    if (!planId) {
      showToast({ title: '计划ID无效', icon: 'none' })
      return false
    }

    if (duration < CHECKIN_RULES.MIN_DURATION) {
      showToast({
        title: `打卡时长不能少于${CHECKIN_RULES.MIN_DURATION}分钟`,
        icon: 'none'
      })
      return false
    }

    if (duration > CHECKIN_RULES.MAX_DURATION) {
      showToast({
        title: `打卡时长不能超过${CHECKIN_RULES.MAX_DURATION}分钟`,
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
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      // 上传照片（如果有）
      let finalPhotoUrl = photoUrl
      if (photoPath && !photoUrl) {
        showToast({ title: '上传照片中...', icon: 'loading', duration: 10000 })
        const uploadRes = await CheckinService.uploadPhoto(photoPath)
        if (uploadRes.code === 0) {
          finalPhotoUrl = uploadRes.data.tempFileURL
          setPhotoUrl(finalPhotoUrl)
        } else {
          throw new Error('照片上传失败')
        }
        Taro.hideToast()
      }

      // 创建打卡记录
      const result = await CheckinService.createCheckin({
        plan_id: planId,
        duration,
        exercise_type: exerciseType,
        photo_url: finalPhotoUrl,
        note: note.trim()
      })

      if (result.code === 0) {
        showToast({
          title: SUCCESS_MESSAGES.CHECKIN_SUCCESS,
          icon: 'success'
        })

        // 返回上一页
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('打卡失败:', error)
      showToast({
        title: error.message || '打卡失败，请重试',
        icon: 'none'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 获取运动类型配置
   */
  const getExerciseConfig = (type: string) => {
    return EXERCISE_TYPE_CONFIG[type] || EXERCISE_TYPE_CONFIG.other
  }

  // 提交中状态
  if (isSubmitting) {
    return (
      <View className='checkin-page'>
        <LoadingSpinner text='提交中...' />
      </View>
    )
  }

  return (
    <View className='checkin-page'>
      {/* 运动时长 */}
      <View className='form-section'>
        <Text className='section-title'>运动时长</Text>
        <View className='duration-selector'>
          <Picker
            mode='selector'
            range={durationOptions.map(d => `${d}分钟`)}
            value={durationOptions.indexOf(duration)}
            onChange={handleDurationChange}
          >
            <View className='duration-display'>
              <Text className='duration-number'>{duration}</Text>
              <Text className='duration-unit'>分钟</Text>
            </View>
          </Picker>
          <Text className='duration-hint'>
            每次打卡最少{CHECKIN_RULES.MIN_DURATION}分钟，最多{CHECKIN_RULES.MAX_DURATION}分钟
          </Text>
        </View>
      </View>

      {/* 运动类型 */}
      <View className='form-section'>
        <Text className='section-title'>运动类型</Text>
        <View className='exercise-types'>
          {exerciseTypes.map(type => (
            <View
              key={type.value}
              className={`type-item ${exerciseType === type.value ? 'active' : ''}`}
              onClick={() => setExerciseType(type.value)}
            >
              <Text className='type-icon'>{type.icon}</Text>
              <Text className='type-label'>{type.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 运动照片 */}
      <View className='form-section'>
        <Text className='section-title'>运动照片（选填）</Text>
        <View className='photo-section'>
          {photoPath ? (
            <View className='photo-preview'>
              <Image
                className='photo-image'
                src={photoPath}
                mode='aspectFill'
              />
              <View className='photo-remove' onClick={handleRemovePhoto}>
                <Text className='remove-icon'>×</Text>
              </View>
            </View>
          ) : (
            <View className='photo-upload' onClick={handleChoosePhoto}>
              <Text className='upload-icon'>📷</Text>
              <Text className='upload-text'>添加照片</Text>
              <Text className='upload-hint'>记录运动瞬间</Text>
            </View>
          )}
        </View>
      </View>

      {/* 备注 */}
      <View className='form-section'>
        <Text className='section-title'>备注（选填）</Text>
        <Input
          className='note-input'
          placeholder='记录今天的运动感受...'
          value={note}
          onInput={(e) => setNote(e.detail.value)}
          maxlength={200}
          type='text'
        />
      </View>

      {/* 提交按钮 */}
      <View className='submit-section'>
        <View
          className={`submit-btn ${duration >= CHECKIN_RULES.MIN_DURATION ? 'active' : 'disabled'}`}
          onClick={handleSubmit}
        >
          <Text className='submit-btn-text'>完成打卡</Text>
        </View>
      </View>
    </View>
  )
}

export default Checkin
