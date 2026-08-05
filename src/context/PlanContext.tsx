import { createContext, useContext, useReducer, ReactNode } from 'react'
import { Plan, PlanProgress, PlanState } from '../types'

// 初始状态
const initialState: PlanState = {
  plans: [],
  currentPlan: null,
  progress: null,
  isLoading: false,
  error: null
}

// Action类型
type PlanAction =
  | { type: 'SET_PLANS'; payload: Plan[] }
  | { type: 'SET_CURRENT_PLAN'; payload: Plan | null }
  | { type: 'SET_PROGRESS'; payload: PlanProgress | null }
  | { type: 'ADD_PLAN'; payload: Plan }
  | { type: 'UPDATE_PLAN'; payload: Plan }
  | { type: 'REMOVE_PLAN'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

// Reducer函数
function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case 'SET_PLANS':
      return {
        ...state,
        plans: action.payload,
        isLoading: false,
        error: null
      }
    case 'SET_CURRENT_PLAN':
      return {
        ...state,
        currentPlan: action.payload,
        isLoading: false,
        error: null
      }
    case 'SET_PROGRESS':
      return {
        ...state,
        progress: action.payload,
        isLoading: false,
        error: null
      }
    case 'ADD_PLAN':
      return {
        ...state,
        plans: [...state.plans, action.payload],
        isLoading: false,
        error: null
      }
    case 'UPDATE_PLAN':
      return {
        ...state,
        plans: state.plans.map(plan =>
          plan.planId === action.payload.planId ? action.payload : plan
        ),
        currentPlan: state.currentPlan?.planId === action.payload.planId
          ? action.payload
          : state.currentPlan,
        isLoading: false,
        error: null
      }
    case 'REMOVE_PLAN':
      return {
        ...state,
        plans: state.plans.filter(plan => plan.planId !== action.payload),
        currentPlan: state.currentPlan?.planId === action.payload
          ? null
          : state.currentPlan,
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
interface PlanContextType {
  state: PlanState
  dispatch: React.Dispatch<PlanAction>
}

// 创建Context
const PlanContext = createContext<PlanContextType | undefined>(undefined)

// Provider组件属性
interface PlanProviderProps {
  children: ReactNode
}

/**
 * 计划状态Provider组件
 */
export function PlanProvider({ children }: PlanProviderProps) {
  const [state, dispatch] = useReducer(planReducer, initialState)

  return (
    <PlanContext.Provider value={{ state, dispatch }}>
      {children}
    </PlanContext.Provider>
  )
}

/**
 * 使用计划状态的Hook
 */
export function usePlanState() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('usePlanState must be used within a PlanProvider')
  }
  return context.state
}

/**
 * 使用计划dispatch的Hook
 */
export function usePlanDispatch() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('usePlanDispatch must be used within a PlanProvider')
  }

  const { dispatch } = context

  /**
   * 设置计划列表
   */
  const setPlans = (plans: Plan[]) => {
    dispatch({ type: 'SET_PLANS', payload: plans })
  }

  /**
   * 设置当前计划
   */
  const setCurrentPlan = (plan: Plan | null) => {
    dispatch({ type: 'SET_CURRENT_PLAN', payload: plan })
  }

  /**
   * 设置进度
   */
  const setProgress = (progress: PlanProgress | null) => {
    dispatch({ type: 'SET_PROGRESS', payload: progress })
  }

  /**
   * 添加计划
   */
  const addPlan = (plan: Plan) => {
    dispatch({ type: 'ADD_PLAN', payload: plan })
  }

  /**
   * 更新计划
   */
  const updatePlan = (plan: Plan) => {
    dispatch({ type: 'UPDATE_PLAN', payload: plan })
  }

  /**
   * 删除计划
   */
  const removePlan = (planId: string) => {
    dispatch({ type: 'REMOVE_PLAN', payload: planId })
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
    setPlans,
    setCurrentPlan,
    setProgress,
    addPlan,
    updatePlan,
    removePlan,
    setLoading,
    setError
  }
}
