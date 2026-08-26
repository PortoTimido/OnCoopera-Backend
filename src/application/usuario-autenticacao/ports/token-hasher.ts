export interface TokenHasher {
  hash(token: string): string;
  matches(token: string, tokenHash: string): boolean;
}

export const TOKEN_HASHER = Symbol('TOKEN_HASHER');
