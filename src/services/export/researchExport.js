function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

function serializeSessionForExport(session) {
  return {
    id: session.id,
    title: session.title,
    stage: session.stage,
    participant: session.participant,
    summary: session.summary,
    mood: session.mood,
    riskLevel: session.riskLevel,
    interventionFocus: session.interventionFocus,
    tags: session.researchTags,
    contextMemory: session.contextMemory,
    interventionSuggestions: session.interventionSuggestions,
    analysis: session.analysis,
    audioAssets: session.audioAssets,
    messages: session.messages.map((message) => ({
      id: message.id,
      role: message.role,
      source: message.source,
      content: message.content,
      createdAt: message.createdAt
    })),
    createdAt: session.createdAt,
    lastUpdated: session.lastUpdated
  }
}

export function exportSessionsAsJson(sessions) {
  const payload = sessions.map((session) => serializeSessionForExport(session))
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  })
  downloadBlob(blob, `research-sessions-${Date.now()}.json`)
}

export function exportSessionsAsCsv(sessions) {
  const header = [
    'id',
    'title',
    'stage',
    'participant',
    'summary',
    'mood',
    'riskLevel',
    'interventionFocus',
    'tags',
    'messageCount',
    'audioAssetCount',
    'lastUpdated'
  ]

  const rows = sessions.map((session) => [
    session.id,
    session.title,
    session.stage,
    session.participant,
    session.summary,
    session.mood,
    session.riskLevel,
    session.interventionFocus,
    (session.researchTags || []).join('|'),
    session.messages.length,
    session.audioAssets?.length || 0,
    session.lastUpdated
  ])

  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
        .join(',')
    )
    .join('\n')

  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8'
  })
  downloadBlob(blob, `research-sessions-${Date.now()}.csv`)
}
