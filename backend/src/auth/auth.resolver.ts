import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import type { CurrentUserPayload } from './current-user.decorator';
import { SignInInput } from './dto/sign-in.input';
import { SignUpInput } from './dto/sign-up.input';
import { GqlAuthGuard } from './gql-auth.guard';
import { AuthPayloadModel } from './model/AuthPayload.model';
import { UserModel } from '../users/model/User.model';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayloadModel)
  async signUp(@Args('input') input: SignUpInput): Promise<AuthPayloadModel> {
    return this.authService.signUp(input.email, input.password);
  }

  @Mutation(() => AuthPayloadModel)
  async signIn(@Args('input') input: SignInInput): Promise<AuthPayloadModel> {
    return this.authService.signIn(input.email, input.password);
  }

  @Query(() => UserModel)
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: CurrentUserPayload): UserModel {
    return { id: user.id, email: user.email };
  }
}
