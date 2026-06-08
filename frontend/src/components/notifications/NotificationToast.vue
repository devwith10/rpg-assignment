<script setup lang="ts">
import { usePostNotifications } from '@/composables/usePostNotifications'

const { activeToast, dismiss } = usePostNotifications()
</script>

<template>
  <Transition name="toast">
    <button
      v-if="activeToast"
      type="button"
      class="toast"
      aria-live="polite"
      aria-label="Dismiss notification"
      @click="dismiss"
    >
      {{ activeToast }}
    </button>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 1000;
  max-width: 22rem;
  padding: 0.875rem 1.25rem;
  border: none;
  border-radius: var(--radius-control);
  background: var(--color-accent);
  color: var(--color-accent-text);
  font-size: 0.9375rem;
  line-height: 1.4;
  text-align: left;
  box-shadow: var(--shadow-button);
  cursor: pointer;
}

.toast:hover {
  background: var(--color-accent-hover);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
