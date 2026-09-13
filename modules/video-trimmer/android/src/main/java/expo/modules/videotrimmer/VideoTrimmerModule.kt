package expo.modules.videotrimmer

import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.media.MediaMuxer
import android.net.Uri
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.nio.ByteBuffer
import kotlin.math.max
import kotlin.math.min

/**
 * Trims video by copying samples between a MediaExtractor and a MediaMuxer.
 *
 * Nothing is re-encoded, so the trim is fast and lossless. ffmpeg-kit was
 * retired in 2025 and its binaries delisted, so it is not an option.
 */
class VideoTrimmerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VideoTrimmer")

    AsyncFunction("getInfo") { uri: String, promise: Promise ->
      val retriever = MediaMetadataRetriever()
      try {
        retriever.setDataSource(resolvePath(uri))
        val durationMs =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLong() ?: 0L
        val width =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toInt() ?: 0
        val height =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toInt() ?: 0
        val rotation =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toInt() ?: 0

        // A 90/270 rotation means the presented dimensions are swapped.
        val rotated = rotation == 90 || rotation == 270
        promise.resolve(
          mapOf(
            "duration" to durationMs / 1000.0,
            "width" to if (rotated) height else width,
            "height" to if (rotated) width else height,
          )
        )
      } catch (error: Exception) {
        promise.reject("ERR_TRIM", error.message ?: "The video could not be read.", error)
      } finally {
        retriever.release()
      }
    }

    AsyncFunction("trim") { uri: String, startTime: Double, endTime: Double, promise: Promise ->
      var extractor: MediaExtractor? = null
      var muxer: MediaMuxer? = null
      try {
        val source = resolvePath(uri)
        extractor = MediaExtractor().apply { setDataSource(source) }

        val output = File(
          appContext.cacheDirectory,
          "storychop_${System.currentTimeMillis()}_${(startTime * 1000).toInt()}.mp4"
        )
        muxer = MediaMuxer(output.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

        // Map every track through to the muxer, keeping audio in sync.
        val indexMap = HashMap<Int, Int>()
        var maxInputSize = 1 shl 20
        for (i in 0 until extractor.trackCount) {
          val format = extractor.getTrackFormat(i)
          val mime = format.getString(MediaFormat.KEY_MIME) ?: continue
          if (!mime.startsWith("video/") && !mime.startsWith("audio/")) continue
          extractor.selectTrack(i)
          if (format.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) {
            maxInputSize = max(maxInputSize, format.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE))
          }
          indexMap[i] = muxer.addTrack(format)
        }

        if (indexMap.isEmpty()) {
          promise.reject("ERR_TRIM", "The file contains no playable track.", null)
          return@AsyncFunction
        }

        val startUs = (startTime * 1_000_000).toLong()
        val endUs = (endTime * 1_000_000).toLong()

        muxer.start()
        // SEEK_TO_PREVIOUS_SYNC: the muxer cannot start mid-GOP, so the clip
        // begins at the nearest preceding key frame. Seeking to the closest
        // sync instead would drop frames the user selected.
        extractor.seekTo(startUs, MediaExtractor.SEEK_TO_PREVIOUS_SYNC)

        val buffer = ByteBuffer.allocate(maxInputSize)
        val bufferInfo = android.media.MediaCodec.BufferInfo()
        var wroteAnything = false

        while (true) {
          bufferInfo.offset = 0
          bufferInfo.size = extractor.readSampleData(buffer, 0)
          if (bufferInfo.size < 0) break

          val sampleTime = extractor.sampleTime
          if (sampleTime > endUs) break

          if (sampleTime >= startUs) {
            bufferInfo.presentationTimeUs = sampleTime - startUs
            bufferInfo.flags = extractor.sampleFlags
            indexMap[extractor.sampleTrackIndex]?.let { target ->
              muxer.writeSampleData(target, buffer, bufferInfo)
              wroteAnything = true
            }
          }
          extractor.advance()
        }

        muxer.stop()

        if (!wroteAnything) {
          output.delete()
          promise.reject("ERR_TRIM", "The selected range contains no frames.", null)
          return@AsyncFunction
        }

        val retriever = MediaMetadataRetriever()
        retriever.setDataSource(output.absolutePath)
        val writtenMs =
          retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLong() ?: 0L
        retriever.release()

        promise.resolve(
          mapOf(
            "uri" to Uri.fromFile(output).toString(),
            "duration" to writtenMs / 1000.0,
          )
        )
      } catch (error: Exception) {
        promise.reject("ERR_TRIM", error.message ?: "The trim failed.", error)
      } finally {
        runCatching { muxer?.release() }
        runCatching { extractor?.release() }
      }
    }
  }

  private fun resolvePath(uri: String): String {
    val parsed = Uri.parse(uri)
    return parsed.path ?: uri
  }
}
