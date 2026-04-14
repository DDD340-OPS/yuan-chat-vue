import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useSpeechRecognition } from './useSpeechRecognition'

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function createAudioFile(blob) {
  const extension = blob.type.includes('mp4')
    ? 'm4a'
    : blob.type.includes('ogg')
      ? 'ogg'
      : 'webm'

  return new File([blob], `recording-${Date.now()}.${extension}`, {
    type: blob.type || 'audio/webm'
  })
}

export function useVoiceRecorder(options = {}) {
  const phase = ref('idle')
  const elapsedSeconds = ref(0)
  const lastTranscript = ref('')
  const isCapturing = ref(false)
  const recordingSupported = ref(
    typeof window !== 'undefined' &&
      Boolean(window.MediaRecorder) &&
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia)
  )
  let timerId = 0
  let mediaRecorder = null
  let mediaStream = null
  let mediaChunks = []

  const {
    supported: speechSupported,
    isListening,
    interimTranscript,
    error,
    start,
    stop,
    abort
  } = useSpeechRecognition({
    onInterim(transcript) {
      options.onInterim?.(transcript)
    },
    onFinal(transcript) {
      lastTranscript.value = transcript
      options.onTranscript?.(transcript)
    },
    onError(message) {
      phase.value = 'error'
      stopTimer()
      options.onError?.(message)
    },
    onStateChange(listening) {
      if (phase.value !== 'uploading') {
        phase.value = listening ? 'listening' : phase.value === 'error' ? 'error' : 'idle'
      }

      if (listening) {
        startTimer()
      } else if (phase.value !== 'uploading' && !isCapturing.value) {
        stopTimer()
      }

      options.onStateChange?.(buildSnapshot())
    }
  })

  function cleanupMediaStream() {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
      mediaStream = null
    }
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId)
      timerId = 0
    }
  }

  function startTimer() {
    stopTimer()
    elapsedSeconds.value = 0
    timerId = window.setInterval(() => {
      elapsedSeconds.value += 1
    }, 1000)
  }

  const durationLabel = computed(() => formatDuration(elapsedSeconds.value))

  const statusText = computed(() => {
    if (!speechSupported.value && !recordingSupported.value) {
      return '当前浏览器不支持语音识别或录音采集。'
    }

    if (phase.value === 'connecting') {
      return '正在连接麦克风，请稍候...'
    }

    if (phase.value === 'stopping') {
      return '正在结束本轮语音采集...'
    }

    if (phase.value === 'uploading') {
      return '录音已完成，正在留存音频并计算分析指标...'
    }

    if (phase.value === 'error') {
      return error.value || '语音识别失败，请检查麦克风权限后重试。'
    }

    if (isListening.value && interimTranscript.value) {
      return `正在识别语音：${interimTranscript.value}`
    }

    if (isCapturing.value) {
      return `麦克风已开启，已采集 ${durationLabel.value}`
    }

    if (lastTranscript.value) {
      return '语音已转写并同步到输入框，录音文件也可留存分析。'
    }

    return '点击麦克风开始语音输入与录音采集。'
  })

  function buildSnapshot() {
    return {
      speechSupported: speechSupported.value,
      recordingSupported: recordingSupported.value,
      isCapturing: isCapturing.value,
      isListening: isListening.value,
      phase: phase.value,
      interimTranscript: interimTranscript.value,
      lastTranscript: lastTranscript.value,
      elapsedSeconds: elapsedSeconds.value,
      durationLabel: durationLabel.value,
      statusText: statusText.value
    }
  }

  async function setupMediaRecording() {
    if (!recordingSupported.value) {
      return false
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })
    mediaChunks = []
    mediaRecorder = new MediaRecorder(mediaStream)

    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) {
        mediaChunks.push(event.data)
      }
    })

    return true
  }

  async function startRecording() {
    if (!speechSupported.value && !recordingSupported.value) {
      phase.value = 'unsupported'
      options.onError?.('当前浏览器不支持语音识别或录音采集。')
      return false
    }

    lastTranscript.value = ''
    phase.value = 'connecting'

    try {
      await setupMediaRecording()
      if (mediaRecorder) {
        mediaRecorder.start()
      }

      isCapturing.value = true

      if (speechSupported.value) {
        start()
      } else {
        phase.value = 'listening'
        startTimer()
        options.onStateChange?.(buildSnapshot())
      }

      return true
    } catch (recordingError) {
      cleanupMediaStream()
      phase.value = 'error'
      isCapturing.value = false
      options.onError?.(recordingError.message || '麦克风启动失败')
      return false
    }
  }

  async function finalizeRecording() {
    const blob =
      mediaChunks.length > 0
        ? new Blob(mediaChunks, { type: mediaRecorder?.mimeType || 'audio/webm' })
        : null
    mediaChunks = []
    cleanupMediaStream()

    if (!blob || blob.size === 0) {
      phase.value = 'idle'
      isCapturing.value = false
      options.onStateChange?.(buildSnapshot())
      return
    }

    phase.value = 'uploading'
    options.onStateChange?.(buildSnapshot())

    const file = createAudioFile(blob)
    try {
      await options.onRecordingComplete?.({
        file,
        transcript: lastTranscript.value,
        durationMs: elapsedSeconds.value * 1000
      })
    } finally {
      phase.value = 'idle'
      isCapturing.value = false
      options.onStateChange?.(buildSnapshot())
    }
  }

  function stopRecording() {
    if (!isCapturing.value) {
      return
    }

    phase.value = 'stopping'

    if (speechSupported.value && isListening.value) {
      stop()
    } else {
      stopTimer()
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      const recorder = mediaRecorder
      mediaRecorder = null
      recorder.addEventListener(
        'stop',
        () => {
          finalizeRecording()
        },
        { once: true }
      )
      recorder.stop()
    } else {
      phase.value = 'idle'
      isCapturing.value = false
      options.onStateChange?.(buildSnapshot())
    }
  }

  function cancelRecording() {
    stopTimer()
    lastTranscript.value = ''
    phase.value = 'idle'
    isCapturing.value = false
    mediaChunks = []

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      mediaRecorder = null
    }

    cleanupMediaStream()
    abort()
    options.onStateChange?.(buildSnapshot())
  }

  watch(interimTranscript, () => {
    options.onStateChange?.(buildSnapshot())
  })

  watch(lastTranscript, () => {
    options.onStateChange?.(buildSnapshot())
  })

  watch(elapsedSeconds, () => {
    if (isCapturing.value) {
      options.onStateChange?.(buildSnapshot())
    }
  })

  onBeforeUnmount(() => {
    stopTimer()
    cleanupMediaStream()
  })

  return {
    speechSupported,
    recordingSupported,
    isCapturing,
    isListening,
    interimTranscript,
    lastTranscript,
    phase,
    durationLabel,
    statusText,
    startRecording,
    stopRecording,
    cancelRecording
  }
}
