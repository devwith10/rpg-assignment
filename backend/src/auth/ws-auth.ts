import type { Context } from 'graphql-ws';
import { JwtService } from '@nestjs/jwt';
import { CurrentUserPayload } from './current-user.decorator';
import { jwtSecret, JwtPayload } from './jwt.constants';

/**
 * Shape of the connection params we read the token from. The client sends the
 * JWT under `authorization`, either as a raw token or a `Bearer <token>` value.
 */
interface WsConnectionParams {
  // graphql-ws constrains connection params to Record<string, unknown>.
  [key: string]: unknown;
  authorization?: unknown;
}

/** The `extra` shape the WS server carries; the verified user lands here. */
export interface WsExtra {
  user?: CurrentUserPayload;
}

/** The graphql-ws connection context with our concrete param/extra shapes. */
export type WsContext = Context<WsConnectionParams, WsExtra>;

/**
 * A token-verification function: returns the decoded payload or throws.
 * Modelled on JwtService.verify so the runtime wiring and tests share a path.
 */
export type VerifyToken = (token: string) => JwtPayload;

/**
 * Extracts the bearer token from a connection-params `authorization` value.
 * Accepts both `Bearer <token>` and a raw token; returns undefined when absent
 * or malformed (non-string).
 */
function extractToken(authorization: unknown): string | undefined {
  if (typeof authorization !== 'string') {
    return undefined;
  }
  const trimmed = authorization.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(trimmed);
  return bearerMatch ? bearerMatch[1] : trimmed;
}

/**
 * Builds the graphql-ws `onConnect` callback from a token verifier.
 *
 * Fail-closed: a missing or invalid token throws, which rejects the WS
 * connection. On success the verified user is stashed on `extra.user`, which
 * the GraphQL context callback forwards to the single normalized `ctx.user`
 * location read by GqlAuthGuard / @CurrentUser().
 */
export function createWsOnConnect(verify: VerifyToken) {
  return (ctx: WsContext): true => {
    const token = extractToken(ctx.connectionParams?.authorization);
    if (!token) {
      throw new Error('Missing authorization token');
    }

    // Throws on invalid signature / malformed / expired token -> rejects.
    const payload = verify(token);

    ctx.extra.user = { id: payload.sub, email: payload.email };
    return true;
  };
}

/**
 * Runtime verifier backed by @nestjs/jwt using the shared secret. Kept here so
 * app.module.ts and tests both build the callback through createWsOnConnect.
 */
export function createJwtVerify(): VerifyToken {
  const jwtService = new JwtService({ secret: jwtSecret });
  return (token: string) => jwtService.verify<JwtPayload>(token);
}

/** The onConnect callback wired into the GraphQL subscriptions config. */
export const wsOnConnect = createWsOnConnect(createJwtVerify());
