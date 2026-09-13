import ExpoModulesCore
import AVFoundation

/// Trims video with AVAssetExportSession in passthrough mode.
///
/// Passthrough copies samples instead of re-encoding, so a trim is fast and
/// lossless. The build this replaces called FileSystem.copyAsync on the whole
/// source for every segment, so each "clip" was a full-length copy of the
/// original and the timeline selection did nothing.
public class VideoTrimmerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VideoTrimmer")

    AsyncFunction("getInfo") { (uri: String, promise: Promise) in
      let asset = AVURLAsset(url: Self.url(uri))
      Task {
        do {
          let duration = try await asset.load(.duration)
          let tracks = try await asset.loadTracks(withMediaType: .video)
          guard let track = tracks.first else {
            promise.reject("ERR_TRIM", "The file contains no video track.")
            return
          }
          // naturalSize ignores rotation; applying the transform gives the
          // dimensions the video actually presents at.
          let size = try await track.load(.naturalSize)
          let transform = try await track.load(.preferredTransform)
          let presented = size.applying(transform)

          promise.resolve([
            "duration": CMTimeGetSeconds(duration),
            "width": Int(abs(presented.width)),
            "height": Int(abs(presented.height)),
          ])
        } catch {
          promise.reject("ERR_TRIM", error.localizedDescription)
        }
      }
    }

    AsyncFunction("trim") {
      (uri: String, startTime: Double, endTime: Double, promise: Promise) in
      let asset = AVURLAsset(url: Self.url(uri))

      Task {
        do {
          let duration = try await asset.load(.duration)
          let total = CMTimeGetSeconds(duration)

          // Clamp rather than fail: a segment computed from a rounded duration
          // can overshoot the real end by a frame.
          let start = max(0, min(startTime, total))
          let end = max(start, min(endTime, total))
          guard end - start > 0.05 else {
            promise.reject("ERR_TRIM", "The selected range is too short to export.")
            return
          }

          guard let session = AVAssetExportSession(
            asset: asset,
            presetName: AVAssetExportPresetPassthrough
          ) else {
            promise.reject("ERR_TRIM", "This video cannot be exported on this device.")
            return
          }

          let output = FileManager.default.temporaryDirectory
            .appendingPathComponent("storychop_\(Int(Date().timeIntervalSince1970 * 1000))_\(Int(start * 1000)).mp4")

          session.outputURL = output
          session.outputFileType = .mp4
          session.shouldOptimizeForNetworkUse = true
          session.timeRange = CMTimeRange(
            start: CMTime(seconds: start, preferredTimescale: 600),
            end: CMTime(seconds: end, preferredTimescale: 600)
          )

          await session.export()

          switch session.status {
          case .completed:
            // Report the duration actually written, not the requested range:
            // passthrough can only cut on sync samples, so the result may run
            // slightly long. The caller shows this to the user.
            let written = AVURLAsset(url: output)
            let writtenDuration = try await written.load(.duration)
            promise.resolve([
              "uri": output.absoluteString,
              "duration": CMTimeGetSeconds(writtenDuration),
            ])
          case .cancelled:
            promise.reject("ERR_TRIM", "The export was cancelled.")
          default:
            promise.reject(
              "ERR_TRIM",
              session.error?.localizedDescription ?? "The export failed."
            )
          }
        } catch {
          promise.reject("ERR_TRIM", error.localizedDescription)
        }
      }
    }
  }

  private static func url(_ uri: String) -> URL {
    URL(string: uri) ?? URL(fileURLWithPath: uri)
  }
}
