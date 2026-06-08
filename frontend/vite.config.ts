import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    // @vue/apollo-composable bundles its own @vue/reactivity; dedupe so
    // useQuery shares the component effect scope and loading state updates.
    dedupe: ['vue', '@vue/reactivity', '@vue/runtime-core', '@vue/runtime-dom'],
  },
})
