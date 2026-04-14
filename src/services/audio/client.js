const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

export function isAudioUploadConfigured() {
  return Boolean(API_BASE_URL)
}

export async function uploadAudioRecording({
  sessionId,
  file,
  transcript = '',
  durationMs = 0
}) {
  if (!API_BASE_URL) {
    throw new Error('音频上传接口未配置。')
  }

  const formData = new FormData()
  formData.append('audio', file)
  formData.append('sessionId', sessionId)
  formData.append('transcript', transcript)
  formData.append('durationMs', String(durationMs))

  const response = await fetch(`${API_BASE_URL}/api/audio/upload`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || '音频上传失败。')
  }

  const payload = await response.json()
  if (!payload?.asset) {
    throw new Error('音频上传响应格式错误。')
  }

  const asset = payload.asset
  return {
    ...asset,
    url: asset.url?.startsWith('http') ? asset.url : `${API_BASE_URL}${asset.url}`
  }
}
