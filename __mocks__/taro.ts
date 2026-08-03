/**
 * Taro Mock - 模拟微信小程序Taro API
 */

const storage: Record<string, any> = {}

const Taro = {
  // 云开发
  cloud: {
    init: jest.fn(),
    callFunction: jest.fn(),
    uploadFile: jest.fn(),
    getTempFileURL: jest.fn(),
    DYNAMIC_CURRENT_ENV: 'test-env'
  },

  // 存储
  setStorageSync: jest.fn((key: string, value: any) => {
    storage[key] = value
  }),
  getStorageSync: jest.fn((key: string) => {
    return storage[key] || ''
  }),
  removeStorageSync: jest.fn((key: string) => {
    delete storage[key]
  }),
  clearStorageSync: jest.fn(() => {
    Object.keys(storage).forEach(k => delete storage[k])
  }),
  getStorageInfoSync: jest.fn(() => ({
    keys: Object.keys(storage),
    currentSize: 100,
    limitSize: 10240
  })),

  // 导航
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  redirectTo: jest.fn(),
  switchTab: jest.fn(),
  reLaunch: jest.fn(),

  // UI
  showToast: jest.fn(),
  showModal: jest.fn(),
  hideToast: jest.fn(),
  showShareMenu: jest.fn(),
  setClipboardData: jest.fn(),
  openSetting: jest.fn(),

  // 登录
  login: jest.fn(),
  getUserProfile: jest.fn(),
  getUserInfo: jest.fn(),

  // 图片
  chooseImage: jest.fn(),
  compressImage: jest.fn(),
  getImageInfo: jest.fn(),
  getFileInfo: jest.fn(),
  previewImage: jest.fn(),
  saveImageToPhotosAlbum: jest.fn(),
  getFileSystemManager: jest.fn(),
  canvasToTempFilePath: jest.fn(),
  createSelectorQuery: jest.fn(),

  // 路由
  useRouter: jest.fn(() => ({
    params: {}
  })),

  // 生命周期
  useDidShow: jest.fn((callback: () => void) => callback()),
  useDidHide: jest.fn(),
  usePullDownRefresh: jest.fn(),
  stopPullDownRefresh: jest.fn(),
  useShareAppMessage: jest.fn(),
  useReachBottom: jest.fn(),
  usePageScroll: jest.fn()
}

export default Taro
export const {
  cloud,
  setStorageSync,
  getStorageSync,
  removeStorageSync,
  clearStorageSync,
  getStorageInfoSync,
  navigateTo,
  navigateBack,
  redirectTo,
  switchTab,
  showToast,
  showModal,
  hideToast,
  login,
  getUserProfile,
  chooseImage,
  compressImage,
  getImageInfo,
  getFileInfo,
  previewImage,
  saveImageToPhotosAlbum,
  useRouter,
  useDidShow,
  useDidHide,
  usePullDownRefresh,
  stopPullDownRefresh,
  useShareAppMessage
} = Taro
