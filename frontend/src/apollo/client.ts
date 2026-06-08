import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'
import { ErrorLink } from '@apollo/client/link/error'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { getMainDefinition } from '@apollo/client/utilities'
import { OperationTypeNode } from 'graphql'
import { createClient, type Client } from 'graphql-ws'
import { TOKEN_KEY } from '@/constants'

const HTTP_URL = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:3200/graphql'
const WS_URL = HTTP_URL.replace(/^http/, 'ws')

// Read the token at request/connect time so links always pick up the latest value.
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// --- Auth-failure handler registration (set by useAuth; avoids importing the router here) ---

let onAuthError: (() => void) | null = null

export function registerAuthErrorHandler(cb: () => void): void {
  onAuthError = cb
}

function isUnauthenticated(error: unknown): boolean {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some((e) => e.extensions?.code === 'UNAUTHENTICATED')
  }
  // 401-shaped network errors
  const statusCode = (error as { statusCode?: number; status?: number } | null)?.statusCode
  const status = (error as { status?: number } | null)?.status
  return statusCode === 401 || status === 401
}

// --- Recreatable graphql-ws client ---
//
// The WS connection captures auth (connectionParams) at connect time. To swap the
// token on login/logout we keep a mutable graphql-ws client and recreate it. A custom
// ApolloLink delegates to the current GraphQLWsLink instance so the Apollo link chain
// never needs rebuilding.

let wsClient: Client | null = null
let wsLink: GraphQLWsLink | null = null

function createWsClient(): Client {
  return createClient({
    url: WS_URL,
    // connectionParams is read at connect time (lazy: true is the default, so the
    // socket is not opened until the first subscription).
    connectionParams: () => {
      const token = getToken()
      return token ? { authorization: `Bearer ${token}` } : {}
    },
  })
}

function ensureWsLink(): GraphQLWsLink {
  if (!wsLink) {
    wsClient = createWsClient()
    wsLink = new GraphQLWsLink(wsClient)
  }
  return wsLink
}

// Tear down the current socket (e.g. on logout). The next subscription recreates it.
export function disposeWs(): void {
  wsClient?.dispose()
  wsClient = null
  wsLink = null
}

// Dispose and recreate so the new socket connects with the current token (e.g. on login).
export function resetWs(): void {
  disposeWs()
  ensureWsLink()
}

// A link that always delegates to the current GraphQLWsLink instance.
const wsDelegateLink = new ApolloLink((operation) => {
  return ensureWsLink().request(operation)
})

// --- HTTP chain ---

const httpLink = new HttpLink({ uri: HTTP_URL })

const authLink = new SetContextLink((prevContext) => {
  const token = getToken()
  return {
    ...prevContext,
    headers: {
      ...prevContext.headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }
})

const errorLink = new ErrorLink(({ error }) => {
  if (isUnauthenticated(error)) {
    onAuthError?.()
  }
})

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === OperationTypeNode.SUBSCRIPTION
    )
  },
  wsDelegateLink,
  ApolloLink.from([authLink, httpLink]),
)

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, splitLink]),
  cache: new InMemoryCache(),
})
