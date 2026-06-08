import type { ApolloCache } from '@apollo/client/cache'
import { POSTS, type Post, type PostsResult } from '@/graphql/operations'

// Prepend a post to the cached POSTS feed, newest-first.
//
// Cache contract (the subscription handler reuses this):
// - Idempotent, id-keyed: if a post with the same id already exists, do nothing.
//   This dedupes the two writers to the feed cache — the author's mutation response
//   and the subscription event for the same post.
// - Cache-miss safe: if the POSTS query has never run (readQuery returns null),
//   write nothing. The active feed query always exists on this screen, but guard anyway.
export function prependPostToFeed(cache: ApolloCache, post: Post): void {
  const existing = cache.readQuery<PostsResult>({ query: POSTS })
  if (!existing) return
  if (existing.posts.some((p) => p.id === post.id)) return
  cache.writeQuery<PostsResult>({
    query: POSTS,
    data: { posts: [post, ...existing.posts] },
  })
}
