# 像素钓鱼小游戏

星露谷物语风格的像素风钓鱼小游戏，支持 H5 体验与**微信小游戏**。

## 功能

- 抛竿 → 等待 → 咬钩动画 → 点击收杆 → 收集鱼种
- 咬钩时手机震动反馈（H5 / 微信小游戏）
- 4 种环境 × 4 种天气，27 种鱼种
- 鱼种图鉴收集系统（本地存档）
- 像素风 Canvas 渲染

> H5 版还包含「锦鲤池塘」养成玩法；微信小游戏版目前为「钓鱼 + 图鉴」两个 Tab。

## 在线体验（手机直接打开）

**H5 地址：** https://nekokosen-cloud.github.io/test/

iPhone Safari 直接打开上面的链接即可，无需开电脑。

## 微信小游戏（推荐）

本项目面向 **微信小游戏** 账号（入口为 `game.js` + `game.json`，不是小程序的 `app.json`）。

### 方式一：本地打包

```bash
npm install
npm run build:minigame
```

1. 打开 **微信开发者工具**
2. 选择 **导入项目**
3. 目录选择项目里的 **`game-dist`** 文件夹
4. AppID：填你的**小游戏** AppID（例如 `wx2f02c0b1839018b2`）
5. 项目类型选 **「小游戏」**（不要选「小程序」）
6. 点击编译，再点 **预览** 或 **真机调试** 扫码测试

开发时可用监听模式，改代码自动重新编译：

```bash
npm run dev:minigame
```

开发者工具导入 **`game-dist`** 目录，保持 `npm run dev:minigame` 在运行。

### 方式二：下载 GitHub 构建包

仓库 Actions → **Build MiniGame** → 最新一次运行 → 下载 `pixel-fishing-minigame` 压缩包，解压后用微信开发者工具导入解压后的文件夹。

### 发布前

1. 在 [`minigame-static/project.config.json`](minigame-static/project.config.json) 填入真实 **小游戏 AppID**
2. `npm run build:minigame` 重新打包
3. 开发者工具 → **上传** → 公众平台提交审核

### 检查清单

```
game-dist/
├── game.js              ← 小游戏入口
├── game.json            ← 必须有
└── project.config.json  ← compileType 应为 "game"
```

### 常见错误：`game.json 未找到`

通常是因为导入了 **`dist/`**（小程序包）而不是 **`game-dist/`**（小游戏包），或 AppID 类型与项目不匹配。

**解决办法：**

1. 确认 AppID 是 **「小游戏」** 账号
2. 导入目录必须是含 **`game.json`** 的 `game-dist` 文件夹
3. 开发者工具里项目类型选 **「小游戏」**

## H5 开发

```bash
npm run dev:h5
npm run build:h5
```

## 操作说明

1. 选择环境和天气（点击底部切换）
2. 点击「抛竿」开始钓鱼
3. 等待浮漂下沉（咬钩），快速点击屏幕收杆
4. 在「图鉴」中查看已收集的鱼种

## 技术栈

- **H5 / 图鉴完整版**：Taro 4 + React + TypeScript + Zustand
- **微信小游戏版**：TypeScript + Canvas 2D + Webpack
- 共享游戏逻辑：钓鱼状态机、掉落算法、像素渲染、鱼种数据
