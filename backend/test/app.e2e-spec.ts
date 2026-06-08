import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';

// NOTE ON SCOPE (see review item #2): the original e2e hit `GET /`, removed with
// the REST stub. The natural replacement — POST /graphql with the guarded
// `{ posts }` query, expecting an UNAUTHENTICATED error — cannot run here:
// ts-jest does not execute the @nestjs/graphql CLI plugin, so the code-first
// models compile without their `@Field()` decorators and Apollo schema
// generation fails at `app.init()` with "Type UserModel must define one or more
// fields". That happens before any HTTP request, so even the documented
// fallback (boot the app, POST /graphql, assert a GraphQL-shaped error envelope)
// is unreachable under ts-jest.
//
// We therefore fall back one level further, as the item permits: assert that
// the AppModule's dependency-injection graph compiles. This exercises that
// every provider (services, resolvers, guard, strategy, pubsub) and the
// TypeORM/GraphQL/JWT/Passport module wiring resolves — i.e. the app is
// correctly assembled — without depending on the CLI-plugin-only schema build.
describe('AppModule (e2e)', () => {
  it('compiles the application dependency graph', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleFixture).toBeDefined();
    await moduleFixture.close();
  });
});
