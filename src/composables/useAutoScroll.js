import { ref } from 'vue'

export function useAutoScroll(viewportRef, options = {}) {
  const bottomThreshold = options.bottomThreshold ?? 72
  const isAutoFollow = ref(true)

  function resolveViewport() {
    const target = viewportRef.value
    if (!target) {
      return null
    }

    return target.$el ?? target
  }

  function getDistanceToBottom() {
    const viewport = resolveViewport()
    if (!viewport) {
      return 0
    }

    return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
  }

  function handleScroll() {
    isAutoFollow.value = getDistanceToBottom() <= bottomThreshold
  }

  function scrollToBottom(force = false) {
    const viewport = resolveViewport()
    if (!viewport || (!force && !isAutoFollow.value)) {
      return
    }

    window.requestAnimationFrame(() => {
      if (typeof options.scrollToEnd === 'function') {
        options.scrollToEnd(viewport)
        return
      }

      viewport.scrollTop = viewport.scrollHeight
    })
  }

  function jumpToLatest() {
    isAutoFollow.value = true
    scrollToBottom(true)
  }

  return {
    isAutoFollow,
    handleScroll,
    scrollToBottom,
    jumpToLatest
  }
}
