import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { join } from 'path';
import { User } from './users/user.entity';
import { UsersService } from './users/users.service';
import { AuthService } from './auth/auth.service';
import { AuthResolver } from './auth/auth.resolver';
import { JwtStrategy } from './auth/jwt.strategy';
import { jwtExpiresIn, jwtSecret } from './auth/jwt.constants';
import { CurrentUserPayload } from './auth/current-user.decorator';
import { Post } from './posts/post.entity';
import { PostsService } from './posts/posts.service';
import { PostsResolver } from './posts/posts.resolver';
import { pubSubProvider } from './pubsub/pubsub.provider';
import { wsOnConnect } from './auth/ws-auth';

interface GqlContextArgs {
  req?: unknown;
  extra?: { user?: CurrentUserPayload };
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'db.sqlite',
      autoLoadEntities: true,
      // Dev/demo-only auto-migration; never use in production.
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Post]),
    JwtModule.register({
      global: true,
      secret: jwtSecret,
      signOptions: { expiresIn: jwtExpiresIn },
    }),
    PassportModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      // Forward the HTTP request and the WS-verified user to a single
      // normalized context location read by GqlAuthGuard / @CurrentUser().
      // U4 wires the WS side by populating `extra.user` in onConnect.
      context: ({ req, extra }: GqlContextArgs) => ({
        req,
        user: extra?.user,
      }),
      subscriptions: {
        // graphql-ws transport. Auth happens once at connect time: the JWT
        // from connectionParams is verified and the user stashed on
        // `extra.user`, which the context callback above forwards to the
        // single normalized `ctx.user`. Fail-closed: a missing/invalid token
        // throws, rejecting the connection, so no operation runs unauthenticated.
        'graphql-ws': {
          onConnect: wsOnConnect,
        },
      },
    }),
  ],
  providers: [
    UsersService,
    AuthService,
    AuthResolver,
    JwtStrategy,
    PostsService,
    PostsResolver,
    pubSubProvider,
  ],
})
export class AppModule {}
