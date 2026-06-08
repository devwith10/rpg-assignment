import { InputType } from '@nestjs/graphql';
import { IsEmail, MaxLength } from 'class-validator';

@InputType()
export class SignInInput {
  @IsEmail()
  @MaxLength(254)
  email: string;

  // No MinLength here: enforcing the policy at login would leak it.
  @MaxLength(128)
  password: string;
}
