import { computed, ref } from 'vue'
import { apolloClient, disposeWs, registerAuthErrorHandler, resetWs } from '@/apollo/client'
import {
  ME,
  SIGN_IN,
  SIGN_UP,
  type MeResult,
  type SignInResult,
  type SignUpResult,
  type User,
} from '@/graphql/operations'
import router from '@/router'
import { TOKEN_KEY, USER_KEY } from '@/constants'

// Module-scoped reactive state, shared across all callers of useAuth().
const token = ref<string | null>(null)
const currentUser = ref<User | null>(null)

const isAuthenticated = computed(() => token.value !== null)

function persist(newToken: string, user: User): void {
  token.value = newToken
  currentUser.value = user
  localStorage.setItem(TOKEN_KEY, newToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// Validate a parsed value against the User shape. localStorage is attacker- and
// bug-writable, so we never trust the stored JSON's type — only accept an object
// with a numeric id and string email.
function parseStoredUser(raw: string): User | null {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).id === 'number' &&
    typeof (value as Record<string, unknown>).email === 'string'
  ) {
    return value as User
  }
  return null
}

function clearState(): void {
  token.value = null
  currentUser.value = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function signIn(email: string, password: string): Promise<void> {
  const { data } = await apolloClient.mutate<SignInResult>({
    mutation: SIGN_IN,
    variables: { input: { email, password } },
  })
  if (!data) throw new Error('Sign in failed')
  persist(data.signIn.token, data.signIn.user)
  // Reconnect the socket with the new token (R16).
  resetWs()
}

async function signUp(email: string, password: string): Promise<void> {
  const { data } = await apolloClient.mutate<SignUpResult>({
    mutation: SIGN_UP,
    variables: { input: { email, password } },
  })
  if (!data) throw new Error('Sign up failed')
  // Registration auto-logs-in (R14).
  persist(data.signUp.token, data.signUp.user)
  resetWs()
}

async function logout(): Promise<void> {
  clearState()
  // Close the socket so a stale identity stops streaming (R16).
  disposeWs()
  // clearStore (not resetStore) so we don't refetch active queries while logged out.
  await apolloClient.clearStore()
  if (router.currentRoute.value.path !== '/login') {
    await router.push('/login')
  }
}

// Shared auth-failure path (R13): clear state, drop the socket, redirect to login.
function handleAuthError(): void {
  if (token.value === null) return
  clearState()
  disposeWs()
  void apolloClient.clearStore()
  if (router.currentRoute.value.path !== '/login') {
    void router.push('/login')
  }
}

async function initFromStorage(): Promise<void> {
  const storedToken = localStorage.getItem(TOKEN_KEY)
  if (!storedToken) return
  token.value = storedToken
  const storedUser = localStorage.getItem(USER_KEY)
  if (storedUser) {
    const parsed = parseStoredUser(storedUser)
    if (parsed) {
      currentUser.value = parsed
    } else {
      // Corrupt/forged stored identity: treat as logged out.
      clearState()
    }
  }
  // Validate the token by firing the me query. On UNAUTHENTICATED the error link
  // calls handleAuthError, which clears state and redirects (R13).
  try {
    const { data } = await apolloClient.query<MeResult>({
      query: ME,
      fetchPolicy: 'network-only',
    })
    if (data?.me) {
      currentUser.value = data.me
      localStorage.setItem(USER_KEY, JSON.stringify(data.me))
    }
  } catch {
    // Auth errors are handled by the error link (clearState via handleAuthError).
    // Non-auth failures (backend down, network) deliberately keep the stored
    // identity — optimistic by choice: the user stays "logged in" and the feed
    // surfaces its own error, rather than bouncing to /login on a flaky network.
  }
}

// Register once at module load so the error link can reach the auth state.
registerAuthErrorHandler(handleAuthError)

export function useAuth() {
  return {
    user: currentUser,
    token,
    isAuthenticated,
    signIn,
    signUp,
    logout,
    initFromStorage,
  }
}
