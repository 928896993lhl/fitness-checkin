// 云函数入口文件 - 圈子相关服务
const cloud = require('wx-server-sdk')
const { DB_COLLECTIONS, ErrorCode, CIRCLE_RULES } = require('../utils/constants')
const { generateInviteCode } = require('../utils/helpers')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 圈子云函数
 * 处理圈子创建、加入、查询、成员管理等操作
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, data } = event

  try {
    switch (action) {
      case 'createCircle':
        return await handleCreateCircle(OPENID, data)
      case 'joinCircle':
        return await handleJoinCircle(OPENID, data)
      case 'getMyCircles':
        return await handleGetMyCircles(OPENID, data)
      case 'getCircleDetail':
        return await handleGetCircleDetail(data.circleId)
      case 'getCircleMembers':
        return await handleGetCircleMembers(data.circleId)
      case 'updateCircle':
        return await handleUpdateCircle(OPENID, data)
      case 'generateNewInviteCode':
        return await handleGenerateNewInviteCode(OPENID, data)
      case 'archiveCircle':
        return await handleArchiveCircle(OPENID, data)
      default:
        return {
          code: ErrorCode.PARAM_ERROR,
          data: null,
          message: `未知操作: ${action}`
        }
    }
  } catch (error) {
    console.error(`圈子云函数错误 [${action}]:`, error)
    return {
      code: ErrorCode.CLOUD_ERROR,
      data: null,
      message: error.message || '服务器内部错误'
    }
  }
}

/**
 * 创建圈子
 */
async function handleCreateCircle(openid, data) {
  const { name, description, max_members } = data

  // 参数验证
  if (!name || name.trim().length === 0) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '圈子名称不能为空'
    }
  }

  if (max_members < CIRCLE_RULES.MIN_MEMBERS || max_members > CIRCLE_RULES.MAX_MEMBERS) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: `圈子人数限制为${CIRCLE_RULES.MIN_MEMBERS}-${CIRCLE_RULES.MAX_MEMBERS}人`
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
      message: '用户不存在，请先登录'
    }
  }

  const userId = userQuery.data[0]._id

  // 检查用户是否已有圈子（每人只能创建一个圈子）
  const existingMember = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
    .where({ user_id: userId })
    .get()

  if (existingMember.data.length > 0) {
    return {
      code: ErrorCode.PERMISSION_DENIED,
      data: null,
      message: '您已在圈子中，暂不支持加入多个圈子'
    }
  }

  // 生成邀请码
  const inviteCode = generateInviteCode(CIRCLE_RULES.INVITE_CODE_LENGTH)

  // 创建圈子
  const circleData = {
    name: name.trim(),
    description: description || '',
    creator_id: userId,
    max_members: max_members,
    invite_code: inviteCode,
    status: 'active',
    created_at: db.serverDate(),
    updated_at: db.serverDate()
  }

  const createResult = await db.collection(DB_COLLECTIONS.CIRCLES)
    .add({
      data: circleData
    })

  // 创建者自动成为成员
  await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
    .add({
      data: {
        circle_id: createResult._id,
        user_id: userId,
        role: 'creator',
        joined_at: db.serverDate()
      }
    })

  circleData._id = createResult._id

  return {
    code: ErrorCode.SUCCESS,
    data: circleData,
    message: '圈子创建成功'
  }
}

/**
 * 加入圈子
 */
async function handleJoinCircle(openid, data) {
  const { invite_code } = data

  if (!invite_code || invite_code.trim().length === 0) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '邀请码不能为空'
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
      message: '用户不存在，请先登录'
    }
  }

  const userId = userQuery.data[0]._id

  // 检查用户是否已在圈子中
  const existingMember = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
    .where({ user_id: userId })
    .get()

  if (existingMember.data.length > 0) {
    return {
      code: ErrorCode.PERMISSION_DENIED,
      data: null,
      message: '您已在圈子中，暂不支持加入多个圈子'
    }
  }

  // 查询圈子
  const circleQuery = await db.collection(DB_COLLECTIONS.CIRCLES)
    .where({
      invite_code: invite_code.trim(),
      status: 'active'
    })
    .get()

  if (circleQuery.data.length === 0) {
    return {
      code: ErrorCode.NOT_FOUND,
      data: null,
      message: '圈子不存在或邀请码错误'
    }
  }

  const circle = circleQuery.data[0]

  // 检查圈子人数是否已满
  const memberCount = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
    .where({ circle_id: circle._id })
    .count()

  if (memberCount.total >= circle.max_members) {
    return {
      code: ErrorCode.PERMISSION_DENIED,
      data: null,
      message: '圈子人数已满'
    }
  }

  // 加入圈子
  await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
    .add({
      data: {
        circle_id: circle._id,
        user_id: userId,
        role: 'member',
        joined_at: db.serverDate()
      }
    })

  return {
    code: ErrorCode.SUCCESS,
    data: circle,
    message: '成功加入圈子'
  }
}

/**
 * 获取我的圈子列表
 */
async function handleGetMyCircles(openid, data = {}) {
  const { page = 1, page_size = 10 } = data

  // 获取用户信息
  const userQuery = await db.collection(DB_COLLECTIONS.USERS)
    .where({ openid })
    .get()

  if (userQuery.data.length === 0) {
    return {
      code: ErrorCode.AUTH_ERROR,
      data: null,
      message: '用户不存在，请先登录'
    }
  }

  const userId = userQuery.data[0]._id

  // 获取用户加入的圈子ID列表
  const memberRecords = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
    .where({ user_id: userId })
    .get()

  if (memberRecords.data.length === 0) {
    return {
      code: ErrorCode.SUCCESS,
      data: {
        list: [],
        total: 0
      },
      message: '暂无圈子'
    }
  }

  const circleIds = memberRecords.data.map(m => m.circle_id)

  // 查询圈子详情
  const circlesQuery = await db.collection(DB_COLLECTIONS.CIRCLES)
    .where({
      _id: _.in(circleIds)
    })
    .orderBy('created_at', 'desc')
    .skip((page - 1) * page_size)
    .limit(page_size)
    .get()

  // 获取每个圈子的成员数量
  const circlesWithMemberCount = await Promise.all(
    circlesQuery.data.map(async (circle) => {
      const memberCount = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
        .where({ circle_id: circle._id })
        .count()
      return {
        ...circle,
        member_count: memberCount.total
      }
    })
  )

  return {
    code: ErrorCode.SUCCESS,
    data: {
      list: circlesWithMemberCount,
      total: memberRecords.data.length
    },
    message: '获取成功'
  }
}

/**
 * 获取圈子详情
 */
async function handleGetCircleDetail(circleId) {
  if (!circleId) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '圈子ID不能为空'
    }
  }

  const circleDoc = await db.collection(DB_COLLECTIONS.CIRCLES)
    .doc(circleId)
    .get()
    .catch(() => null)

  if (!circleDoc) {
    return {
      code: ErrorCode.NOT_FOUND,
      data: null,
      message: '圈子不存在'
    }
  }

  // 获取成员数量
  const memberCount = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
    .where({ circle_id: circleId })
    .count()

  return {
    code: ErrorCode.SUCCESS,
    data: {
      ...circleDoc.data,
      member_count: memberCount.total
    },
    message: '获取成功'
  }
}

/**
 * 获取圈子成员列表
 */
async function handleGetCircleMembers(circleId) {
  if (!circleId) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '圈子ID不能为空'
    }
  }

  // 获取成员记录
  const memberRecords = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
    .where({ circle_id: circleId })
    .orderBy('joined_at', 'asc')
    .get()

  if (memberRecords.data.length === 0) {
    return {
      code: ErrorCode.SUCCESS,
      data: [],
      message: '暂无成员'
    }
  }

  // 获取成员用户信息
  const userIds = memberRecords.data.map(m => m.user_id)
  const usersQuery = await db.collection(DB_COLLECTIONS.USERS)
    .where({
      _id: _.in(userIds)
    })
    .get()

  const usersMap = {}
  usersQuery.data.forEach(user => {
    usersMap[user._id] = user
  })

  // 合并成员信息
  const members = memberRecords.data.map(member => ({
    ...member,
    user: usersMap[member.user_id] || null
  }))

  return {
    code: ErrorCode.SUCCESS,
    data: members,
    message: '获取成功'
  }
}

/**
 * 更新圈子信息
 */
async function handleUpdateCircle(openid, data) {
  const { circle_id, name, description, max_members } = data

  if (!circle_id) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: null,
      message: '圈子ID不能为空'
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
      message: '只有圈子创建者可以修改圈子信息'
    }
  }

  const updateData = {}
  if (name !== undefined) updateData.name = name.trim()
  if (description !== undefined) updateData.description = description
  if (max_members !== undefined) {
    if (max_members < CIRCLE_RULES.MIN_MEMBERS || max_members > CIRCLE_RULES.MAX_MEMBERS) {
      return {
        code: ErrorCode.PARAM_ERROR,
        data: null,
        message: `圈子人数限制为${CIRCLE_RULES.MIN_MEMBERS}-${CIRCLE_RULES.MAX_MEMBERS}人`
      }
    }
    // 检查新的人数限制是否小于当前成员数
    const currentMemberCount = await db.collection(DB_COLLECTIONS.CIRCLE_MEMBERS)
      .where({ circle_id })
      .count()
    if (max_members < currentMemberCount.total) {
      return {
        code: ErrorCode.PARAM_ERROR,
        data: null,
        message: '人数限制不能小于当前成员数'
      }
    }
    updateData.max_members = max_members
  }
  updateData.updated_at = db.serverDate()

  await db.collection(DB_COLLECTIONS.CIRCLES)
    .doc(circle_id)
    .update({
      data: updateData
    })

  // 返回更新后的圈子信息
  const updatedCircle = await db.collection(DB_COLLECTIONS.CIRCLES)
    .doc(circle_id)
    .get()

  return {
    code: ErrorCode.SUCCESS,
    data: updatedCircle.data,
    message: '更新成功'
  }
}

/**
 * 生成新的邀请码
 */
async function handleGenerateNewInviteCode(openid, data) {
  const { circle_id } = data

  // 验证用户权限
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
      message: '只有圈子创建者可以生成新邀请码'
    }
  }

  const newInviteCode = generateInviteCode(CIRCLE_RULES.INVITE_CODE_LENGTH)

  await db.collection(DB_COLLECTIONS.CIRCLES)
    .doc(circle_id)
    .update({
      data: {
        invite_code: newInviteCode,
        updated_at: db.serverDate()
      }
    })

  return {
    code: ErrorCode.SUCCESS,
    data: { invite_code: newInviteCode },
    message: '邀请码已更新'
  }
}

/**
 * 归档圈子
 */
async function handleArchiveCircle(openid, data) {
  const { circle_id } = data

  // 验证用户权限
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
      message: '只有圈子创建者可以归档圈子'
    }
  }

  await db.collection(DB_COLLECTIONS.CIRCLES)
    .doc(circle_id)
    .update({
      data: {
        status: 'archived',
        updated_at: db.serverDate()
      }
    })

  return {
    code: ErrorCode.SUCCESS,
    data: null,
    message: '圈子已归档'
  }
}
