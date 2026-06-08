<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { useAuth } from '@/composables/useAuth'
import '@/assets/auth-form.css'

const router = useRouter()
const { signUp } = useAuth()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function onSubmit(): Promise<void> {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await signUp(email.value, password.value)
    // signUp auto-logs-in (R14): token already stored, go to the feed.
    await router.push('/')
  } catch (err) {
    if (CombinedGraphQLErrors.is(err)) {
      // Surface the server's message (e.g. 'Email already registered').
      errorMessage.value = err.errors[0]?.message ?? 'Something went wrong — try again'
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
    <h1>Create an account</h1>
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
          minlength="8"
          autocomplete="new-password"
          :disabled="isSubmitting"
        />
      </label>
      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Registering…' : 'Register' }}
      </button>
    </form>
    <p class="alt">
      Already have an account?
      <RouterLink to="/login">Sign in</RouterLink>
    </p>
  </main>
</template>
