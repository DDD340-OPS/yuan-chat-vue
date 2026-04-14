import { onBeforeUnmount, ref } from 'vue'

function getRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useSpeechRecognition(callbacks = {}) {
  const supported = ref(Boolean(getRecognitionConstructor()))
  const isListening = ref(false)
  const interimTranscript = ref('')
  const finalTranscript = ref('')
  const error = ref('')
  let recognition = null

  function ensureRecognition() {
    if (recognition || !supported.value) {
      return recognition
    }

    const Recognition = getRecognitionConstructor()
    if (!Recognition) {
      supported.value = false
      return null
    }

    recognition = new Recognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      isListening.value = true
      error.value = ''
      callbacks.onStateChange?.(true)
    }

    recognition.onresult = (event) => {
      let interim = ''
      let finalText = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result[0]?.transcript?.trim() ?? ''

        if (!transcript) {
          continue
        }

        if (result.isFinal) {
          finalText += transcript
        } else {
          interim += transcript
        }
      }

      interimTranscript.value = interim
      callbacks.onInterim?.(interim)

      if (finalText) {
        finalTranscript.value = finalText
        callbacks.onFinal?.(finalText)
      }
    }

    recognition.onerror = (event) => {
      error.value = event.error || '语音识别失败'
      isListening.value = false
      callbacks.onError?.(error.value)
      callbacks.onStateChange?.(false)
    }

    recognition.onend = () => {
      isListening.value = false
      interimTranscript.value = ''
      callbacks.onStateChange?.(false)
    }

    return recognition
  }

  function start() {
    const currentRecognition = ensureRecognition()

    if (!currentRecognition) {
      const message = '当前浏览器不支持 Web Speech API。'
      error.value = message
      callbacks.onError?.(message)
      return false
    }

    interimTranscript.value = ''
    finalTranscript.value = ''
    error.value = ''

    try {
      currentRecognition.start()
      return true
    } catch (recognitionError) {
      const message = recognitionError.message || '麦克风启动失败'
      error.value = message
      callbacks.onError?.(message)
      return false
    }
  }

  function stop() {
    recognition?.stop()
  }

  function abort() {
    recognition?.abort()
  }

  onBeforeUnmount(() => {
    abort()
  })

  return {
    supported,
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
    abort
  }
}
