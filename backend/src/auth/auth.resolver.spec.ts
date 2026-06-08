import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { GqlAuthGuard } from './gql-auth.guard';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: { signUp: jest.Mock; signIn: jest.Mock };

  beforeEach(async () => {
    authService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
  });

  it('delegates signUp to the service and returns its payload', async () => {
    const payload = {
      token: 'tok',
      user: { id: 1, email: 'a@b.com' },
    };
    authService.signUp.mockResolvedValue(payload);

    const result = await resolver.signUp({
      email: 'a@b.com',
      password: 'password1',
    });

    expect(authService.signUp).toHaveBeenCalledWith('a@b.com', 'password1');
    expect(result).toBe(payload);
  });

  it('delegates signIn to the service and returns its payload', async () => {
    const payload = {
      token: 'tok',
      user: { id: 1, email: 'a@b.com' },
    };
    authService.signIn.mockResolvedValue(payload);

    const result = await resolver.signIn({
      email: 'a@b.com',
      password: 'password1',
    });

    expect(authService.signIn).toHaveBeenCalledWith('a@b.com', 'password1');
    expect(result).toBe(payload);
  });

  it('returns an AuthPayload user containing only id/email (no passwordHash anywhere)', async () => {
    authService.signUp.mockResolvedValue({
      token: 'tok',
      user: { id: 1, email: 'a@b.com' },
    });

    const result = await resolver.signUp({
      email: 'a@b.com',
      password: 'password1',
    });

    expect(Object.keys(result.user).sort()).toEqual(['email', 'id']);
    expect(JSON.stringify(result)).not.toContain('passwordHash');
  });

  it('me returns the current user shape', () => {
    const result = resolver.me({ id: 5, email: 'me@b.com' });
    expect(result).toEqual({ id: 5, email: 'me@b.com' });
  });

  /* eslint-disable @typescript-eslint/unbound-method --
     reading guard metadata off the method reference, not invoking it */
  it('guards me with GqlAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthResolver.prototype.me,
    ) as unknown[];
    expect(guards).toContain(GqlAuthGuard);
  });
  /* eslint-enable @typescript-eslint/unbound-method */
});
