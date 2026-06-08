import { ref } from 'vue'
import { useSubscription } from '@vue/apollo-composable'
import { apolloClient } from '@/apollo/client'
import { useAuth } from '@/composables/useAuth'
import { prependPostToFeed } from '@/graphql/feedCache'
import { POST_PUBLISHED, type Post, type PostPublishedResult } from '@/graphql/operations'

const TOAST_DURATION_MS = 4000

// Subscribes to postPublished while authenticated. On each event:
// 1. Prepend the post to the cached feed (idempotent, id-keyed — safe alongside the
//    author's mutation update, so this runs for ALL events including the author's own).
// 2. If the author is not the current user, show a single replace-on-arrival toast
//    that auto-dismisses after TOAST_DURATION_MS (one visible toast max).
//
// Auth-gating: the subscription is enabled only while authenticated, so no socket is
// opened before login (the backend would reject a token-less WS connect) and the
// subscription stops on logout (the WS client is disposed by useAuth.logout). The
// component that mounts this composable is also rendered only when authenticated
// (App.vue v-if), giving a clean unmount on logout.
export function usePostNotifications() {
  const { user, isAuthenticated } = useAuth()

  const activeToast = ref<string | null>(null)
  let dismissTimer: ReturnType<typeof setTimeout> | null = null

  function clearTimer(): void {
    if (dismissTimer !== null) {
      clearTimeout(dismissTimer)
      dismissTimer = null
    }
  }

  function dismiss(): void {
    clearTimer()
    activeToast.value = null
  }

  function showToast(post: Post): void {
    clearTimer()
    activeToast.value = `${post.author.email} published a new post: "${post.title}"`
    dismissTimer = setTimeout(() => {
      activeToast.value = null
      dismissTimer = null
    }, TOAST_DURATION_MS)
  }

  const { onResult, onError } = useSubscription<PostPublishedResult>(POST_PUBLISHED, () => ({
    enabled: isAuthenticated.value,
  }))

  onResult((data) => {
    const post = data?.postPublished
    if (!post) return
    // Live feed update from the same event (R17) — idempotent, so the author's own
    // post (already prepended by the mutation) is not duplicated.
    prependPostToFeed(apolloClient.cache, post)
    // Suppress the toast for the author's own post.
    if (post.author.id === user.value?.id) return
    showToast(post)
  })

  // The WS client is disposed on logout, which surfaces here as an error. Swallow it
  // so the subscription does not crash or retry-loop; it resubscribes on next login.
  onError(() => {})

  return {
    activeToast,
    dismiss,
  }
}
