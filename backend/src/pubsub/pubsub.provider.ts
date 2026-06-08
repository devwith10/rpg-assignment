import { Provider } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

/**
 * DI token for the single shared in-memory PubSub instance.
 *
 * One process-wide instance is the fan-out point for real-time events: the
 * posts service publishes to it on create, and the subscription resolver
 * reads from it. Provided via DI (per plan decision) so both share the same
 * instance despite the small scale.
 */
export const PUB_SUB = Symbol('PUB_SUB');

export const pubSubProvider: Provider = {
  provide: PUB_SUB,
  useValue: new PubSub(),
};
