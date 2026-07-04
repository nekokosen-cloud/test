export default defineAppConfig({
  pages: [
    'pages/fishing/index',
    'pages/encyclopedia/index',
    'pages/koi/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#5FA088',
    navigationBarTitleText: '像素钓鱼',
    navigationBarTextStyle: 'white',
    backgroundColor: '#2A4A3A',
  },
});

function defineAppConfig(config: Taro.AppConfig): Taro.AppConfig {
  return config;
}
