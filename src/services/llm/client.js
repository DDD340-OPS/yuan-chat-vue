import { streamMockConversation } from './mock'
import { streamSseResponse } from './sse'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const API_ENDPOINT = API_BASE_URL ? `${API_BASE_URL}/api/chat` : ''
const DEFAULT_CONTEXT_WINDOW = 12
const DEFAULT_RETRIES = 2
const DEFAULT_RETRY_DELAY = 800

const BASE_SYSTEM_PROMPT = [
  '你是一名用于心理对话研究的智能助手。',
  '请使用支持性、非诊断性的表达帮助用户梳理情绪、触发场景与自动想法。',
  '如果识别到自伤、自杀或他伤风险，请优先提醒用户寻求线下紧急援助和专业支持。',
  '回答需要适合多轮对话，避免一次性输出过长的结论。'
].join('\n')

function createAbortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function isAbortError(error) {
  return error?.name === 'AbortError'
}

function createHttpError(status, message) {
  const error = new Error(message)
  error.name = 'HttpError'
  error.status = status
  error.retryable = status === 408 || status === 429 || status >= 500
  return error
}

function isRetryableError(error) {
  if (isAbortError(error)) {
    return false
  }

  if (typeof error?.retryable === 'boolean') {
    return error.retryable
  }

  return (
    error?.name === 'TypeError' ||
    error?.name === 'TimeoutError' ||
    error?.status === 429 ||
    error?.status >= 500
  )
}

function sleep(duration, signal) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup()
      resolve()
    }, duration)

    const cleanup = () => {
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }

    const onAbort = () => {
      cleanup()
      reject(createAbortError())
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function buildSystemPrompt(context = {}) {
  return [
    BASE_SYSTEM_PROMPT,
    context.summary ? `当前会话摘要：${context.summary}` : '',
    context.interventionFocus ? `当前研究焦点：${context.interventionFocus}` : '',
    context.riskLevel ? `当前风险观察：${context.riskLevel}` : '',
    context.researchTags?.length ? `当前研究标签：${context.researchTags.join('、')}` : ''
  ]
    .filter(Boolean)
    .join('\n')
}

function normalizeMessages(messages) {
  return messages
    .filter((message) => ['system', 'assistant', 'user'].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content ?? '').trim()
    }))
    .filter((message) => message.content)
}

function extractContentFromPayload(payload) {
  return (
    payload?.choices?.[0]?.delta?.content ??
    payload?.choices?.[0]?.message?.content ??
    payload?.message?.content ??
    payload?.content ??
    ''
  )
}

async function fetchChatStream({ messages, sessionContext, experimentConfig, signal }) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages,
      sessionContext,
      experimentConfig,
      structured: experimentConfig?.structuredAnalysis !== false
    }),
    signal
  })

  if (!response.ok) {
    let detail = ''
    try {
      detail = await response.text()
    } catch {
      detail = ''
    }

    throw createHttpError(
      response.status,
      detail || `模型接口请求失败（HTTP ${response.status}）。`
    )
  }

  return response
}

async function streamNetworkConversation({
  messages,
  sessionContext,
  experimentConfig,
  signal,
  onOpen,
  onDelta,
  onAnalysis,
  onComplete
}) {
  const response = await fetchChatStream({
    messages,
    sessionContext,
    experimentConfig,
    signal
  })

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const payload = await response.json()
    const content = extractContentFromPayload(payload)
    if (content) {
      onDelta(content)
    }
    onComplete?.()
    return
  }

  await streamSseResponse({
    response,
    signal,
    onData: (payloadText) => {
      if (!payloadText || payloadText === '[DONE]') {
        return
      }

      const payload = JSON.parse(payloadText)

      if (payload.type === 'open') {
        onOpen?.({
          mode: 'network',
          provider: payload.provider
        })
        return
      }

      if (payload.type === 'delta') {
        onDelta?.(payload.delta || '')
        return
      }

      if (payload.type === 'analysis') {
        onAnalysis?.(payload.analysis)
        return
      }

      if (payload.type === 'done') {
        onComplete?.()
        return
      }

      if (payload.type === 'error') {
        throw new Error(payload.message || '模型请求失败。')
      }

      const content = extractContentFromPayload(payload)
      if (content) {
        onDelta?.(content)
      }
    }
  })
}

async function withRetry(task, { retries, retryDelay, signal, onRetry }) {
  let attempt = 1

  while (true) {
    try {
      return await task(attempt)
    } catch (error) {
      if (attempt > retries || !isRetryableError(error)) {
        throw error
      }

      const delay = retryDelay * 2 ** (attempt - 1)
      onRetry?.({
        attempt,
        nextAttempt: attempt + 1,
        delay,
        error
      })

      await sleep(delay, signal)
      attempt += 1
    }
  }
}

export function isLlmApiConfigured() {
  return Boolean(API_ENDPOINT)
}

export function getLlmConnectionLabel() {
  return isLlmApiConfigured() ? '真实 LLM 接口' : 'Mock LLM 引擎'
}

export function buildConversationContext({ messages, ...context }) {
  const normalizedMessages = normalizeMessages(messages)
  const trimmedMessages = normalizedMessages.slice(-DEFAULT_CONTEXT_WINDOW)

  return [
    {
      role: 'system',
      content: buildSystemPrompt(context)
    },
    ...trimmedMessages
  ]
}

export async function streamConversationReply({
  messages,
  sessionContext,
  experimentConfig,
  signal,
  onOpen,
  onRetry,
  onDelta,
  onAnalysis,
  onComplete
}) {
  if (!isLlmApiConfigured()) {
    onOpen?.({ attempt: 1, mode: 'mock' })
    await streamMockConversation({ messages, signal, onDelta })
    onAnalysis?.(null)
    onComplete?.()
    return
  }

  await withRetry(
    async (attempt) => {
      onOpen?.({ attempt, mode: 'network' })
      await streamNetworkConversation({
        messages,
        sessionContext,
        experimentConfig,
        signal,
        onOpen,
        onDelta,
        onAnalysis,
        onComplete
      })
    },
    {
      retries: DEFAULT_RETRIES,
      retryDelay: DEFAULT_RETRY_DELAY,
      signal,
      onRetry
    }
  )
}
