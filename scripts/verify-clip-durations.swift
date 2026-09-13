import AVFoundation
import Foundation
for path in CommandLine.arguments.dropFirst() {
    let asset = AVURLAsset(url: URL(fileURLWithPath: path))
    let d = CMTimeGetSeconds(try await asset.load(.duration))
    print(String(format: "%@  %.2fs", (path as NSString).lastPathComponent, d))
}
