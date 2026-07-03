import Combine
import SceneKit
import UIKit

final class GameSceneController: NSObject, ObservableObject, SCNSceneRendererDelegate, SCNPhysicsContactDelegate {
    @Published var phase: GamePhase = .ready
    @Published var remainingTime: TimeInterval = 0
    @Published var levelTitle: String = ""
    @Published var hintText: String = "倾斜手机，把小球滚进虫洞"

    let scene = SCNScene()
    let motionManager = MotionManager()
    let levelManager = LevelManager()

    private let mazeContainer = SCNNode()
    private var ballNode: SCNNode?
    private var levelContext: LevelContext?
    private(set) var currentLevelIndex = 1
    private var elapsedTime: TimeInterval = 0
    private var lastFrameTime: TimeInterval?
    private var isRunning = false

    var hasNextLevel: Bool {
        levelManager.level(for: currentLevelIndex + 1) != nil
    }

    override init() {
        super.init()
        setupScene()
    }

    func loadLevel(_ index: Int) {
        currentLevelIndex = index
        phase = .ready
        elapsedTime = 0
        lastFrameTime = nil
        isRunning = false

        mazeContainer.childNodes.forEach { $0.removeFromParentNode() }
        ballNode?.removeFromParentNode()
        ballNode = nil

        guard let level = levelManager.level(for: index) else { return }
        levelContext = level.build(into: mazeContainer)

        guard let context = levelContext else { return }
        remainingTime = context.timeLimit
        levelTitle = "第 \(context.levelNumber) 关 · \(context.themeName)"
        hintText = "限时 \(Int(context.timeLimit)) 秒 · 掉出轨道即失败"

        let ballMaterial: SCNMaterial = index == 2
            ? MaterialFactory.energyBall(color: UIColor(red: 1.0, green: 0.7, blue: 0.95, alpha: 1.0))
            : MaterialFactory.energyBall()

        let ball = MazeBuilder.makeBall(at: context.ballSpawn, material: ballMaterial)
        ballNode = ball
        mazeContainer.addChildNode(ball)

        mazeContainer.eulerAngles = SCNVector3Zero
    }

    func startLevel() {
        guard levelContext != nil else { return }
        phase = .playing
        elapsedTime = 0
        lastFrameTime = nil
        isRunning = true
        motionManager.start { [weak self] tilt in
            self?.applyTilt(tilt)
        }
    }

    func retryLevel() {
        loadLevel(currentLevelIndex)
        startLevel()
    }

    func nextLevel() {
        let next = currentLevelIndex + 1
        if levelManager.level(for: next) != nil {
            loadLevel(next)
            startLevel()
        } else {
            loadLevel(1)
            startLevel()
        }
    }

    private func setupScene() {
        scene.background.contents = UIColor(red: 0.01, green: 0.02, blue: 0.06, alpha: 1.0)
        scene.physicsWorld.gravity = SCNVector3(0, -9.8, 0)
        scene.physicsWorld.contactDelegate = self

        let ambient = SCNLight()
        ambient.type = .ambient
        ambient.color = UIColor(white: 0.25, alpha: 1.0)
        let ambientNode = SCNNode()
        ambientNode.light = ambient
        scene.rootNode.addChildNode(ambientNode)

        let key = SCNLight()
        key.type = .directional
        key.color = UIColor(white: 0.95, alpha: 1.0)
        key.intensity = 900
        let keyNode = SCNNode()
        keyNode.light = key
        keyNode.eulerAngles = SCNVector3(-1.1, 0.6, 0)
        scene.rootNode.addChildNode(keyNode)

        scene.rootNode.addChildNode(mazeContainer)

        let cameraNode = SCNNode()
        cameraNode.name = "camera"
        cameraNode.camera = SCNCamera()
        cameraNode.camera?.usesOrthographicProjection = false
        cameraNode.camera?.fieldOfView = 42
        cameraNode.camera?.zFar = 100
        cameraNode.position = SCNVector3(0, 11.5, 0.01)
        cameraNode.eulerAngles = SCNVector3(-Float.pi / 2 + 0.001, 0, 0)
        scene.rootNode.addChildNode(cameraNode)

        loadLevel(1)
    }

    private func applyTilt(_ tilt: SCNVector3) {
        guard isRunning else { return }
        SCNTransaction.begin()
        SCNTransaction.animationDuration = 0.08
        mazeContainer.eulerAngles = SCNVector3(tilt.x, 0, tilt.z)
        SCNTransaction.commit()
    }

    func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
        guard isRunning, let context = levelContext else { return }

        if let lastFrameTime {
            elapsedTime += time - lastFrameTime
        }
        self.lastFrameTime = time

        let left = max(0, context.timeLimit - elapsedTime)

        DispatchQueue.main.async {
            self.remainingTime = left
        }

        if left <= 0 {
            fail(reason: "时间耗尽")
            return
        }

        guard let ball = ballNode else { return }

        if ball.position.y < context.fallThreshold {
            fail(reason: "坠出轨道")
            return
        }

        let dx = ball.position.x - context.holePosition.x
        let dz = ball.position.z - context.holePosition.z
        let horizontalDistance = sqrt(dx * dx + dz * dz)

        if horizontalDistance < context.holeRadius * 0.55 && ball.position.y < 0.05 {
            win()
        }
    }

    func physicsWorld(_ world: SCNPhysicsWorld, didBegin contact: SCNPhysicsContact) {
        // 接触检测备用；主判定在 renderer 中做距离检测
    }

    private func win() {
        guard isRunning else { return }
        isRunning = false
        motionManager.stop()
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()

        DispatchQueue.main.async {
            self.phase = .won
            self.hintText = "虫洞捕获成功！"
        }
    }

    private func fail(reason: String) {
        guard isRunning else { return }
        isRunning = false
        motionManager.stop()
        UINotificationFeedbackGenerator().notificationOccurred(.error)

        DispatchQueue.main.async {
            self.phase = .lost(reason: reason)
            self.hintText = reason
        }
    }
}
