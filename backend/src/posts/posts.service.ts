import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSubEngine } from 'graphql-subscriptions';
import { Repository } from 'typeorm';
import { PUB_SUB } from '../pubsub/pubsub.provider';
import { Post } from './post.entity';

/** PubSub trigger name for the publish-a-post event. */
export const POST_PUBLISHED = 'postPublished';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postsRepository: Repository<Post>,
    @Inject(PUB_SUB) private pubSub: PubSubEngine,
  ) {}

  async createPost(
    authorId: number,
    title: string,
    body: string,
  ): Promise<Post> {
    const post = this.postsRepository.create({
      title,
      body,
      author: { id: authorId },
    });
    const saved = await this.postsRepository.save(post);
    // Reload with the eager author relation populated; save() does not hydrate
    // a relation that was set by id alone.
    const reloaded = await this.postsRepository.findOne({
      where: { id: saved.id },
    });
    if (!reloaded) {
      // A just-saved row must be readable; degrading silently would publish
      // a post with an unhydrated author (review finding).
      throw new Error(`Post ${saved.id} vanished after save`);
    }
    // Single fan-out point: notify every WS subscriber with the full post.
    // Nested under the trigger key so the subscription resolves the field.
    await this.pubSub.publish(POST_PUBLISHED, { [POST_PUBLISHED]: reloaded });
    return reloaded;
  }

  async findAllNewestFirst(): Promise<Post[]> {
    // Bounded result set: pagination is out of scope (demo scale), but an
    // unbounded full-table load is a needless resource risk (review finding).
    return this.postsRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
