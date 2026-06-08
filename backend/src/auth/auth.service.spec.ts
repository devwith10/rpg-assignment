import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

// Wrap argon2's real implementation in jest.fn() so the verify call can be
// asserted while preserving real hashing/verification behavior.
jest.mock('argon2', () => {
  const actual = jest.requireActual<typeof import('argon2')>('argon2');
  return {
    ...actual,
    hash: jest.fn(actual.hash),
    verify: jest.fn(actual.verify),
  };
});

import { SignUpInput } from './dto/sign-up.input';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    createUser: jest.Mock;
    findByEmail: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    usersService = {
      createUser: jest.fn(),
      findByEmail: jest.fn(),
    };
    jwtService = { sign: jest.fn(() => 'signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('signUp', () => {
    it('returns a token and user, stores an argon2 hash, never the plaintext', async () => {
      let storedHash = '';
      usersService.createUser.mockImplementation(
        (email: string, passwordHash: string) => {
          storedHash = passwordHash;
          return Promise.resolve({ id: 7, email, passwordHash } as User);
        },
      );

      const result = await service.signUp('new@user.com', 'plaintext123');

      expect(result.token).toBe('signed.jwt.token');
      expect(result.user).toEqual({ id: 7, email: 'new@user.com' });
      expect(storedHash.startsWith('$argon2')).toBe(true);
      expect(storedHash).not.toContain('plaintext123');
      // Stored hash must verify against the original plaintext.
      await expect(argon2.verify(storedHash, 'plaintext123')).resolves.toBe(
        true,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 7,
        email: 'new@user.com',
      });
    });
  });

  describe('signIn', () => {
    it('returns a token for correct credentials', async () => {
      const passwordHash = await argon2.hash('correct-horse');
      usersService.findByEmail.mockResolvedValue({
        id: 3,
        email: 'a@b.com',
        passwordHash,
      } as User);

      const result = await service.signIn('a@b.com', 'correct-horse');

      expect(result.token).toBe('signed.jwt.token');
      expect(result.user).toEqual({ id: 3, email: 'a@b.com' });
    });

    it('throws the identical generic message for unknown email and wrong password', async () => {
      const passwordHash = await argon2.hash('correct-horse');

      // Wrong password against a real user.
      usersService.findByEmail.mockResolvedValue({
        id: 3,
        email: 'a@b.com',
        passwordHash,
      } as User);
      const wrongPwError = await service
        .signIn('a@b.com', 'totally-wrong')
        .catch((e: unknown) => e as Error);

      // Unknown email.
      usersService.findByEmail.mockResolvedValue(null);
      const unknownEmailError = await service
        .signIn('missing@b.com', 'whatever')
        .catch((e: unknown) => e as Error);

      expect(wrongPwError).toBeInstanceOf(UnauthorizedException);
      expect(unknownEmailError).toBeInstanceOf(UnauthorizedException);
      expect(wrongPwError.message).toBe('Invalid email or password');
      expect(unknownEmailError.message).toBe(wrongPwError.message);
    });

    it('runs the verifier exactly once on the unknown-email path (timing equalization)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await service.signIn('missing@b.com', 'whatever').catch(() => undefined);

      expect(argon2.verify).toHaveBeenCalledTimes(1);
    });
  });

  describe('SignUpInput validation', () => {
    it('rejects a password longer than 128 chars', async () => {
      const input = plainToInstance(SignUpInput, {
        email: 'a@b.com',
        password: 'x'.repeat(129),
      });

      const errors = await validate(input);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('rejects a non-email string for email', async () => {
      const input = plainToInstance(SignUpInput, {
        email: 'not-an-email',
        password: 'password1',
      });

      const errors = await validate(input);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('rejects a password shorter than 8 chars', async () => {
      const input = plainToInstance(SignUpInput, {
        email: 'a@b.com',
        password: 'x'.repeat(6),
      });

      const errors = await validate(input);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });
  });
});
