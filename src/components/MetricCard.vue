<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  tone: {
    type: String,
    default: 'teal'
  }
})
</script>

<template>
  <article class="metric-card" :class="`metric-card--${tone}`">
    <p class="metric-card__label">{{ label }}</p>
    <strong class="metric-card__value">{{ value }}</strong>
    <p v-if="description" class="metric-card__description">
      {{ description }}
    </p>
  </article>
</template>

<style scoped>
.metric-card {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(23, 56, 51, 0.08);
  background: rgba(255, 255, 255, 0.86);
}

.metric-card--teal {
  box-shadow: inset 0 0 0 1px rgba(32, 89, 83, 0.05);
}

.metric-card--amber {
  background: linear-gradient(135deg, rgba(247, 232, 205, 0.78), rgba(255, 255, 255, 0.92));
}

.metric-card--slate {
  background: linear-gradient(135deg, rgba(226, 236, 234, 0.82), rgba(255, 255, 255, 0.9));
}

.metric-card__label {
  margin: 0 0 10px;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7b6854;
}

.metric-card__value {
  display: block;
  font-size: 1.4rem;
  color: #173833;
}

.metric-card__description {
  margin: 10px 0 0;
  color: #5d7771;
  line-height: 1.6;
}
</style>
