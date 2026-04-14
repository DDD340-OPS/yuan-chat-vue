<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { exportSessionsAsCsv, exportSessionsAsJson } from '../services/export/researchExport'
import { useResearchStore } from '../stores/research'

const router = useRouter()
const researchStore = useResearchStore()

const filterModel = computed(() => researchStore.archiveFilters)
const stages = computed(() => ['all', ...new Set(researchStore.sessions.map((session) => session.stage))])
const riskLevels = ['all', '低', '中', '高']

function openSession(sessionId) {
  researchStore.setActiveSession(sessionId)
  router.push('/workbench')
}

function formatTime(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function exportJson() {
  exportSessionsAsJson(researchStore.filteredSessions)
}

function exportCsv() {
  exportSessionsAsCsv(researchStore.filteredSessions)
}
</script>

<template>
  <div class="archive">
    <section class="archive-summary">
      <article>
        <p class="section-eyebrow">Archive Scale</p>
        <strong>{{ researchStore.sessionCount }}</strong>
        <span>个会话样本可回溯</span>
      </article>
      <article>
        <p class="section-eyebrow">History Value</p>
        <strong>{{ researchStore.totalMessageCount }}</strong>
        <span>条历史消息已进入上下文池</span>
      </article>
      <article>
        <p class="section-eyebrow">Audio Assets</p>
        <strong>{{ researchStore.sessions.reduce((count, session) => count + (session.audioAssets?.length || 0), 0) }}</strong>
        <span>条录音样本已留存</span>
      </article>
    </section>

    <section class="archive-toolbar">
      <div class="archive-toolbar__filters">
        <input
          v-model="filterModel.query"
          type="text"
          placeholder="搜索标题、摘要、参与者或标签"
          @input="researchStore.updateArchiveFilters({ query: filterModel.query })"
        />

        <select
          :value="filterModel.stage"
          @change="researchStore.updateArchiveFilters({ stage: $event.target.value })"
        >
          <option v-for="stage in stages" :key="stage" :value="stage">
            {{ stage === 'all' ? '全部阶段' : stage }}
          </option>
        </select>

        <select
          :value="filterModel.risk"
          @change="researchStore.updateArchiveFilters({ risk: $event.target.value })"
        >
          <option v-for="risk in riskLevels" :key="risk" :value="risk">
            {{ risk === 'all' ? '全部风险' : `${risk}风险` }}
          </option>
        </select>

        <select
          :value="filterModel.tag"
          @change="researchStore.updateArchiveFilters({ tag: $event.target.value })"
        >
          <option value="all">全部标签</option>
          <option v-for="tag in researchStore.availableTags" :key="tag" :value="tag">
            {{ tag }}
          </option>
        </select>
      </div>

      <div class="archive-toolbar__actions">
        <button type="button" @click="researchStore.resetArchiveFilters()">
          重置筛选
        </button>
        <button type="button" @click="exportJson">
          导出 JSON
        </button>
        <button type="button" @click="exportCsv">
          导出 CSV
        </button>
      </div>
    </section>

    <section class="archive-list">
      <article
        v-for="session in researchStore.filteredSessions"
        :key="session.id"
        class="archive-card"
      >
        <div class="archive-card__header">
          <div>
            <p class="section-eyebrow">Sample Record</p>
            <h3>{{ session.title }}</h3>
          </div>
          <button type="button" @click="openSession(session.id)">
            打开工作台
          </button>
        </div>

        <p class="archive-card__summary">{{ session.summary }}</p>

        <dl class="archive-card__meta">
          <div>
            <dt>最近更新</dt>
            <dd>{{ formatTime(session.lastUpdated) }}</dd>
          </div>
          <div>
            <dt>会话阶段</dt>
            <dd>{{ session.stage }}</dd>
          </div>
          <div>
            <dt>情绪状态</dt>
            <dd>{{ session.mood }}</dd>
          </div>
          <div>
            <dt>风险等级</dt>
            <dd>{{ session.riskLevel }}</dd>
          </div>
        </dl>

        <div class="archive-card__footer">
          <div class="chip-list">
            <span v-for="tag in session.researchTags" :key="tag">{{ tag }}</span>
          </div>
          <p>关键记忆：{{ session.contextMemory.join(' / ') || '暂无' }}</p>
          <p>录音留存：{{ session.audioAssets?.length || 0 }} 条</p>
        </div>
      </article>

      <div v-if="researchStore.filteredSessions.length === 0" class="archive-empty">
        当前筛选条件下没有匹配的研究会话。
      </div>
    </section>
  </div>
</template>

<style scoped>
.archive {
  display: grid;
  gap: 20px;
}

.archive-summary,
.archive-card,
.archive-toolbar,
.archive-empty {
  border: 1px solid rgba(23, 56, 51, 0.08);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14px 38px rgba(35, 63, 58, 0.06);
}

.archive-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 22px;
  border-radius: 28px;
}

.archive-summary article,
.archive-card {
  padding: 20px;
  border-radius: 24px;
}

.section-eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8b7258;
}

.archive-summary strong {
  display: block;
  margin-bottom: 8px;
  font-size: 1.7rem;
  color: #173833;
}

.archive-summary span,
.archive-card__summary,
.archive-card__footer p,
.archive-empty {
  color: #5d7771;
}

.archive-toolbar {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 24px;
}

.archive-toolbar__filters,
.archive-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.archive-toolbar input,
.archive-toolbar select,
.archive-toolbar button {
  border: 1px solid rgba(23, 56, 51, 0.12);
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(255, 252, 247, 0.92);
  color: #173833;
}

.archive-toolbar input {
  min-width: 260px;
}

.archive-toolbar button {
  font-weight: 700;
}

.archive-list {
  display: grid;
  gap: 16px;
}

.archive-card {
  background:
    linear-gradient(135deg, rgba(255, 252, 247, 0.94), rgba(240, 248, 246, 0.92));
}

.archive-card__header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.archive-card__header h3 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  color: #173833;
}

.archive-card__header button {
  padding: 11px 16px;
  border: none;
  border-radius: 999px;
  color: #f7f1e7;
  background: linear-gradient(135deg, #205953, #173e39);
  font-weight: 700;
}

.archive-card__summary {
  margin: 16px 0 20px;
  line-height: 1.8;
}

.archive-card__meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.archive-card__meta dt {
  font-size: 0.82rem;
  color: #7d6a57;
}

.archive-card__meta dd {
  margin: 6px 0 0;
  font-weight: 700;
  color: #173833;
}

.archive-card__footer {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-list span {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  color: #21504a;
  background: rgba(32, 89, 83, 0.08);
}

.archive-empty {
  padding: 24px;
  border-radius: 24px;
  text-align: center;
}

@media (max-width: 960px) {
  .archive-summary,
  .archive-card__meta {
    grid-template-columns: 1fr;
  }

  .archive-card__header,
  .archive-toolbar__filters,
  .archive-toolbar__actions {
    flex-direction: column;
  }
}
</style>
