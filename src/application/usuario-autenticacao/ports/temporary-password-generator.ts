export interface TemporaryPasswordGenerator {
  generate(): string;
}

export const TEMPORARY_PASSWORD_GENERATOR = Symbol(
  'TEMPORARY_PASSWORD_GENERATOR',
);
