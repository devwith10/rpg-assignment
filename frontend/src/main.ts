import './assets/main.css'

import { createApp } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import App from './App.vue'
import router from './router'
import { apolloClient } from '@/apollo/client'
import { useAuth } from '@/composables/useAuth'

const app = createApp(App)

app.provide(DefaultApolloClient, apolloClient)
app.use(router)

// Hydrate auth state (and validate the token) before mounting so the router guard
// sees the correct authenticated state on first navigation (R13).
await useAuth().initFromStorage()

app.mount('#app')
