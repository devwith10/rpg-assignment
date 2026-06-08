import { Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSubEngine } from 'graphql-subscriptions';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PUB_SUB } from '../pubsub/pubsub.provider';
import { CreatePostInput } from './dto/create-post.input';
import { PostModel } from './model/Post.model';
import { POST_PUBLISHED, PostsService } from './posts.service';

@Resolver()
export class PostsResolver {
  constructor(
    private postsService: PostsService,
    @Inject(PUB_SUB) private pubSub: PubSubEngine,
  ) {}

  @Mutation(() => PostModel)
  @UseGuards(GqlAuthGuard)
  createPost(
    @Args('input') input: CreatePostInput,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<PostModel> {
    return this.postsService.createPost(user.id, input.title, input.body);
  }

  @Query(() => [PostModel])
  @UseGuards(GqlAuthGuard)
  posts(): Promise<PostModel[]> {
    return this.postsService.findAllNewestFirst();
  }

  // Guarded: the WS connection's verified user is forwarded to ctx.user, so a
  // connection without a verified user is rejected before this body runs.
  @UseGuards(GqlAuthGuard)
  @Subscription(() => PostModel)
  postPublished(): AsyncIterator<PostModel> {
    return this.pubSub.asyncIterator<PostModel>(POST_PUBLISHED);
  }
}
