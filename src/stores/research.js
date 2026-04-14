import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { applyStructuredAnalysis, enrichSession } from '../modules/research/analysis'
import {
  createMessage,
  createSession,
  createStreamingAssistantMessage,
  nowIso
} from '../modules/research/sessionFactory'
import { createInitialSessions } from '../modules/research/seedSessions'
import { uploadAudioRecording } from '../services/audio/client'
import {
  buildConversationContext,
  getLlmConnectionLabel,
  streamConversationReply
} from '../services/llm/client'
import {
  loadResearchCache,
  persistResearchCache
} from '../services/storage/researchCache'

const PERSIST_DELAY = 240

function createDefaultExperimentConfig() {
  return {
    model: '',
    analysisModel: '',
    temperature: 0.6,
    maxTokens: 1200,
    structuredAnalysis: true,
    analysisPrompt: '',
    autoUploadAudio: true,
    responseStyle: 'supportive'
  }
}

function createDefaultArchiveFilters() {
  return {
    query: '',
    stage: 'all',
    risk: 'all',
    tag: 'all'
  }
}

export const useResearchStore = defineStore('research', () => {
  const fallbackSessions = createInitialSessions()
  const restoredState = loadResearchCache(fallbackSessions)
  const sessions = ref(restoredState.sessions)
  const activeSessionId = ref(restoredState.activeSessionId)
  const isStreaming = ref(false)
  const isUploadingAudio = ref(false)
  const statusMessage = ref('系统就绪，等待发起研究对话。')
  const activeAbortController = ref(null)
  const experimentConfig = ref({
    ...createDefaultExperimentConfig(),
    ...(restoredState.experimentConfig || {})
  })
  const archiveFilters = ref({
    ...createDefaultArchiveFilters(),
    ...(restoredState.archiveFilters || {})
  })
  let persistTimerId = 0

  const activeSession = computed(() => {
    return sessions.value.find((session) => session.id === activeSessionId.value) ?? null
  })

  const orderedSessions = computed(() => {
    return [...sessions.value].sort((left, right) => {
      return new Date(right.lastUpdated).getTime() - new Date(left.lastUpdated).getTime()
    })
  })

  const availableTags = computed(() => {
    return [...new Set(sessions.value.flatMap((session) => session.researchTags || []))]
  })

  const filteredSessions = computed(() => {
    const query = archiveFilters.value.query.trim().toLowerCase()

    return orderedSessions.value.filter((session) => {
      const matchesQuery =
        !query ||
        [session.title, session.summary, session.participant, ...(session.researchTags || [])]
          .join(' ')
          .toLowerCase()
          .includes(query)

      const matchesStage =
        archiveFilters.value.stage === 'all' || session.stage === archiveFilters.value.stage

      const matchesRisk =
        archiveFilters.value.risk === 'all' || session.riskLevel === archiveFilters.value.risk

      const matchesTag =
        archiveFilters.value.tag === 'all' ||
        (session.researchTags || []).includes(archiveFilters.value.tag)

      return matchesQuery && matchesStage && matchesRisk && matchesTag
    })
  })

  const sessionCount = computed(() => sessions.value.length)
  const totalMessageCount = computed(() => {
    return sessions.value.reduce((total, session) => total + session.messages.length, 0)
  })

  const connectionLabel = computed(() => getLlmConnectionLabel())

  function schedulePersist() {
    if (typeof window === 'undefined') {
      return
    }

    window.clearTimeout(persistTimerId)
    persistTimerId = window.setTimeout(() => {
      persistResearchCache({
        sessions: sessions.value,
        activeSessionId: activeSessionId.value,
        experimentConfig: experimentConfig.value,
        archiveFilters: archiveFilters.value
      })
    }, PERSIST_DELAY)
  }

  watch(
    [sessions, activeSessionId, experimentConfig, archiveFilters],
    () => {
      schedulePersist()
    },
    { deep: true }
  )

  function setActiveSession(sessionId) {
    activeSessionId.value = sessionId
  }

  function createResearchSession(title = '') {
    const session = createSession({
      title: title || `新建研究会话 ${sessions.value.length + 1}`,
      participant: `匿名样本 ${String.fromCharCode(68 + sessions.value.length)}`
    })

    sessions.value.unshift(session)
    activeSessionId.value = session.id
    statusMessage.value = '已创建新的研究会话。'
  }

  function updateDraft(value) {
    if (activeSession.value) {
      activeSession.value.draft = value
    }
  }

  function appendToDraft(value) {
    if (!activeSession.value || !value) {
      return
    }

    const spacer = activeSession.value.draft.trim() ? ' ' : ''
    activeSession.value.draft = `${activeSession.value.draft}${spacer}${value}`.trim()
  }

  function updateExperimentConfig(patch) {
    experimentConfig.value = {
      ...experimentConfig.value,
      ...patch
    }
  }

  function updateArchiveFilters(patch) {
    archiveFilters.value = {
      ...archiveFilters.value,
      ...patch
    }
  }

  function resetArchiveFilters() {
    archiveFilters.value = createDefaultArchiveFilters()
  }

  function stopStreaming() {
    if (activeAbortController.value) {
      activeAbortController.value.abort()
      statusMessage.value = '已停止本轮流式输出。'
    }
  }

  async function attachAudioAsset({
    file,
    transcript = '',
    durationMs = 0
  }) {
    if (!activeSession.value) {
      return null
    }

    const session = activeSession.value

    if (!experimentConfig.value.autoUploadAudio) {
      const localAsset = {
        id: `local-audio-${Date.now()}`,
        sessionId: session.id,
        createdAt: new Date().toISOString(),
        originalName: file.name,
        url: URL.createObjectURL(file),
        transcript,
        analysis: {
          durationMs,
          transcriptLength: transcript.length,
          mimeType: file.type,
          sizeBytes: file.size,
          clarity: transcript.length > 20 ? '较清晰' : '待评估',
          engagement: durationMs > 60000 ? '完整片段' : '短片段',
          speechRateCpm: durationMs > 0 ? Math.round(transcript.length / (durationMs / 60000 || 1)) : 0
        }
      }

      session.audioAssets.unshift(localAsset)
      session.lastUpdated = nowIso()
      return localAsset
    }

    isUploadingAudio.value = true
    statusMessage.value = '正在上传录音并分析语音元数据...'

    try {
      const asset = await uploadAudioRecording({
        sessionId: session.id,
        file,
        transcript,
        durationMs
      })

      session.audioAssets.unshift(asset)
      session.lastUpdated = nowIso()
      statusMessage.value = '录音文件已上传并保存。'
      return asset
    } finally {
      isUploadingAudio.value = false
    }
  }

  async function sendMessage(content, options = {}) {
    if (!activeSession.value || isStreaming.value) {
      return
    }

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return
    }

    const session = activeSession.value
    const userMessage = createMessage('user', trimmedContent, {
      source: options.source ?? 'text'
    })

    session.messages.push(userMessage)
    session.draft = ''
    enrichSession(session)

    const assistantMessage = createStreamingAssistantMessage()
    session.messages.push(assistantMessage)

    const llmMessages = buildConversationContext({
      messages: session.messages.filter((message) => message.id !== assistantMessage.id),
      summary: session.summary,
      interventionFocus: session.interventionFocus,
      riskLevel: session.riskLevel,
      researchTags: session.researchTags
    })

    const controller = new AbortController()
    activeAbortController.value = controller
    isStreaming.value = true
    statusMessage.value = '正在建立对话请求并等待流式响应...'

    try {
      await streamConversationReply({
        messages: llmMessages,
        sessionContext: {
          summary: session.summary,
          interventionFocus: session.interventionFocus,
          riskLevel: session.riskLevel,
          researchTags: session.researchTags
        },
        experimentConfig: experimentConfig.value,
        signal: controller.signal,
        onOpen: ({ attempt, mode, provider }) => {
          statusMessage.value =
            attempt === 1
              ? `已连接${mode === 'mock' ? '本地 Mock 引擎' : provider?.model || 'LLM 服务'}，开始流式生成...`
              : `正在发起第 ${attempt} 次重试请求...`
        },
        onRetry: ({ nextAttempt, delay }) => {
          assistantMessage.content = ''
          assistantMessage.renderedContent = ''
          statusMessage.value = `网络波动，${Math.round(delay / 100) / 10} 秒后进行第 ${nextAttempt} 次重试...`
        },
        onDelta: (chunk) => {
          assistantMessage.content += chunk
          session.lastUpdated = nowIso()
          statusMessage.value = '正在流式生成支持性回应...'
        },
        onAnalysis: (analysis) => {
          if (analysis) {
            applyStructuredAnalysis(session, analysis)
          }
        },
        onComplete: () => {
          statusMessage.value = '本轮流式输出已完成。'
        }
      })

      assistantMessage.streaming = false
      enrichSession(session)
      applyStructuredAnalysis(session, session.analysis)
    } catch (error) {
      if (error.name === 'AbortError') {
        assistantMessage.content =
          assistantMessage.content || '本轮回应已手动停止，你可以从当前点继续追问。'
        assistantMessage.streaming = false
        enrichSession(session)
      } else {
        if (assistantMessage.content) {
          assistantMessage.content += '\n\n[连接中断，本轮回复未完整生成，请稍后重试。]'
        } else {
          assistantMessage.content =
            '暂时未能获取模型回复，请检查后端连接后重试，当前问题已经保留在会话中。'
        }

        assistantMessage.error = true
        assistantMessage.streaming = false
        enrichSession(session)
        statusMessage.value = '生成失败，请检查接口配置。'
      }
    } finally {
      isStreaming.value = false
      activeAbortController.value = null
      schedulePersist()
    }
  }

  return {
    sessions,
    activeSessionId,
    activeSession,
    orderedSessions,
    filteredSessions,
    availableTags,
    isStreaming,
    isUploadingAudio,
    statusMessage,
    sessionCount,
    totalMessageCount,
    connectionLabel,
    experimentConfig,
    archiveFilters,
    setActiveSession,
    createResearchSession,
    updateDraft,
    appendToDraft,
    updateExperimentConfig,
    updateArchiveFilters,
    resetArchiveFilters,
    attachAudioAsset,
    sendMessage,
    stopStreaming
  }
})
