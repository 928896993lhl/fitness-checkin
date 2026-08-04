export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/login',
    'pages/circle/circle',
    'pages/circle/detail/detail',
    'pages/circle/create/create',
    'pages/circle/join/join',
    'pages/plan/create/create',
    'pages/plan/detail/detail',
    'pages/checkin/checkin',
    'pages/profile/profile',
    'pages/profile/history/history'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '健身打卡',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f5f5'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#3b82f6',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/circle/circle',
        text: '圈子',
        iconPath: 'assets/tabbar/circle.png',
        selectedIconPath: 'assets/tabbar/circle-active.png'
      },
      {
        pagePath: 'pages/profile/profile',
        text: '我的',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile-active.png'
      }
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '用于获取您的运动位置信息'
    }
  },
  cloud: false,
  style: 'v2',
  sitemapLocation: 'sitemap.json'
})
