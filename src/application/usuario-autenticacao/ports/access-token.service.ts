export interface SessionAccessTokenPayload {
  sub: string;
  sid: string;
}

export interface TermosUsoAceiteTokenPayload {
  sub: string;
  scope: 'TERMOS_USO_ACEITE';
}

export type AccessTokenPayload =
  SessionAccessTokenPayload | TermosUsoAceiteTokenPayload;

export interface AccessTokenService {
  sign(payload: AccessTokenPayload): Promise<string>;
  verify(token: string): Promise<AccessTokenPayload | null>;
}

export const ACCESS_TOKEN_SERVICE = Symbol('ACCESS_TOKEN_SERVICE');
