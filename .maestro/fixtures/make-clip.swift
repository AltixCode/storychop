import AVFoundation
import AppKit

// A 30-second clip with a visible second counter, so exported segments can be
// checked for both correct duration and correct start offset.
let width = 720, height = 1280, fps: Int32 = 30
let total = 95
let url = URL(fileURLWithPath: "storychop-fixture.mp4")
try? FileManager.default.removeItem(at: url)

let writer = try! AVAssetWriter(outputURL: url, fileType: .mp4)
let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input,
    sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
    ]
)
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

func frame(second: Int) -> CVPixelBuffer {
    var pb: CVPixelBuffer?
    CVPixelBufferCreate(kCFAllocatorDefault, width, height,
                        kCVPixelFormatType_32ARGB, nil, &pb)
    let buffer = pb!
    CVPixelBufferLockBaseAddress(buffer, [])
    let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buffer),
                        width: width, height: height, bitsPerComponent: 8,
                        bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
                        space: CGColorSpaceCreateDeviceRGB(),
                        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue)!
    // A distinct hue per second makes a wrong start offset obvious at a glance.
    let hue = CGFloat(second) / CGFloat(total)
    ctx.setFillColor(NSColor(hue: hue, saturation: 0.7, brightness: 0.9, alpha: 1).cgColor)
    ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))

    let nsCtx = NSGraphicsContext(cgContext: ctx, flipped: false)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = nsCtx
    let label = "\(second)"
    label.draw(at: NSPoint(x: 280, y: 600), withAttributes: [
        .font: NSFont.boldSystemFont(ofSize: 220),
        .foregroundColor: NSColor.white,
    ])
    NSGraphicsContext.restoreGraphicsState()
    CVPixelBufferUnlockBaseAddress(buffer, [])
    return buffer
}

var frameIndex: Int64 = 0
for second in 0..<total {
    let buffer = frame(second: second)
    for _ in 0..<Int(fps) {
        while !input.isReadyForMoreMediaData { usleep(2000) }
        adaptor.append(buffer, withPresentationTime: CMTime(value: frameIndex, timescale: fps))
        frameIndex += 1
    }
}

input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
print("wrote storychop-fixture.mp4 — \(total)s, \(width)x\(height), one colour+number per second")
