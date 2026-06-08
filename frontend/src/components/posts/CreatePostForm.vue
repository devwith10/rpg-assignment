<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { CREATE_POST, type CreatePostInput, type CreatePostResult } from '@/graphql/operations'
import { prependPostToFeed } from '@/graphql/feedCache'

// maxlength hints mirror the backend @MaxLength caps.
const TITLE_MAX = 200
const BODY_MAX = 10000

const title = ref('')
const body = ref('')
const errorMessage = ref('')

const { mutate, loading } = useMutation<CreatePostResult, { input: CreatePostInput }>(CREATE_POST, {
  // Update the author's own feed from the mutation response — no refetch.
  // The subscription handler reuses prependPostToFeed; the id-keyed merge
  // dedupes the two writers.
  update(cache, { data }) {
    if (data?.createPost) {
      prependPostToFeed(cache, data.createPost)
    }
  },
})

async function onSubmit(): Promise<void> {
  errorMessage.value = ''

  const trimmedTitle = title.value.trim()
  const trimmedBody = body.value.trim()
  // Client-side check mirroring server validation (R15).
  if (!trimmedTitle || !trimmedBody) {
    errorMessage.value = 'Title and body are required'
    return
  }

  try {
    await mutate({ variables: { input: { title: title.value, body: body.value } } })
    // Clear the form on success.
    title.value = ''
    body.value = ''
  } catch (err) {
    if (CombinedGraphQLErrors.is(err)) {
      errorMessage.value = err.errors[0]?.message ?? 'Could not publish — try again'
    } else {
      errorMessage.value = 'Could not publish — try again'
    }
  }
}
</script>

<template>
  <form class="create-post" @submit.prevent="onSubmit">
    <label class="field">
      <span>Title</span>
      <input
        v-model="title"
        type="text"
        :maxlength="TITLE_MAX"
        :disabled="loading"
        placeholder="What’s on your mind?"
      />
    </label>
    <textarea
      v-model="body"
      rows="7"
      :maxlength="BODY_MAX"
      :disabled="loading"
      placeholder="Type something…"
      aria-label="Body"
    ></textarea>
    <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    <button type="submit" :disabled="loading">
      <svg class="send-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3.4 20.4 21.8 12 3.4 3.6l-.01 6.53L16 12 3.39 13.87z" />
      </svg>
      {{ loading ? 'Publishing…' : 'Publish' }}
    </button>
  </form>
</template>

<style scoped>
.create-post {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field span {
  font-size: 1.0625rem;
  font-weight: 500;
  color: var(--color-heading);
}

input,
textarea {
  padding: 1rem 1.25rem;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 1.0625rem;
  font-family: inherit;
  box-shadow: inset 0 1px 2px rgba(31, 36, 46, 0.04);
}

input::placeholder,
textarea::placeholder {
  color: var(--color-text-muted);
}

textarea {
  resize: vertical;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.error {
  color: #c0392b;
  font-size: 0.875rem;
}

button {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: var(--radius-control);
  background: var(--color-accent);
  color: var(--color-accent-text);
  font-size: 1.0625rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: var(--shadow-button);
}

button:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.send-icon {
  width: 1.125rem;
  height: 1.125rem;
}
</style>
