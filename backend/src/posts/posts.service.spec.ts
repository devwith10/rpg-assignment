import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { POST_PUBLISHED, PostsService } from './posts.service';
import { Post } from './post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { PUB_SUB } from '../pubsub/pubsub.provider';

describe('PostsService', () => {
  let service: PostsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
  };
  let pubSub: { publish: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn((dto: Partial<Post>) => dto),
      save: jest.fn((entity: Partial<Post>) =>
        Promise.resolve({ id: 1, createdAt: new Date(), ...entity }),
      ),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    pubSub = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: repo },
        { provide: PUB_SUB, useValue: pubSub },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('persists a post with the right author id and returns it with the author populated', async () => {
    const author = { id: 7, email: 'a@b.com' };
    const stored = {
      id: 1,
      title: 'Hello',
      body: 'World',
      createdAt: new Date('2026-06-06T00:00:00Z'),
      author,
    };
    repo.findOne.mockResolvedValue(stored);

    const result = await service.createPost(7, 'Hello', 'World');

    expect(repo.create).toHaveBeenCalledWith({
      title: 'Hello',
      body: 'World',
      author: { id: 7 },
    });
    expect(repo.save).toHaveBeenCalled();
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toBe(stored);
    expect(result.author).toEqual(author);
  });

  it('publishes the persisted post exactly once under the trigger key', async () => {
    const author = { id: 7, email: 'a@b.com' };
    const stored = {
      id: 1,
      title: 'Hello',
      body: 'World',
      createdAt: new Date('2026-06-06T00:00:00Z'),
      author,
    };
    repo.findOne.mockResolvedValue(stored);

    await service.createPost(7, 'Hello', 'World');

    expect(pubSub.publish).toHaveBeenCalledTimes(1);
    expect(pubSub.publish).toHaveBeenCalledWith(POST_PUBLISHED, {
      [POST_PUBLISHED]: stored,
    });
  });

  it('findAllNewestFirst calls find ordered by createdAt DESC and returns the list', async () => {
    const newer = {
      id: 2,
      title: 'Newer',
      body: 'b',
      createdAt: new Date('2026-06-06T12:00:00Z'),
      author: { id: 1, email: 'a@b.com' },
    };
    const older = {
      id: 1,
      title: 'Older',
      body: 'b',
      createdAt: new Date('2026-06-06T00:00:00Z'),
      author: { id: 1, email: 'a@b.com' },
    };
    repo.find.mockResolvedValue([newer, older]);

    const result = await service.findAllNewestFirst();

    expect(repo.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      take: 100,
    });
    expect(result).toEqual([newer, older]);
  });

  // Covers AE4: a saved post read back through the repo contract round-trips
  // its content identically.
  it('round-trips post content through the mocked repo contract', async () => {
    const author = { id: 3, email: 'c@d.com' };
    repo.save.mockImplementation((entity: Partial<Post>) =>
      Promise.resolve({ id: 42, createdAt: new Date(), ...entity }),
    );
    repo.findOne.mockImplementation(({ where }: { where: { id: number } }) =>
      Promise.resolve({
        id: where.id,
        title: 'Round trip',
        body: 'Body stays the same',
        createdAt: new Date('2026-06-06T00:00:00Z'),
        author,
      }),
    );

    const result = await service.createPost(
      3,
      'Round trip',
      'Body stays the same',
    );

    expect(result.title).toBe('Round trip');
    expect(result.body).toBe('Body stays the same');
    expect(result.author).toEqual(author);
  });

  it('rejects when the post vanishes after save and does not publish', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.createPost(7, 'Hello', 'World')).rejects.toThrow(
      /vanished after save/,
    );
    expect(pubSub.publish).not.toHaveBeenCalled();
  });

  describe('CreatePostInput validation', () => {
    it('rejects an empty-string title', async () => {
      const input = plainToInstance(CreatePostInput, {
        title: '',
        body: 'Valid body',
      });

      const errors = await validate(input);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('rejects a whitespace-only title', async () => {
      const input = plainToInstance(CreatePostInput, {
        title: '   ',
        body: 'Valid body',
      });

      const errors = await validate(input);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('rejects a whitespace-only body', async () => {
      const input = plainToInstance(CreatePostInput, {
        title: 'Valid title',
        body: '   ',
      });

      const errors = await validate(input);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('body');
      expect(errors[0].constraints).toHaveProperty('matches');
    });
  });
});
