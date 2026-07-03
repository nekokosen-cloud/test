# Space Ball

iOS 重力滚球迷宫原型：倾斜手机，让小球在 3D 甬道中滚动，落入虫洞过关。

## 玩法

- **固定俯视视角**，迷宫不旋转镜头
- **倾斜手机**控制迷宫平台倾斜，利用重力滚球
- **技巧向**：限时、掉出轨道即失败
- **每关不同**：第 1 关「深空站」、第 2 关「星云桥」（窄桥更高难度）

## 技术栈

| 模块 | 技术 |
|------|------|
| UI | SwiftUI |
| 3D / 物理 | SceneKit |
| 重力感应 | CoreMotion |
| 最低系统 | iOS 16+ |

## 运行方式

1. 用 **Xcode 15+** 打开 `SpaceBall/SpaceBall.xcodeproj`
2. 选择真机（推荐）或模拟器目标
3. `Cmd + R` 运行

> **注意**：重力感应在真机上体验最佳。模拟器可通过 `Device > Shake` 或传感器模拟菜单测试，但手感不如真机。

## 项目结构

```
SpaceBall/
├── App/                 # 入口
├── Views/               # SwiftUI 界面 + HUD
├── Game/                # 场景控制、物理、重力
├── Levels/              # 各关卡定义（每关独立主题与路线）
├── Models/              # 游戏状态与关卡协议
└── Resources/           # 资源
```

## 关卡扩展

新增关卡只需：

1. 在 `Levels/` 新建文件，实现 `LevelBuilding` 协议
2. 在 `LevelManager.swift` 的 `levels` 数组中注册

```swift
struct Level3Asteroid: LevelBuilding {
    let levelNumber = 3
    let themeName = "小行星带"
    let timeLimit: TimeInterval = 35

    func build(into container: SCNNode) -> LevelContext {
        // 用 MazeBuilder.makeCorridor 拼路线
        // 返回出生点、洞口、限时等
    }
}
```

## 原型范围

- [x] 太空主题第 1 关
- [x] 固定俯视 3D 相机
- [x] CoreMotion 重力倾斜
- [x] SceneKit 物理滚球
- [x] 进洞胜利 / 掉出失败 / 超时失败
- [x] 第 2 关不同布局预览
- [ ] 音效、更多关卡、星级评价（后续迭代）

## 操作提示

| 状态 | 操作 |
|------|------|
| 开始界面 | 点击「开始」 |
| 游戏中 | 倾斜手机滚球 |
| 过关 | 「下一关」或「再玩一次」 |
| 失败 | 「重试」 |
