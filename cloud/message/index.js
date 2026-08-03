// 云函数入口文件 - 消息推送服务
const cloud = require('wx-server-sdk')
const { DB_COLLECTIONS, ErrorCode, PLAN_RULES } = require('../utils/constants')
const { formatDate, calculateDaysDiff } = require('../utils/helpers')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 消息推送云函数
 * 处理每日汇总推送、周期结束提醒等消息通知
 */
exports.main = async (event, context) => {
  const { action, data } = event

  try {
    switch (action) {
      case 'sendDailySummary':
        return await handleSendDailySummary()
      case 'sendPlanEndReminder':
        return await handleSendPlanEndReminder()
      case 'sendCheckinReminder':
        return await handleSendCheckinReminder()
      case 'getSubscribers':
        return await handleGetSubscribers(data.circleId)
      default:
        return {
          code: ErrorCode.PARAM_ERROR,
          data: null,
          message: `未知操作: ${action}`
        }
    }
  } catch (error) {
    console.error(`消息推送云函数错误 [${action}]:`, error)
    return {
      code: ErrorCode.CLOUD_ERROR,
      data: null,
      message: error.message || '服务器内部错误'
    }
  }
}

/**
 * 发送每日运动汇总
 * 每日定时任务调用（建议在晚上8点执行）
 */
async function handleSendDailySummary() {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  // 获取所有进行中的计划
  const activePlans = await db.collection(DB_COLLECTIONS.PLANS)
    .where({
      status: 'active'
    })
    .get()

  const results = []

  for (const plan of activePlans.data) {
    try {
      // 获取圈子成员
      const memberRecords = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
        .where({ circle_id: plan.circle_id })
        .get()

      if (memberRecords.data.length === 0) continue

      const userIds = memberRecords.data.map(m => m.user_id)

      // 获取今日打卡记录
      const todayCheckins = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
        .where({
          plan_id: plan._id,
          user_id: _.in(userIds),
          checkin_time: _.gte(startOfDay).and(_.lt(endOfDay))
        })
        .get()

      // 获取用户信息
      const usersQuery = await db.collection(DB_COLLECTIONS.USERS)
        .where({
          _id: _.in(userIds)
        })
        .get()

      const usersMap = {}
      usersQuery.data.forEach(user => {
        usersMap[user._id] = user
      })

      // 统计今日运动情况
      const todayStats = {}
      todayCheckins.data.forEach(checkin => {
        if (!todayStats[checkin.user_id]) {
          todayStats[checkin.user_id] = {
            duration: 0,
            count: 0
          }
        }
        todayStats[checkin.user_id].duration += checkin.duration
        todayStats[checkin.user_id].count++
      })

      // 构建汇总消息
      const totalDuration = Object.values(todayStats).reduce((sum, stat) => sum + stat.duration, 0)
      const activeCount = Object.keys(todayStats).length

      const summaryMessage = buildDailySummaryMessage(
        plan.name,
        todayStats,
        usersMap,
        totalDuration,
        activeCount,
        memberRecords.data.length
      )

      // 发送订阅消息给所有成员
      await sendSubscriptionMessage(userIds, {
        thing1: { value: plan.name },
        number2: { value: totalDuration },
        number3: { value: activeCount },
        thing4: { value: summaryMessage }
      })

      results.push({
        plan_id: plan._id,
        success: true,
        message_count: userIds.length
      })
    } catch (error) {
      console.error(`发送计划 ${plan._id} 的每日汇总失败:`, error)
      results.push({
        plan_id: plan._id,
        success: false,
        error: error.message
      })
    }
  }

  return {
    code: ErrorCode.SUCCESS,
    data: results,
    message: '每日汇总发送完成'
  }
}

/**
 * 发送周期结束提醒
 * 提醒未完成目标的成员（计划结束前2天）
 */
async function handleSendPlanEndReminder() {
  const today = new Date()
  const reminderDate = new Date(today)
  reminderDate.setDate(today.getDate() + PLAN_RULES.REMINDER_DAYS_BEFORE_END)

  // 获取即将结束的计划
  const plansToEnd = await db.collection(DB_COLLECTIONS.PLANS)
    .where({
      status: 'active',
      end_date: _.gte(today).and(_.lte(reminderDate))
    })
    .get()

  const results = []

  for (const plan of plansToEnd.data) {
    try {
      // 获取圈子成员
      const memberRecords = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
        .where({ circle_id: plan.circle_id })
        .get()

      if (memberRecords.data.length === 0) continue

      const userIds = memberRecords.data.map(m => m.user_id)

      // 获取计划的所有打卡记录
      const allCheckins = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
        .where({
          plan_id: plan._id,
          user_id: _.in(userIds)
        })
        .get()

      // 统计每个成员的运动情况
      const memberStats = {}
      allCheckins.data.forEach(checkin => {
        if (!memberStats[checkin.user_id]) {
          memberStats[checkin.user_id] = {
            duration: 0,
            count: 0
          }
        }
        memberStats[checkin.user_id].duration += checkin.duration
        memberStats[checkin.user_id].count++
      })

      // 找出未完成目标的成员
      const incompleteMembers = []
      const daysRemaining = calculateDaysDiff(today, new Date(plan.end_date))

      for (const userId of userIds) {
        const stats = memberStats[userId] || { duration: 0, count: 0 }
        const expectedDuration = plan.daily_duration_goal * (plan.total_duration_goal / plan.daily_duration_goal - daysRemaining)
        
        if (stats.duration < expectedDuration * 0.8) { // 低于预期80%算未完成
          incompleteMembers.push(userId)
        }
      }

      if (incompleteMembers.length > 0) {
        // 获取用户信息
        const usersQuery = await db.collection(DB_COLLECTIONS.USERS)
          .where({
            _id: _.in(incompleteMembers)
          })
          .get()

        const usersMap = {}
        usersQuery.data.forEach(user => {
          usersMap[user._id] = user
        })

        // 构建提醒消息
        const reminderMessage = buildPlanEndReminderMessage(
          plan.name,
          daysRemaining,
          incompleteMembers.map(id => usersMap[id]?.nickname || '未知用户')
        )

        // 发送提醒消息
        await sendSubscriptionMessage(incompleteMembers, {
          thing1: { value: plan.name },
          number2: { value: daysRemaining },
          thing3: { value: reminderMessage }
        })

        results.push({
          plan_id: plan._id,
          success: true,
          reminded_count: incompleteMembers.length
        })
      }
    } catch (error) {
      console.error(`发送计划 ${plan._id} 的结束提醒失败:`, error)
      results.push({
        plan_id: plan._id,
        success: false,
        error: error.message
      })
    }
  }

  return {
    code: ErrorCode.SUCCESS,
    data: results,
    message: '周期结束提醒发送完成'
  }
}

/**
 * 发送打卡提醒
 * 提醒今日未打卡的成员（建议在下午6点执行）
 */
async function handleSendCheckinReminder() {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  // 获取所有进行中的计划
  const activePlans = await db.collection(DB_COLLECTIONS.PLANS)
    .where({
      status: 'active'
    })
    .get()

  const results = []

  for (const plan of activePlans.data) {
    try {
      // 获取圈子成员
      const memberRecords = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
        .where({ circle_id: plan.circle_id })
        .get()

      if (memberRecords.data.length === 0) continue

      const userIds = memberRecords.data.map(m => m.user_id)

      // 获取今日已打卡的用户
      const todayCheckins = await db.collection(DB_COLLECTIONS.CHECKIN_RECORDS)
        .where({
          plan_id: plan._id,
          user_id: _.in(userIds),
          checkin_time: _.gte(startOfDay).and(_.lt(endOfDay))
        })
        .get()

      const checkedInUserIds = [...new Set(todayCheckins.data.map(c => c.user_id))]
      const uncheckedUserIds = userIds.filter(id => !checkedInUserIds.includes(id))

      if (uncheckedUserIds.length > 0) {
        // 发送提醒消息
        await sendSubscriptionMessage(uncheckedUserIds, {
          thing1: { value: plan.name },
          thing2: { value: '今日还未打卡哦，快来记录您的运动吧！' }
        })

        results.push({
          plan_id: plan._id,
          success: true,
          reminded_count: uncheckedUserIds.length
        })
      }
    } catch (error) {
      console.error(`发送计划 ${plan._id} 的打卡提醒失败:`, error)
      results.push({
        plan_id: plan._id,
        success: false,
        error: error.message
      })
    }
  }

  return {
    code: ErrorCode.SUCCESS,
    data: results,
    message: '打卡提醒发送完成'
  }
}

/**
 * 获取已订阅消息的用户
 */
async function handleGetSubscribers(circleId) {
  // 注意：实际实现需要从数据库获取用户的订阅状态
  // 这里简化处理，返回圈子所有成员
  if (!circleId) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '圈子ID不能为空'
    }
  }

  const memberRecords = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
    .where({ circle_id: circleId })
    .get()

  return {
    code: ErrorCode.SUCCESS,
    data: memberRecords.data.map(m => m.user_id),
    message: '获取成功'
  }
}

/**
 * 发送订阅消息
 * 注意：实际发送需要用户已订阅消息模板
 */
async function sendSubscriptionMessage(userIds, templateData) {
  // 这里只是示例，实际需要使用 cloud.openapi.subscribeMessage.send
  // 需要在微信公众平台配置消息模板
  console.log('发送订阅消息:', {
    touser: userIds,
    template_id: 'YOUR_TEMPLATE_ID',
    data: templateData
  })

  // 实际实现示例：
  /*
  for (const userId of userIds) {
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: userId,
        template_id: 'YOUR_TEMPLATE_ID',
        page: '/pages/index/index',
        data: templateData
      })
    } catch (error) {
      console.error(`发送消息给用户 ${userId} 失败:`, error)
    }
  }
  */

  return true
}

/**
 * 构建每日汇总消息
 */
function buildDailySummaryMessage(planName, todayStats, usersMap, totalDuration, activeCount, totalCount) {
  let message = `【${planName}】今日运动汇总\n`
  message += `📊 总运动时长: ${totalDuration}分钟\n`
  message += `👥 活跃成员: ${activeCount}/${totalCount}人\n\n`
  message += `成员详情:\n`

  Object.entries(todayStats).forEach(([userId, stat]) => {
    const user = usersMap[userId]
    const nickname = user ? user.nickname : '未知用户'
    message += `• ${nickname}: ${stat.duration}分钟 (${stat.count}次)\n`
  })

  return message
}

/**
 * 构建周期结束提醒消息
 */
function buildPlanEndReminderMessage(planName, daysRemaining, incompleteMemberNames) {
  let message = `【${planName}】即将结束\n`
  message += `⏰ 剩余天数: ${daysRemaining}天\n`
  message += `⚠️ 以下成员进度落后:\n`

  incompleteMemberNames.forEach(name => {
    message += `• ${name}\n`
  })

  message += `\n请加油完成目标！`

  return message
}
