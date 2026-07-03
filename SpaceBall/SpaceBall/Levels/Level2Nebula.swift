import SceneKit
import UIKit

struct Level2Nebula: LevelBuilding {
    let levelNumber = 2
    let themeName = "星云桥"
    let timeLimit: TimeInterval = 40

    func build(into container: SCNNode) -> LevelContext {
        let floorMaterial = MaterialFactory.nebulaFloor()
        let wallMaterial = MaterialFactory.nebulaWall()
        let ringMaterial = MaterialFactory.portalRing(color: UIColor(red: 1.0, green: 0.45, blue: 0.95, alpha: 1.0))
        let glowMaterial = MaterialFactory.portalGlow(color: UIColor(red: 0.9, green: 0.2, blue: 0.8, alpha: 0.85))

        let spawn = SCNVector3(0, 0.25, -4.2)
        let holePosition = SCNVector3(0, 0, 4.2)

        let segments: [(SCNVector3, SCNVector3)] = [
            (SCNVector3(0, 0, -4.2), SCNVector3(0, 0, -1.8)),
            (SCNVector3(0, 0, -1.8), SCNVector3(-2.2, 0, 0.2)),
            (SCNVector3(-2.2, 0, 0.2), SCNVector3(2.2, 0, 0.2)),
            (SCNVector3(2.2, 0, 0.2), SCNVector3(0, 0, 2.2)),
            (SCNVector3(0, 0, 2.2), SCNVector3(0, 0, 3.6))
        ]

        for (start, end) in segments {
            let width: Float = (start.z == end.z && abs(start.x - end.x) > 3.0) ? 0.72 : 1.0
            let corridor = MazeBuilder.makeCorridor(
                from: start,
                to: end,
                width: width,
                wallHeight: 0.24,
                floorThickness: 0.1,
                wallMaterial: wallMaterial,
                floorMaterial: floorMaterial
            )
            corridor.forEach { container.addChildNode($0) }
        }

        let hole = MazeBuilder.makeHole(
            at: holePosition,
            radius: 0.32,
            ringMaterial: ringMaterial,
            glowMaterial: glowMaterial
        )
        container.addChildNode(hole)

        addNebulaBackground(to: container)

        return LevelContext(
            levelNumber: levelNumber,
            themeName: themeName,
            timeLimit: timeLimit,
            ballSpawn: spawn,
            holePosition: holePosition,
            holeRadius: 0.32,
            fallThreshold: -1.2
        )
    }

    private func addNebulaBackground(to container: SCNNode) {
        let mist = SCNParticleSystem()
        mist.particleColor = UIColor(red: 0.55, green: 0.2, blue: 0.85, alpha: 0.35)
        mist.particleSize = 0.25
        mist.particleLifeSpan = 4
        mist.birthRate = 6
        mist.spreadingAngle = 35
        mist.particleVelocity = 0.08
        mist.blendMode = .additive
        mist.emitterShape = SCNBox(width: 10, height: 1, length: 10, chamferRadius: 0)
        let mistNode = SCNNode()
        mistNode.position = SCNVector3(0, -0.5, 0)
        mistNode.addParticleSystem(mist)
        container.addChildNode(mistNode)
    }
}
