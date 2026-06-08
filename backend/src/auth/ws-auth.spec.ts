import { createWsOnConnect, VerifyToken, WsContext } from './ws-auth';
import { JwtPayload } from './jwt.constants';

/** Builds a minimal WsContext with the given connectionParams. */
function makeContext(authorization?: unknown): WsContext {
  return {
    connectionInitReceived: true,
    acknowledged: false,
    connectionParams: authorization === undefined ? {} : { authorization },
    subscriptions: {},
    extra: {},
  } as unknown as WsContext;
}

describe('createWsOnConnect', () => {
  const validPayload: JwtPayload = { sub: 42, email: 'a@b.com' };
  const verifyOk: VerifyToken = () => validPayload;
  const verifyThrows: VerifyToken = () => {
    throw new Error('invalid signature');
  };

  it('throws when no authorization token is present', () => {
    const onConnect = createWsOnConnect(verifyOk);
    expect(() => onConnect(makeContext())).toThrow();
  });

  it('throws when authorization is an empty string', () => {
    const onConnect = createWsOnConnect(verifyOk);
    expect(() => onConnect(makeContext('   '))).toThrow();
  });

  it('throws when the token is malformed / has an invalid signature', () => {
    const onConnect = createWsOnConnect(verifyThrows);
    expect(() => onConnect(makeContext('Bearer bad.token'))).toThrow(
      'invalid signature',
    );
  });

  it('sets extra.user from the payload for a valid Bearer token', () => {
    const verify = jest.fn<JwtPayload, [string]>(() => validPayload);
    const onConnect = createWsOnConnect(verify);
    const ctx = makeContext('Bearer good.token');

    const result = onConnect(ctx);

    expect(verify).toHaveBeenCalledWith('good.token');
    expect(ctx.extra.user).toEqual({ id: 42, email: 'a@b.com' });
    expect(result).toBe(true);
  });

  it('accepts a raw token without the Bearer prefix', () => {
    const verify = jest.fn<JwtPayload, [string]>(() => validPayload);
    const onConnect = createWsOnConnect(verify);
    const ctx = makeContext('raw.jwt.token');

    onConnect(ctx);

    expect(verify).toHaveBeenCalledWith('raw.jwt.token');
    expect(ctx.extra.user).toEqual({ id: 42, email: 'a@b.com' });
  });
});
