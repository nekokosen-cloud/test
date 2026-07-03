import SwiftUI

struct HUDView: View {
    @ObservedObject var controller: GameSceneController

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Space Ball")
                        .font(.title2.bold())
                        .foregroundStyle(.white)
                    Text(controller.levelTitle)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.75))
                }
                Spacer()
                timerBadge
            }

            Text(controller.hintText)
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.8))
                .frame(maxWidth: .infinity, alignment: .leading)

            Spacer()

            overlayCard
        }
        .padding(20)
    }

    private var timerBadge: some View {
        VStack(spacing: 2) {
            Text("剩余")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.7))
            Text(String(format: "%.0f", controller.remainingTime))
                .font(.title3.monospacedDigit().bold())
                .foregroundStyle(controller.remainingTime <= 10 ? Color.red : Color.cyan)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    @ViewBuilder
    private var overlayCard: some View {
        switch controller.phase {
        case .ready:
            actionCard(
                title: "准备出发",
                message: "固定俯视视角，倾斜手机控制重力。把小球滚进发光虫洞。",
                primaryTitle: "开始",
                primaryAction: controller.startLevel
            )
        case .playing:
            EmptyView()
        case .won:
            actionCard(
                title: "过关！",
                message: "你成功把能量球送入了虫洞。",
                primaryTitle: controller.hasNextLevel ? "下一关" : "再玩一次",
                primaryAction: controller.nextLevel,
                secondaryTitle: "重试",
                secondaryAction: controller.retryLevel
            )
        case .lost(let reason):
            actionCard(
                title: "失败",
                message: reason,
                primaryTitle: "重试",
                primaryAction: controller.retryLevel
            )
        }
    }

    private func actionCard(
        title: String,
        message: String,
        primaryTitle: String,
        primaryAction: @escaping () -> Void,
        secondaryTitle: String? = nil,
        secondaryAction: (() -> Void)? = nil
    ) -> some View {
        VStack(spacing: 14) {
            Text(title)
                .font(.title3.bold())
                .foregroundStyle(.white)
            Text(message)
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundStyle(.white.opacity(0.8))

            HStack(spacing: 12) {
                if let secondaryTitle, let secondaryAction {
                    Button(secondaryTitle, action: secondaryAction)
                        .buttonStyle(SecondaryGameButtonStyle())
                }
                Button(primaryTitle, action: primaryAction)
                    .buttonStyle(PrimaryGameButtonStyle())
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
    }
}

private struct PrimaryGameButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.black)
            .padding(.horizontal, 22)
            .padding(.vertical, 12)
            .background(Color.cyan.opacity(configuration.isPressed ? 0.7 : 1.0), in: Capsule())
    }
}

private struct SecondaryGameButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.white)
            .padding(.horizontal, 22)
            .padding(.vertical, 12)
            .background(Color.white.opacity(configuration.isPressed ? 0.12 : 0.18), in: Capsule())
    }
}
