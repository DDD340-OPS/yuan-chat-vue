export function clipText(text, maxLength = 42) {
  if (!text) {
    return ''
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

export function translateRiskLevel(level) {
  const normalized = String(level || '').toLowerCase()

  if (normalized === 'high' || normalized === '高') {
    return '高'
  }

  if (normalized === 'medium' || normalized === '中') {
    return '中'
  }

  return '低'
}

export function inferRiskLevel(text) {
  if (!text) {
    return '低'
  }

  const dangerWords = ['轻生', '不想活', '结束自己', '自残', '伤害自己', '伤害别人']
  const warningWords = ['崩溃', '绝望', '控制不住', '失眠', '无助', '慌张']

  if (dangerWords.some((item) => text.includes(item))) {
    return '高'
  }

  if (warningWords.some((item) => text.includes(item))) {
    return '中'
  }

  return '低'
}

export function inferMood(text) {
  if (!text) {
    return '待评估'
  }

  const mapping = [
    {
      label: '焦虑波动',
      words: ['焦虑', '紧张', '担心', '压力', '害怕', '心慌']
    },
    {
      label: '低落疲惫',
      words: ['难过', '沮丧', '无助', '疲惫', '失落', '空']
    },
    {
      label: '关系敏感',
      words: ['孤独', '朋友', '父母', '关系', '误解', '社交']
    },
    {
      label: '睡眠受扰',
      words: ['失眠', '睡不着', '做梦', '半夜醒', '熬夜']
    }
  ]

  return mapping.find((item) => item.words.some((word) => text.includes(word)))?.label ?? '情绪探索中'
}

export function inferFocus(text) {
  if (!text) {
    return '支持性倾听与情绪梳理'
  }

  const focusRules = [
    {
      value: '考试与表现压力疏导',
      words: ['考试', '成绩', '面试', '绩效', '论文', '学习']
    },
    {
      value: '睡眠与身心放松干预',
      words: ['失眠', '睡不着', '做梦', '熬夜', '早醒']
    },
    {
      value: '关系边界与社交支持',
      words: ['朋友', '父母', '家里', '恋爱', '社交', '关系']
    },
    {
      value: '危机识别与安全计划',
      words: ['轻生', '自残', '伤害自己', '结束自己']
    }
  ]

  return focusRules.find((item) => item.words.some((word) => text.includes(word)))?.value ?? '支持性倾听与情绪梳理'
}

export function inferTags(text) {
  if (!text) {
    return ['基础样本']
  }

  const tagRules = [
    { tag: '考试压力', words: ['考试', '成绩', '学习', '论文'] },
    { tag: '睡眠问题', words: ['失眠', '睡不着', '熬夜', '早醒'] },
    { tag: '社交敏感', words: ['社交', '朋友', '同学', '同事'] },
    { tag: '家庭关系', words: ['父母', '家里', '家庭'] },
    { tag: '躯体反应', words: ['心慌', '胸闷', '头疼', '没胃口'] },
    { tag: '危机预警', words: ['轻生', '自残', '结束自己'] }
  ]

  const tags = tagRules
    .filter((item) => item.words.some((word) => text.includes(word)))
    .map((item) => item.tag)

  return tags.length > 0 ? tags : ['情绪梳理']
}

export function buildSummary(messages) {
  const userMessages = messages.filter((message) => message.role === 'user')
  const latestUserText = userMessages.at(-1)?.content ?? ''
  const previousUserText = userMessages.at(-2)?.content ?? ''

  if (!latestUserText) {
    return '等待来访者开始描述当前困扰。'
  }

  if (!previousUserText) {
    return `样本围绕“${clipText(latestUserText, 16)}”展开，适合从触发场景和身体反应继续追问。`
  }

  return `最近两轮聚焦“${clipText(previousUserText, 12)}”与“${clipText(latestUserText, 12)}”，可继续追踪自动想法、情绪强度和行为反应。`
}

export function buildContextMemory(messages) {
  return messages
    .filter((message) => message.role === 'user')
    .slice(-3)
    .map((message) => clipText(message.content, 28))
}

export function buildInterventionSuggestions(session) {
  const focus = session.interventionFocus

  if (focus.includes('睡眠')) {
    return [
      '请来访者回顾睡前一小时的活动顺序与身体感受。',
      '记录入睡前最强烈的自动想法及其可信度。',
      '加入呼吸放松或固定就寝仪式的研究观察点。'
    ]
  }

  if (focus.includes('考试')) {
    return [
      '用事件-想法-情绪三栏法拆分最近一次压力高峰。',
      '识别“必须表现完美”类核心信念是否反复出现。',
      '观察支持性自我对话是否能降低焦虑强度。'
    ]
  }

  if (focus.includes('关系')) {
    return [
      '澄清样本在关系中最在意的期待与现实落差。',
      '记录回避、讨好或沉默等应对模式。',
      '从可信任支持者网络切入，观察安全感变化。'
    ]
  }

  if (focus.includes('危机')) {
    return [
      '优先确认现实安全性与当下陪伴资源。',
      '建立可立即执行的求助清单与环境降险措施。',
      '本系统仅作研究验证，急性风险需转专业支持。'
    ]
  }

  return [
    '继续用开放式问题澄清触发事件与自动想法。',
    '记录情绪强度随对话推进的变化轨迹。',
    '尝试总结一条对样本最有帮助的支持性回应。'
  ]
}

export function applyStructuredAnalysis(session, analysis) {
  if (!analysis) {
    return
  }

  session.analysis = analysis

  if (analysis.summary) {
    session.summary = analysis.summary
  }

  if (analysis.emotion?.primary) {
    session.mood = analysis.emotion.primary
  }

  if (analysis.risk?.level) {
    session.riskLevel = translateRiskLevel(analysis.risk.level)
  }

  if (Array.isArray(analysis.tags) && analysis.tags.length > 0) {
    session.researchTags = analysis.tags
  }

  if (Array.isArray(analysis.interventions) && analysis.interventions.length > 0) {
    session.interventionSuggestions = analysis.interventions.map((item) => item.label || item.rationale).filter(Boolean)
    session.interventionFocus = analysis.interventions[0]?.label || session.interventionFocus
  }

  if (Array.isArray(analysis.recommendedFollowUps) && analysis.recommendedFollowUps.length > 0) {
    session.contextMemory = analysis.recommendedFollowUps.slice(0, 3)
  }
}

export function enrichSession(session) {
  const combinedUserText = session.messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join(' ')

  session.summary = buildSummary(session.messages)
  session.mood = inferMood(combinedUserText)
  session.riskLevel = inferRiskLevel(combinedUserText)
  session.interventionFocus = inferFocus(combinedUserText)
  session.researchTags = inferTags(combinedUserText)
  session.contextMemory = buildContextMemory(session.messages)
  session.interventionSuggestions = buildInterventionSuggestions(session)
  session.lastUpdated = new Date().toISOString()

  const firstUserMessage = session.messages.find((message) => message.role === 'user')
  if (firstUserMessage && session.title.startsWith('新建研究会话')) {
    session.title = clipText(firstUserMessage.content, 14)
  }
}
