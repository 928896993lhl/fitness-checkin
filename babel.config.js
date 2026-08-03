// babel-preset-taro 自动处理 Taro 的 JSX 转换
// 详细文档见 https://taro-docs.jd.com/docs/next/babel-config
module.exports = {
  presets: [
    ['taro', {
      framework: 'react',
      ts: true
    }]
  ],
  plugins: [
    // 支持装饰器语法（用于 mobx 等）
    // ["@babel/plugin-proposal-decorators", { "legacy": true }],
    // 支持可选链和空值合并
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator"
  ]
}
