/**
 * Single source of truth for JWT configuration, shared by JwtModule.register
 * (in app.module.ts) and the passport-jwt strategy.
 *
 * The default secret is conspicuously non-production: in a real deployment
 * JWT_SECRET must be supplied via the environment.
 */
export const jwtSecret =
  process.env.JWT_SECRET ?? 'dev-only-insecure-secret-do-not-use-in-prod';

export const jwtExpiresIn = '7d';

/** Shape of the signed JWT payload. */
export interface JwtPayload {
  sub: number;
  email: string;
}
