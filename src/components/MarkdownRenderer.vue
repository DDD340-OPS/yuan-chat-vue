<script setup>
import { computed } from 'vue'
import 'highlight.js/styles/github.css'
import { renderMarkdown } from '../services/markdown/renderer'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const renderedHtml = computed(() => renderMarkdown(props.content))
</script>

<template>
  <div class="markdown-renderer" v-html="renderedHtml" />
</template>

<style scoped>
.markdown-renderer {
  color: inherit;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.markdown-renderer :deep(*:first-child) {
  margin-top: 0;
}

.markdown-renderer :deep(*:last-child) {
  margin-bottom: 0;
}

.markdown-renderer :deep(p),
.markdown-renderer :deep(ul),
.markdown-renderer :deep(ol),
.markdown-renderer :deep(blockquote),
.markdown-renderer :deep(pre),
.markdown-renderer :deep(table) {
  margin: 0 0 12px;
}

.markdown-renderer :deep(h1),
.markdown-renderer :deep(h2),
.markdown-renderer :deep(h3),
.markdown-renderer :deep(h4) {
  margin: 18px 0 12px;
  line-height: 1.35;
  color: #173833;
}

.markdown-renderer :deep(h1) {
  font-size: 1.3rem;
}

.markdown-renderer :deep(h2) {
  font-size: 1.2rem;
}

.markdown-renderer :deep(h3) {
  font-size: 1.08rem;
}

.markdown-renderer :deep(ul),
.markdown-renderer :deep(ol) {
  padding-left: 22px;
}

.markdown-renderer :deep(li + li) {
  margin-top: 6px;
}

.markdown-renderer :deep(blockquote) {
  padding: 10px 14px;
  border-left: 4px solid rgba(32, 89, 83, 0.28);
  background: rgba(32, 89, 83, 0.05);
  color: #4d6963;
  border-radius: 0 14px 14px 0;
}

.markdown-renderer :deep(a) {
  color: #0d6f88;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.markdown-renderer :deep(code) {
  font-family: 'Cascadia Code', Consolas, 'Courier New', monospace;
}

.markdown-renderer :deep(:not(pre) > code) {
  padding: 2px 7px;
  border-radius: 8px;
  background: rgba(23, 56, 51, 0.08);
  color: #173833;
  font-size: 0.92em;
}

.markdown-renderer :deep(.md-code-block) {
  margin: 0;
  padding: 14px 16px;
  border-radius: 16px;
  overflow-x: auto;
  background: #f7faf9;
  border: 1px solid rgba(23, 56, 51, 0.08);
}

.markdown-renderer :deep(.md-code-block code) {
  display: block;
  min-width: max-content;
  background: transparent;
  font-size: 0.92rem;
}

.markdown-renderer :deep(table) {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(23, 56, 51, 0.08);
}

.markdown-renderer :deep(th),
.markdown-renderer :deep(td) {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(23, 56, 51, 0.08);
  text-align: left;
}

.markdown-renderer :deep(th) {
  background: rgba(32, 89, 83, 0.06);
}
</style>
