export interface AccessTokenPayload {
  sub: string;
  sid: string;
}

export interface AccessTokenService {
  sign(payload: AccessTokenPayload): Promise<string>;
  verify(token: string): Promise<AccessTokenPayload | null>;
}

export const ACCESS_TOKEN_SERVICE = Symbol('ACCESS_TOKEN_SERVICE');
