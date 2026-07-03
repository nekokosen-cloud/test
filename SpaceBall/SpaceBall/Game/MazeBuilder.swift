import SceneKit

enum MazeBuilder {
    static func makeCorridor(
        from start: SCNVector3,
        to end: SCNVector3,
        width: Float,
        wallHeight: Float,
        floorThickness: Float,
        wallMaterial: SCNMaterial,
        floorMaterial: SCNMaterial
    ) -> [SCNNode] {
        let delta = end - start
        let length = delta.length()
        guard length > 0.001 else { return [] }

        let center = (start + end) * 0.5
        let direction = delta.normalized()
        let angle = atan2(direction.x, direction.z)

        var nodes: [SCNNode] = []

        let floor = SCNBox(width: CGFloat(width), height: CGFloat(floorThickness), length: CGFloat(length), chamferRadius: 0.02)
        floor.firstMaterial = floorMaterial
        let floorNode = SCNNode(geometry: floor)
        floorNode.position = SCNVector3(center.x, start.y - floorThickness * 0.5, center.z)
        floorNode.eulerAngles.y = angle
        floorNode.name = "floor"
        floorNode.physicsBody = SCNPhysicsBody(type: .static, shape: nil)
        floorNode.physicsBody?.friction = 0.35
        floorNode.physicsBody?.restitution = 0.05
        floorNode.physicsBody?.categoryBitMask = PhysicsCategory.floor
        nodes.append(floorNode)

        let wallLength = length
        let wallThickness: Float = 0.08

        for side in [-1.0 as Float, 1.0 as Float] {
            let wall = SCNBox(
                width: CGFloat(wallThickness),
                height: CGFloat(wallHeight),
                length: CGFloat(wallLength),
                chamferRadius: 0.01
            )
            wall.firstMaterial = wallMaterial

            let wallNode = SCNNode(geometry: wall)
            let offset = SCNVector3(-direction.z, 0, direction.x) * (width * 0.5 + wallThickness * 0.5) * side
            wallNode.position = center + offset + SCNVector3(0, wallHeight * 0.5, 0)
            wallNode.eulerAngles.y = angle
            wallNode.name = "wall"
            wallNode.physicsBody = SCNPhysicsBody(type: .static, shape: nil)
            wallNode.physicsBody?.friction = 0.2
            wallNode.physicsBody?.restitution = 0.1
            wallNode.physicsBody?.categoryBitMask = PhysicsCategory.wall
            nodes.append(wallNode)
        }

        return nodes
    }

    static func makeHole(
        at position: SCNVector3,
        radius: Float,
        ringMaterial: SCNMaterial,
        glowMaterial: SCNMaterial
    ) -> SCNNode {
        let container = SCNNode()
        container.name = "hole"
        container.position = position

        let ring = SCNTorus(ringRadius: CGFloat(radius), pipeRadius: 0.04)
        ring.firstMaterial = ringMaterial
        let ringNode = SCNNode(geometry: ring)
        ringNode.eulerAngles.x = .pi / 2
        ringNode.position = SCNVector3(0, 0.02, 0)
        container.addChildNode(ringNode)

        let glow = SCNCylinder(radius: CGFloat(radius * 0.85), height: 0.02)
        glow.firstMaterial = glowMaterial
        let glowNode = SCNNode(geometry: glow)
        glowNode.position = SCNVector3(0, -0.01, 0)
        container.addChildNode(glowNode)

        let sensor = SCNCylinder(radius: CGFloat(radius * 0.75), height: 0.2)
        sensor.firstMaterial?.diffuse.contents = UIColor.clear
        let sensorNode = SCNNode(geometry: sensor)
        sensorNode.position = SCNVector3(0, -0.08, 0)
        sensorNode.name = "holeSensor"
        sensorNode.physicsBody = SCNPhysicsBody(type: .static, shape: nil)
        sensorNode.physicsBody?.isAffectedByGravity = false
        sensorNode.physicsBody?.categoryBitMask = PhysicsCategory.hole
        sensorNode.physicsBody?.collisionBitMask = 0
        sensorNode.physicsBody?.contactTestBitMask = PhysicsCategory.ball
        container.addChildNode(sensorNode)

        return container
    }

    static func makeBall(at position: SCNVector3, material: SCNMaterial, radius: Float = 0.14) -> SCNNode {
        let sphere = SCNSphere(radius: CGFloat(radius))
        sphere.firstMaterial = material

        let ball = SCNNode(geometry: sphere)
        ball.name = "ball"
        ball.position = position

        ball.physicsBody = SCNPhysicsBody(type: .dynamic, shape: nil)
        ball.physicsBody?.mass = 0.35
        ball.physicsBody?.friction = 0.18
        ball.physicsBody?.rollingFriction = 0.04
        ball.physicsBody?.restitution = 0.12
        ball.physicsBody?.angularDamping = 0.35
        ball.physicsBody?.damping = 0.08
        ball.physicsBody?.categoryBitMask = PhysicsCategory.ball
        ball.physicsBody?.collisionBitMask = PhysicsCategory.floor | PhysicsCategory.wall
        ball.physicsBody?.contactTestBitMask = PhysicsCategory.hole

        return ball
    }
}

enum PhysicsCategory {
    static let ball: Int = 1 << 0
    static let floor: Int = 1 << 1
    static let wall: Int = 1 << 2
    static let hole: Int = 1 << 3
}

extension SCNVector3 {
    static func +(lhs: SCNVector3, rhs: SCNVector3) -> SCNVector3 {
        SCNVector3(lhs.x + rhs.x, lhs.y + rhs.y, lhs.z + rhs.z)
    }

    static func -(lhs: SCNVector3, rhs: SCNVector3) -> SCNVector3 {
        SCNVector3(lhs.x - rhs.x, lhs.y - rhs.y, lhs.z - rhs.z)
    }

    static func *(lhs: SCNVector3, rhs: Float) -> SCNVector3 {
        SCNVector3(lhs.x * rhs, lhs.y * rhs, lhs.z * rhs)
    }

    func length() -> Float {
        sqrt(x * x + y * y + z * z)
    }

    func normalized() -> SCNVector3 {
        let len = length()
        guard len > 0.0001 else { return SCNVector3(0, 0, 1) }
        return self * (1.0 / len)
    }
}
