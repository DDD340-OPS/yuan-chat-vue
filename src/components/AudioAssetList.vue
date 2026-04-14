<script setup>
defineProps({
  assets: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <section class="audio-assets">
    <div class="audio-assets__header">
      <div>
        <p class="audio-assets__eyebrow">Audio Archive</p>
        <h4>录音留存</h4>
      </div>
      <span>{{ assets.length }} 条</span>
    </div>

    <div v-if="assets.length === 0" class="audio-assets__empty">
      当前会话还没有录音留存。
    </div>

    <article v-for="asset in assets" :key="asset.id" class="audio-assets__card">
      <div class="audio-assets__meta">
        <strong>{{ asset.originalName || asset.filename }}</strong>
        <span>{{ new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(asset.createdAt)) }}</span>
      </div>

      <audio class="audio-assets__player" :src="asset.url" controls preload="none" />

      <p v-if="asset.transcript" class="audio-assets__transcript">
        {{ asset.transcript }}
      </p>

      <div v-if="asset.analysis" class="audio-assets__chips">
        <span>时长 {{ Math.round((asset.analysis.durationMs || 0) / 1000) }} 秒</span>
        <span>清晰度 {{ asset.analysis.clarity }}</span>
        <span>表达强度 {{ asset.analysis.engagement }}</span>
        <span v-if="asset.analysis.speechRateCpm">语速 {{ asset.analysis.speechRateCpm }} 字/分</span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.audio-assets {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.84);
}

.audio-assets__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.audio-assets__header h4 {
  margin: 0;
  color: #173833;
}

.audio-assets__header span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(32, 89, 83, 0.08);
  color: #205953;
  font-size: 0.82rem;
}

.audio-assets__eyebrow {
  margin: 0 0 6px;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8b7258;
}

.audio-assets__empty {
  padding: 12px 14px;
  border-radius: 16px;
  color: #5d7771;
  background: rgba(32, 89, 83, 0.06);
}

.audio-assets__card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 252, 247, 0.92);
  border: 1px solid rgba(23, 56, 51, 0.08);
}

.audio-assets__meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.audio-assets__meta strong {
  color: #173833;
}

.audio-assets__meta span,
.audio-assets__transcript {
  color: #5d7771;
}

.audio-assets__player {
  width: 100%;
}

.audio-assets__transcript {
  margin: 0;
  line-height: 1.7;
}

.audio-assets__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.audio-assets__chips span {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  color: #21504a;
  background: rgba(32, 89, 83, 0.08);
}
</style>
