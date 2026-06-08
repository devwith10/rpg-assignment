import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PostsResolver } from './posts.resolver';
import { POST_PUBLISHED, PostsService } from './posts.service';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { PUB_SUB } from '../pubsub/pubsub.provider';

describe('PostsResolver postPublished subscription', () => {
  let resolver: PostsResolver;
  let pubSub: { asyncIterator: jest.Mock; publish: jest.Mock };

  beforeEach(async () => {
    pubSub = { asyncIterator: jest.fn(), publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsResolver,
        {
          provide: PostsService,
          useValue: { createPost: jest.fn(), findAllNewestFirst: jest.fn() },
        },
        { provide: PUB_SUB, useValue: pubSub },
      ],
    }).compile();

    resolver = module.get<PostsResolver>(PostsResolver);
  });

  it('returns the iterator from pubSub for the postPublished trigger', () => {
    const iterator = {} as AsyncIterator<unknown>;
    pubSub.asyncIterator.mockReturnValue(iterator);

    const result = resolver.postPublished();

    expect(pubSub.asyncIterator).toHaveBeenCalledWith(POST_PUBLISHED);
    expect(result).toBe(iterator);
  });

  /* eslint-disable @typescript-eslint/unbound-method --
     reading guard metadata off the method reference, not invoking it */
  it('guards postPublished with GqlAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PostsResolver.prototype.postPublished,
    ) as unknown[];
    expect(guards).toContain(GqlAuthGuard);
  });
  /* eslint-enable @typescript-eslint/unbound-method */
});
