import { randomInt } from 'node:crypto';
import type { TemporaryPasswordGenerator } from '../../application/usuario-autenticacao/ports/temporary-password-generator.js';

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?';
const ALL = `${UPPERCASE}${LOWERCASE}${DIGITS}${SYMBOLS}`;

export class SecureTemporaryPasswordGenerator implements TemporaryPasswordGenerator {
  private readonly length: number;

  constructor(length = 16) {
    this.length = Math.max(length, 12);
  }

  generate(): string {
    const chars = [
      pick(UPPERCASE),
      pick(LOWERCASE),
      pick(DIGITS),
      pick(SYMBOLS),
    ];

    while (chars.length < this.length) {
      chars.push(pick(ALL));
    }

    return shuffle(chars).join('');
  }
}

function pick(characters: string): string {
  return characters[randomInt(0, characters.length)];
}

function shuffle(characters: string[]): string[] {
  const result = [...characters];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}
