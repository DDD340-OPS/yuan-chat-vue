const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const multer = require('multer')

dotenv.config()

const app = express()

const PORT = Number(process.env.PORT || 3000)
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.XUNFEI_API_KEY || ''
const LLM_API_SECRET = process.env.LLM_API_SECRET || process.env.API_SECRET || ''
const LLM_BASE_URL = (process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
const LLM_MODEL = process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'
const LLM_ANALYSIS_MODEL = process.env.LLM_ANALYSIS_MODEL || LLM_MODEL
const DEFAULT_MAX_TOKENS = Number(process.env.LLM_MAX_TOKENS || 1200)
const DEFAULT_TEMPERATURE = Number(process.env.LLM_TEMPERATURE || 0.6)
const AUDIO_UPLOAD_DIR = path.resolve(
  __dirname,
  process.env.AUDIO_UPLOAD_DIR || 'uploads/audio'
)

fs.mkdirSync(AUDIO_UPLOAD_DIR, { recursive: true })

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')))

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    callback(null, AUDIO_UPLOAD_DIR)
  },
  filename(_req, file, callback) {
    const extension = path.extname(file.originalname || '') || '.webm'
    const safeName = `audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`
    callback(null, safeName)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024
  }
})

function inferRiskLevel(text) {
  if (!text) {
    return 'low'
  }

  const highRiskWords = ['轻生', '不想活', '结束自己', '自残', '伤害自己', '伤害别人', 'suicide', 'self-harm']
  const mediumRiskWords = ['崩溃', '绝望', '控制不住', '无助', 'panic', 'hopeless']

  if (highRiskWords.some((word) => text.includes(word))) {
    return 'high'
  }

  if (mediumRiskWords.some((word) => text.includes(word))) {
    return 'medium'
  }

  return 'low'
}

function inferEmotion(text) {
  if (!text) {
    return {
      primary: '待评估',
      secondary: [],
      intensity: 25,
      valence: 'neutral',
      arousal: 'medium'
    }
  }

  const ruleSet = [
    {
      primary: '焦虑',
      secondary: ['担忧', '警觉'],
      intensity: 72,
      valence: 'negative',
      arousal: 'high',
      words: ['焦虑', '紧张', '压力', '害怕', '心慌', 'panic', 'anxious']
    },
    {
      primary: '低落',
      secondary: ['疲惫', '失落'],
      intensity: 68,
      valence: 'negative',
      arousal: 'low',
      words: ['难过', '沮丧', '无助', '失落', '疲惫', 'depressed', 'sad']
    },
    {
      primary: '关系敏感',
      secondary: ['委屈', '不安'],
      intensity: 64,
      valence: 'negative',
      arousal: 'medium',
      words: ['朋友', '父母', '关系', '误解', '社交', 'conflict', 'relationship']
    }
  ]

  return (
    ruleSet.find((rule) => rule.words.some((word) => text.includes(word))) ?? {
      primary: '情绪探索中',
      secondary: [],
      intensity: 40,
      valence: 'mixed',
      arousal: 'medium'
    }
  )
}

function fallbackStructuredAnalysis({ conversationText, assistantReply = '' }) {
  const emotion = inferEmotion(conversationText)
  const riskLevel = inferRiskLevel(conversationText)
  const tags = []

  if (conversationText.includes('考试') || conversationText.includes('成绩')) {
    tags.push('考试压力')
  }
  if (conversationText.includes('失眠') || conversationText.includes('睡不着')) {
    tags.push('睡眠问题')
  }
  if (conversationText.includes('关系') || conversationText.includes('父母') || conversationText.includes('朋友')) {
    tags.push('关系议题')
  }
  if (tags.length === 0) {
    tags.push('情绪梳理')
  }

  const interventions =
    riskLevel === 'high'
      ? [
          {
            id: 'safety-plan',
            label: '安全计划建立',
            type: 'safety',
            priority: 'high',
            rationale: '存在明显危机词，需要优先确认现实安全和求助资源。'
          }
        ]
      : [
          {
            id: 'emotion-labeling',
            label: '情绪标注与触发追问',
            type: 'exploration',
            priority: 'medium',
            rationale: '适合继续澄清事件、自动想法和身体反应之间的关系。'
          },
          {
            id: 'supportive-reflection',
            label: '支持性反映',
            type: 'support',
            priority: 'medium',
            rationale: '保持非评判回应，帮助样本继续表达。'
          }
        ]

  const riskActionMap = {
    low: '继续进行研究性对话和情绪梳理。',
    medium: '建议增加安全性追问，必要时提醒寻求线下支持。',
    high: '请优先建议联系家属、专业机构或当地紧急援助。'
  }

  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    summary:
      assistantReply.slice(0, 120) ||
      '系统已根据当前会话生成基础研究分析，可继续追踪情绪、风险和干预方向。',
    emotion,
    risk: {
      level: riskLevel,
      flags: riskLevel === 'high' ? ['crisis-language'] : [],
      rationale: '基于当前轮次文本中的情绪词和风险词做启发式判断。',
      immediateAction: riskActionMap[riskLevel]
    },
    interventions,
    tags,
    recommendedFollowUps: [
      '继续询问最近一次触发情绪的具体场景。',
      '追踪自动想法、情绪强度和身体反应。',
      '记录支持性回应后样本状态是否有波动。'
    ]
  }
}

function extractJsonObject(text) {
  const raw = String(text || '').trim()
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')

    if (start === -1 || end === -1 || end <= start) {
      return null
    }

    try {
      return JSON.parse(raw.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

function writeSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

function sanitizeMessages(messages = []) {
  return messages
    .filter((message) => ['system', 'assistant', 'user'].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content ?? '').trim()
    }))
    .filter((message) => message.content)
}

function buildXfyunHmacHeaders({ url, method, body, apiKey, apiSecret }) {
  const targetUrl = new URL(url)
  const requestMethod = String(method || 'POST').toUpperCase()
  const requestPath = `${targetUrl.pathname}${targetUrl.search}`
  const date = new Date().toUTCString()
  const host = targetUrl.host
  const payload = typeof body === 'string' ? body : JSON.stringify(body || {})
  const digest = crypto.createHash('sha256').update(payload).digest('base64')

  const signingString = [
    `host: ${host}`,
    `date: ${date}`,
    `${requestMethod} ${requestPath} HTTP/1.1`
  ].join('\n')

  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(signingString)
    .digest('base64')

  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`

  return {
    Host: host,
    Date: date,
    Digest: `SHA-256=${digest}`,
    Authorization: authorizationOrigin
  }
}

async function createChatCompletion({
  messages,
  stream = false,
  model = LLM_MODEL,
  temperature = DEFAULT_TEMPERATURE,
  maxTokens = DEFAULT_MAX_TOKENS,
  signal
}) {
  if (!LLM_API_KEY) {
    throw new Error('LLM_API_KEY is not configured.')
  }

  const url = `${LLM_BASE_URL}/chat/completions`
  const payload = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream
  }

  const headers = {
    'Content-Type': 'application/json'
  }

  if (LLM_API_SECRET) {
    Object.assign(
      headers,
      buildXfyunHmacHeaders({
        url,
        method: 'POST',
        body: payload,
        apiKey: LLM_API_KEY,
        apiSecret: LLM_API_SECRET
      })
    )
  } else {
    headers.Authorization = `Bearer ${LLM_API_KEY}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `LLM request failed with status ${response.status}.`)
  }

  return response
}

async function streamModelReply({
  messages,
  model,
  temperature,
  maxTokens,
  signal,
  onDelta
}) {
  const response = await createChatCompletion({
    messages,
    stream: true,
    model,
    temperature,
    maxTokens,
    signal
  })

  if (!response.body) {
    throw new Error('Model response body is empty.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() || ''

    for (const block of blocks) {
      const lines = block.split(/\r?\n/)

      for (const line of lines) {
        if (!line.startsWith('data:')) {
          continue
        }

        const payloadText = line.slice(5).trim()
        if (!payloadText || payloadText === '[DONE]') {
          continue
        }

        const payload = JSON.parse(payloadText)
        const delta = payload.choices?.[0]?.delta?.content || payload.choices?.[0]?.message?.content || ''

        if (delta) {
          fullText += delta
          onDelta(delta)
        }
      }
    }
  }

  return fullText
}

async function requestStructuredAnalysis({
  messages,
  assistantReply,
  sessionContext,
  experimentConfig
}) {
  const conversationText = messages
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n')

  const analysisPrompt = [
    '你是一名心理对话研究分析助手。',
    '请根据提供的对话内容输出严格 JSON，不要添加任何解释。',
    'JSON schema:',
    '{',
    '  "version": "1.0",',
    '  "generatedAt": "ISO-8601 string",',
    '  "summary": "string",',
    '  "emotion": {',
    '    "primary": "string",',
    '    "secondary": ["string"],',
    '    "intensity": 0,',
    '    "valence": "positive|neutral|negative|mixed",',
    '    "arousal": "low|medium|high"',
    '  },',
    '  "risk": {',
    '    "level": "low|medium|high",',
    '    "flags": ["string"],',
    '    "rationale": "string",',
    '    "immediateAction": "string"',
    '  },',
    '  "interventions": [',
    '    {',
    '      "id": "string",',
    '      "label": "string",',
    '      "type": "support|exploration|cognitive|behavioral|safety",',
    '      "priority": "low|medium|high",',
    '      "rationale": "string"',
    '    }',
    '  ],',
    '  "tags": ["string"],',
    '  "recommendedFollowUps": ["string"]',
    '}',
    sessionContext?.summary ? `当前会话摘要：${sessionContext.summary}` : '',
    experimentConfig?.analysisPrompt ? `研究者补充要求：${experimentConfig.analysisPrompt}` : '',
    `对话内容：\n${conversationText}`,
    `助手回复：\n${assistantReply}`
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const response = await createChatCompletion({
      messages: [{ role: 'system', content: analysisPrompt }],
      stream: false,
      model: experimentConfig?.analysisModel || LLM_ANALYSIS_MODEL,
      temperature: 0.1,
      maxTokens: 1000
    })

    const payload = await response.json()
    const content = payload.choices?.[0]?.message?.content || ''
    const parsed = extractJsonObject(content)

    if (parsed) {
      return parsed
    }
  } catch (error) {
    console.warn('[analysis] fallback due to parse or request error:', error.message)
  }

  return fallbackStructuredAnalysis({
    conversationText,
    assistantReply
  })
}

function analyzeAudioArtifact({ transcript, durationMs, file }) {
  const safeDurationMs = Math.max(Number(durationMs || 0), 0)
  const transcriptText = String(transcript || '').trim()
  const transcriptLength = transcriptText.length
  const durationMinutes = safeDurationMs > 0 ? safeDurationMs / 60000 : 0
  const speechRateCpm =
    durationMinutes > 0 && transcriptLength > 0
      ? Math.round(transcriptLength / durationMinutes)
      : 0

  let clarity = '待评估'
  if (transcriptLength >= 40 && speechRateCpm >= 100) {
    clarity = '较清晰'
  } else if (transcriptLength >= 12) {
    clarity = '一般'
  } else if (transcriptLength > 0) {
    clarity = '偏短'
  }

  let engagement = '短片段'
  if (safeDurationMs >= 90000) {
    engagement = '长时表达'
  } else if (safeDurationMs >= 30000) {
    engagement = '完整片段'
  }

  return {
    transcriptLength,
    durationMs: safeDurationMs,
    speechRateCpm,
    clarity,
    engagement,
    mimeType: file.mimetype,
    sizeBytes: file.size
  }
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    provider: {
      baseUrl: LLM_BASE_URL,
      model: LLM_MODEL,
      hasApiKey: Boolean(LLM_API_KEY),
      authMode: LLM_API_SECRET ? 'xfyun-hmac' : 'bearer'
    }
  })
})

app.post('/api/chat', async (req, res) => {
  const {
    messages = [],
    sessionContext = {},
    experimentConfig = {},
    structured = true
  } = req.body || {}

  const normalizedMessages = sanitizeMessages(messages)

  if (normalizedMessages.length === 0) {
    res.status(400).json({
      error: 'messages is required.'
    })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const abortController = new AbortController()
  req.on('aborted', () => {
    abortController.abort()
  })
  res.on('close', () => {
    abortController.abort()
  })

  try {
    writeSse(res, {
      type: 'open',
      provider: {
        baseUrl: LLM_BASE_URL,
        model: experimentConfig.model || LLM_MODEL
      }
    })

    const assistantReply = await streamModelReply({
      messages: normalizedMessages,
      model: experimentConfig.model || LLM_MODEL,
      temperature: Number(experimentConfig.temperature ?? DEFAULT_TEMPERATURE),
      maxTokens: Number(experimentConfig.maxTokens ?? DEFAULT_MAX_TOKENS),
      signal: abortController.signal,
      onDelta: (delta) => {
        writeSse(res, {
          type: 'delta',
          delta
        })
      }
    })

    if (structured) {
      const analysis = await requestStructuredAnalysis({
        messages: normalizedMessages,
        assistantReply,
        sessionContext,
        experimentConfig
      })

      writeSse(res, {
        type: 'analysis',
        analysis
      })
    }

    writeSse(res, {
      type: 'done'
    })
    res.end()
  } catch (error) {
    writeSse(res, {
      type: 'error',
      message: error.message || 'LLM request failed.'
    })
    writeSse(res, {
      type: 'done'
    })
    res.end()
  }
})

app.post('/api/audio/upload', upload.single('audio'), (req, res) => {
  if (!req.file) {
    res.status(400).json({
      error: 'audio file is required.'
    })
    return
  }

  const transcript = String(req.body?.transcript || '')
  const durationMs = Number(req.body?.durationMs || 0)
  const sessionId = String(req.body?.sessionId || '')
  const analysis = analyzeAudioArtifact({
    transcript,
    durationMs,
    file: req.file
  })

  res.json({
    asset: {
      id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId,
      createdAt: new Date().toISOString(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/audio/${req.file.filename}`,
      transcript,
      analysis
    }
  })
})

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`)
})
