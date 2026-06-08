import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { GqlAuthContext } from './current-user.decorator';

/**
 * Auth guard for GraphQL resolvers that resolves the current user from a single
 * normalized context location (`ctx.user`), regardless of transport.
 *
 * - HTTP path: passport-jwt validates the Bearer header and sets `req.user`;
 *   we then copy it onto the GraphQL context as `ctx.user`.
 * - WebSocket path: a later unit's onConnect verifies the JWT and stashes the
 *   user on `extra.user`, which the GraphQL context callback forwards as
 *   `ctx.user`. There is no `req` here, so passport cannot run — we short-
 *   circuit when `ctx.user` is already populated.
 *
 * Fail-closed: if neither path yields a user, access is denied.
 */
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext =
      GqlExecutionContext.create(context).getContext<GqlAuthContext>();

    // WebSocket path: user already verified at connect time.
    if (gqlContext.user) {
      return true;
    }

    // HTTP path: run passport-jwt against the Bearer header.
    const allowed = await super.canActivate(context);
    if (allowed !== true) {
      throw new UnauthorizedException();
    }
    const req = this.getRequest(context);
    if (!req?.user) {
      throw new UnauthorizedException();
    }
    // Normalize to the single location read by @CurrentUser().
    gqlContext.user = req.user;
    return true;
  }

  getRequest(context: ExecutionContext): GqlAuthContext['req'] {
    return GqlExecutionContext.create(context).getContext<GqlAuthContext>().req;
  }
}
