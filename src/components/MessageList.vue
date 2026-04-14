<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { useAutoScroll } from '../composables/useAutoScroll'
import { useStreamRenderer } from '../composables/useStreamRenderer'
import MessageBubble from './MessageBubble.vue'

const props = defineProps({
  session: {
    type: Object,
    default: null
  }
})

const scrollerRef = ref(null)
const sessionRef = computed(() => props.session)
const messages = computed(() => props.session?.messages ?? [])

const {
  isAutoFollow,
  handleScroll,
  scrollToBottom,
  jumpToLatest
} = useAutoScroll(scrollerRef, {
  bottomThreshold: 84,
  scrollToEnd(viewport) {
    if (!messages.value.length) {
      return
    }

    if (typeof scrollerRef.value?.scrollToItem === 'function') {
      scrollerRef.value.scrollToItem(messages.value.length - 1)
      return
    }

    viewport.scrollTop = viewport.scrollHeight
  }
})

useStreamRenderer({
  activeSession: sessionRef,
  scrollToBottom,
  cadence: 110
})

onMounted(() => {
  jumpToLatest()
})

watch(
  () => messages.value.map((message) => message.id).join('|'),
  async (currentIds, previousIds) => {
    if (!currentIds || currentIds === previousIds) {
      return
    }

    const latestMessage = messages.value.at(-1)
    await nextTick()

    if (latestMessage?.role === 'assistant' && latestMessage.streaming) {
      jumpToLatest()
      return
    }

    scrollToBottom()
  }
)
</script>

<template>
  <section class="message-list">
    <div class="message-list__toolbar">
      <span>{{ isAutoFollow ? '滚动跟随已开启' : '已暂停自动跟随，可手动回到底部' }}</span>
      <button
        v-if="!isAutoFollow"
        type="button"
        class="message-list__follow"
        @click="jumpToLatest"
      >
        回到底部
      </button>
    </div>

    <div v-if="messages.length === 0" class="message-list__empty">
      当前会话还没有消息，先从一条研究引导语开始吧。
    </div>

    <DynamicScroller
      v-else
      ref="scrollerRef"
      class="message-list__viewport"
      :items="messages"
      key-field="id"
      :min-item-size="96"
      @scroll.passive="handleScroll"
      v-slot="{ item, index, active }"
    >
      <DynamicScrollerItem
        :item="item"
        :active="active"
        :data-index="index"
        :size-dependencies="[item.renderedContent, item.error ? 'error' : 'normal', item.streaming ? 'streaming' : 'done']"
      >
        <div class="message-list__item">
          <MessageBubble :message="item" />
        </div>
      </DynamicScrollerItem>
    </DynamicScroller>
  </section>
</template>

<style scoped>
.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.message-list__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(32, 89, 83, 0.06);
  color: #5d7771;
  font-size: 0.92rem;
}

.message-list__follow {
  border: none;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 700;
  color: #205953;
  background: rgba(32, 89, 83, 0.08);
}

.message-list__viewport {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
}

.message-list__item {
  padding-bottom: 14px;
}

.message-list__empty {
  padding: 18px;
  border-radius: 20px;
  border: 1px dashed rgba(32, 89, 83, 0.2);
  color: #5d7771;
  text-align: center;
}

:deep(.vue-recycle-scroller__item-wrapper) {
  overflow: visible;
}

@media (max-width: 720px) {
  .message-list__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
