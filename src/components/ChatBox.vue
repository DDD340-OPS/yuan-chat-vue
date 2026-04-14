<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import VoiceRecorder from './VoiceRecorder.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  uploadingAudio: {
    type: Boolean,
    default: false
  },
  statusMessage: {
    type: String,
    default: ''
  },
  suggestions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:modelValue',
  'send',
  'voice-status-change',
  'audio-recording-complete'
])

const localDraft = ref(props.modelValue)
const voiceStatusText = ref('点击麦克风开始语音输入。')
let debounceTimer = 0
const debounceDelay = 220

function clearDebounceTimer() {
  if (debounceTimer) {
    window.clearTimeout(debounceTimer)
    debounceTimer = 0
  }
}

function syncDraft(value, immediate = false) {
  clearDebounceTimer()

  if (immediate) {
    emit('update:modelValue', value)
    return
  }

  debounceTimer = window.setTimeout(() => {
    emit('update:modelValue', value)
  }, debounceDelay)
}

watch(
  () => props.modelValue,
  (value) => {
    if (value !== localDraft.value) {
      localDraft.value = value
    }
  }
)

watch(localDraft, (value) => {
  syncDraft(value)
})

function submitDraft(source = 'text') {
  const content = localDraft.value.trim()
  if (!content || props.disabled || props.uploadingAudio) {
    return
  }

  syncDraft(localDraft.value, true)
  emit('send', {
    content,
    source
  })
}

function applyPrompt(prompt) {
  localDraft.value = prompt
  syncDraft(localDraft.value, true)
  emit('send', {
    content: prompt,
    source: 'suggestion'
  })
}

function appendTranscript(transcript) {
  const spacer = localDraft.value.trim() ? ' ' : ''
  localDraft.value = `${localDraft.value}${spacer}${transcript}`.trim()
  syncDraft(localDraft.value, true)
}

function handleVoiceStatusChange(snapshot) {
  voiceStatusText.value = snapshot.statusText
  emit('voice-status-change', snapshot)
}

function handleAudioRecordingComplete(payload) {
  emit('audio-recording-complete', payload)
}

onBeforeUnmount(() => {
  clearDebounceTimer()
})
</script>

<template>
  <section class="chat-box">
    <div class="chat-box__prompt-list">
      <button
        v-for="prompt in suggestions"
        :key="prompt"
        type="button"
        class="chat-box__prompt-chip"
        :disabled="disabled || uploadingAudio"
        @click="applyPrompt(prompt)"
      >
        {{ prompt }}
      </button>
    </div>

    <VoiceRecorder
      :disabled="disabled || uploadingAudio"
      @transcript="appendTranscript"
      @status-change="handleVoiceStatusChange"
      @recording-complete="handleAudioRecordingComplete"
    />

    <textarea
      v-model="localDraft"
      rows="4"
      class="chat-box__textarea"
      placeholder="输入来访者描述或研究者引导语。按 Enter 发送，Shift + Enter 换行。"
      @keydown.enter.exact.prevent="submitDraft()"
      @blur="syncDraft(localDraft, true)"
    />

    <div class="chat-box__footer">
      <div class="chat-box__status">
        <span>{{ statusMessage }}</span>
        <span>{{ voiceStatusText }}</span>
        <span v-if="uploadingAudio">录音文件正在上传与分析，请稍候...</span>
      </div>

      <div class="chat-box__actions">
        <button
          type="button"
          class="chat-box__primary"
          :disabled="disabled || uploadingAudio || !localDraft.trim()"
          @click="submitDraft()"
        >
          发送并流式生成
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.chat-box {
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 252, 247, 0.94), rgba(240, 248, 246, 0.88));
}

.chat-box__prompt-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chat-box__prompt-chip {
  border: 1px solid rgba(23, 56, 51, 0.08);
  border-radius: 999px;
  padding: 10px 14px;
  color: #205953;
  background: rgba(255, 255, 255, 0.88);
}

.chat-box__prompt-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-box__textarea {
  width: 100%;
  border: 1px solid rgba(23, 56, 51, 0.12);
  border-radius: 18px;
  background: rgba(255, 252, 247, 0.92);
  color: #173833;
  outline: none;
  padding: 14px 16px;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.chat-box__textarea:focus {
  border-color: rgba(32, 89, 83, 0.35);
  box-shadow: 0 0 0 4px rgba(32, 89, 83, 0.08);
}

.chat-box__footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.chat-box__status {
  display: grid;
  gap: 6px;
  color: #5d7771;
  font-size: 0.92rem;
}

.chat-box__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chat-box__primary {
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  font-weight: 700;
  color: #f7f1e7;
  background: linear-gradient(135deg, #205953, #173e39);
}

.chat-box__primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .chat-box__footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
