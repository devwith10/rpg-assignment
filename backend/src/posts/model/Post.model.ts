import { ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/model/User.model';

/**
 * GraphQL-facing representation of a post, including its author.
 */
@ObjectType()
export class PostModel {
  id: number;

  title: string;

  body: string;

  createdAt: Date;

  author: UserModel;
}
