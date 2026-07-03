import SceneKit
import UIKit

struct Level1Space: LevelBuilding {
    let levelNumber = 1
    let themeName = "深空站"
    let timeLimit: TimeInterval = 45

    func build(into container: SCNNode) -> LevelContext {
        let floorMaterial = MaterialFactory.spaceFloor()
        let wallMaterial = MaterialFactory.spaceWall()
        let ringMaterial = MaterialFactory.portalRing()
        let glowMaterial = MaterialFactory.portalGlow()

        let spawn = SCNVector3(-3.8, 0.25, -3.2)
        let holePosition = SCNVector3(1.2, 0, 3.75)

        let segments: [(SCNVector3, SCNVector3)] = [
            (SCNVector3(-3.8, 0, -3.2), SCNVector3(-3.8, 0, -0.8)),
            (SCNVector3(-3.8, 0, -0.8), SCNVector3(-1.0, 0, -0.8)),
            (SCNVector3(-1.0, 0, -0.8), SCNVector3(-1.0, 0, 1.4)),
            (SCNVector3(-1.0, 0, 1.4), SCNVector3(1.2, 0, 1.4)),
            (SCNVector3(1.2, 0, 1.4), SCNVector3(1.2, 0, 3.2))
        ]

        for (start, end) in segments {
            let corridor = MazeBuilder.makeCorridor(
                from: start,
                to: end,
                width: 1.15,
                wallHeight: 0.28,
                floorThickness: 0.12,
                wallMaterial: wallMaterial,
                floorMaterial: floorMaterial
            )
            corridor.forEach { container.addChildNode($0) }
        }

        addStartPad(at: spawn, container: container)
        addSpaceDecorations(to: container)

        let hole = MazeBuilder.makeHole(
            at: holePosition,
            radius: 0.34,
            ringMaterial: ringMaterial,
            glowMaterial: glowMaterial
        )
        container.addChildNode(hole)

        return LevelContext(
            levelNumber: levelNumber,
            themeName: themeName,
            timeLimit: timeLimit,
            ballSpawn: spawn,
            holePosition: holePosition,
            holeRadius: 0.34,
            fallThreshold: -1.2
        )
    }

    private func addStartPad(at position: SCNVector3, container: SCNNode) {
        let pad = SCNCylinder(radius: 0.35, height: 0.03)
        pad.firstMaterial = MaterialFactory.startPad()
        let node = SCNNode(geometry: pad)
        node.position = SCNVector3(position.x, 0.02, position.z)
        container.addChildNode(node)
    }

    private func addSpaceDecorations(to container: SCNNode) {
        let starfield = SCNParticleSystem()
        starfield.particleColor = UIColor.white
        starfield.particleSize = 0.015
        starfield.particleLifeSpan = 8
        starfield.birthRate = 18
        starfield.emissionDuration = 0
        starfield.spreadingAngle = 180
        starfield.particleVelocity = 0
        starfield.blendMode = .additive
        starfield.emitterShape = SCNSphere(radius: 12)
        let stars = SCNNode()
        stars.position = SCNVector3(0, 6, 0)
        stars.addParticleSystem(starfield)
        container.addChildNode(stars)

        let beacon = SCNLight()
        beacon.type = .omni
        beacon.color = UIColor(red: 0.3, green: 0.85, blue: 1.0, alpha: 1.0)
        beacon.intensity = 700
        let beaconNode = SCNNode()
        beaconNode.light = beacon
        beaconNode.position = SCNVector3(1.2, 1.2, 3.75)
        container.addChildNode(beaconNode)
    }
}
