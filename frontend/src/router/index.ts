import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import FeedView from '@/views/FeedView.vue'

const PUBLIC_PATHS = ['/login', '/register']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'feed',
      component: FeedView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth()
  const isPublic = PUBLIC_PATHS.includes(to.path)

  if (!isAuthenticated.value && !isPublic) {
    return '/login'
  }
  if (isAuthenticated.value && isPublic) {
    return '/'
  }
  return true
})

export default router
