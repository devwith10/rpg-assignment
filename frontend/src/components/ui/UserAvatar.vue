<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    label?: string
  }>(),
  { size: 48, label: undefined },
)
</script>

<template>
  <span
    class="avatar"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :title="label"
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      :style="{ width: `${size * 0.55}px`, height: `${size * 0.55}px` }"
    >
      <circle cx="12" cy="8.5" r="3.2" />
      <path d="M5.5 19.2c1.2-3 3.6-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
    </svg>
  </span>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-avatar);
  color: #ffffff;
}
</style>
