import { createContext, useContext, useReducer, ReactNode } from 'react'
import Taro from '@tarojs/taro'
import { Circle, CircleMember, CircleState } from '../types'

// 初始状态
const initialState: CircleState = {
  circles: [],
  current_circle: null,
  members: [],
  isLoading: false,
  error: null
}

// Action类型
type CircleAction =
  | { type: 'SET_CIRCLES'; payload: Circle[] }
  | { type: 'SET_CURRENT_CIRCLE'; payload: Circle | null }
  | { type: 'SET_MEMBERS'; payload: CircleMember[] }
  | { type: 'ADD_CIRCLE'; payload: Circle }
  | { type: 'UPDATE_CIRCLE'; payload: Circle }
  | { type: 'REMOVE_CIRCLE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

// Reducer函数
function circleReducer(state: CircleState, action: CircleAction): CircleState {
  switch (action.type) {
    case 'SET_CIRCLES':
      return {
        ...state,
        circles: action.payload,
        isLoading: false,
        error: null
      }
    case 'SET_CURRENT_CIRCLE':
      return {
        ...state,
        current_circle: action.payload,
        isLoading: false,
        error: null
      }
    case 'SET_MEMBERS':
      return {
        ...state,
        members: action.payload,
        isLoading: false,
        error: null
      }
    case 'ADD_CIRCLE':
      return {
        ...state,
        circles: [...state.circles, action.payload],
        isLoading: false,
        error: null
      }
    case 'UPDATE_CIRCLE':
      return {
        ...state,
        circles: state.circles.map(circle =>
          circle._id === action.payload._id ? action.payload : circle
        ),
        current_circle: state.current_circle?._id === action.payload._id
          ? action.payload
          : state.current_circle,
        isLoading: false,
        error: null
      }
    case 'REMOVE_CIRCLE':
      return {
        ...state,
        circles: state.circles.filter(circle => circle._id !== action.payload),
        current_circle: state.current_circle?._id === action.payload
          ? null
          : state.current_circle,
        isLoading: false,
        error: null
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }
    default:
      return state
  }
}

// Context类型
interface CircleContextType {
  state: CircleState
  dispatch: React.Dispatch<CircleAction>
}

// 创建Context
const CircleContext = createContext<CircleContextType | undefined>(undefined)

// Provider组件属性
interface CircleProviderProps {
  children: ReactNode
}

/**
 * 圈子状态Provider组件
 */
export function CircleProvider({ children }: CircleProviderProps) {
  const [state, dispatch] = useReducer(circleReducer, initialState)

  return (
    <CircleContext.Provider value={{ state, dispatch }}>
      {children}
    </CircleContext.Provider>
  )
}

/**
 * 使用圈子状态的Hook
 */
export function useCircleState() {
  const context = useContext(CircleContext)
  if (!context) {
    throw new Error('useCircleState must be used within a CircleProvider')
  }
  return context.state
}

/**
 * 使用圈子dispatch的Hook
 */
export function useCircleDispatch() {
  const context = useContext(CircleContext)
  if (!context) {
    throw new Error('useCircleDispatch must be used within a CircleProvider')
  }

  const { dispatch } = context

  /**
   * 设置圈子列表
   */
  const setCircles = (circles: Circle[]) => {
    dispatch({ type: 'SET_CIRCLES', payload: circles })
  }

  /**
   * 设置当前圈子
   */
  const setCurrentCircle = (circle: Circle | null) => {
    dispatch({ type: 'SET_CURRENT_CIRCLE', payload: circle })
    if (circle) {
      Taro.setStorageSync('lastCircleId', circle._id)
    }
  }

  /**
   * 设置成员列表
   */
  const setMembers = (members: CircleMember[]) => {
    dispatch({ type: 'SET_MEMBERS', payload: members })
  }

  /**
   * 添加圈子
   */
  const addCircle = (circle: Circle) => {
    dispatch({ type: 'ADD_CIRCLE', payload: circle })
  }

  /**
   * 更新圈子
   */
  const updateCircle = (circle: Circle) => {
    dispatch({ type: 'UPDATE_CIRCLE', payload: circle })
  }

  /**
   * 删除圈子
   */
  const removeCircle = (circleId: string) => {
    dispatch({ type: 'REMOVE_CIRCLE', payload: circleId })
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
    setCircles,
    setCurrentCircle,
    setMembers,
    addCircle,
    updateCircle,
    removeCircle,
    setLoading,
    setError
  }
}
