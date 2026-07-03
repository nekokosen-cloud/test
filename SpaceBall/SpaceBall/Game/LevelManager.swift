import SceneKit

final class LevelManager {
    private let levels: [LevelBuilding] = [
        Level1Space(),
        Level2Nebula()
    ]

    func level(for index: Int) -> LevelBuilding? {
        guard index >= 1, index <= levels.count else { return nil }
        return levels[index - 1]
    }

    var totalLevels: Int { levels.count }
}
