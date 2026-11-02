export type ExternalIdentityProvider = 'GOOGLE';

export interface ExternalIdentityKey {
  provider: ExternalIdentityProvider;
  subject: string;
}

export interface LinkExternalIdentityInput extends ExternalIdentityKey {
  usuarioId: string;
}

export interface ExternalIdentityRepository {
  findUsuarioId(identity: ExternalIdentityKey): Promise<string | null>;
  link(input: LinkExternalIdentityInput): Promise<void>;
}

export const EXTERNAL_IDENTITY_REPOSITORY = Symbol(
  'EXTERNAL_IDENTITY_REPOSITORY',
);
