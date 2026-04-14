<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useResearchStore } from './stores/research'

const route = useRoute()
const researchStore = useResearchStore()

const navItems = [
  {
    to: '/',
    label: '研究总览',
    caption: '目标、能力与当前样本状态'
  },
  {
    to: '/workbench',
    label: '研究工作台',
    caption: '多轮心理对话、流式输出与语音输入'
  },
  {
    to: '/archive',
    label: '会话归档',
    caption: '历史记录回溯与样本横向观察'
  },
  {
    to: '/system',
    label: '系统设计',
    caption: '模块边界、接口和扩展计划'
  }
]

const activePage = computed(() => {
  return navItems.find((item) => item.to === route.path) ?? navItems[0]
})

const systemBadges = computed(() => {
  return [
    `${researchStore.sessionCount} 个研究会话`,
    `${researchStore.totalMessageCount} 条消息`,
    researchStore.connectionLabel
  ]
})
</script>

<template>
  <div class="shell">
    <aside class="shell-sidebar">
      <div class="brand-card">
        <p class="brand-card__eyebrow">Mental Health NLP Lab</p>
        <h1>智能心理对话研究系统</h1>
        <p class="brand-card__copy">
          面向心理健康研究的多轮会话工作台，覆盖历史回溯、上下文理解、
          流式生成与语音输入采集。
        </p>
      </div>

      <nav class="nav-list" aria-label="主导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ 'nav-item--active': route.path === item.to }"
        >
          <span class="nav-item__label">{{ item.label }}</span>
          <span class="nav-item__caption">{{ item.caption }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-note">
        <p class="sidebar-note__title">当前研究焦点</p>
        <p>{{ researchStore.activeSession?.interventionFocus ?? '等待建立首个样本' }}</p>
        <div class="sidebar-note__chips">
          <span
            v-for="tag in researchStore.activeSession?.researchTags ?? []"
            :key="tag"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </aside>

    <div class="shell-main">
      <header class="shell-header">
        <div>
          <p class="shell-header__eyebrow">Research Console</p>
          <h2>{{ activePage.label }}</h2>
          <p class="shell-header__caption">
            {{ activePage.caption }}
          </p>
        </div>

        <div class="shell-header__badges">
          <span v-for="badge in systemBadges" :key="badge">{{ badge }}</span>
        </div>
      </header>

      <section class="safety-banner">
        研究用途提醒：当前框架用于心理对话流程验证与交互研究，不替代临床诊断或紧急援助。
      </section>

      <main class="shell-content">
        <RouterView v-slot="{ Component }">
          <Suspense>
            <template #default>
              <component :is="Component" />
            </template>
            <template #fallback>
              <div class="route-skeleton">
                正在加载页面模块...
              </div>
            </template>
          </Suspense>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 310px minmax(0, 1fr);
  gap: 24px;
  padding: 24px;
}

.shell-sidebar,
.shell-main {
  min-height: calc(100vh - 48px);
}

.shell-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.brand-card,
.sidebar-note,
.shell-header,
.safety-banner,
.shell-content,
.route-skeleton {
  border: 1px solid rgba(26, 61, 56, 0.09);
  background: rgba(255, 251, 246, 0.76);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 60px rgba(38, 70, 66, 0.08);
}

.brand-card {
  padding: 28px;
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(25, 88, 81, 0.92), rgba(21, 54, 62, 0.95)),
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.14), transparent 35%);
  color: #f8f5ef;
}

.brand-card__eyebrow,
.shell-header__eyebrow {
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.75rem;
  color: rgba(246, 242, 232, 0.78);
}

.brand-card h1 {
  margin: 0 0 12px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 2rem;
  line-height: 1.15;
}

.brand-card__copy {
  margin: 0;
  line-height: 1.7;
  color: rgba(248, 245, 239, 0.84);
}

.nav-list {
  display: grid;
  gap: 12px;
}

.nav-item {
  display: grid;
  gap: 6px;
  padding: 18px 20px;
  border-radius: 20px;
  border: 1px solid rgba(26, 61, 56, 0.08);
  background: rgba(255, 255, 255, 0.72);
  color: #24423d;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.nav-item:hover {
  transform: translateY(-2px);
  border-color: rgba(25, 88, 81, 0.22);
  background: rgba(255, 255, 255, 0.9);
}

.nav-item--active {
  background: linear-gradient(135deg, #f3e2bf, #f7f2e8 58%, #ffffff 100%);
  border-color: rgba(182, 117, 56, 0.24);
  box-shadow: 0 10px 30px rgba(182, 117, 56, 0.12);
}

.nav-item__label {
  font-size: 1.05rem;
  font-weight: 700;
}

.nav-item__caption {
  font-size: 0.9rem;
  color: rgba(36, 66, 61, 0.7);
  line-height: 1.5;
}

.sidebar-note {
  margin-top: auto;
  padding: 22px;
  border-radius: 24px;
}

.sidebar-note__title {
  margin: 0 0 10px;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7c6a55;
}

.sidebar-note p {
  margin: 0;
  color: #28453f;
  line-height: 1.6;
}

.sidebar-note__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.sidebar-note__chips span,
.shell-header__badges span {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  color: #21504a;
  background: rgba(32, 89, 84, 0.08);
}

.shell-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 28px 32px;
  border-radius: 30px;
}

.shell-header h2 {
  margin: 0 0 8px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 2.1rem;
  color: #173e39;
}

.shell-header__eyebrow {
  color: #8b7258;
}

.shell-header__caption {
  margin: 0;
  color: #536d67;
  line-height: 1.7;
}

.shell-header__badges {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.safety-banner {
  padding: 14px 20px;
  border-radius: 20px;
  color: #845732;
  background:
    linear-gradient(135deg, rgba(246, 226, 189, 0.86), rgba(255, 251, 242, 0.92));
}

.shell-content {
  flex: 1;
  padding: 24px;
  border-radius: 32px;
  overflow: hidden;
}

.route-skeleton {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  border-radius: 24px;
  color: #5d7771;
}

@media (max-width: 1100px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .shell-sidebar,
  .shell-main {
    min-height: auto;
  }
}

@media (max-width: 720px) {
  .shell {
    padding: 14px;
    gap: 14px;
  }

  .brand-card,
  .shell-header,
  .shell-content {
    border-radius: 24px;
  }

  .shell-header {
    padding: 22px;
    flex-direction: column;
    align-items: flex-start;
  }

  .shell-header h2 {
    font-size: 1.7rem;
  }
}
</style>
