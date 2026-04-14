<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  connectionLabel: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:config'])

const localConfig = reactive({
  ...props.config
})

watch(
  () => props.config,
  (value) => {
    Object.assign(localConfig, value)
  },
  { deep: true }
)

watch(
  localConfig,
  (value) => {
    emit('update:config', { ...value })
  },
  { deep: true }
)
</script>

<template>
  <section class="experiment-panel">
    <div class="experiment-panel__header">
      <div>
        <p class="experiment-panel__eyebrow">Experiment Config</p>
        <h4>实验配置面板</h4>
      </div>
      <span>{{ connectionLabel }}</span>
    </div>

    <div class="experiment-panel__grid">
      <label>
        <span>对话模型</span>
        <input v-model="localConfig.model" type="text" placeholder="留空则使用后端默认模型" />
      </label>

      <label>
        <span>分析模型</span>
        <input v-model="localConfig.analysisModel" type="text" placeholder="留空则复用对话模型" />
      </label>

      <label>
        <span>Temperature</span>
        <input v-model.number="localConfig.temperature" type="number" min="0" max="2" step="0.1" />
      </label>

      <label>
        <span>Max Tokens</span>
        <input v-model.number="localConfig.maxTokens" type="number" min="200" max="4000" step="100" />
      </label>
    </div>

    <label class="experiment-panel__textarea">
      <span>结构化分析补充提示</span>
      <textarea
        v-model="localConfig.analysisPrompt"
        rows="3"
        placeholder="比如：重点关注睡眠、考试表现、社交回避等研究变量。"
      />
    </label>

    <div class="experiment-panel__checks">
      <label>
        <input v-model="localConfig.structuredAnalysis" type="checkbox" />
        <span>启用结构化分析协议</span>
      </label>
      <label>
        <input v-model="localConfig.autoUploadAudio" type="checkbox" />
        <span>录音完成后自动上传留存</span>
      </label>
    </div>
  </section>
</template>

<style scoped>
.experiment-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.84);
}

.experiment-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.experiment-panel__header h4 {
  margin: 0;
  color: #173833;
}

.experiment-panel__header span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(32, 89, 83, 0.08);
  color: #205953;
  font-size: 0.82rem;
}

.experiment-panel__eyebrow {
  margin: 0 0 6px;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8b7258;
}

.experiment-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.experiment-panel label {
  display: grid;
  gap: 6px;
}

.experiment-panel label span {
  color: #5d7771;
  font-size: 0.9rem;
}

.experiment-panel input,
.experiment-panel textarea {
  width: 100%;
  border: 1px solid rgba(23, 56, 51, 0.12);
  border-radius: 14px;
  background: rgba(255, 252, 247, 0.92);
  color: #173833;
  outline: none;
  padding: 10px 12px;
}

.experiment-panel__textarea textarea {
  resize: vertical;
}

.experiment-panel__checks {
  display: grid;
  gap: 10px;
}

.experiment-panel__checks label {
  display: flex;
  gap: 10px;
  align-items: center;
}

.experiment-panel__checks input {
  width: auto;
}

@media (max-width: 720px) {
  .experiment-panel__grid {
    grid-template-columns: 1fr;
  }
}
</style>
