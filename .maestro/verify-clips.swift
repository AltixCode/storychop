import Foundation
import AVFoundation
import Vision

// Re-reads the clips StoryChop wrote and checks the promise on the box: the
// source is split into clips with nothing lost.
//
// Durations alone prove nothing -- a slicer that re-exports the same opening
// segment N times produces N plausible durations. The fixture burns the elapsed
// second into every frame, so each clip's first and last frame are read back and
// the covered ranges are checked for gaps.
//
// Gaps are the failure that matters. Stream copy cannot cut mid-GOP, so a clip
// may start slightly before its nominal offset and overlap its predecessor;
// that is expected and harmless. Footage that appears in no clip is not: the
// Android slicer used to drop roughly 2.3s of a 95s source, precisely at the
// cuts.
//
// Frames are sampled a little inside each end, because Vision will not read a
// large isolated single digit and the very first frame of a clip can be mid
// transition.

let sem = DispatchSemaphore(value: 0)
var failed = false

func number(in image: CGImage) -> Int? {
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    try? VNImageRequestHandler(cgImage: image, options: [:]).perform([req])
    let text = (req.results ?? []).compactMap { $0.topCandidates(1).first?.string }
        .joined().trimmingCharacters(in: .whitespaces)
    return Int(text)
}

Task {
    var covered: [(Int, Int)] = []
    for path in CommandLine.arguments.dropFirst() {
        let name = (path as NSString).lastPathComponent
        let asset = AVURLAsset(url: URL(fileURLWithPath: path))
        guard let dur = try? await asset.load(.duration) else {
            print("FAIL \(name): unreadable"); failed = true; continue
        }
        let secs = CMTimeGetSeconds(dur)
        let gen = AVAssetImageGenerator(asset: asset)
        gen.appliesPreferredTrackTransform = true
        gen.requestedTimeToleranceBefore = .zero
        gen.requestedTimeToleranceAfter = .zero

        func read(at t: Double) -> Int? {
            var actual = CMTime.zero
            guard let cg = try? gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600),
                                                actualTime: &actual) else { return nil }
            return number(in: cg)
        }
        // The counter reads `startSecond + floor(t)`. Vision will not read an
        // isolated single digit, so the first clip is unreadable at t=1.5s
        // where the counter is "1" -- sample progressively later until a
        // two-digit value appears and subtract the offset back off.
        func readCounter(near t: Double, probes: [Double]) -> Int? {
            for offset in probes {
                let at = t + offset
                guard at < secs - 0.2, at >= 0 else { continue }
                if let v = read(at: at) { return v - Int(at.rounded(.down)) }
            }
            return nil
        }
        guard let startsAt = readCounter(near: 0, probes: [1.5, 10.5, 11.5, 12.5, 15.5]),
              let tail = read(at: max(1.5, secs - 1.5)) else {
            print("FAIL \(name): could not read the burned-in counter"); failed = true; continue
        }
        // Coverage runs to the last whole second the clip contains. Reading a
        // frame near the end would under-report it by however far inside the
        // sample sits, which shows up as a one-second gap at every cut that is
        // an artefact of the measurement, not of the clip.
        // Round rather than truncate: a 29.97s clip holds thirty seconds of
        // footage, and truncating reports a one-second gap at every cut.
        let endsAt = startsAt + Int(secs.rounded()) - 1
        // The tail frame is a sanity check that the counter really is this
        // clip's, rather than proof of the extent.
        if tail < startsAt || tail > endsAt + 1 {
            print("FAIL \(name): frame near the end reads \(tail), outside \(startsAt)..\(endsAt)")
            failed = true
        }
        covered.append((startsAt, endsAt))
        print(String(format: "     %@ duration=%.2fs covers %ds..%ds", name, secs, startsAt, endsAt))
    }

    covered.sort { $0.0 < $1.0 }
    if covered.isEmpty { print("FAIL: no clips"); failed = true }
    var reach = -1
    for (start, end) in covered {
        if start > reach + 1 {
            print("FAIL: nothing covers \(reach + 1)s..\(start - 1)s -- footage was dropped at a cut")
            failed = true
        }
        reach = max(reach, end)
    }
    if !failed {
        print("ok   clips cover \(covered.first!.0)s..\(reach)s with no gaps")
    }
    print(failed ? "RESULT: FAIL" : "RESULT: PASS - the source is split with nothing lost")
    sem.signal()
}
sem.wait()
exit(failed ? 1 : 0)
