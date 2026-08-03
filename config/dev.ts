import type { UserConfigExport } from '@tarojs/cli'

// 开发环境配置
export default {
  logger: {
    quiet: false,
    stats: true
  },
  mini: {},
  h5: {}
} satisfies UserConfigExport
