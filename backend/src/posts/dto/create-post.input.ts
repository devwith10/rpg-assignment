import { InputType } from '@nestjs/graphql';
import { IsNotEmpty, Matches, MaxLength } from 'class-validator';

@InputType()
export class CreatePostInput {
  @IsNotEmpty()
  @Matches(/\S/, { message: 'title must not be empty' })
  @MaxLength(200)
  title: string;

  @IsNotEmpty()
  @Matches(/\S/, { message: 'body must not be empty' })
  @MaxLength(10000)
  body: string;
}
