import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repo: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOneBy: jest.fn(),
      create: jest.fn((dto: Partial<User>) => dto),
      save: jest.fn((entity: Partial<User>) =>
        Promise.resolve({ id: 1, ...entity }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('creates a user when the email is free', async () => {
    repo.findOneBy.mockResolvedValue(null);

    const user = await service.createUser('a@b.com', 'hashed');

    expect(repo.findOneBy).toHaveBeenCalledWith({ email: 'a@b.com' });
    expect(repo.save).toHaveBeenCalledWith({
      email: 'a@b.com',
      passwordHash: 'hashed',
    });
    expect(user).toEqual({ id: 1, email: 'a@b.com', passwordHash: 'hashed' });
  });

  it('throws ConflictException on a duplicate email', async () => {
    repo.findOneBy.mockResolvedValue({ id: 1, email: 'a@b.com' });

    await expect(service.createUser('a@b.com', 'hashed')).rejects.toThrow(
      ConflictException,
    );
    expect(repo.save).not.toHaveBeenCalled();
  });
});
