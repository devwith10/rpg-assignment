import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

/**
 * Persistence entity for posts.
 *
 * This is intentionally NOT a GraphQL @ObjectType: the GraphQL-facing shape
 * lives in `model/Post.model.ts`. The author relation is eager-loaded so the
 * feed query hydrates authors without per-resolver wiring.
 */
@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  body: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  author: User;
}
