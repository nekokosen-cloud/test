import CoreMotion
import SceneKit

final class MotionManager {
    private let manager = CMMotionManager()
    private(set) var tiltAngles = SCNVector3Zero

    var isAvailable: Bool {
        manager.isDeviceMotionAvailable
    }

    func start(updateHandler: @escaping (SCNVector3) -> Void) {
        guard manager.isDeviceMotionAvailable else { return }

        manager.deviceMotionUpdateInterval = 1.0 / 60.0
        manager.startDeviceMotionUpdates(using: .xArbitraryCorrectedZVertical, to: .main) { [weak self] motion, _ in
            guard let self, let motion else { return }

            let pitch = Float(motion.attitude.pitch)
            let roll = Float(motion.attitude.roll)

            let maxTilt: Float = 0.42
            let filteredPitch = clamp(pitch * 0.85, min: -maxTilt, max: maxTilt)
            let filteredRoll = clamp(roll * 0.85, min: -maxTilt, max: maxTilt)

            self.tiltAngles = SCNVector3(filteredRoll, 0, filteredPitch)
            updateHandler(self.tiltAngles)
        }
    }

    func stop() {
        manager.stopDeviceMotionUpdates()
    }

    private func clamp(_ value: Float, min: Float, max: Float) -> Float {
        Swift.max(min, Swift.min(max, value))
    }
}
