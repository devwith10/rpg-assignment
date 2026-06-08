import { ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/model/User.model';

@ObjectType()
export class AuthPayloadModel {
  token: string;

  user: UserModel;
}
