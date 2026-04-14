<script setup>
import { computed } from 'vue'
import { useVoiceRecorder } from '../composables/useVoiceRecorder'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['transcript', 'status-change', 'recording-complete'])

const {
  speechSupported,
  recordingSupported,
  isCapturing,
  isListening,
  interimTranscript,
  phase,
  durationLabel,
  statusText,
  startRecording,
  stopRecording,
  cancelRecording
} = useVoiceRecorder({
  onTranscript(transcript) {
    emit('transcript', transcript)
  },
  onStateChange(snapshot) {
    emit('status-change', snapshot)
  },
  onRecordingComplete(payload) {
    emit('recording-complete', payload)
  },
  onError(message) {
    emit('status-change', {
      phase: 'error',
      speechSupported: speechSupported.value,
      recordingSupported: recordingSupported.value,
      isListening: isListening.value,
      interimTranscript: interimTranscript.value,
      statusText: message
    })
  }
})

const canStart = computed(() => (speechSupported.value || recordingSupported.value) && !props.disabled && !isCapturing.value)
const canStop = computed(() => (speechSupported.value || recordingSupported.value) && isCapturing.value)
const hasInterimTranscript = computed(() => Boolean(interimTranscript.value))
</script>

<template>
  <section class="voice-recorder">
    <div class="voice-recorder__header">
      <div>
        <p class="voice-recorder__eyebrow">Voice Input</p>
        <strong>语音输入与录音留存</strong>
      </div>
      <span class="voice-recorder__badge" :class="`voice-recorder__badge--${phase}`">
        {{ isListening ? durationLabel : speechSupported || recordingSupported ? '待命' : '不支持' }}
      </span>
    </div>

    <div class="voice-recorder__capabilities">
      <span>转写：{{ speechSupported ? '支持' : '不支持' }}</span>
      <span>录音：{{ recordingSupported ? '支持' : '不支持' }}</span>
    </div>

    <p class="voice-recorder__status">
      {{ statusText }}
    </p>

    <div v-if="hasInterimTranscript" class="voice-recorder__transcript">
      {{ interimTranscript }}
    </div>

    <div class="voice-recorder__actions">
      <button
        type="button"
        class="voice-recorder__primary"
        :disabled="!canStart"
        @click="startRecording"
      >
        开始采集
      </button>
      <button
        type="button"
        class="voice-recorder__ghost"
        :disabled="!canStop"
        @click="stopRecording"
      >
        结束采集
      </button>
      <button
        type="button"
        class="voice-recorder__ghost"
        :disabled="props.disabled && !isListening"
        @click="cancelRecording"
      >
        清空状态
      </button>
    </div>
  </section>
</template>

<style scoped>
.voice-recorder {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 22px;
  border: 1px solid rgba(23, 56, 51, 0.08);
  background: rgba(255, 255, 255, 0.78);
}

.voice-recorder__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.voice-recorder__eyebrow {
  margin: 0 0 6px;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8b7258;
}

.voice-recorder strong {
  color: #173833;
}

.voice-recorder__badge {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  color: #205953;
  background: rgba(32, 89, 83, 0.08);
}

.voice-recorder__badge--listening,
.voice-recorder__badge--connecting,
.voice-recorder__badge--stopping,
.voice-recorder__badge--uploading {
  color: #8a5221;
  background: rgba(182, 117, 56, 0.14);
}

.voice-recorder__badge--error {
  color: #a24545;
  background: rgba(162, 69, 69, 0.12);
}

.voice-recorder__capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.voice-recorder__capabilities span {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  color: #21504a;
  background: rgba(32, 89, 83, 0.08);
}

.voice-recorder__status {
  margin: 0;
  color: #5d7771;
  line-height: 1.7;
}

.voice-recorder__transcript {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(32, 89, 83, 0.06);
  color: #205953;
  line-height: 1.7;
}

.voice-recorder__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.voice-recorder__primary,
.voice-recorder__ghost {
  border: none;
  border-radius: 999px;
  padding: 10px 15px;
  font-weight: 700;
}

.voice-recorder__primary {
  color: #f7f1e7;
  background: linear-gradient(135deg, #205953, #173e39);
}

.voice-recorder__ghost {
  color: #205953;
  background: rgba(32, 89, 83, 0.08);
}

.voice-recorder__primary:disabled,
.voice-recorder__ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
