import { createSession } from '../../modules/research/sessionFactory'

const STORAGE_KEY = 'mental-health-research:cache:v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function serializeMessage(message) {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    source: message.source,
    error: Boolean(message.error)
  }
}

function serializeSession(session) {
  return {
    id: session.id,
    title: session.title,
    stage: session.stage,
    participant: session.participant,
    summary: session.summary,
    mood: session.mood,
    riskLevel: session.riskLevel,
    interventionFocus: session.interventionFocus,
    researchTags: session.researchTags,
    contextMemory: session.contextMemory,
    interventionSuggestions: session.interventionSuggestions,
    analysis: session.analysis,
    audioAssets: session.audioAssets,
    draft: session.draft,
    createdAt: session.createdAt,
    lastUpdated: session.lastUpdated,
    messages: session.messages.map(serializeMessage)
  }
}

function restoreSession(rawSession) {
  return createSession({
    ...rawSession,
    messages: Array.isArray(rawSession?.messages)
      ? rawSession.messages.map((message) => ({
          ...message,
          renderedContent: message.content ?? '',
          streaming: false
        }))
      : []
  })
}

export function loadResearchCache(fallbackSessions = []) {
  const defaultState = {
    sessions: fallbackSessions,
    activeSessionId: fallbackSessions[0]?.id ?? '',
    experimentConfig: null,
    archiveFilters: null
  }

  if (!canUseStorage()) {
    return defaultState
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultState
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.sessions) || parsed.sessions.length === 0) {
      return defaultState
    }

    const sessions = parsed.sessions.map((session) => restoreSession(session))
    const activeSessionId = sessions.some((session) => session.id === parsed.activeSessionId)
      ? parsed.activeSessionId
      : sessions[0]?.id ?? ''

    return {
      sessions,
      activeSessionId,
      experimentConfig: parsed.experimentConfig || null,
      archiveFilters: parsed.archiveFilters || null
    }
  } catch {
    return defaultState
  }
}

export function persistResearchCache({ sessions, activeSessionId, experimentConfig, archiveFilters }) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        activeSessionId,
        experimentConfig,
        archiveFilters,
        sessions: sessions.map(serializeSession)
      })
    )
  } catch {
    // Ignore storage quota and privacy mode errors.
  }
}
