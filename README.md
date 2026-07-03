# 像素钓鱼小游戏

星露谷物语风格的像素风钓鱼小游戏，支持 H5 体验与微信小程序。

## 功能

- 抛竿 → 等待 → 咬钩动画 → 点击收杆 → 收集鱼种
- 咬钩时手机震动反馈（H5 / 小程序）
- 4 种环境 × 4 种天气，27 种鱼种
- 鱼种图鉴收集系统（本地存档）
- 像素风 Canvas 渲染

## 快速开始

```bash
npm install
npm run dev:h5
```

浏览器访问 http://localhost:10086

## 微信小程序

```bash
npm run dev:weapp
```

用微信开发者工具打开 `dist` 目录，在 `project.config.json` 中填入你的 AppID。

## 操作说明

1. 选择环境和天气（点击底部切换）
2. 点击「抛竿」开始钓鱼
3. 等待浮漂下沉（咬钩），快速点击屏幕收杆
4. 在「图鉴」中查看已收集的鱼种

## 技术栈

- Taro 4 + React + TypeScript
- Canvas 2D 像素渲染
- Zustand 状态管理
