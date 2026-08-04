import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import * as zxcvbn from 'zxcvbn';

@Injectable()
export class PasswordService {
  private readonly MIN_LENGTH = 8;
  private readonly MIN_ZXCVBN_SCORE = 2;

  validatePassword(password: string): void {
    const errors: string[] = [];

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    const strength = zxcvbn(password);
    if (strength.score < this.MIN_ZXCVBN_SCORE) {
      errors.push(
        `Password is too weak: ${strength.feedback.warning || 'Choose a stronger password'}`,
      );
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
