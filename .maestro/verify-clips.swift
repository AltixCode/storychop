import Foundation
import AVFoundation
import Vision

// Re-reads the clips StoryChop wrote to the camera roll.
//
// Durations alone do not prove correct slicing: a slicer that re-exports the
// same opening segment N times produces N plausible durations. The fixture
// burns the elapsed second into every frame, so reading that number back out
// proves the start offset actually advanced.
//
// Frames are sampled two seconds in, not at the head: Vision will not read a
// large isolated single digit, so a sample at t=0 comes back empty for the
// first clip even when the clip is correct.
let sem = DispatchSemaphore(value: 0)
var failed = false

Task {
  var expectedStart = 0
  for path in CommandLine.arguments.dropFirst() {
    let name = (path as NSString).lastPathComponent
    let asset = AVURLAsset(url: URL(fileURLWithPath: path))
    guard let dur = try? await asset.load(.duration) else {
      print("FAIL \(name): unreadable"); failed = true; continue
    }
    let gen = AVAssetImageGenerator(asset: asset)
    gen.appliesPreferredTrackTransform = true
    gen.requestedTimeToleranceBefore = .zero
    gen.requestedTimeToleranceAfter = .zero
    guard let (cg, _) = try? await gen.image(at: CMTime(seconds: 2, preferredTimescale: 600)) else {
      print("FAIL \(name): no frame at 2s"); failed = true; continue
    }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
    let text = (req.results ?? []).compactMap { $0.topCandidates(1).first?.string }
      .joined().trimmingCharacters(in: .whitespaces)
    let seen = Int(text)
    let want = expectedStart + 2
    let secs = CMTimeGetSeconds(dur)
    let ok = seen == want
    if !ok { failed = true }
    print(String(format: "%@ %@ duration=%.2fs startsAt=%d frame@2s=%@ (expected %d)",
                 ok ? "ok  " : "FAIL", name, secs, expectedStart, text.isEmpty ? "<none>" : text, want))
    expectedStart += Int(secs.rounded())
  }
  print(failed ? "RESULT: FAIL" : "RESULT: PASS - clips are contiguous, correctly offset and correctly cut")
  sem.signal()
}
sem.wait()
exit(failed ? 1 : 0)
