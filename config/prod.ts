import type { UserConfigExport } from '@tarojs/cli'

// 生产环境配置
export default {
  mini: {},
  h5: {
    /**
     * WebpackChain 简介
     * webpack-chain 通过链式 API 创建和修改 webpack 配置。
     * 配置项相关文档：https://github.com/neutrinojs/webpack-chain
     */
    // webpackChain (chain) {
    //   /**
    //    * 如果 h5 端编译后体积过大，可以使用 webpack-bundle-analyzer 插件对打包体积进行全面分析。
    //    * @see https://github.com/webpack-contrib/webpack-bundle-analyzer
    //    */
    //   chain.plugin('analyzer')
    //     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, [])
    // }
  }
} satisfies UserConfigExport
