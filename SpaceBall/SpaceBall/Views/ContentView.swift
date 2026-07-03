import SwiftUI

struct ContentView: View {
    @StateObject private var controller = GameSceneController()

    var body: some View {
        ZStack {
            GameView(controller: controller)
                .ignoresSafeArea()

            HUDView(controller: controller)
        }
    }
}

#Preview {
    ContentView()
}
