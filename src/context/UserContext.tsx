import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import Taro from '@tarojs/taro'
import { User, UserState } from '../types'

// 初始状态
const initialState: UserState = {
  user: null,
  token: null,
  isLoggedIn: false,
  isLoading: false,
  error: null
}

// Action类型
type UserAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

// Reducer函数
function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoggedIn: true,
        isLoading: false,
        error: null
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...initialState
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      }
    default:
      return state
  }
}

// Context类型
interface UserContextType {
  state: UserState
  dispatch: React.Dispatch<UserAction>
}

// 创建Context
const UserContext = createContext<UserContextType | undefined>(undefined)

// Provider组件属性
interface UserProviderProps {
  children: ReactNode
}

/**
 * 用户状态Provider组件
 */
export function UserProvider({ children }: UserProviderProps) {
  const [state, dispatch] = useReducer(userReducer, initialState)

  // 初始化时从本地存储恢复用户信息
  const initFromStorage = () => {
    try {
      const token = Taro.getStorageSync('token')
      const userInfo = Taro.getStorageSync('userInfo')
      
      if (token && userInfo) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: userInfo,
            token
          }
        })
      }
    } catch (error) {
      console.error('从本地存储恢复用户信息失败:', error)
    }
  }

  // 组件挂载时初始化
  useEffect(() => {
    initFromStorage()
  }, [])

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  )
}

/**
 * 使用用户状态的Hook
 */
export function useUserState() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserState must be used within a UserProvider')
  }
  return context.state
}

/**
 * 使用用户dispatch的Hook
 */
export function useUserDispatch() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserDispatch must be used within a UserProvider')
  }

  const { dispatch } = context

  /**
   * 登录
   */
  const login = (user: any) => {
    const token = user.token || user.openid
    Taro.setStorageSync('token', token)
    Taro.setStorageSync('userInfo', user)
    
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, token }
    })
  }

  /**
   * 退出登录
   */
  const logout = () => {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('userInfo')
    Taro.removeStorageSync('lastCircleId')
    
    dispatch({ type: 'LOGOUT' })
  }

  /**
   * 更新用户信息
   */
  const updateUser = (user: User) => {
    Taro.setStorageSync('userInfo', user)
    dispatch({ type: 'UPDATE_USER', payload: user })
  }

  /**
   * 设置加载状态
   */
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  /**
   * 设置错误信息
   */
  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  return {
    login,
    logout,
    updateUser,
    setLoading,
    setError
  }
}
