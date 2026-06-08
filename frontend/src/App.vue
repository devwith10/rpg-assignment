<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import NotificationToast from '@/components/notifications/NotificationToast.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'

const { user, isAuthenticated, logout } = useAuth()
</script>

<template>
  <div class="panel">
    <header v-if="isAuthenticated" class="nav">
      <UserAvatar :size="56" :label="user?.email" />
      <button type="button" class="logout" @click="logout">
        Log out
        <svg
          class="logout-arrow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M7 17 17 7" />
          <path d="M9 7h8v8" />
        </svg>
      </button>
    </header>

    <main>
      <RouterView />
    </main>
  </div>

  <!-- The v-if is load-bearing: unmount/remount on logout/login is what tears
       down and recreates the subscription on the NEW WebSocket after resetWs().
       An always-mounted toast would keep subscribing against the old socket. -->
  <NotificationToast v-if="isAuthenticated" />
</template>

<style scoped>
.panel {
  background: var(--color-panel);
  border-radius: var(--radius-panel);
  padding: 2rem 1.75rem 2.25rem;
  box-shadow: var(--shadow-soft);
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.75rem;
}

.logout {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--color-card);
  color: var(--color-heading);
  font-size: 1.0625rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(31, 36, 46, 0.08);
}

.logout:hover {
  box-shadow: 0 4px 12px rgba(31, 36, 46, 0.16);
}

.logout-arrow {
  width: 1rem;
  height: 1rem;
}
</style>
