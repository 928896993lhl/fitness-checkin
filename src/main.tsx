import { createApp } from '@tarojs/taro'
import App from './app'

// 创建Taro应用实例
const app = createApp(App)

// 全局错误处理
app.config = {
  ...app.config,
  onError(error: string) {
    console.error('应用全局错误:', error)
    // 可以在此处上报错误到监控系统
  },
  onPageNotFound(res: any) {
    console.error('页面不存在:', res)
    // 可以在此处处理404页面
  }
}

export default app
