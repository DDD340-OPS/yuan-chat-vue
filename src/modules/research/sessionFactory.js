import { enrichSession } from './analysis'

export function nowIso() {
  return new Date().toISOString()
}

export function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeMessage(raw = {}) {
  const content = String(raw.content ?? '')

  return {
    id: raw.id ?? createId('msg'),
    role: raw.role ?? 'user',
    content,
    renderedContent: raw.renderedContent ?? content,
    createdAt: raw.createdAt ?? nowIso(),
    source: raw.source,
    error: Boolean(raw.error),
    streaming: Boolean(raw.streaming)
  }
}

export function createMessage(role, content, extra = {}) {
  return normalizeMessage({
    ...extra,
    role,
    content
  })
}

export function createStreamingAssistantMessage(extra = {}) {
  return normalizeMessage({
    ...extra,
    role: 'assistant',
    content: '',
    renderedContent: '',
    streaming: true
  })
}

export function createSession(seed = {}) {
  const normalizedMessages =
    Array.isArray(seed.messages) && seed.messages.length > 0
      ? seed.messages.map((message) => normalizeMessage(message))
      : [
          createMessage(
            'assistant',
            '你好，我是研究工作台中的心理对话助手。你可以在这里进行多轮样本对话、语音输入记录和基础情绪评估。'
          )
        ]

  const session = {
    id: seed.id ?? createId('session'),
    title: seed.title ?? '新建研究会话',
    stage: seed.stage ?? '初访',
    participant: seed.participant ?? '匿名样本',
    summary: seed.summary ?? '等待研究对话启动。',
    mood: seed.mood ?? '待评估',
    riskLevel: seed.riskLevel ?? '低',
    interventionFocus: seed.interventionFocus ?? '支持性倾听与情绪梳理',
    researchTags: seed.researchTags ?? ['基础样本'],
    contextMemory: seed.contextMemory ?? [],
    interventionSuggestions: seed.interventionSuggestions ?? [],
    analysis: seed.analysis ?? null,
    audioAssets: Array.isArray(seed.audioAssets) ? seed.audioAssets : [],
    draft: seed.draft ?? '',
    createdAt: seed.createdAt ?? nowIso(),
    lastUpdated: seed.lastUpdated ?? nowIso(),
    messages: normalizedMessages
  }

  enrichSession(session)
  session.messages = session.messages.map((message) =>
    normalizeMessage({
      ...message,
      renderedContent: message.content,
      streaming: false
    })
  )

  return session
}
