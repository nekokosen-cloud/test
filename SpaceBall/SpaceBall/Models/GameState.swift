import Foundation

enum GamePhase: Equatable {
    case ready
    case playing
    case won
    case lost(reason: String)
}

struct LevelProgress {
    var currentLevel: Int = 1
    var unlockedLevel: Int = 1
}
