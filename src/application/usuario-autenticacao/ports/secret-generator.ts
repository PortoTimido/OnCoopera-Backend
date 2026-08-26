export interface SecretGenerator {
  generate(): string;
}

export const SECRET_GENERATOR = Symbol('SECRET_GENERATOR');
