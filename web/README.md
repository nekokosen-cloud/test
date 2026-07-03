# Space Ball · Safari 网页版

在 iPhone Safari 中直接玩的 3D 重力滚球迷宫原型。

## 玩法

1. 用 **Safari** 打开游戏页面
2. 点击 **「授权并开始」**（iOS 需要允许「动作与方向」传感器）
3. **倾斜手机** 控制小球滚进虫洞
4. 限时内进洞过关，掉出轨道或超时失败

## 本地预览

需要 **HTTPS 或 localhost**，否则 iOS 不会开放陀螺仪权限。

```bash
cd web
python3 -m http.server 8080
```

同一 Wi‑Fi 下，iPhone Safari 打开：

```
http://<你的电脑IP>:8080
```

> 局域网 HTTP 下 iOS 可能仍拒绝传感器。更稳妥的方式是用 GitHub Pages（HTTPS）。

## GitHub Pages 部署

1. 仓库 **Settings → Pages**
2. Source 选 **Deploy from a branch**
3. Branch 选 `main`，目录选 **`/web`**
4. 保存后访问：`https://<用户名>.github.io/<仓库名>/`

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
