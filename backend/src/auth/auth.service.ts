import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { UserModel } from '../users/model/User.model';
import { JwtPayload } from './jwt.constants';

/**
 * A real argon2id hash of a throwaway string. Used to equalize timing on the
 * unknown-email login branch so a verify always runs, closing the timing
 * side-channel that would otherwise let an attacker enumerate valid emails.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$UbpXQHGH3ll4bkrxbWMS7w$GpRdtvP25g8UnLvDBlOO2Hv1qwUB8JvuTiQ/auRIKnU';

export interface AuthResult {
  token: string;
  user: UserModel;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(email: string, password: string): Promise<AuthResult> {
    const passwordHash = await argon2.hash(password);
    const user = await this.usersService.createUser(email, passwordHash);
    return this.buildResult(user);
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(email);

    // Always run a verify (against the user's hash, or the dummy hash for an
    // unknown email) so both branches cost the same.
    const valid = await argon2.verify(
      user ? user.passwordHash : DUMMY_HASH,
      password,
    );

    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildResult(user);
  }

  private buildResult(user: User): AuthResult {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    return { token, user: { id: user.id, email: user.email } };
  }
}
