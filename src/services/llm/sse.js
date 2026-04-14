function createAbortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function extractPayloads(block) {
  const lines = block.split(/\r?\n/)
  const dataLines = []

  for (const line of lines) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }

  const payload = dataLines.join('\n').trim()
  return payload ? [payload] : []
}

export async function streamSseResponse({ response, signal, onData }) {
  if (!response.body) {
    throw new Error('SSE response body is empty.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      if (signal?.aborted) {
        throw createAbortError()
      }

      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() ?? ''

      for (const block of blocks) {
        const payloads = extractPayloads(block)
        payloads.forEach((payload) => onData(payload))
      }
    }

    buffer += decoder.decode()
    if (buffer.trim()) {
      const payloads = extractPayloads(buffer)
      payloads.forEach((payload) => onData(payload))
    }
  } finally {
    reader.releaseLock?.()
  }
}
