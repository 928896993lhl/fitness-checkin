// 云函数入口文件 - 用户相关服务
const cloud = require('wx-server-sdk')
const { DB_COLLECTIONS, ErrorCode } = require('../utils/constants')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 用户云函数
 * 处理用户登录、信息获取、信息更新等操作
 */
exports.main = async (event, context) => {
  const { OPENID, APPID } = cloud.getWXContext()
  const { action, data } = event

  try {
    switch (action) {
      case 'login':
        return await handleLogin(OPENID, data)
      case 'getUserInfo':
        return await handleGetUserInfo(OPENID)
      case 'updateUserInfo':
        return await handleUpdateUserInfo(OPENID, data)
      case 'getUserById':
        return await handleGetUserById(data.userId)
      case 'getUsersByIds':
        return await handleGetUsersByIds(data.userIds)
      default:
        return {
          code: ErrorCode.PARAM_ERROR,
          data: null,
          message: `未知操作: ${action}`
        }
    }
  } catch (error) {
    console.error(`用户云函数错误 [${action}]:`, error)
    return {
      code: ErrorCode.CLOUD_ERROR,
      data: null,
      message: error.message || '服务器内部错误'
    }
  }
}

/**
 * 处理用户登录
 * 如果用户不存在则创建新用户
 */
async function handleLogin(openid, data = {}) {
  const { nickname, avatar_url, gender, province, city, country } = data

  // 查询用户是否存在
  const userQuery = await db.collection(DB_COLLECTIONS.USERS)
    .where({ openid })
    .get()

  if (userQuery.data.length > 0) {
    // 用户已存在，更新最后登录时间
    const user = userQuery.data[0]
    await db.collection(DB_COLLECTIONS.USERS)
      .doc(user._id)
      .update({
        data: {
          updated_at: db.serverDate()
        }
      })

    return {
      code: ErrorCode.SUCCESS,
      data: {
        user: user,
        isNewUser: false
      },
      message: '登录成功'
    }
  }

  // 创建新用户
  const newUser = {
    openid,
    nickname: nickname || '健身达人',
    avatar_url: avatar_url || '',
    gender: gender || 0,
    province: province || '',
    city: city || '',
    country: country || '',
    created_at: db.serverDate(),
    updated_at: db.serverDate()
  }

  const createResult = await db.collection(DB_COLLECTIONS.USERS)
    .add({
      data: newUser
    })

  newUser._id = createResult._id

  return {
    code: ErrorCode.SUCCESS,
    data: {
      user: newUser,
      isNewUser: true
    },
    message: '注册成功'
  }
}

/**
 * 获取当前用户信息
 */
async function handleGetUserInfo(openid) {
  const userQuery = await db.collection(DB_COLLECTIONS.USERS)
    .where({ openid })
    .get()

  if (userQuery.data.length === 0) {
    return {
      code: ErrorCode.NOT_FOUND,
      data: null,
      message: '用户不存在'
    }
  }

  return {
    code: ErrorCode.SUCCESS,
    data: userQuery.data[0],
    message: '获取成功'
  }
}

/**
 * 更新用户信息
 */
async function handleUpdateUserInfo(openid, data) {
  const { nickname, avatar_url, gender, province, city, country } = data

  // 验证用户存在
  const userQuery = await db.collection(DB_COLLECTIONS.USERS)
    .where({ openid })
    .get()

  if (userQuery.data.length === 0) {
    return {
      code: ErrorCode.NOT_FOUND,
      data: null,
      message: '用户不存在'
    }
  }

  const userId = userQuery.data[0]._id
  const updateData = {}

  if (nickname !== undefined) updateData.nickname = nickname
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url
  if (gender !== undefined) updateData.gender = gender
  if (province !== undefined) updateData.province = province
  if (city !== undefined) updateData.city = city
  if (country !== undefined) updateData.country = country
  updateData.updated_at = db.serverDate()

  await db.collection(DB_COLLECTIONS.USERS)
    .doc(userId)
    .update({
      data: updateData
    })

  // 返回更新后的用户信息
  const updatedUser = await db.collection(DB_COLLECTIONS.USERS)
    .doc(userId)
    .get()

  return {
    code: ErrorCode.SUCCESS,
    data: updatedUser.data,
    message: '更新成功'
  }
}

/**
 * 根据用户ID获取用户信息
 */
async function handleGetUserById(userId) {
  const userDoc = await db.collection(DB_COLLECTIONS.USERS)
    .doc(userId)
    .get()
    .catch(() => null)

  if (!userDoc) {
    return {
      code: ErrorCode.NOT_FOUND,
      data: null,
      message: '用户不存在'
    }
  }

  return {
    code: ErrorCode.SUCCESS,
    data: userDoc.data,
    message: '获取成功'
  }
}

/**
 * 批量获取用户信息
 */
async function handleGetUsersByIds(userIds) {
  if (!userIds || userIds.length === 0) {
    return {
      code: ErrorCode.PARAM_ERROR,
      data: [],
      message: '用户ID列表不能为空'
    }
  }

  // 限制批量查询数量
  const limit = 20
  const ids = userIds.slice(0, limit)

  const usersQuery = await db.collection(DB_COLLECTIONS.USERS)
    .where({
      _id: _.in(ids)
    })
    .get()

  return {
    code: ErrorCode.SUCCESS,
    data: usersQuery.data,
    message: '获取成功'
  }
}
