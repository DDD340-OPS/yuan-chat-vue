<script setup>
import { computed } from 'vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const roleLabel = computed(() => {
  return props.message.role === 'assistant' ? '研究助手' : '来访者样本'
})

const sourceLabel = computed(() => {
  if (props.message.source === 'voice') {
    return '语音转写'
  }

  if (props.message.source === 'suggestion') {
    return '快捷引导'
  }

  return props.message.role === 'assistant' ? '流式输出' : '文本输入'
})

const displayedContent = computed(() => {
  return props.message.renderedContent ?? props.message.content
})

const hasVisibleContent = computed(() => {
  return Boolean(displayedContent.value?.trim())
})

const createdAt = computed(() => {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(props.message.createdAt))
})

const isAssistant = computed(() => props.message.role === 'assistant')
</script>

<template>
  <article
    class="message-bubble"
    :class="[
      `message-bubble--${message.role}`,
      { 'message-bubble--error': message.error }
    ]"
  >
    <div class="message-bubble__meta">
      <strong>{{ roleLabel }}</strong>
      <span>{{ sourceLabel }}</span>
      <span>{{ createdAt }}</span>
    </div>

    <div v-if="isAssistant" class="message-bubble__rich">
      <div
        v-if="message.streaming && !hasVisibleContent"
        class="message-bubble__pending"
      >
        <span class="message-bubble__pending-dot" />
        <span class="message-bubble__pending-dot" />
        <span class="message-bubble__pending-dot" />
        <span class="message-bubble__pending-text">研究助手正在组织回应...</span>
      </div>
      <MarkdownRenderer v-else :content="displayedContent" />
      <span v-if="message.streaming" class="message-bubble__cursor" />
    </div>

    <p v-else class="message-bubble__content">
      {{ displayedContent }}
      <span v-if="message.streaming" class="message-bubble__cursor" />
    </p>
  </article>
</template>

<style scoped>
.message-bubble {
  display: grid;
  gap: 10px;
  padding: 18px 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(23, 56, 51, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 30px rgba(35, 63, 58, 0.07);
}

.message-bubble--assistant {
  background:
    linear-gradient(135deg, rgba(240, 248, 246, 0.96), rgba(255, 255, 255, 0.94));
}

.message-bubble--user {
  background:
    linear-gradient(135deg, rgba(244, 230, 205, 0.9), rgba(255, 255, 255, 0.96));
}

.message-bubble--error {
  border-color: rgba(182, 74, 74, 0.24);
}

.message-bubble__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 0.82rem;
  color: #617a74;
}

.message-bubble__meta strong {
  color: #173833;
}

.message-bubble__meta span {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(32, 89, 83, 0.07);
}

.message-bubble__content,
.message-bubble__rich {
  margin: 0;
  font-size: 1rem;
  line-height: 1.8;
  color: #24423d;
}

.message-bubble__content {
  white-space: pre-wrap;
}

.message-bubble__rich {
  display: grid;
  gap: 8px;
}

.message-bubble__pending {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  color: #54706a;
}

.message-bubble__pending-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #205953;
  animation: bubble-pulse 1.2s ease-in-out infinite;
}

.message-bubble__pending-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.message-bubble__pending-dot:nth-child(3) {
  animation-delay: 0.3s;
}

.message-bubble__pending-text {
  margin-left: 4px;
}

.message-bubble__cursor {
  display: inline-block;
  width: 9px;
  height: 1em;
  margin-left: 6px;
  vertical-align: -0.1em;
  border-radius: 2px;
  background: #205953;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@keyframes bubble-pulse {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
