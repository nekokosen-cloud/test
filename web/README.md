# Space Ball · Safari 网页版

在 iPhone Safari 中直接玩的 3D 重力滚球迷宫原型。

## 玩法

1. 用 **Safari** 打开游戏页面
2. 点击 **「授权并开始」**（iOS 需要允许「动作与方向」传感器）
3. **倾斜手机** 控制小球滚进虫洞
4. 限时内进洞过关，掉出轨道或超时失败

## 立即开玩（已部署）

iPhone **Safari** 直接打开：

**https://cdn.jsdelivr.net/gh/nekokosen-cloud/test@main/web/index.html**

1. 点击 **「授权并开始」**
2. 允许 **「动作与方向」** 传感器
3. 倾斜手机，把球滚进虫洞

> 这是通过 jsDelivr CDN 从 GitHub 自动发布的 HTTPS 版本，推送 `main` 分支后约 1 分钟生效。

## GitHub Pages（可选，需仓库主手动开启一次）

若希望使用更短的域名 `https://nekokosen-cloud.github.io/test/`：

1. GitHub 仓库 → **Settings → Pages**
2. **Build and deployment** → Source 选 **GitHub Actions**
3. 保存后 Actions 会自动部署

当前 Actions 因仓库 Pages 未开启而暂时失败，**不影响上面的 CDN 链接**。

## 技术

| 模块 | 方案 |
|------|------|
| 3D | Three.js |
| 重力 | DeviceOrientation API |
| 物理 | 自研滚球 + 甬道碰撞 |
| 关卡 | 第 1 关深空站、第 2 关星云桥 |

## 文件结构

```
web/
├── index.html
├── css/style.css
└── js/
    ├── app.js       # 主循环、UI、权限
    ├── levels.js    # 关卡数据
    ├── maze.js      # 3D 迷宫构建
    └── physics.js   # 滚球物理
```

## 与 iOS 原生版关系

- 玩法、关卡路线与 Swift 原型一致
- 网页版可在 iPhone Safari 直接体验，无需 Mac
- 原生版（`SpaceBall/`）手感与性能更好，适合后续上架
