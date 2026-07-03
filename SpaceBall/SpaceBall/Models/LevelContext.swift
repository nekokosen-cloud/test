import SceneKit

struct LevelContext {
    let levelNumber: Int
    let themeName: String
    let timeLimit: TimeInterval
    let ballSpawn: SCNVector3
    let holePosition: SCNVector3
    let holeRadius: Float
    let fallThreshold: Float
}

protocol LevelBuilding {
    var levelNumber: Int { get }
    var themeName: String { get }
    var timeLimit: TimeInterval { get }

    func build(into container: SCNNode) -> LevelContext
}
