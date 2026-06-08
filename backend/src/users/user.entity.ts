import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Persistence entity for application users.
 *
 * This is intentionally NOT a GraphQL @ObjectType: the @nestjs/graphql CLI
 * plugin auto-adds @Field() to every property of @ObjectType classes, which
 * would expose `passwordHash`. The GraphQL-facing shape lives in
 * `model/User.model.ts`.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;
}
