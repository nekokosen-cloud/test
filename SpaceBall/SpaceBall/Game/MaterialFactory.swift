import SceneKit
import UIKit

enum MaterialFactory {
    static func spaceFloor() -> SCNMaterial {
        let material = SCNMaterial()
        material.lightingModel = .physicallyBased
        material.diffuse.contents = UIColor(red: 0.12, green: 0.14, blue: 0.2, alpha: 1.0)
        material.metalness.contents = 0.75
        material.roughness.contents = 0.35
        material.emission.contents = UIColor(red: 0.05, green: 0.12, blue: 0.22, alpha: 1.0)
        return material
    }

    static func spaceWall() -> SCNMaterial {
        let material = SCNMaterial()
        material.lightingModel = .physicallyBased
        material.diffuse.contents = UIColor(red: 0.18, green: 0.55, blue: 0.95, alpha: 1.0)
        material.metalness.contents = 0.9
        material.roughness.contents = 0.2
        material.emission.contents = UIColor(red: 0.05, green: 0.25, blue: 0.55, alpha: 1.0)
        return material
    }

    static func nebulaFloor() -> SCNMaterial {
        let material = SCNMaterial()
        material.lightingModel = .physicallyBased
        material.diffuse.contents = UIColor(red: 0.18, green: 0.08, blue: 0.28, alpha: 1.0)
        material.metalness.contents = 0.4
        material.roughness.contents = 0.55
        material.emission.contents = UIColor(red: 0.25, green: 0.05, blue: 0.35, alpha: 1.0)
        return material
    }

    static func nebulaWall() -> SCNMaterial {
        let material = SCNMaterial()
        material.lightingModel = .physicallyBased
        material.diffuse.contents = UIColor(red: 0.75, green: 0.25, blue: 0.95, alpha: 1.0)
        material.metalness.contents = 0.55
        material.roughness.contents = 0.35
        material.emission.contents = UIColor(red: 0.35, green: 0.05, blue: 0.45, alpha: 1.0)
        return material
    }

    static func portalRing(color: UIColor = UIColor(red: 0.2, green: 0.95, blue: 1.0, alpha: 1.0)) -> SCNMaterial {
        let material = SCNMaterial()
        material.lightingModel = .physicallyBased
        material.diffuse.contents = color
        material.emission.contents = color
        material.metalness.contents = 1.0
        material.roughness.contents = 0.15
        return material
    }

    static func portalGlow(color: UIColor = UIColor(red: 0.1, green: 0.75, blue: 1.0, alpha: 0.8)) -> SCNMaterial {
        let material = SCNMaterial()
        material.lightingModel = .constant
        material.diffuse.contents = color
        material.emission.contents = color
        material.transparency = 0.65
        material.writesToDepthBuffer = false
        return material
    }

    static func energyBall(color: UIColor = UIColor(red: 0.95, green: 0.98, blue: 1.0, alpha: 1.0)) -> SCNMaterial {
        let material = SCNMaterial()
        material.lightingModel = .physicallyBased
        material.diffuse.contents = color
        material.emission.contents = UIColor(red: 0.35, green: 0.75, blue: 1.0, alpha: 1.0)
        material.metalness.contents = 0.95
        material.roughness.contents = 0.08
        return material
    }

    static func startPad() -> SCNMaterial {
        let material = SCNMaterial()
        material.lightingModel = .constant
        material.diffuse.contents = UIColor(red: 0.15, green: 0.85, blue: 0.55, alpha: 0.85)
        material.emission.contents = UIColor(red: 0.1, green: 0.55, blue: 0.35, alpha: 1.0)
        return material
    }
}
