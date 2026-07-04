# 像素钓鱼小游戏

星露谷物语风格的像素风钓鱼小游戏，支持 H5 体验与微信小程序。

## 功能

- 抛竿 → 等待 → 咬钩动画 → 点击收杆 → 收集鱼种
- 咬钩时手机震动反馈（H5 / 小程序）
- 4 种环境 × 4 种天气，27 种鱼种
- 鱼种图鉴收集系统（本地存档）
- **锦鲤池塘**：喂食、互动、看锦鲤长大，喂太多会撑死
- 像素风 Canvas 渲染

## 在线体验（手机直接打开）

**H5 地址：** https://nekokosen-cloud.github.io/test/

iPhone Safari 直接打开上面的链接即可，无需开电脑。

## 微信小程序

### 方式一：本地打包（推荐）

```bash
npm install
npm run build:weapp
```

1. 打开 **微信开发者工具**
2. 选择 **导入项目**
3. 目录选择项目里的 **`dist`** 文件夹（不是整个项目根目录）
4. AppID：填你的小程序 AppID（没有可先选「测试号」体验）
5. 点击编译，再点 **预览** 扫码真机测试

开发时可用监听模式，改代码自动重新编译：

```bash
npm run dev:weapp
```

开发者工具导入 **项目根目录**（含 `project.config.json`，`miniprogramRoot` 指向 `dist/`），保持 `npm run dev:weapp` 在运行。

### 方式二：下载 GitHub 构建包

仓库 Actions → **Build WeApp** → 最新一次运行 → 下载 `pixel-fishing-weapp` 压缩包，解压后用微信开发者工具导入解压后的文件夹。

### 发布前

1. 在 [`project.config.json`](project.config.json) 和 [`dist/project.config.json`](dist/project.config.json) 填入真实 **AppID**
2. `npm run build:weapp` 重新打包
3. 开发者工具 → **上传** → 公众平台提交审核

## 操作说明

1. 选择环境和天气（点击底部切换）
2. 点击「抛竿」开始钓鱼
3. 等待浮漂下沉（咬钩），快速点击屏幕收杆
4. 在「图鉴」中查看已收集的鱼种
5. 在「锦鲤」中领养锦鲤，喂食互动，看着它长大（钓到金锦鲤有金色皮肤加成）

## 锦鲤池塘

1. 从钓鱼页点击「锦鲤」进入池塘
2. 给锦鲤取名并开始养成
3. 点击「喂食」或「摸摸」与锦鲤互动，也可以直接点击池塘里的锦鲤
4. 注意饱食度——喂太多会撑死！长期不喂也会饿坏
5. 合理照顾下，锦鲤会从小幼鲤慢慢长成传说锦鲤

## 技术栈

- Taro 4 + React + TypeScript
- Canvas 2D 像素渲染
- Zustand 状态管理
