<script setup>
import { computed, defineAsyncComponent, ref } from 'vue'
import { useResearchStore } from '../stores/research'

const MessageList = defineAsyncComponent(() => import('../components/MessageList.vue'))
const ChatBox = defineAsyncComponent(() => import('../components/ChatBox.vue'))
const MetricCard = defineAsyncComponent(() => import('../components/MetricCard.vue'))
const ExperimentPanel = defineAsyncComponent(() => import('../components/ExperimentPanel.vue'))
const AudioAssetList = defineAsyncComponent(() => import('../components/AudioAssetList.vue'))

const researchStore = useResearchStore()
const newSessionTitle = ref('')

const activeSession = computed(() => researchStore.activeSession)

const draft = computed({
  get: () => activeSession.value?.draft ?? '',
  set: (value) => researchStore.updateDraft(value)
})

const activeMetrics = computed(() => {
  if (!activeSession.value) {
    return []
  }

  return [
    {
      label: '会话阶段',
      value: activeSession.value.stage,
      description: `当前样本：${activeSession.value.participant}`,
      tone: 'teal'
    },
    {
      label: '情绪评估',
      value: activeSession.value.mood,
      description: '优先展示结构化分析结果，失败时回退到前端启发式判断。',
      tone: 'amber'
    },
    {
      label: '风险等级',
      value: activeSession.value.riskLevel,
      description: '结合结构化协议与关键风险词，辅助研究转介判断。',
      tone: 'slate'
    }
  ]
})

const structuredHighlights = computed(() => {
  const analysis = activeSession.value?.analysis
  if (!analysis) {
    return []
  }

  return [
    analysis.emotion?.secondary?.length
      ? `伴随情绪：${analysis.emotion.secondary.join('、')}`
      : '',
    analysis.risk?.rationale ? `风险依据：${analysis.risk.rationale}` : '',
    analysis.risk?.immediateAction ? `建议动作：${analysis.risk.immediateAction}` : '',
    Array.isArray(analysis.recommendedFollowUps) && analysis.recommendedFollowUps.length
      ? `后续追问：${analysis.recommendedFollowUps.join('；')}`
      : ''
  ].filter(Boolean)
})

const suggestedPrompts = computed(() => {
  const followUps = activeSession.value?.analysis?.recommendedFollowUps
  if (Array.isArray(followUps) && followUps.length > 0) {
    return followUps.slice(0, 3)
  }

  const focus = activeSession.value?.interventionFocus ?? ''

  if (focus.includes('睡眠')) {
    return [
      '昨晚最难入睡的那一刻，你脑海里第一句话是什么？',
      '睡前一小时你通常在做什么？',
      '那时身体最明显的不舒服是什么？'
    ]
  }

  if (focus.includes('考试')) {
    return [
      '最近一次压力飙升时，具体发生了什么？',
      '你最担心的后果是什么？',
      '如果把焦虑强度从 0 到 10 打分，会是多少？'
    ]
  }

  if (focus.includes('关系')) {
    return [
      '那段关系里你最在意被怎样对待？',
      '冲突发生时你第一反应通常是什么？',
      '有没有一个人能让你感觉稍微安全一些？'
    ]
  }

  return [
    '最近一次情绪明显波动时，发生了什么？',
    '那一刻你最想逃开的是什么？',
    '如果把感受说成一句话，会是什么？'
  ]
})

function formatTime(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function createSession() {
  researchStore.createResearchSession(newSessionTitle.value.trim())
  newSessionTitle.value = ''
}

function submitMessage(payload) {
  researchStore.sendMessage(payload.content, {
    source: payload.source
  })
}

async function handleAudioRecordingComplete(payload) {
  await researchStore.attachAudioAsset(payload)
}
</script>

<template>
  <div class="workbench" v-if="activeSession">
    <aside class="panel session-panel">
      <div class="panel__header">
        <div>
          <p class="section-eyebrow">Session Pool</p>
          <h3>研究会话</h3>
        </div>
      </div>

      <div class="new-session">
        <input
          v-model="newSessionTitle"
          type="text"
          placeholder="输入新的研究样本标题"
          @keyup.enter="createSession"
        />
        <button type="button" @click="createSession">
          新建
        </button>
      </div>

      <div class="session-list">
        <button
          v-for="session in researchStore.orderedSessions"
          :key="session.id"
          type="button"
          class="session-card"
          :class="{ 'session-card--active': session.id === activeSession.id }"
          @click="researchStore.setActiveSession(session.id)"
        >
          <div class="session-card__header">
            <strong>{{ session.title }}</strong>
            <span>{{ formatTime(session.lastUpdated) }}</span>
          </div>
          <p>{{ session.summary }}</p>
          <div class="session-card__meta">
            <span>{{ session.mood }}</span>
            <span>风险 {{ session.riskLevel }}</span>
            <span v-if="session.audioAssets?.length">录音 {{ session.audioAssets.length }}</span>
          </div>
        </button>
      </div>
    </aside>

    <section class="panel conversation-panel">
      <div class="conversation-panel__header">
        <div>
          <p class="section-eyebrow">Dialogue Lab</p>
          <h3>{{ activeSession.title }}</h3>
          <p>{{ activeSession.summary }}</p>
        </div>
        <div class="conversation-panel__badges">
          <span>{{ activeSession.participant }}</span>
          <span>{{ researchStore.connectionLabel }}</span>
        </div>
      </div>

      <Suspense>
        <template #default>
          <MessageList :session="activeSession" />
        </template>
        <template #fallback>
          <div class="async-skeleton">
            正在加载历史消息模块...
          </div>
        </template>
      </Suspense>

      <Suspense>
        <template #default>
          <ChatBox
            v-model="draft"
            :disabled="researchStore.isStreaming"
            :uploading-audio="researchStore.isUploadingAudio"
            :status-message="researchStore.statusMessage"
            :suggestions="suggestedPrompts"
            @send="submitMessage"
            @audio-recording-complete="handleAudioRecordingComplete"
          />
        </template>
        <template #fallback>
          <div class="async-skeleton">
            正在加载输入与语音模块...
          </div>
        </template>
      </Suspense>
    </section>

    <aside class="panel insight-panel">
      <div class="panel__header">
        <div>
          <p class="section-eyebrow">Research Console</p>
          <h3>实验与观察面板</h3>
        </div>
      </div>

      <Suspense>
        <template #default>
          <div class="metric-grid">
            <MetricCard
              v-for="metric in activeMetrics"
              :key="metric.label"
              :label="metric.label"
              :value="metric.value"
              :description="metric.description"
              :tone="metric.tone"
            />
          </div>
        </template>
        <template #fallback>
          <div class="async-skeleton async-skeleton--compact">
            正在加载研究指标...
          </div>
        </template>
      </Suspense>

      <section class="insight-block">
        <h4>结构化分析</h4>
        <div v-if="structuredHighlights.length > 0" class="insight-lines">
          <p v-for="item in structuredHighlights" :key="item">{{ item }}</p>
        </div>
        <p v-else class="insight-empty">
          当前尚未返回结构化分析结果，系统会先使用前端启发式标签。
        </p>
      </section>

      <section class="insight-block">
        <h4>研究标签</h4>
        <div class="chip-list">
          <span v-for="tag in activeSession.researchTags" :key="tag">{{ tag }}</span>
        </div>
      </section>

      <section class="insight-block">
        <h4>上下文记忆</h4>
        <ul>
          <li v-for="item in activeSession.contextMemory" :key="item">
            {{ item }}
          </li>
        </ul>
      </section>

      <section class="insight-block">
        <h4>干预建议</h4>
        <ul>
          <li v-for="item in activeSession.interventionSuggestions" :key="item">
            {{ item }}
          </li>
        </ul>
      </section>

      <Suspense>
        <template #default>
          <ExperimentPanel
            :config="researchStore.experimentConfig"
            :connection-label="researchStore.connectionLabel"
            @update:config="researchStore.updateExperimentConfig"
          />
        </template>
        <template #fallback>
          <div class="async-skeleton async-skeleton--compact">
            正在加载实验配置...
          </div>
        </template>
      </Suspense>

      <Suspense>
        <template #default>
          <AudioAssetList :assets="activeSession.audioAssets || []" />
        </template>
        <template #fallback>
          <div class="async-skeleton async-skeleton--compact">
            正在加载录音留存...
          </div>
        </template>
      </Suspense>
    </aside>
  </div>
</template>

<style scoped>
.workbench {
  display: grid;
  grid-template-columns: 280px minmax(0, 1.35fr) 360px;
  gap: 18px;
  height: 100%;
  min-height: 720px;
}

.panel,
.session-card,
.async-skeleton {
  border: 1px solid rgba(23, 56, 51, 0.08);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14px 38px rgba(35, 63, 58, 0.06);
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 18px;
  border-radius: 28px;
}

.panel__header {
  margin-bottom: 16px;
}

.section-eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8b7258;
}

.panel__header h3,
.conversation-panel__header h3 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.42rem;
  color: #173833;
}

.new-session {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  margin-bottom: 16px;
}

.new-session input {
  width: 100%;
  border: 1px solid rgba(23, 56, 51, 0.12);
  border-radius: 18px;
  background: rgba(255, 252, 247, 0.92);
  color: #173833;
  outline: none;
  padding: 12px 14px;
}

.new-session button {
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  font-weight: 700;
  color: #f7f1e7;
  background: linear-gradient(135deg, #205953, #173e39);
}

.session-list {
  display: grid;
  gap: 12px;
  overflow-y: auto;
  padding-right: 2px;
}

.session-card {
  width: 100%;
  padding: 16px;
  border-radius: 22px;
  text-align: left;
}

.session-card--active {
  background: linear-gradient(135deg, rgba(244, 230, 205, 0.82), rgba(255, 255, 255, 0.96));
  border-color: rgba(182, 117, 56, 0.22);
}

.session-card__header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.session-card__header strong {
  color: #173833;
}

.session-card__header span,
.session-card p,
.conversation-panel__header p,
.insight-block li,
.insight-lines p,
.insight-empty,
.async-skeleton {
  color: #5d7771;
}

.session-card p {
  margin: 0 0 12px;
  line-height: 1.7;
}

.session-card__meta,
.conversation-panel__badges,
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.session-card__meta span,
.conversation-panel__badges span,
.chip-list span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(32, 89, 83, 0.08);
  font-size: 0.82rem;
  color: #21504a;
}

.conversation-panel {
  gap: 16px;
}

.conversation-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.conversation-panel__header p {
  margin: 10px 0 0;
  line-height: 1.7;
}

.async-skeleton {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  border-radius: 24px;
}

.async-skeleton--compact {
  min-height: 110px;
}

.metric-grid {
  display: grid;
  gap: 12px;
}

.insight-panel {
  gap: 14px;
}

.insight-block {
  padding: 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.8);
}

.insight-block h4 {
  margin: 0 0 12px;
  font-size: 1rem;
  color: #173833;
}

.insight-block ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
}

.insight-lines {
  display: grid;
  gap: 8px;
}

.insight-lines p,
.insight-empty {
  margin: 0;
  line-height: 1.7;
}

@media (max-width: 1380px) {
  .workbench {
    grid-template-columns: 1fr;
    height: auto;
  }
}

@media (max-width: 720px) {
  .conversation-panel__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .new-session {
    grid-template-columns: 1fr;
  }
}
</style>
