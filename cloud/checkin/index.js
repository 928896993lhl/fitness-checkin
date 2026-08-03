// 云函数入口文件 - 打卡相关服务
const cloud = require('wx-server-sdk')
const { DB_COLLECTIONS, ErrorCode, CHECKIN_RULES } = require('../utils/constants')
const { formatDate, isSameDay } = require('../utils/helpers')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 打卡云函数
 * 处理打卡记录创建、查询、统计等操作
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, data } = event

  try {
    switch (action) {
      case 'createCheckin':
        return await handleCreateCheckin(OPENID, data)
      case 'getMyCheckins':
        return await handleGetMyCheckins(OPENID, data)
      case 'getCheckinsByPlan':
        return await handleGetCheckinsByPlan(data.planId, data)
      case 'getCheckinsByUser':
        return await handleGetCheckinsByUser(data.userId, data)
      case 'getTodayCheckins':
        return await handleGetTodayCheckins(OPENID, data)
      case 'getUserStats':
        return await handleGetUserStats(OPENID)
      case 'getCircleStats':
        return await handleGetCircleStats(data.circleId)
      case 'uploadPhoto':
        return await handleUploadPhoto(OPENID, data)
      default:
        return {
          code: ErrorCode.PARAM_ERROR,
          data: null,
          message: `未知操作: ${action}`
        }
    }
  } catch (error) {
    console.error(`打卡云函数错误 [${action}]:`, error)
    return {
      code: ErrorCode.CLOUD_ERROR,
      data: null,
      message: error.message || '服务器内部错误'
    }
  }
}

/**
 * 创建打卡记录
 */
async function handleCreateCheckin(openid, data) {
  const {
    plan_id,
    duration,
    exercise_type,
    photo_temp_path,
    photo_url,
    note
  } = data

  // 参数验证
  if (!plan_id || !duration || !exercise_type) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '缺少必要参数'
    }
  }

  if (duration < CHECKIN_RULES.MIN_DURATION) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: `打卡时长不能少于${CHECKIN_RULES.MIN_DURATION}分钟`
    }
  }

  if (duration > CHECKIN_RULES.MAX_DURATION) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: `打卡时长不能超过${CHECKIN_RULES.MAX_DURATION}分钟`
    }
  }

  // 获取用户信息
  const userQuery = await db.collection(DB_COLLECTIONS.USERS)
    .where({ openid })
    .get()

  if (userQuery.data.length === 0) {
    return {
      code: ErrorCode.AUTH_ERROR,
      data: null,
      message: '用户不存在'
    }
  }

  const userId = userQuery.data[0]._id

  // 验证计划存在且进行中
  const planDoc = await db.collection(DB_COLLECTIONS.PLANS)
    .doc(plan_id)
    .get()
    .catch(() => null)

  if (!planDoc) {
    return {
      code: ErrorCode.NOT_FOUND,
      data: null,
      message: '计划不存在'
    }
  }

  const plan = planDoc.data

  if (plan.status !== 'active') {
    return {
      code: ErrorCode.PERMISSION_DENIED,
      data: null,
      message: '该计划未在进行中'
    }
  }

  // 验证用户是否是圈子成员
  const memberRecord = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
    .where({
      circle_id: plan.circle_id,
      user_id: userId
    })
    .get()

  if (memberRecord.data.length === 0) {
    return {
      code: ErrorCode.PERMISSION_DENIED,
      data: null,
      message: '您不是该圈子成员'
    }
  }

  // 上传照片（如果有）
  let finalPhotoUrl = photo_url || ''
  let photoFileId = ''

  if (photo_temp_path) {
    try {
      const uploadResult = await uploadPhoto(photo_temp_path, userId, plan_id)
      finalPhotoUrl = uploadResult.tempFileURL
      photoFileId = uploadResult.fileID
    } catch (uploadError) {
      console.error('照片上传失败:', uploadError)
      return {
        code: ErrorCode.CLOUD_ERROR,
        data: null,
        message: '照片上传失败，请重试'
      }
    }
  }

  // 创建打卡记录
  const checkinData = {
    plan_id,
    user_id: userId,
    duration: Number(duration),
    exercise_type: exercise_type,
    photo_url: finalPhotoUrl,
    photo_file_id: photoFileId,
    note: note || '',
    checkin_time: db.serverDate(),
    created_at: db.serverDate()
  }

  const createResult = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
    .add({
      data: checkinData
    })

  checkinData._id = createResult._id

  return {
    code: ErrorCode.SUCCESS,
    data: checkinData,
    message: '打卡成功'
  }
}

/**
 * 上传照片到云存储
 */
async function uploadPhoto(tempFilePath, userId, planId) {
  const timestamp = Date.now()
  const cloudPath = `checkin-photos/${userId}/${planId}/${timestamp}.jpg`

  const uploadResult = await cloud.uploadFile({
    cloudPath,
    filePath: tempFilePath
  })

  // 获取临时访问链接
  const tempUrlResult = await cloud.getTempFileURL({
    fileList: [uploadResult.fileID]
  })

  return {
    fileID: uploadResult.fileID,
    tempFileURL: tempUrlResult.fileList[0].tempFileURL
  }
}

/**
 * 获取我的打卡记录
 */
async function handleGetMyCheckins(openid, data = {}) {
  const { plan_id, start_date, end_date, page = 1, page_size = 20 } = data

  // 获取用户信息
  const userQuery = await db.collection(DB_COLLECTIONS.USERS)
    .where({ openid })
    .get()

  if (userQuery.data.length === 0) {
    return {
      code: ErrorCode.AUTH_ERROR,
      data: null,
      message: '用户不存在'
    }
  }

  const userId = userQuery.data[0]._id
  const whereCondition = { user_id: userId }

  if (plan_id) {
    whereCondition.plan_id = plan_id
  }

  if (start_date && end_date) {
    whereCondition.checkin_time = _.gte(new Date(start_date)).and(_.lte(new Date(end_date)))
  }

  const recordsQuery = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
    .where(whereCondition)
    .orderBy('checkin_time', 'desc')
    .skip((page - 1) * page_size)
    .limit(page_size)
    .get()

  const total = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
    .where(whereCondition)
    .count()

  return {
    code: ErrorCode.SUCCESS,
    data: {
      list: recordsQuery.data,
      total: total.total
    },
    message: '获取成功'
  }
}

/**
 * 获取计划的打卡记录
 */
async function handleGetCheckinsByPlan(planId, data = {}) {
  const { user_id, page = 1, page_size = 20 } = data

  if (!planId) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '计划ID不能为空'
    }
  }

  const whereCondition = { plan_id: planId }
  if (user_id) {
    whereCondition.user_id = user_id
  }

  const recordsQuery = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
    .where(whereCondition)
    .orderBy('checkin_time', 'desc')
    .skip((page - 1) * page_size)
    .limit(page_size)
    .get()

  const total = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
    .where(whereCondition)
    .count()

  // 如果需要显示用户信息，获取用户数据
  let records = recordsQuery.data
  if (!user_id) {
    const userIds = [...new Set(records.map(r => r.user_id))]
    if (userIds.length > 0) {
      const usersQuery = await db.collection(DB_COLLECTIONS.USERS)
        .where({
          _id: _.in(userIds)
        })
        .get()

      const usersMap = {}
      usersQuery.data.forEach(user => {
        usersMap[user._id] = user
      })

      records = records.map(record => ({
        ...record,
        user: usersMap[record.user_id] || null
      }))
    }
  }

  return {
    code: ErrorCode.SUCCESS,
    data: {
      list: records,
      total: total.total
    },
    message: '获取成功'
  }
}

/**
 * 获取用户打卡记录
 */
async function handleGetCheckinsByUser(userId, data = {}) {
  const { plan_id, page = 1, page_size = 20 } = data

  if (!userId) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '用户ID不能为空'
    }
  }

  const whereCondition = { user_id: userId }
  if (plan_id) {
    whereCondition.plan_id = plan_id
  }

  const recordsQuery = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
    .where(whereCondition)
    .orderBy('checkin_time', 'desc')
    .skip((page - 1) * page_size)
    .limit(page_size)
    .get()

  const total = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
    .where(whereCondition)
    .count()

  return {
    code: ErrorCode.SUCCESS,
    data: {
      list: recordsQuery.data,
      total: total.total
    },
    message: '获取成功'
  }
}

/**
 * 获取今日打卡记录
 */
async function handleGetTodayCheckins(openid, data = {}) {
  const { plan_id } = data

  // 获取用户信息
  const userQuery = await db.collection(DB_COLLECTIONS.USERS)
    .where({ openid })
    .get()

  if (userQuery.data.length === 0) {
    return {
      code: ErrorCode.AUTH_ERROR,
      data: null,
      message: '用户不存在'
    }
  }

  const userId = userQuery.data[0]._id
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  const whereCondition = {
    user_id: userId,
    checkin_time: _.gte(startOfDay).and(_.lt(endOfDay))
  }

  if (plan_id) {
    whereCondition.plan_id = plan_id
  }

  const recordsQuery = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
    .where(whereCondition)
    .orderBy('checkin_time', 'desc')
    .get()

  // 计算今日总运动时长
  const totalDuration = recordsQuery.data.reduce((sum, record) => sum + record.duration, 0)

  return {
    code: ErrorCode.SUCCESS,
    data: {
      records: recordsQuery.data,
      total_duration: totalDuration
    },
    message: '获取成功'
  }
}

/**
 * 获取用户运动统计
 */
async function handleGetUserStats(openid) {
  // 获取用户信息
  const userQuery = await db.collection(DB_COLLECTIONS.USERS)
    .where({ openid })
    .get()

  if (userQuery.data.length === 0) {
    return {
      code: ErrorCode.AUTH_ERROR,
      data: null,
      message: '用户不存在'
    }
  }

  const userId = userQuery.data[0]._id

  // 获取所有打卡记录
  const allRecords = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
    .where({ user_id: userId })
    .orderBy('checkin_time', 'asc')
    .get()

  const records = allRecords.data

  if (records.length === 0) {
    return {
      code: ErrorCode.SUCCESS,
      data: {
        total_duration: 0,
        total_checkins: 0,
        current_streak: 0,
        max_streak: 0,
        this_week_duration: 0,
        this_month_duration: 0
      },
      message: '获取成功'
    }
  }

  // 计算总运动时长和打卡次数
  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0)
  const totalCheckins = records.length

  // 计算连续打卡天数
  const checkinDates = [...new Set(records.map(r => formatDate(r.checkin_time, 'YYYY-MM-DD')))]
  const { currentStreak, maxStreak } = calculateStreaks(checkinDates)

  // 计算本周运动时长
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const thisWeekRecords = records.filter(r => new Date(r.checkin_time) >= startOfWeek)
  const thisWeekDuration = thisWeekRecords.reduce((sum, r) => sum + r.duration, 0)

  // 计算本月运动时长
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const thisMonthRecords = records.filter(r => new Date(r.checkin_time) >= startOfMonth)
  const thisMonthDuration = thisMonthRecords.reduce((sum, r) => sum + r.duration, 0)

  return {
    code: ErrorCode.SUCCESS,
    data: {
      total_duration: totalDuration,
      total_checkins: totalCheckins,
      current_streak: currentStreak,
      max_streak: maxStreak,
      this_week_duration: thisWeekDuration,
      this_month_duration: thisMonthDuration
    },
    message: '获取成功'
  }
}

/**
 * 计算连续打卡天数
 */
function calculateStreaks(dateStrings) {
  if (dateStrings.length === 0) {
    return { currentStreak: 0, maxStreak: 0 }
  }

  const dates = dateStrings.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime())
  let currentStreak = 1
  let maxStreak = 1
  let tempStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const diff = calculateDaysDiff(dates[i - 1], dates[i])
    if (diff === 1) {
      tempStreak++
    } else if (diff > 1) {
      tempStreak = 1
    }
    maxStreak = Math.max(maxStreak, tempStreak)
  }

  // 检查当前连续天数（是否包含今天或昨天）
  const today = new Date()
  const lastCheckinDate = dates[dates.length - 1]
  const daysSinceLastCheckin = calculateDaysDiff(lastCheckinDate, today)

  if (daysSinceLastCheckin <= 1) {
    currentStreak = tempStreak
  } else {
    currentStreak = 0
  }

  return { currentStreak, maxStreak }
}

/**
 * 获取圈子运动统计
 */
async function handleGetCircleStats(circleId) {
  if (!circleId) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '圈子ID不能为空'
    }
  }

  // 获取圈子成员
  const memberRecords = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
    .where({ circle_id: circleId })
    .get()

  const memberCount = memberRecords.total || memberRecords.data.length
  const userIds = memberRecords.data.map(m => m.user_id)

  if (userIds.length === 0) {
    return {
      code: ErrorCode.SUCCESS,
      data: {
        circle_id: circleId,
        total_duration: 0,
        total_checkins: 0,
        member_count: 0,
        active_member_count: 0,
        average_duration: 0
      },
      message: '获取成功'
    }
  }

  // 获取圈子当前计划
  const currentPlan = await db.collection(DB_COLLECTIONS.PLANS)
    .where({
      circle_id: circleId,
      status: 'active'
    })
    .limit(1)
    .get()

  let planId = null
  if (currentPlan.data.length > 0) {
    planId = currentPlan.data[0]._id
  }

  // 获取打卡记录
  const whereCondition = {
    user_id: _.in(userIds)
  }
  if (planId) {
    whereCondition.plan_id = planId
  }

  const checkinRecords = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
    .where(whereCondition)
    .get()

  const records = checkinRecords.data

  // 计算总运动时长和打卡次数
  const totalDuration = records.reduce((sum, r) => sum + r.duration, 0)
  const totalCheckins = records.length

  // 计算本周活跃成员数
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const thisWeekRecords = records.filter(r => new Date(r.checkin_time) >= startOfWeek)
  const activeUserIds = [...new Set(thisWeekRecords.map(r => r.user_id))]

  return {
    code: ErrorCode.SUCCESS,
    data: {
      circle_id: circleId,
      total_duration: totalDuration,
      total_checkins: totalCheckins,
      member_count: memberCount,
      active_member_count: activeUserIds.length,
      average_duration: memberCount > 0 ? Math.round(totalDuration / memberCount) : 0
    },
    message: '获取成功'
  }
}
