<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { useAuth } from '@/composables/useAuth'
import '@/assets/auth-form.css'

const router = useRouter()
const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function onSubmit(): Promise<void> {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await signIn(email.value, password.value)
    await router.push('/')
  } catch (err) {
    if (CombinedGraphQLErrors.is(err)) {
      // Server returns a generic message for both bad email and bad password (R15).
      errorMessage.value = err.errors[0]?.message ?? 'Invalid email or password'
    } else {
      errorMessage.value = 'Something went wrong — try again'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="auth">
    <h1>Sign in</h1>
    <form @submit.prevent="onSubmit">
      <label class="field">
        <span>Email</span>
        <input
          v-model="email"
          type="email"
          required
          autocomplete="email"
          :disabled="isSubmitting"
        />
      </label>
      <label class="field">
        <span>Password</span>
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          :disabled="isSubmitting"
        />
      </label>
      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
    <p class="alt">
      <RouterLink to="/register">Create an account</RouterLink>
    </p>
  </main>
</template>
