import { nextTick, onBeforeUnmount, watch } from 'vue'

function getRenderStep(remaining) {
  if (remaining > 180) {
    return 10
  }

  if (remaining > 90) {
    return 6
  }

  if (remaining > 40) {
    return 3
  }

  return 1
}

export function useStreamRenderer({ activeSession, scrollToBottom, cadence = 20 }) {
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

      const step = getRenderStep(source.length - rendered.length)
      message.renderedContent = source.slice(0, rendered.length + step)
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
