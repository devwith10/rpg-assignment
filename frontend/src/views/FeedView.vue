<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { POSTS, type PostsResult } from '@/graphql/operations'
import CreatePostForm from '@/components/posts/CreatePostForm.vue'
import PostCard from '@/components/posts/PostCard.vue'

const { result, loading, error } = useQuery<PostsResult>(POSTS)

const posts = computed(() => result.value?.posts ?? [])
</script>

<template>
  <div class="feed">
    <CreatePostForm />

    <p v-if="loading" class="status">Loading posts…</p>
    <p v-else-if="error" class="status">Could not load posts — try refreshing</p>
    <p v-else-if="posts.length === 0" class="status">No posts yet — be the first to write one.</p>
    <div v-else class="posts">
      <PostCard v-for="post in posts" :key="post.id" :post="post" />
    </div>
  </div>
</template>

<style scoped>
.feed {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.status {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}

.posts {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
