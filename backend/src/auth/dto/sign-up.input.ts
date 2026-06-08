import { InputType } from '@nestjs/graphql';
import { IsEmail, MaxLength, MinLength } from 'class-validator';

@InputType()
export class SignUpInput {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @MinLength(8)
  @MaxLength(128)
  password: string;
}
