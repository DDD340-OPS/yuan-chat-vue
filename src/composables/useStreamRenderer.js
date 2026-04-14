import { nextTick, onBeforeUnmount, watch } from 'vue'

const SENTENCE_BREAKS = new Set(['\n', '。', '！', '？', '；', '!', '?', ';'])
const CLAUSE_BREAKS = new Set(['，', '、', ',', '：', ':'])

function getChunkWindow(remaining, isStreaming) {
  if (!isStreaming) {
    return {
      min: 10,
      max: 24
    }
  }

  if (remaining > 180) {
    return {
      min: 12,
      max: 30
    }
  }

  if (remaining > 90) {
    return {
      min: 10,
      max: 24
    }
  }

  if (remaining > 40) {
    return {
      min: 8,
      max: 18
    }
  }

  return {
    min: 6,
    max: 12
  }
}

function findNextRenderIndex(source, renderedLength, isStreaming) {
  if (!source || renderedLength >= source.length) {
    return source.length
  }

  const remaining = source.length - renderedLength
  const { min, max } = getChunkWindow(remaining, isStreaming)
  let clauseCandidate = -1
  let spaceCandidate = -1

  for (let index = renderedLength; index < source.length; index += 1) {
    const currentChar = source[index]
    const currentLength = index - renderedLength + 1

    if (currentChar === '\n') {
      return index + 1
    }

    if (currentLength >= min && SENTENCE_BREAKS.has(currentChar)) {
      return index + 1
    }

    if (currentLength >= Math.max(min, 8) && CLAUSE_BREAKS.has(currentChar)) {
      clauseCandidate = index + 1
    }

    if (currentLength >= min && currentChar === ' ') {
      spaceCandidate = index + 1
    }

    if (currentLength >= max) {
      return clauseCandidate > renderedLength
        ? clauseCandidate
        : spaceCandidate > renderedLength
          ? spaceCandidate
          : index + 1
    }
  }

  return source.length
}

export function useStreamRenderer({ activeSession, scrollToBottom, cadence = 90 }) {
  let timerId = 0

  function clearTimer() {
    if (timerId) {
      window.clearTimeout(timerId)
      timerId = 0
    }
  }

  function getMessages() {
    return activeSession.value?.messages ?? []
  }

  function ensureRenderedContent() {
    getMessages().forEach((message) => {
      if (typeof message.renderedContent !== 'string') {
        message.renderedContent = message.content ?? ''
      }
    })
  }

  function flushQueue() {
    clearTimer()
    let hasPending = false

    ensureRenderedContent()

    getMessages().forEach((message) => {
      const source = message.content ?? ''
      const rendered = message.renderedContent ?? ''

      if (rendered.length >= source.length) {
        return
      }

      const nextIndex = findNextRenderIndex(
        source,
        rendered.length,
        Boolean(message.streaming)
      )

      message.renderedContent = source.slice(0, nextIndex)
      hasPending = true
    })

    if (hasPending) {
      scrollToBottom()
      timerId = window.setTimeout(flushQueue, cadence)
    }
  }

  function scheduleFlush() {
    if (!timerId) {
      flushQueue()
    }
  }

  watch(
    () => activeSession.value?.id,
    async () => {
      ensureRenderedContent()
      await nextTick()
      scrollToBottom(true)
    },
    { immediate: true }
  )

  watch(
    () =>
      getMessages()
        .map((message) => `${message.id}:${message.content?.length ?? 0}:${message.streaming ? 1 : 0}`)
        .join('|'),
    () => {
      scheduleFlush()
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    clearTimer()
  })

  return {
    scheduleFlush
  }
}
