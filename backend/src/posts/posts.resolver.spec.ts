import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PUB_SUB } from '../pubsub/pubsub.provider';

describe('PostsResolver', () => {
  let resolver: PostsResolver;
  let postsService: { createPost: jest.Mock; findAllNewestFirst: jest.Mock };
  let pubSub: { asyncIterator: jest.Mock; publish: jest.Mock };

  beforeEach(async () => {
    postsService = {
      createPost: jest.fn(),
      findAllNewestFirst: jest.fn(),
    };
    pubSub = { asyncIterator: jest.fn(), publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsResolver,
        { provide: PostsService, useValue: postsService },
        { provide: PUB_SUB, useValue: pubSub },
      ],
    }).compile();

    resolver = module.get<PostsResolver>(PostsResolver);
  });

  it('createPost delegates to the service with the current user id', async () => {
    const post = { id: 1, title: 't', body: 'b' };
    postsService.createPost.mockResolvedValue(post);

    const result = await resolver.createPost(
      { title: 't', body: 'b' },
      { id: 9, email: 'a@b.com' },
    );

    expect(postsService.createPost).toHaveBeenCalledWith(9, 't', 'b');
    expect(result).toBe(post);
  });

  it('posts delegates to findAllNewestFirst', async () => {
    const posts = [{ id: 1 }, { id: 2 }];
    postsService.findAllNewestFirst.mockResolvedValue(posts);

    const result = await resolver.posts();

    expect(postsService.findAllNewestFirst).toHaveBeenCalled();
    expect(result).toBe(posts);
  });

  /* eslint-disable @typescript-eslint/unbound-method --
     reading guard metadata off the method references, not invoking them */
  it('guards createPost with GqlAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PostsResolver.prototype.createPost,
    ) as unknown[];
    expect(guards).toContain(GqlAuthGuard);
  });

  it('guards posts with GqlAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PostsResolver.prototype.posts,
    ) as unknown[];
    expect(guards).toContain(GqlAuthGuard);
  });
  /* eslint-enable @typescript-eslint/unbound-method */
});
