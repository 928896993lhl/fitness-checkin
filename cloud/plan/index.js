// 云函数入口文件 - 计划相关服务
const cloud = require('wx-server-sdk')
const { DB_COLLECTIONS, ErrorCode, PLAN_RULES } = require('../utils/constants')
const { calculateDaysDiff, formatDate } = require('../utils/helpers')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 计划云函数
 * 处理计划创建、查询、状态更新等操作
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, data } = event

  try {
    switch (action) {
      case 'createPlan':
        return await handleCreatePlan(OPENID, data)
      case 'getPlansByCircle':
        return await handleGetPlansByCircle(data.circleId, data)
      case 'getPlanDetail':
        return await handleGetPlanDetail(data.planId)
      case 'getCurrentPlan':
        return await handleGetCurrentPlan(data.circleId)
      case 'updatePlanStatus':
        return await handleUpdatePlanStatus(OPENID, data)
      case 'cancelPlan':
        return await handleCancelPlan(OPENID, data)
      case 'getPlanProgress':
        return await handleGetPlanProgress(data.planId)
      default:
        return {
          code: ErrorCode.PARAM_ERROR,
          data: null,
          message: `未知操作: ${action}`
        }
    }
  } catch (error) {
    console.error(`计划云函数错误 [${action}]:`, error)
    return {
      code: ErrorCode.CLOUD_ERROR,
      data: null,
      message: error.message || '服务器内部错误'
    }
  }
}

/**
 * 创建计划
 */
async function handleCreatePlan(openid, data) {
  const {
    circle_id,
    name,
    description,
    start_date,
    end_date,
    total_duration_goal,
    daily_duration_goal,
    circle_total_goal,
    min_duration_per_checkin = 10
  } = data

  // 参数验证
  if (!circle_id || !name || !start_date || !end_date) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '缺少必要参数'
    }
  }

  if (total_duration_goal <= 0 || daily_duration_goal <= 0 || circle_total_goal <= 0) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '运动目标必须大于0'
    }
  }

  if (min_duration_per_checkin < 1) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '每次打卡最低时长不能小于1分钟'
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

  // 验证是否是圈子创建者
  const circleDoc = await db.collection(DB_COLLECTIONS.CIRCLES)
    .doc(circle_id)
    .get()
    .catch(() => null)

  if (!circleDoc) {
    return {
      code: ErrorCode.NOT_FOUND,
      data: null,
      message: '圈子不存在'
    }
  }

  if (circleDoc.data.creator_id !== userId) {
    return {
      code: ErrorCode.PERMISSION_DENIED,
      data: null,
      message: '只有圈子创建者可以创建计划'
    }
  }

  // 验证日期
  const startDate = new Date(start_date)
  const endDate = new Date(end_date)
  const daysDiff = calculateDaysDiff(startDate, endDate)

  if (daysDiff < PLAN_RULES.MIN_DURATION_DAYS) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: `计划时长不能少于${PLAN_RULES.MIN_DURATION_DAYS}天`
    }
  }

  if (daysDiff > PLAN_RULES.MAX_DURATION_DAYS) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: `计划时长不能超过${PLAN_RULES.MAX_DURATION_DAYS}天`
    }
  }

  // 检查圈子是否有进行中的计划
  const activePlan = await db.collection(DB_COLLECTIONS.PLANS)
    .where({
      circle_id,
      status: _.in(['pending', 'active'])
    })
    .get()

  if (activePlan.data.length > 0) {
    return {
      code: ErrorCode.PERMISSION_DENIED,
      data: null,
      message: '圈子已有进行中的计划，请先完成或取消'
    }
  }

  // 创建计划
  const planData = {
    circle_id,
    name: name.trim(),
    description: description || '',
    start_date: startDate,
    end_date: endDate,
    total_duration_goal: total_duration_goal,
    daily_duration_goal: daily_duration_goal,
    circle_total_goal: circle_total_goal,
    min_duration_per_checkin: min_duration_per_checkin,
    status: startDate <= new Date() ? 'active' : 'pending',
    created_at: db.serverDate(),
    updated_at: db.serverDate()
  }

  const createResult = await db.collection(DB_COLLECTIONS.PLANS)
    .add({
      data: planData
    })

  planData._id = createResult._id

  return {
    code: ErrorCode.SUCCESS,
    data: planData,
    message: '计划创建成功'
  }
}

/**
 * 获取圈子的计划列表
 */
async function handleGetPlansByCircle(circleId, data = {}) {
  const { status, page = 1, page_size = 10 } = data

  if (!circleId) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '圈子ID不能为空'
    }
  }

  const whereCondition = { circle_id: circleId }
  if (status) {
    whereCondition.status = status
  }

  const plansQuery = await db.collection(DB_COLLECTIONS.PLANS)
    .where(whereCondition)
    .orderBy('created_at', 'desc')
    .skip((page - 1) * page_size)
    .limit(page_size)
    .get()

  const total = await db.collection(DB_COLLECTIONS.PLANS)
    .where(whereCondition)
    .count()

  return {
    code: ErrorCode.SUCCESS,
    data: {
      list: plansQuery.data,
      total: total.total
    },
    message: '获取成功'
  }
}

/**
 * 获取计划详情
 */
async function handleGetPlanDetail(planId) {
  if (!planId) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '计划ID不能为空'
    }
  }

  const planDoc = await db.collection(DB_COLLECTIONS.PLANS)
    .doc(planId)
    .get()
    .catch(() => null)

  if (!planDoc) {
    return {
      code: ErrorCode.NOT_FOUND,
      data: null,
      message: '计划不存在'
    }
  }

  return {
    code: ErrorCode.SUCCESS,
    data: planDoc.data,
    message: '获取成功'
  }
}

/**
 * 获取圈子当前进行中的计划
 */
async function handleGetCurrentPlan(circleId) {
  if (!circleId) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '圈子ID不能为空'
    }
  }

  const planQuery = await db.collection(DB_COLLECTIONS.PLANS)
    .where({
      circle_id: circleId,
      status: _.in(['pending', 'active'])
    })
    .orderBy('created_at', 'desc')
    .limit(1)
    .get()

  if (planQuery.data.length === 0) {
    return {
      code: ErrorCode.SUCCESS,
      data: null,
      message: '暂无进行中的计划'
    }
  }

  return {
    code: ErrorCode.SUCCESS,
    data: planQuery.data[0],
    message: '获取成功'
  }
}

/**
 * 更新计划状态（定时任务调用）
 */
async function handleUpdatePlanStatus(openid, data) {
  const { plan_id, status } = data

  if (!plan_id || !status) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '缺少必要参数'
    }
  }

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

  await db.collection(DB_COLLECTIONS.PLANS)
    .doc(plan_id)
    .update({
      data: {
        status,
        updated_at: db.serverDate()
      }
    })

  return {
    code: ErrorCode.SUCCESS,
    data: null,
      message: '计划状态已更新'
  }
}

/**
 * 取消计划
 */
async function handleCancelPlan(openid, data) {
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

  // 验证是否是圈子创建者
  const circleDoc = await db.collection(DB_COLLECTIONS.CIRCLES)
    .doc(planDoc.data.circle_id)
    .get()

  if (circleDoc.data.creator_id !== userId) {
    return {
      code: ErrorCode.PERMISSION_DENIED,
      data: null,
      message: '只有圈子创建者可以取消计划'
    }
  }

  if (planDoc.data.status === 'completed') {
    return {
      code: ErrorCode.PERMISSION_DENIED,
      data: null,
      message: '已完成的计划不能取消'
    }
  }

  await db.collection(DB_COLLECTIONS.PLANS)
    .doc(plan_id)
    .update({
      data: {
        status: 'cancelled',
        updated_at: db.serverDate()
      }
    })

  return {
    code: ErrorCode.SUCCESS,
    data: null,
    message: '计划已取消'
  }
}

/**
 * 获取计划进度
 */
async function handleGetPlanProgress(planId) {
  if (!planId) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '计划ID不能为空'
    }
  }

  const planDoc = await db.collection(DB_COLLECTIONS.PLANS)
    .doc(planId)
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

  // 获取计划的所有打卡记录
  const checkinRecords = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
    .where({
      plan_id: planId
    })
    .get()

  // 计算总运动时长
  const totalDuration = checkinRecords.data.reduce((sum, record) => sum + record.duration, 0)

  // 计算进度百分比
  const progressPercentage = Math.min(100, Math.round((totalDuration / plan.total_duration_goal) * 100))

  // 计算剩余天数
  const today = new Date()
  const endDate = new Date(plan.end_date)
  const daysRemaining = Math.max(0, calculateDaysDiff(today, endDate))

  // 判断是否按计划进行
  const totalDays = calculateDaysDiff(new Date(plan.start_date), endDate)
  const elapsedDays = totalDays - daysRemaining
  const expectedProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100))
  const isOnTrack = progressPercentage >= expectedProgress * 0.8 // 允许20%的偏差

  return {
    code: ErrorCode.SUCCESS,
    data: {
      plan_id: planId,
      total_goal: plan.total_duration_goal,
      current_duration: totalDuration,
      progress_percentage: progressPercentage,
      days_remaining: daysRemaining,
      is_on_track: isOnTrack
    },
    message: '获取成功'
  }
}
