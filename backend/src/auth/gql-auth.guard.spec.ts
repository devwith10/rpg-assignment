import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlAuthGuard } from './gql-auth.guard';
import { GqlAuthContext } from './current-user.decorator';

/** Builds an ExecutionContext whose GraphQL context is the given object. */
function makeExecutionContext(ctx: GqlAuthContext): ExecutionContext {
  const execContext = {} as ExecutionContext;
  jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
    getContext: () => ctx,
  } as unknown as GqlExecutionContext);
  return execContext;
}

describe('GqlAuthGuard fail-closed', () => {
  afterEach(() => jest.restoreAllMocks());

  it('short-circuits to true when a WS-verified user is on the context', async () => {
    const guard = new GqlAuthGuard();
    const execContext = makeExecutionContext({
      user: { id: 1, email: 'a@b.com' },
    });

    await expect(guard.canActivate(execContext)).resolves.toBe(true);
  });

  it('throws UnauthorizedException when neither ctx.user nor req.user is present', async () => {
    const guard = new GqlAuthGuard();
    // Simulate passport-jwt rejecting (no valid Bearer header).
    jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockResolvedValue(false);
    const execContext = makeExecutionContext({ req: {} });

    await expect(guard.canActivate(execContext)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when passport allows but no user is on the request', async () => {
    const guard = new GqlAuthGuard();
    // passport-jwt resolves true, yet the request carries no user — a contract
    // violation that must fail closed rather than authorize an empty identity.
    jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockResolvedValue(true);
    const execContext = makeExecutionContext({ req: {} });

    await expect(guard.canActivate(execContext)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
