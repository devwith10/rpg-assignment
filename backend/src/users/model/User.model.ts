import { ObjectType } from '@nestjs/graphql';

/**
 * GraphQL-facing representation of a user. Deliberately omits passwordHash.
 */
@ObjectType()
export class UserModel {
  id: number;

  email: string;
}
