<script setup>
import { computed } from 'vue'
import { useResearchStore } from '../stores/research'

const researchStore = useResearchStore()

const capabilityCards = [
  {
    title: '真实模型流式对话',
    description: '前端工作台可直接通过后端 LLM 网关请求真实模型，并接收结构化 SSE 事件。'
  },
  {
    title: '结构化情绪与风险协议',
    description: '除自然语言回复外，系统还会返回情绪分类、风险分层、干预建议和后续追问。'
  },
  {
    title: '语音采集与音频留存',
    description: '支持浏览器录音、Web Speech API 转写、文件上传留存以及基础语音分析指标。'
  },
  {
    title: '研究缓存与导出',
    description: '会话可自动恢复，并支持筛选后导出 JSON / CSV，用于后续研究整理。'
  }
]

const workflow = [
  '建立匿名样本并设置实验配置，如模型、温度与结构化分析开关。',
  '在工作台中进行多轮对话、语音采集和实时流式观察。',
  '查看右侧结构化分析、音频留存和干预建议，持续修正研究路径。',
  '在归档页筛选样本并导出研究数据，形成后续分析材料。'
]

const latestSession = computed(() => researchStore.orderedSessions[0] ?? null)
</script>

<template>
  <div class="dashboard">
    <section class="hero-card">
      <div class="hero-card__copy">
        <p class="section-eyebrow">Project Brief</p>
        <h3>基于大语言模型的智能心理对话研究系统</h3>
        <p>
          当前版本已经具备真实模型流式接入、结构化研究协议、会话缓存恢复、音频上传留存与数据导出能力，
          可以作为心理对话研究的基础工作台继续扩展。
        </p>

        <div class="hero-card__actions">
          <RouterLink to="/workbench" class="primary-link">
            进入研究工作台
          </RouterLink>
          <RouterLink to="/archive" class="ghost-link">
            查看归档数据
          </RouterLink>
        </div>
      </div>

      <div class="hero-card__snapshot" v-if="latestSession">
        <p class="section-eyebrow">Latest Sample</p>
        <h4>{{ latestSession.title }}</h4>
        <p>{{ latestSession.summary }}</p>
        <dl>
          <div>
            <dt>当前阶段</dt>
            <dd>{{ latestSession.stage }}</dd>
          </div>
          <div>
            <dt>情绪状态</dt>
            <dd>{{ latestSession.mood }}</dd>
          </div>
          <div>
            <dt>风险等级</dt>
            <dd>{{ latestSession.riskLevel }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <p class="section-eyebrow">Research Scale</p>
        <strong>{{ researchStore.sessionCount }}</strong>
        <span>个基础研究样本</span>
      </article>
      <article class="summary-card">
        <p class="section-eyebrow">Dialogue Volume</p>
        <strong>{{ researchStore.totalMessageCount }}</strong>
        <span>条累计消息</span>
      </article>
      <article class="summary-card">
        <p class="section-eyebrow">Audio Archive</p>
        <strong>{{ researchStore.sessions.reduce((count, session) => count + (session.audioAssets?.length || 0), 0) }}</strong>
        <span>条录音样本</span>
      </article>
    </section>

    <section class="panel">
      <div class="panel__header">
        <div>
          <p class="section-eyebrow">Capability Matrix</p>
          <h4>当前框架已具备的研究能力</h4>
        </div>
      </div>

      <div class="capability-grid">
        <article v-for="card in capabilityCards" :key="card.title" class="capability-card">
          <h5>{{ card.title }}</h5>
          <p>{{ card.description }}</p>
        </article>
      </div>
    </section>

    <section class="panel workflow-panel">
      <div class="panel__header">
        <div>
          <p class="section-eyebrow">Workflow</p>
          <h4>建议的研究使用流程</h4>
        </div>
      </div>

      <div class="workflow-grid">
        <article v-for="step in workflow" :key="step" class="workflow-card">
          <p>{{ step }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 20px;
}

.hero-card,
.summary-card,
.panel,
.capability-card,
.workflow-card {
  border: 1px solid rgba(23, 56, 51, 0.08);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14px 38px rgba(35, 63, 58, 0.06);
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
  gap: 18px;
  padding: 28px;
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 251, 243, 0.94), rgba(240, 248, 246, 0.92));
}

.section-eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8b7258;
}

.hero-card h3,
.panel__header h4 {
  margin: 0 0 12px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.75rem;
  color: #173833;
}

.hero-card p,
.capability-card p,
.workflow-card p {
  margin: 0;
  line-height: 1.8;
  color: #55716b;
}

.hero-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.primary-link,
.ghost-link {
  padding: 12px 18px;
  border-radius: 999px;
  font-weight: 700;
}

.primary-link {
  color: #f8f5ef;
  background: linear-gradient(135deg, #205953, #173e39);
}

.ghost-link {
  color: #205953;
  background: rgba(32, 89, 83, 0.08);
}

.hero-card__snapshot {
  padding: 22px;
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(244, 230, 205, 0.78), rgba(255, 255, 255, 0.92));
}

.hero-card__snapshot h4 {
  margin: 0 0 10px;
  font-size: 1.3rem;
}

.hero-card__snapshot dl {
  display: grid;
  gap: 14px;
  margin: 18px 0 0;
}

.hero-card__snapshot dt {
  font-size: 0.84rem;
  color: #7a6856;
}

.hero-card__snapshot dd {
  margin: 2px 0 0;
  font-weight: 700;
  color: #173833;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.summary-card,
.panel {
  padding: 22px;
  border-radius: 26px;
}

.summary-card strong {
  display: block;
  margin-bottom: 6px;
  font-size: 1.8rem;
}

.summary-card span {
  color: #607973;
}

.panel__header {
  margin-bottom: 18px;
}

.capability-grid,
.workflow-grid {
  display: grid;
  gap: 16px;
}

.capability-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.workflow-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.capability-card,
.workflow-card {
  padding: 20px;
  border-radius: 24px;
}

.capability-card h5 {
  margin: 0 0 10px;
  font-size: 1.08rem;
  color: #173833;
}

@media (max-width: 980px) {
  .hero-card,
  .summary-grid,
  .capability-grid,
  .workflow-grid {
    grid-template-columns: 1fr;
  }
}
</style>
