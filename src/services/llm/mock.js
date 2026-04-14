function createAbortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function ensureNotAborted(signal) {
  if (signal?.aborted) {
    throw createAbortError()
  }
}

function delay(duration, signal) {
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

function clipText(text, maxLength = 18) {
  if (!text) {
    return ''
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function inferFocusPrompt(text) {
  if (['考试', '成绩', '学习', '论文', '面试'].some((word) => text.includes(word))) {
    return '回到最近一次压力升高的场景，区分事件、自动想法和身体反应。'
  }

  if (['失眠', '睡不着', '早醒', '熬夜'].some((word) => text.includes(word))) {
    return '按时间顺序回顾睡前一小时发生的事情，找出最先启动警觉的线索。'
  }

  if (['朋友', '父母', '关系', '社交', '同学', '同事'].some((word) => text.includes(word))) {
    return '先厘清你最在意的关系期待，再看看现实中的落差是如何触发情绪的。'
  }

  return '先把最难受的瞬间具体化，再决定是情绪、认知还是行为层面的切入口。'
}

function inferEmotion(text) {
  if (['焦虑', '紧张', '压力', '害怕', '慌'].some((word) => text.includes(word))) {
    return '焦虑偏高'
  }

  if (['难过', '委屈', '无助', '沮丧', '疲惫'].some((word) => text.includes(word))) {
    return '低落受伤'
  }

  if (['生气', '烦', '冲突', '压抑'].some((word) => text.includes(word))) {
    return '压抑和愤怒并存'
  }

  return '仍在探索中的复杂感受'
}

function inferRiskNotice(text) {
  if (['轻生', '不想活', '自残', '伤害自己', '结束自己'].some((word) => text.includes(word))) {
    return '如果你此刻已经有伤害自己或他人的现实冲动，请优先联系身边可信任的人、当地急救或专业支持。'
  }

  return '在研究场景下，我们先用支持性回应和结构化追问帮助你梳理当前体验。'
}

function buildMockReply(messages) {
  const userMessages = messages.filter((message) => message.role === 'user')
  const latestUserMessage = userMessages.at(-1)?.content ?? ''
  const previousUserMessage = userMessages.at(-2)?.content ?? ''
  const emotion = inferEmotion(latestUserMessage)
  const focusPrompt = inferFocusPrompt(latestUserMessage)
  const contextLine = previousUserMessage
    ? `我也注意到你前面提到“${clipText(previousUserMessage)}”，这说明困扰并不是瞬间出现的。`
    : '你已经给出了很重要的起点，我们可以先把最近一次触发情绪的情境再说具体一点。'

  return [
    `谢谢你愿意继续说。听起来你现在更接近“${emotion}”的状态。`,
    contextLine,
    `接下来我们可以先做一个小切口：${focusPrompt}`,
    inferRiskNotice(latestUserMessage),
    '如果你愿意，下一条可以继续描述当时脑海里最先冒出来的一句话，或者身体上最明显的不适感。'
  ].join('')
}

function splitIntoChunks(text) {
  const chunks = []
  let buffer = ''

  for (const char of text) {
    buffer += char

    const shouldFlush =
      buffer.length >= 12 && ['，', '。', '！', '？', '；', '：'].includes(char)

    if (shouldFlush) {
      chunks.push(buffer)
      buffer = ''
    }
  }

  while (buffer.length > 14) {
    chunks.push(buffer.slice(0, 14))
    buffer = buffer.slice(14)
  }

  if (buffer) {
    chunks.push(buffer)
  }

  return chunks
}

export async function streamMockConversation({ messages, signal, onDelta }) {
  const reply = buildMockReply(messages)
  const chunks = splitIntoChunks(reply)

  for (const chunk of chunks) {
    ensureNotAborted(signal)
    await delay(90 + Math.floor(Math.random() * 90), signal)
    onDelta(chunk)
  }
}
