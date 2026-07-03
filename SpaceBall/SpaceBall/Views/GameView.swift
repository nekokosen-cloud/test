import SceneKit
import SwiftUI

struct GameView: UIViewRepresentable {
    @ObservedObject var controller: GameSceneController

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView()
        view.scene = controller.scene
        view.delegate = controller
        view.backgroundColor = UIColor(red: 0.01, green: 0.02, blue: 0.06, alpha: 1.0)
        view.antialiasingMode = .multisampling4X
        view.isPlaying = true
        view.preferredFramesPerSecond = 60
        view.autoenablesDefaultLighting = false
        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {}
}
