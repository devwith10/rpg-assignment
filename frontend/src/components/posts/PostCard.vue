<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { Post } from '@/graphql/operations'
import { relativeTime } from '@/utils/relativeTime'
import UserAvatar from '@/components/ui/UserAvatar.vue'

const props = defineProps<{
  post: Post
}>()

const timestamp = computed(() => relativeTime(props.post.createdAt))

const bodyEl = ref<HTMLParagraphElement | null>(null)
const expanded = ref(false)
// Whether the clamped body actually overflows two lines — drives showing the
// toggle at all, so short posts don't get a pointless "Show more".
const overflows = ref(false)

async function measureOverflow(): Promise<void> {
  await nextTick()
  const el = bodyEl.value
  if (!el || expanded.value) return
  overflows.value = el.scrollHeight > el.clientHeight + 1
}

onMounted(measureOverflow)
watch(() => props.post.body, measureOverflow)

function toggle(): void {
  expanded.value = !expanded.value
}
</script>

<template>
  <article class="card">
    <header class="meta">
      <span class="author-group">
        <UserAvatar :size="36" :label="post.author.email" />
        <span class="author">{{ post.author.email }}</span>
      </span>
      <time class="time" :datetime="post.createdAt">{{ timestamp }}</time>
    </header>
    <h2 class="title">{{ post.title }}</h2>
    <p ref="bodyEl" class="body" :class="{ clamped: !expanded }">{{ post.body }}</p>
    <button v-if="overflows" type="button" class="toggle" @click="toggle">
      {{ expanded ? 'Show less' : 'Show more' }}
    </button>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1.25rem 1.5rem 1.375rem;
  border-radius: var(--radius-card);
  background: var(--color-card);
  box-shadow: 0 2px 10px rgba(31, 36, 46, 0.06);
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.author-group {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.author {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  flex-shrink: 0;
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

.title {
  color: var(--color-heading);
  font-size: 1.1875rem;
  font-weight: 700;
}

.body {
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.55;
  white-space: pre-wrap;
}

/* Two-line truncation with a trailing ellipsis; expanded removes the clamp. */
.body.clamped {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.toggle {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-accent);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
}

.toggle:hover {
  text-decoration: underline;
}
</style>
