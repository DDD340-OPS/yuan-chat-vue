<script setup>
const modules = [
  {
    title: '真实 LLM 网关',
    description: '后端通过可配置的 OpenAI 兼容接口完成流式生成，并在同一链路上补发结构化分析事件。'
  },
  {
    title: 'Pinia 研究中枢',
    description: '统一管理会话、草稿、结构化分析、音频资产、实验配置和归档筛选状态。'
  },
  {
    title: '会话缓存与导出',
    description: '结合 localStorage 完成会话恢复，支持在归档页导出 JSON 与 CSV 研究数据。'
  },
  {
    title: '音频留存与分析',
    description: '浏览器端采集录音，后端上传留存并返回时长、语速、清晰度等基础分析指标。'
  }
]

const nextSteps = [
  '把结构化分析协议进一步对齐为可版本化 JSON Schema，并增加评估回放记录。',
  '增加实验配置预设与多模型切换方案，支持 A/B 测试式研究。',
  '补充会话级数据导出到外部数据库或对象存储的能力。',
  '接入更专业的语音转写或声学特征服务，提升音频研究维度。'
]
</script>

<template>
  <div class="system">
    <section class="system-intro">
      <div>
        <p class="section-eyebrow">Architecture</p>
        <h3>系统结构说明</h3>
        <p>
          当前工程已经从前端交互原型升级为“前端研究工作台 + 后端模型网关 + 本地缓存与导出”的组合式系统，
          既能进行真实流式对话，也能沉淀结构化分析与音频样本。
        </p>
      </div>

      <div class="code-card">
        <p class="section-eyebrow">Environment</p>
        <pre><code>VITE_API_BASE_URL=http://localhost:3000
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini</code></pre>
        <p>
          前端通过 `VITE_API_BASE_URL` 指向后端，后端再通过 `LLM_*` 环境变量接入真实模型。
        </p>
      </div>
    </section>

    <section class="module-grid">
      <article v-for="module in modules" :key="module.title" class="module-card">
        <h4>{{ module.title }}</h4>
        <p>{{ module.description }}</p>
      </article>
    </section>

    <section class="roadmap-card">
      <div>
        <p class="section-eyebrow">Roadmap</p>
        <h3>下一步建议</h3>
      </div>

      <ul>
        <li v-for="step in nextSteps" :key="step">{{ step }}</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.system {
  display: grid;
  gap: 20px;
}

.system-intro,
.code-card,
.module-card,
.roadmap-card {
  border: 1px solid rgba(23, 56, 51, 0.08);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14px 38px rgba(35, 63, 58, 0.06);
}

.system-intro {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
  gap: 18px;
  padding: 24px;
  border-radius: 28px;
}

.section-eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #8b7258;
}

.system-intro h3,
.roadmap-card h3 {
  margin: 0 0 12px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.65rem;
  color: #173833;
}

.system-intro p,
.module-card p,
.code-card p,
.roadmap-card li {
  margin: 0;
  line-height: 1.8;
  color: #5d7771;
}

.code-card {
  padding: 20px;
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(244, 230, 205, 0.78), rgba(255, 255, 255, 0.92));
}

.code-card pre {
  margin: 0 0 12px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(23, 56, 51, 0.92);
  color: #f8f5ef;
  overflow-x: auto;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.module-card,
.roadmap-card {
  padding: 22px;
  border-radius: 24px;
}

.module-card h4 {
  margin: 0 0 10px;
  color: #173833;
}

.roadmap-card ul {
  margin: 14px 0 0;
  padding-left: 20px;
  display: grid;
  gap: 10px;
}

@media (max-width: 980px) {
  .system-intro,
  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
