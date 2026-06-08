import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentUserPayload {
  id: number;
  email: string;
}

/** Shape of the normalized GraphQL context used by the auth layer. */
export interface GqlAuthContext {
  req?: { user?: CurrentUserPayload };
  user?: CurrentUserPayload;
}

/**
 * Reads the authenticated user from the single normalized GraphQL context
 * location (`ctx.user`) populated by GqlAuthGuard on both transports.
 *
 * Always paired with GqlAuthGuard, which guarantees `ctx.user` is present;
 * the throw encodes that contract so the return type is never undefined.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserPayload => {
    const ctx =
      GqlExecutionContext.create(context).getContext<GqlAuthContext>();
    if (!ctx.user) {
      throw new UnauthorizedException();
    }
    return ctx.user;
  },
);
